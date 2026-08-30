import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { CHUNK_SIZE, BLOCK_SIZE, VoxelWorld } from './VoxelWorld';
import { BLOCK_BY_INDEX } from './vocabData';

interface ChunkMeshProps {
  cx: number;
  cy: number;
  cz: number;
  world: VoxelWorld;
}

const dummy = new THREE.Object3D();
const color = new THREE.Color();
const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

// Generate a 5x5 texture overlay
const canvas = document.createElement('canvas');
canvas.width = 5;
canvas.height = 5;
const ctx = canvas.getContext('2d')!;
for(let x=0; x<5; x++) {
  for(let y=0; y<5; y++) {
     const v = 150 + Math.random() * 105; // grey to white
     ctx.fillStyle = `rgb(${v},${v},${v})`;
     ctx.fillRect(x,y,1,1);
  }
}
const texture = new THREE.CanvasTexture(canvas);
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
texture.colorSpace = THREE.SRGBColorSpace;

const material = new THREE.MeshStandardMaterial({ vertexColors: true, map: texture, roughness: 0.8 });

export function ChunkMesh({ cx, cy, cz, world }: ChunkMeshProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [version, setVersion] = useState(1);
  const key = world.getChunkKey(cx, cy, cz);

  useEffect(() => {
    const unsub = world.subscribe((k, v) => {
      if (k === key) setVersion(v);
    });
    return () => { unsub(); };
  }, [world, key]);

  const [{ count, instances }, setMeshData] = useState({ count: 0, instances: [] as any[] });

  useEffect(() => {
    let data = world.chunks.get(key);
    if (!data) {
      data = world.generateChunk(cx, cy, cz);
    }

    const newInstances = [];
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const index = data[x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE];
          if (index > 0) {
            const blockDef = BLOCK_BY_INDEX.get(index);
            if (blockDef) {
              newInstances.push({ x, y, z, blockDef });
            }
          }
        }
      }
    }
    setMeshData({ count: newInstances.length, instances: newInstances });
  }, [cx, cy, cz, world, version, key]);


  useLayoutEffect(() => {
    if (meshRef.current) {
      instances.forEach((inst, i) => {
        const { x, y, z, blockDef } = inst;
        
        const px = x * BLOCK_SIZE + BLOCK_SIZE / 2;
        const py = y * BLOCK_SIZE + BLOCK_SIZE / 2;
        const pz = z * BLOCK_SIZE + BLOCK_SIZE / 2;

        dummy.position.set(px, py, pz);
        dummy.scale.set(1, 1, 1);

        if (blockDef.isWater) {
          dummy.scale.set(1, 0.8, 1);
          dummy.position.y -= (BLOCK_SIZE * 0.1);
        }

        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);

        color.set(blockDef.color);
        meshRef.current!.setColorAt(i, color);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [count, instances]);

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      position={[cx * CHUNK_SIZE * BLOCK_SIZE, cy * CHUNK_SIZE * BLOCK_SIZE, cz * CHUNK_SIZE * BLOCK_SIZE]}
      castShadow
      receiveShadow
    />
  );
}
