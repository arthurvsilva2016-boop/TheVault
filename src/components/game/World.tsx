import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Sky, PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { VoxelWorld, CHUNK_SIZE, BLOCK_SIZE } from './VoxelWorld';
import { ChunkMesh } from './ChunkMesh';
import { Player } from './Player';
import { BLOCKS, BLOCK_BY_INDEX } from './vocabData';
import { audioSystem } from './AudioSystem';
import { ArrowLeft, Settings, Pickaxe, Hammer, Heart, Drumstick } from 'lucide-react';
import { Student } from '../../types';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Weather, Clouds, Animals } from './WeatherCloudsAnimals';

interface WorldProps {
  student?: Student;
  isTeacher?: boolean;
}

const world = new VoxelWorld();

function ChunkManager() {
  const { camera } = useThree();
  const [activeChunks, setActiveChunks] = useState<string[]>([]);
  const RENDER_DISTANCE = 3;

  useFrame(() => {
    const cx = Math.floor(camera.position.x / (CHUNK_SIZE * BLOCK_SIZE));
    const cy = Math.floor(camera.position.y / (CHUNK_SIZE * BLOCK_SIZE));
    const cz = Math.floor(camera.position.z / (CHUNK_SIZE * BLOCK_SIZE));
    
    const newChunks = [];
    for (let x = -RENDER_DISTANCE; x <= RENDER_DISTANCE; x++) {
      for (let y = -2; y <= 2; y++) {
        for (let z = -RENDER_DISTANCE; z <= RENDER_DISTANCE; z++) {
          newChunks.push(`${cx + x},${cy + y},${cz + z}`);
        }
      }
    }
    
    if (newChunks.length !== activeChunks.length || !newChunks.every((v, i) => v === activeChunks[i])) {
      setActiveChunks(newChunks);
    }
  });

  return (
    <>
      {activeChunks.map(key => {
        const [cx, cy, cz] = key.split(',').map(Number);
        return <ChunkMesh key={key} cx={cx} cy={cy} cz={cz} world={world} />;
      })}
    </>
  );
}

function Crosshair() {
  return (
    <div className="absolute top-1/2 left-1/2 w-4 h-4 -mt-2 -ml-2 pointer-events-none z-10 flex items-center justify-center">
      <div className="w-0.5 h-4 bg-white/70 absolute"></div>
      <div className="w-4 h-0.5 bg-white/70 absolute"></div>
    </div>
  );
}

function InteractionManager({ world, mode, selectedBlock, settingsOpen, onBlockBreak, onBlockPlace, onFish }: { world: VoxelWorld, mode: string, selectedBlock: number, settingsOpen: boolean, onBlockBreak: (id: number) => void, onBlockPlace: (id: number) => void, onFish: () => void }) {
  const { camera, gl } = useThree();
  const raycaster = new THREE.Raycaster();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'KeyR') {
            const px = Math.floor(camera.position.x / BLOCK_SIZE);
            const pz = Math.floor(camera.position.z / BLOCK_SIZE);
            const py = Math.floor(camera.position.y / BLOCK_SIZE);
            
            let nearWater = false;
            for(let dx=-2; dx<=2; dx++) {
                for(let dy=-2; dy<=2; dy++) {
                    for(let dz=-2; dz<=2; dz++) {
                        if (world.getBlock(px+dx, py+dy, pz+dz) === 161) {
                            nearWater = true;
                        }
                    }
                }
            }
            if (nearWater) {
                onFish();
            }
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [camera, world, onFish]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      audioSystem.init();
      if (document.pointerLockElement !== gl.domElement || settingsOpen) return;
      
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      raycaster.far = 4;
      
      let p = camera.position.clone();
      const d = raycaster.ray.direction.clone().normalize().multiplyScalar(0.05);
      
      let hit = false;
      let lastAir = p.clone();
      
      for(let i=0; i<80; i++) {
        p.add(d);
        const bx = Math.floor(p.x / BLOCK_SIZE);
        const by = Math.floor(p.y / BLOCK_SIZE);
        const bz = Math.floor(p.z / BLOCK_SIZE);
        
        if (world.getBlock(bx, by, bz) > 0) {
          hit = true;
          if (mode === 'break') {
            const brokenId = world.getBlock(bx, by, bz);
            world.setBlock(bx, by, bz, 0);
            audioSystem.playBlockPlace(); // reuse place sound for break
            onBlockBreak(brokenId);
          } else {
            const px = Math.floor(lastAir.x / BLOCK_SIZE);
            const py = Math.floor(lastAir.y / BLOCK_SIZE);
            const pz = Math.floor(lastAir.z / BLOCK_SIZE);
            world.setBlock(px, py, pz, selectedBlock);
            audioSystem.playBlockPlace();
            onBlockPlace(selectedBlock);
          }
          break;
        }
        lastAir.copy(p);
      }
    };
    
    gl.domElement.addEventListener('mousedown', onClick);
    return () => gl.domElement.removeEventListener('mousedown', onClick);
  }, [camera, gl, world, mode, selectedBlock, settingsOpen]);
  
  return null;
}

