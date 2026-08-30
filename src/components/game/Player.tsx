import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { VoxelWorld, BLOCK_SIZE } from './VoxelWorld';
import { audioSystem } from './AudioSystem';

interface PlayerProps {
  world: VoxelWorld;
  height: number;
}

const velocity = new THREE.Vector3();
const moveState = { forward: false, backward: false, left: false, right: false, jump: false, sprint: false, crouch: false };

let lastFootstepTime = 0;
let headBobTimer = 0;
let bobOffset = 0;

export function Player({ world, height }: PlayerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  useEffect(() => {
    camera.position.set(0, 20, 0);

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': moveState.forward = true; break;
        case 'KeyS': moveState.backward = true; break;
        case 'KeyA': moveState.left = true; break;
        case 'KeyD': moveState.right = true; break;
        case 'Space': moveState.jump = true; break;
        case 'ControlLeft':
        case 'ControlRight': moveState.sprint = true; break;
        case 'ShiftLeft':
        case 'ShiftRight': moveState.crouch = true; break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': moveState.forward = false; break;
        case 'KeyS': moveState.backward = false; break;
        case 'KeyA': moveState.left = false; break;
        case 'KeyD': moveState.right = false; break;
        case 'Space': moveState.jump = false; break;
        case 'ControlLeft':
        case 'ControlRight': moveState.sprint = false; break;
        case 'ShiftLeft':
        case 'ShiftRight': moveState.crouch = false; break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [camera]);

  useFrame((state, delta) => {
    if (!controlsRef.current?.isLocked) return;

    const dt = Math.min(delta, 0.1);
    
    camera.position.y -= bobOffset;

    const isCrouching = moveState.crouch;
    const isSprinting = moveState.sprint && !isCrouching;
    const currentHeight = isCrouching ? height * 0.5 : height;
    
    const targetSpeedBlocks = isCrouching ? 1.5 : (isSprinting ? 5.0 : 3.0);
    const targetSpeed = targetSpeedBlocks * BLOCK_SIZE;
    
    // Physics Y
    velocity.y -= 9.8 * 2.0 * dt;
    
    const dir = new THREE.Vector3(
      Number(moveState.right) - Number(moveState.left),
      0,
      Number(moveState.backward) - Number(moveState.forward)
    );
    dir.normalize();

    // Store old position
    const oldX = camera.position.x;
    const oldZ = camera.position.z;
    const py = Math.floor((camera.position.y - currentHeight) / BLOCK_SIZE);
    
    // X movement
    if (dir.x !== 0) {
      controlsRef.current.moveRight(dir.x * targetSpeed * dt);
      const px = Math.floor(camera.position.x / BLOCK_SIZE);
      const pz = Math.floor(camera.position.z / BLOCK_SIZE);
      const headY = Math.floor(camera.position.y / BLOCK_SIZE);
      const feetY = Math.floor((camera.position.y - currentHeight + 0.1) / BLOCK_SIZE);
      
      if (world.getBlock(px, feetY, pz) !== 0 || world.getBlock(px, headY, pz) !== 0) {
          camera.position.x = oldX;
      } else if (isCrouching && world.getBlock(px, py - 1, pz) === 0) {
          camera.position.x = oldX; // Revert if edge
      }
    }
    
    // Z movement
    if (dir.z !== 0) {
      controlsRef.current.moveForward(-dir.z * targetSpeed * dt);
      const px = Math.floor(camera.position.x / BLOCK_SIZE);
      const pz = Math.floor(camera.position.z / BLOCK_SIZE);
      const headY = Math.floor(camera.position.y / BLOCK_SIZE);
      const feetY = Math.floor((camera.position.y - currentHeight + 0.1) / BLOCK_SIZE);

      if (world.getBlock(px, feetY, pz) !== 0 || world.getBlock(px, headY, pz) !== 0) {
          camera.position.z = oldZ;
      } else if (isCrouching && world.getBlock(px, py - 1, pz) === 0) {
          camera.position.z = oldZ; // Revert if edge
      }
    }
    
    camera.position.y += velocity.y * dt;
    
    const px = Math.floor(camera.position.x / BLOCK_SIZE);
    const pz = Math.floor(camera.position.z / BLOCK_SIZE);
    const pyNew = Math.floor((camera.position.y - currentHeight) / BLOCK_SIZE);
    const blockBelow = world.getBlock(px, pyNew, pz);
    
    if (blockBelow !== 0) {
      velocity.y = Math.max(0, velocity.y);
      camera.position.y = (pyNew + 1) * BLOCK_SIZE + currentHeight;
      if (moveState.jump && !isCrouching) {
        velocity.y = 5.0;
      } else if (dir.x !== 0 || dir.z !== 0) {
        // We are walking on ground
        headBobTimer += dt * (isSprinting ? 15 : (isCrouching ? 5 : 10));
        bobOffset = Math.sin(headBobTimer) * 0.05 * (isCrouching ? 0.5 : 1);

        const stepInterval = isSprinting ? 0.3 : (isCrouching ? 0.6 : 0.4);
        if (state.clock.elapsedTime - lastFootstepTime > stepInterval) {
           audioSystem.playFootstep();
           lastFootstepTime = state.clock.elapsedTime;
        }
      } else {
        bobOffset = THREE.MathUtils.lerp(bobOffset, 0, dt * 10);
        headBobTimer = 0;
      }
    } else {
      bobOffset = THREE.MathUtils.lerp(bobOffset, 0, dt * 10);
      headBobTimer = 0;
    }

    camera.position.y += bobOffset;
  });

  return <PointerLockControls ref={controlsRef} />;
}
