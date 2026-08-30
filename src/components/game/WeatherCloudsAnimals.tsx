import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VoxelWorld, BLOCK_SIZE } from './VoxelWorld';

export const Clouds = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();
  
  useEffect(() => {
    if (meshRef.current) {
      for(let i=0; i<30; i++) {
        dummy.position.set(
          (Math.random() - 0.5) * 400,
          80 + Math.random() * 20,
          (Math.random() - 0.5) * 400
        );
        dummy.scale.set(10 + Math.random() * 20, 5 + Math.random() * 5, 10 + Math.random() * 20);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
        meshRef.current.position.x += delta * 2;
        if (meshRef.current.position.x > 200) meshRef.current.position.x -= 400;
    }
  });

  return (
     <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, 30]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#ffffff" transparent opacity={0.8} />
     </instancedMesh>
  );
};

export const Weather = ({ type, world }: { type: string, world: VoxelWorld }) => {
  const count = type === 'rain' || type === 'thunderstorm' ? 5000 : (type === 'snow' ? 2000 : 0);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const dummy = new THREE.Object3D();
  
  // Water accumulation
  useEffect(() => {
      const interval = setInterval(() => {
          if (type === 'rain' || type === 'thunderstorm') {
              const px = Math.floor(camera.position.x / BLOCK_SIZE);
              const pz = Math.floor(camera.position.z / BLOCK_SIZE);
              
              const rx = px + Math.floor((Math.random() - 0.5) * 40);
              const rz = pz + Math.floor((Math.random() - 0.5) * 40);
              const h = world.getTerrainHeight(rx, rz);
              
              const h1 = world.getTerrainHeight(rx+1, rz);
              const h2 = world.getTerrainHeight(rx-1, rz);
              const h3 = world.getTerrainHeight(rx, rz+1);
              const h4 = world.getTerrainHeight(rx, rz-1);
              
              if (h < h1 && h < h2 && h < h3 && h < h4) {
                 if (world.getBlock(rx, h + 1, rz) === 0) {
                     world.setBlock(rx, h + 1, rz, 161);
                 }
              }
          }
      }, 500);
      return () => clearInterval(interval);
  }, [type, world, camera]);

  useEffect(() => {
    if (count > 0 && meshRef.current) {
      for(let i=0; i<count; i++) {
        dummy.position.set(
          (Math.random() - 0.5) * 100,
          Math.random() * 50,
          (Math.random() - 0.5) * 100
        );
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [count]);
  
  useFrame((state, delta) => {
     if (count > 0 && meshRef.current) {
         const speed = type === 'snow' ? 5 : 20;
         const yDrop = speed * delta;
         const mat = new THREE.Matrix4();
         const pos = new THREE.Vector3();
         const rot = new THREE.Quaternion();
         const scale = new THREE.Vector3();
         for(let i=0; i<count; i++) {
             meshRef.current.getMatrixAt(i, mat);
             mat.decompose(pos, rot, scale);
             pos.y -= yDrop;
             if (pos.y < camera.position.y - 10) pos.y += 40;
             const dx = pos.x - camera.position.x;
             const dz = pos.z - camera.position.z;
             if (dx > 50) pos.x -= 100;
             if (dx < -50) pos.x += 100;
             if (dz > 50) pos.z -= 100;
             if (dz < -50) pos.z += 100;
             
             dummy.position.copy(pos);
             dummy.scale.copy(scale);
             dummy.updateMatrix();
             meshRef.current.setMatrixAt(i, dummy.matrix);
         }
         meshRef.current.instanceMatrix.needsUpdate = true;
     }
  });

  if (count === 0) return null;
  
  return (
     <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, count]}>
        <boxGeometry args={type === 'snow' ? [0.1, 0.1, 0.1] : [0.05, 0.5, 0.05]} />
        <meshBasicMaterial color={type === 'snow' ? '#ffffff' : '#88ccff'} transparent opacity={0.6} />
     </instancedMesh>
  );
};

export const Animals = ({ world }: { world: VoxelWorld }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();
  const count = 10;
  
  const positions = useRef<{x: number, y: number, z: number, rx: number}[]>([]);
  
  useEffect(() => {
      for(let i=0; i<count; i++) {
         positions.current.push({
             x: (Math.random() - 0.5) * 60,
             y: 30,
             z: (Math.random() - 0.5) * 60,
             rx: 0
         });
      }
  }, []);
  
  useFrame((state, delta) => {
     if (!meshRef.current) return;
     positions.current.forEach((pos, i) => {
         const px = Math.floor(pos.x / BLOCK_SIZE);
         const pz = Math.floor(pos.z / BLOCK_SIZE);
         const py = Math.floor(pos.y / BLOCK_SIZE);
         
         if (world.getBlock(px, py - 1, pz) === 0) {
             pos.y -= 10 * delta;
         } else {
             pos.rx += (Math.random() - 0.5) * delta;
             pos.x += Math.cos(pos.rx) * 2 * delta;
             pos.z += Math.sin(pos.rx) * 2 * delta;
             
             const h = world.getTerrainHeight(px, pz);
             pos.y = h * BLOCK_SIZE + 0.6;
         }
         
         dummy.position.set(pos.x, pos.y, pos.z);
         dummy.rotation.y = -pos.rx;
         dummy.updateMatrix();
         meshRef.current!.setMatrixAt(i, dummy.matrix);
     });
     meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
     <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, count]} castShadow>
        <boxGeometry args={[0.8, 0.8, 1.2]} />
        <meshLambertMaterial color="#ffcccc" />
     </instancedMesh>
  );
};