const Lighting = ({ torchOn }: { torchOn: boolean }) => {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const [sunPos, setSunPos] = useState(new THREE.Vector3(100, 20, 100));
  const { camera } = useThree();
  
  useFrame((state) => {
     // 30 min daylight cycle: 2*PI radians / 1800 seconds = Math.PI / 900
     const t = (state.clock.getElapsedTime() * (Math.PI / 900)) + Math.PI / 4; 
     const x = Math.cos(t) * 100;
     const y = Math.sin(t) * 100;
     const z = Math.cos(t) * 30;
     
     if (lightRef.current) {
        lightRef.current.position.set(camera.position.x + x, y, camera.position.z + z);
     }
     if (pointLightRef.current) {
        pointLightRef.current.position.copy(camera.position);
     }
     setSunPos(new THREE.Vector3(x, y, z));
  });
  
  const intensity = Math.max(0, sunPos.y > 0 ? (sunPos.y / 100) * 7.5 : 0);

  return (
    <>
      <Sky sunPosition={sunPos} />
      <ambientLight intensity={Math.max(2.4, intensity * 0.8)} />
      <directionalLight ref={lightRef} intensity={intensity} castShadow shadow-mapSize={[4096, 4096]} shadow-camera-left={-60} shadow-camera-right={60} shadow-camera-top={60} shadow-camera-bottom={-60} shadow-camera-near={0.5} shadow-camera-far={300} shadow-bias={-0.0005} shadow-normalBias={0.02} />
      {torchOn && <pointLight ref={pointLightRef} position={camera.position} intensity={6.0} distance={135} decay={2} color="#ffaa55" />}
    </>
  );
}

