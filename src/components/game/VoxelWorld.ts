import { fbm } from './noise';
import { BLOCKS } from './vocabData';

export const CHUNK_SIZE = 16;
export const BLOCK_SIZE = 0.25;

type Listener = (key: string, version: number) => void;

export class VoxelWorld {
  chunks: Map<string, Uint8Array>;
  chunkVersions: Map<string, number>;
  listeners: Set<Listener>;
  fallingQueue: Array<{x: number, y: number, z: number, id: number}>;
  
  constructor() {
    this.chunks = new Map();
    this.chunkVersions = new Map();
    this.listeners = new Set();
    this.fallingQueue = [];
    
    // Physics loop
    setInterval(() => this.tickPhysics(), 100);
  }

  serialize(): Record<string, string> {
    const data: Record<string, string> = {};
    for (const [key, chunk] of this.chunks.entries()) {
      let bstr = '';
      for(let i=0; i<chunk.length; i++) bstr += String.fromCharCode(chunk[i]);
      data[key] = btoa(bstr);
    }
    return data;
  }

  deserialize(data: Record<string, string>) {
    this.chunks.clear();
    for (const [key, b64] of Object.entries(data)) {
      const bstr = atob(b64);
      const chunk = new Uint8Array(bstr.length);
      for(let i=0; i<bstr.length; i++) chunk[i] = bstr.charCodeAt(i);
      this.chunks.set(key, chunk);
      this.chunkVersions.set(key, (this.chunkVersions.get(key) || 0) + 1);
      this.notify(key);
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  notify(key: string) {
    const version = this.chunkVersions.get(key) || 1;
    for (const l of this.listeners) {
      l(key, version);
    }
  }

  getChunkKey(cx: number, cy: number, cz: number) { return `${cx},${cy},${cz}`; }
  
  getChunkForBlock(x: number, y: number, z: number) {
    return { cx: Math.floor(x / CHUNK_SIZE), cy: Math.floor(y / CHUNK_SIZE), cz: Math.floor(z / CHUNK_SIZE) };
  }

  getTerrainHeight(x: number, z: number) {
    const baseHeight = Math.floor(fbm(x * 0.03, z * 0.03) * 25) + 10;
    const riverNoise = Math.abs(fbm(x * 0.015 + 100, z * 0.015 + 100));
    let finalHeight = baseHeight;
    if (riverNoise < 0.15) {
       finalHeight -= Math.floor((0.15 - riverNoise) * 40);
    }
    return Math.max(1, finalHeight);
  }
  
  isTreeAt(x: number, z: number) {
     const hash = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453);
     return (hash - Math.floor(hash)) < 0.02 && this.getTerrainHeight(x, z) > 6;
  }

  generateChunk(cx: number, cy: number, cz: number) {
    const key = this.getChunkKey(cx, cy, cz);
    if (this.chunks.has(key)) return this.chunks.get(key)!;

    const data = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
    const grassIndex = BLOCKS.find(b => b.id === 'grass')?.index || 1;
    const stoneIndex = BLOCKS.find(b => b.id === 'granite')?.index || 20;
    const waterIndex = BLOCKS.find(b => b.id === 'fresh_water')?.index || 0;
    const woodIndex = BLOCKS.find(b => b.id === 'oak_wood')?.index || 1;
    const leafIndex = BLOCKS.find(b => b.id === 'moss')?.index || 200;

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const globalX = cx * CHUNK_SIZE + x;
        const globalZ = cz * CHUNK_SIZE + z;
        const height = this.getTerrainHeight(globalX, globalZ);
        
        for (let y = 0; y < CHUNK_SIZE; y++) {
          const globalY = cy * CHUNK_SIZE + y;
          if (globalY < height - 2) {
            data[x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE] = stoneIndex;
          } else if (globalY <= height) {
            data[x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE] = grassIndex;
          } else if (globalY <= 6 && waterIndex > 0) {
             data[x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE] = waterIndex;
          } else {
             // Check for trees nearby
             let isWood = false;
             let isLeaf = false;
             
             // Trunk
             if (this.isTreeAt(globalX, globalZ) && globalY > height && globalY <= height + 8) {
                 isWood = true;
             } else {
                 // Leaves
                 for (let dx = -3; dx <= 3; dx++) {
                     for (let dz = -3; dz <= 3; dz++) {
                         if (dx*dx + dz*dz <= 8) {
                             const tx = globalX + dx;
                             const tz = globalZ + dz;
                             if (this.isTreeAt(tx, tz)) {
                                 const theight = this.getTerrainHeight(tx, tz);
                                 const dy = globalY - theight;
                                 if (dy >= 6 && dy <= 10) {
                                     if (dx*dx + (dy-8)*(dy-8) + dz*dz <= 8) {
                                        isLeaf = true;
                                     }
                                 }
                             }
                         }
                     }
                 }
             }
             
             if (isWood) {
                 data[x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE] = woodIndex;
             } else if (isLeaf) {
                 data[x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE] = leafIndex;
             }
          }
        }
      }
    }
    
