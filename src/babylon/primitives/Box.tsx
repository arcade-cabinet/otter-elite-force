/**
 * Babylon.js Box Primitive
 */

import { useEffect, useRef } from 'react';
import { 
  MeshBuilder,
  StandardMaterial,
  Vector3,
  Color3,
  Mesh,
} from '@babylonjs/core';
import { useScene } from '../Scene';

interface BoxProps {
  position?: [number, number, number];
  size?: number;
  width?: number;
  height?: number;
  depth?: number;
  color?: [number, number, number];
  name?: string;
}

export const Box: React.FC<BoxProps> = ({
  position = [0, 0, 0],
  size = 1,
  width,
  height,
  depth,
  color = [0.8, 0.8, 0.8],
  name = 'box',
}) => {
  const { scene } = useScene();
  const meshRef = useRef<Mesh>();

  useEffect(() => {
    if (!scene) return;

    const box = MeshBuilder.CreateBox(
      name,
      {
        size,
        width: width || size,
        height: height || size,
        depth: depth || size,
      },
      scene
    );

    box.position = new Vector3(...position);

    const material = new StandardMaterial(`${name}-material`, scene);
    material.diffuseColor = new Color3(...color);
    box.material = material;

    meshRef.current = box;

    return () => {
      box.dispose();
      material.dispose();
    };
  }, [scene, name]);

  return null;
};