export default function World({ student, isTeacher = false }: WorldProps) {
  const [height, setHeight] = useState(0.9);
  const [selectedBlock, setSelectedBlock] = useState(1);
  const [mode, setMode] = useState<'build' | 'break'>('build');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [hoveredBlockName, setHoveredBlockName] = useState<string>('');
  
  const [health, setHealth] = useState(100);
  const [hunger, setHunger] = useState(100);
  const [inventory, setInventory] = useState<Record<number, number>>({});
  const [craftingOpen, setCraftingOpen] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [weather, setWeather] = useState<'clear'|'rain'|'snow'|'thunderstorm'>('clear');

  useEffect(() => {
     const interval = setInterval(() => {
        const r = Math.random();
        if (r < 0.5) setWeather('clear');
        else if (r < 0.7) setWeather('rain');
        else if (r < 0.85) setWeather('snow');
        else setWeather('thunderstorm');
     }, 30000);
     return () => clearInterval(interval);
  }, []);

  const handleFish = () => {
     const r = Math.random();
     let caught = 0;
     if (r < 0.1) caught = 154; // Eel
     else if (r < 0.3) caught = 151; // Salmon
     else if (r < 0.6) caught = 152; // Trout
     else if (r < 0.9) caught = 153; // Cod
     
     if (caught > 0) {
         setInventory(inv => ({...inv, [caught]: (inv[caught]||0) + 1}));
         setHoveredBlockName(`Caught a ${BLOCK_BY_INDEX.get(caught)?.name}!`);
         setTimeout(() => setHoveredBlockName(""), 2000);
     } else {
         setHoveredBlockName("Nothing caught...");
         setTimeout(() => setHoveredBlockName(""), 2000);
     }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') {
        setInventoryOpen(prev => {
           if (!prev) document.exitPointerLock();
           return !prev;
        });
      }
      if (e.code === 'KeyC') {
        setCraftingOpen(prev => {
           if (!prev) document.exitPointerLock();
           return !prev;
        });
      }
      if (e.code === 'KeyF') {
        setTorchOn(prev => !prev);
      }
      if (e.code === 'KeyG') {
        setHunger(h => {
           if (h >= 100) return h;
           let consumed = false;
           setInventory(inv => {
               const b = BLOCK_BY_INDEX.get(selectedBlock);
               if (b && inv[selectedBlock] > 0 && (b.name.toLowerCase().includes('meat') || b.name.toLowerCase().includes('apple') || b.name.toLowerCase().includes('berry') || b.name.toLowerCase().includes('carrot'))) {
                   consumed = true;
                   return {...inv, [selectedBlock]: inv[selectedBlock] - 1};
               }
               return inv;
           });
           if (consumed) return Math.min(100, h + 20);
           return h;
        });
      }
    };
    const handleWheel = (e: WheelEvent) => {
      if (settingsOpen || inventoryOpen || craftingOpen) return;
      const validBlocks = BLOCKS.filter(b => b.id !== 'air' && (inventory[b.index] > 0 || isTeacher));
      if (validBlocks.length === 0) return;
      const currentIndex = validBlocks.findIndex(b => b.index === selectedBlock);
      if (currentIndex === -1) { setSelectedBlock(validBlocks[0].index); return; }
      let nextIndex = e.deltaY > 0 ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex >= validBlocks.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = validBlocks.length - 1;
      setSelectedBlock(validBlocks[nextIndex].index);
      setMode('build');
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('wheel', handleWheel); };
  }, [selectedBlock, settingsOpen, inventoryOpen, craftingOpen, inventory, isTeacher]);

  useEffect(() => {
    if (!student) return;
    const load = async () => {
       try {
         const snap = await getDoc(doc(db, 'vivlio_worlds', student.id));
         if (snap.exists()) {
            const d = snap.data();
            if (d.chunks) world.deserialize(d.chunks);
            if (typeof d.health === 'number') setHealth(d.health);
            if (typeof d.hunger === 'number') setHunger(d.hunger);
            if (d.inventory) setInventory(d.inventory);
         }
       } catch(e) {}
    };
    load();
  }, [student, world]);

  useEffect(() => {
    if (!student) return;
    const interval = setInterval(() => {
        setDoc(doc(db, 'vivlio_worlds', student.id), {
            chunks: world.serialize(),
            health,
            hunger,
            inventory
        }, { merge: true }).catch(console.error);
    }, 15000);
    return () => clearInterval(interval);
  }, [student, world, health, hunger, inventory]);

  useEffect(() => {
    const interval = setInterval(() => {
       setHunger(h => {
          if (h <= 0) { setHealth(hl => Math.max(0, hl - 5)); return 0; }
          return Math.max(0, h - 2);
       });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        world.generateChunk(x, 0, z);
      }
    }
  }, []);

  const onBlockBreak = (id: number) => {
    setInventory(prev => ({...prev, [id]: (prev[id] || 0) + 1}));
  };
  const onBlockPlace = (id: number) => {
    if (!isTeacher) {
      setInventory(prev => {
         const next = {...prev, [id]: Math.max(0, (prev[id] || 0) - 1)};
         if (next[id] === 0) {
           const available = BLOCKS.find(b => next[b.index] > 0);
           if (available) setSelectedBlock(available.index);
         }
         return next;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col font-sans">
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <button onClick={() => window.history.back()} className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="bg-black/50 text-white px-4 py-2 rounded-lg font-bold">
            Vivlío - {student ? student.name : 'Teacher'}
          </div>
        </div>
        
        <div className="pointer-events-auto">
          <button onClick={() => setSettingsOpen(!settingsOpen)} className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <Crosshair />
      
      {/* Target Info */}
      <div className="absolute top-1/2 left-1/2 -mt-10 -ml-16 w-32 text-center text-white font-bold pointer-events-none drop-shadow-md z-10">
        {hoveredBlockName}
      </div>

      {/* HUD (Health & Hunger) */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
         <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full border border-red-500/30">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <div className="w-32 h-2 bg-black/60 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{width: `${health}%`}}></div></div>
         </div>
         <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full border border-amber-600/30">
            <Drumstick className="w-5 h-5 text-amber-600 fill-amber-600" />
            <div className="w-32 h-2 bg-black/60 rounded-full overflow-hidden"><div className="h-full bg-amber-600" style={{width: `${hunger}%`}}></div></div>
         </div>
         <div className="text-white text-xs text-right mt-1 opacity-70">Press 'G' to eat food<br/>Press 'F' for torch<br/>Press 'C' to craft</div>
      </div>

      {/* Toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto flex gap-2">
        <button onClick={() => setMode('break')} className={`p-3 rounded-xl ${mode === 'break' ? 'bg-red-500 text-white' : 'bg-black/50 text-slate-300'}`}>
          <Pickaxe className="w-6 h-6" />
        </button>
        <button onClick={() => setMode('build')} className={`p-3 rounded-xl ${mode === 'build' ? 'bg-emerald-500 text-white' : 'bg-black/50 text-slate-300'}`}>
          <Hammer className="w-6 h-6" />
        </button>
        
        <div className="w-1 h-12 bg-white/20 mx-2 rounded-full"></div>
        
        <div className="flex bg-black/50 p-2 rounded-xl gap-2 overflow-x-auto max-w-lg no-scrollbar">
          {BLOCKS.filter(b => b.id !== 'air').map(b => {
            const count = inventory[b.index] || 0;
            if (count === 0 && !isTeacher && selectedBlock !== b.index) return null;
            return (
            <button
              key={b.id}
              onClick={() => { setSelectedBlock(b.index); setMode('build'); }}
              className={`relative w-10 h-10 rounded-lg flex-shrink-0 border-2 transition ${selectedBlock === b.index ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: b.color }}
              title={b.name}
            >
              {count > 0 && <span className="absolute -bottom-1 -right-1 bg-black/80 text-white text-[9px] px-1 rounded-full">{count}</span>}
            </button>
          )})}
        </div>
      </div>

      {inventoryOpen && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-8 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-6 shrink-0">
               <h2 className="text-2xl font-bold text-white">Inventory</h2>
               <button onClick={() => setInventoryOpen(false)} className="text-slate-400 hover:text-white font-bold">Close (E)</button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 overflow-y-auto no-scrollbar pb-10">
              {BLOCKS.filter(b => b.id !== 'air').map(b => (
                <button
                  key={b.id}
                  onClick={() => { setSelectedBlock(b.index); setMode('build'); setInventoryOpen(false); }}
                  className={`relative aspect-square rounded-lg flex flex-col items-center justify-center border-2 transition overflow-hidden ${selectedBlock === b.index ? 'border-emerald-500 scale-105 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-slate-800 hover:border-slate-600'}`}
                  style={{ backgroundColor: b.color }}
                  title={b.name}
                >
                  <span className="mt-auto bg-black/70 text-[10px] w-full truncate px-1 text-center text-white/90 pb-1">{b.name}</span>
                  {(inventory[b.index] || 0) > 0 && <span className="absolute top-1 right-1 bg-black/80 text-white text-[10px] px-1.5 rounded-full">{inventory[b.index]}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {craftingOpen && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-8 backdrop-blur-sm">
           <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-lg flex flex-col">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-white">Crafting Recipes</h2>
                 <button onClick={() => setCraftingOpen(false)} className="text-slate-400 hover:text-white font-bold">Close (C)</button>
              </div>
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] pr-2 no-scrollbar">
                 {/* Workbench */}
                 <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-4 text-white">
                       <div className="flex items-center gap-2"><div className="w-8 h-8 rounded" style={{backgroundColor: BLOCK_BY_INDEX.get(1)?.color}}></div> 2x Oak Wood</div>
                       <span>→</span>
                       <div className="flex items-center gap-2"><div className="w-8 h-8 rounded" style={{backgroundColor: BLOCK_BY_INDEX.get(201)?.color}}></div> 1x Workbench</div>
                    </div>
                    <button onClick={() => {
                        if ((inventory[1] || 0) >= 2) {
                            setInventory(prev => ({...prev, 1: prev[1] - 2, 201: (prev[201] || 0) + 1}));
                        }
                    }} disabled={(inventory[1] || 0) < 2} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 rounded-lg text-white font-bold transition shadow-sm">Craft</button>
                 </div>
                 {/* Baked Potato */}
                 <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-4 text-white">
                       <div className="flex items-center gap-2"><div className="w-8 h-8 rounded" style={{backgroundColor: BLOCK_BY_INDEX.get(122)?.color}}></div> 2x Wild Potato</div>
                       <span>→</span>
                       <div className="flex items-center gap-2">1x Cooked Meal</div>
                    </div>
                    <button onClick={() => {
                        if ((inventory[122] || 0) >= 2) {
                            setInventory(prev => ({...prev, 122: prev[122] - 2}));
                            setHunger(h => Math.min(100, h + 40));
                        }
                    }} disabled={(inventory[122] || 0) < 2} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:hover:bg-amber-600 rounded-lg text-white font-bold transition shadow-sm">Cook</button>
                 </div>
                 {/* Planks/Something */}
                 <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-4 text-white">
                       <div className="flex items-center gap-2"><div className="w-8 h-8 rounded" style={{backgroundColor: BLOCK_BY_INDEX.get(20)?.color}}></div> 4x Granite</div>
                       <span>→</span>
                       <div className="flex items-center gap-2"><div className="w-8 h-8 rounded" style={{backgroundColor: BLOCK_BY_INDEX.get(190)?.color}}></div> 1x Terracotta</div>
                    </div>
                    <button onClick={() => {
                        if ((inventory[20] || 0) >= 4) {
                            setInventory(prev => ({...prev, 20: prev[20] - 4, 190: (prev[190] || 0) + 1}));
                        }
                    }} disabled={(inventory[20] || 0) < 4} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 rounded-lg text-white font-bold transition shadow-sm">Craft</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {settingsOpen && (
        <div className="absolute top-20 right-4 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/20 text-white z-20 pointer-events-auto w-64">
          <h3 className="font-bold mb-4">Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 block mb-1">Player Height (cm)</label>
              <input 
                type="range" min="50" max="250" value={height * 100} 
                onChange={e => setHeight(parseInt(e.target.value) / 100)}
                className="w-full"
              />
              <div className="text-right text-xs mt-1">{Math.round(height * 100)} cm</div>
            </div>
            
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              <strong>Controls:</strong> WASD to move, Space to jump. Click to interact. Esc to show mouse cursor.
            </p>
          </div>
        </div>
      )}

      <Canvas shadows camera={{ fov: 75 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.5 }}>
        <fog attach="fog" args={['#87CEEB', 10, 50]} />
        <Lighting torchOn={torchOn} />
        <Weather type={weather} world={world} />
        <Clouds />
        <Animals world={world} />
        
        <ChunkManager />
        <Player world={world} height={height} />
        <InteractionManager world={world} mode={mode} selectedBlock={selectedBlock} settingsOpen={settingsOpen} onBlockBreak={onBlockBreak} onBlockPlace={onBlockPlace} onFish={handleFish} />
      </Canvas>
    </div>
  );
}