    this.chunks.set(key, data);
    this.chunkVersions.set(key, 1);
    return data;
  }

  getBlock(x: number, y: number, z: number): number {
    const { cx, cy, cz } = this.getChunkForBlock(x, y, z);
    const key = this.getChunkKey(cx, cy, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) chunk = this.generateChunk(cx, cy, cz);
    const lx = x - cx * CHUNK_SIZE;
    const ly = y - cy * CHUNK_SIZE;
    const lz = z - cz * CHUNK_SIZE;
    return chunk[lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE];
  }

  setBlock(x: number, y: number, z: number, index: number, checkPhysics = true) {
    const { cx, cy, cz } = this.getChunkForBlock(x, y, z);
    const key = this.getChunkKey(cx, cy, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) chunk = this.generateChunk(cx, cy, cz);
    
    const lx = x - cx * CHUNK_SIZE;
    const ly = y - cy * CHUNK_SIZE;
    const lz = z - cz * CHUNK_SIZE;
    chunk[lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_SIZE] = index;
    
    this.chunkVersions.set(key, (this.chunkVersions.get(key) || 1) + 1);
    this.notify(key);

    if (checkPhysics && index !== 0) {
      if (!this.checkSupport(x, y, z)) {
        this.setBlock(x, y, z, 0, false);
        this.fallingQueue.push({x, y, z, id: index});
      }
    }
  }

  // Simple support check: BFS up to 5 blocks
  checkSupport(startX: number, startY: number, startZ: number): boolean {
    const queue = [[startX, startY, startZ, 0]];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const [x, y, z, dist] = queue.shift()!;
      const key = `${x},${y},${z}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (dist > 5) continue;

      // If there is a solid block directly below that is supported (we assume ground is supported)
      if (this.getBlock(x, y - 1, z) !== 0) {
        // If it's ground level or below, it's supported
        if (y <= 12) return true; // Approximation of ground support
        // We can just assume if we hit any block below, it acts as support for this BFS scope
        if (dist > 0) return true; 
      }

      // Check neighbors
      const neighbors = [
        [x+1, y, z], [x-1, y, z],
        [x, y, z+1], [x, y, z-1]
      ];

      for (const [nx, ny, nz] of neighbors) {
        if (this.getBlock(nx, ny, nz) !== 0) {
          queue.push([nx, ny, nz, dist + 1]);
        }
      }
    }
    return false;
  }

  tickPhysics() {
    if (this.fallingQueue.length === 0) return;
    
    const newQueue = [];
    for (const block of this.fallingQueue) {
      const {x, y, z, id} = block;
      if (this.getBlock(x, y - 1, z) === 0) {
        // Fall down
        newQueue.push({x, y: y - 1, z, id});
      } else {
        // Landed
        this.setBlock(x, y, z, id, false);
      }
    }
    this.fallingQueue = newQueue;
  }
}
