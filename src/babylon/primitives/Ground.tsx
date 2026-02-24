/**
 * Babylon.js Ground Primitive
 */

import { useEffect } from 'react';
import {
  MeshBuilder,
  StandardMaterial,
  Color3,
} from '@babylonjs/core';
import { useScene } from '../Scene';

interface GroundProps {
  width?: number;
  height?: number;
  subdivisions?: number;
  color?: [number, number, number];
  name?: string;
}

export const Ground: React.FC<GroundProps> = ({
  width = 10,
  height = 10,
  subdivisions = 2,
  color = [0.5, 0.7, 0.5],
  name = 'ground',
}) => {
  const { scene } = useScene();

  useEffect(() => {
    if (!scene) return;

    const ground = MeshBuilder.CreateGround(
      name,
      { width, height, subdivisions },
      scene
    );

    const material = new StandardMaterial(`${name}-material`, scene);
    material.diffuseColor = new Color3(...color);
    ground.material = material;

    return () => {
      ground.dispose();
      material.dispose();
    };
  }, [scene, width, height, subdivisions]);

  return null;
};
