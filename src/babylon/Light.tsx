/**
 * Babylon.js Light Components
 */

import { useEffect } from 'react';
import {
  HemisphericLight as BabylonHemisphericLight,
  DirectionalLight as BabylonDirectionalLight,
  PointLight as BabylonPointLight,
  Vector3,
  Color3,
} from '@babylonjs/core';
import { useScene } from './Scene';

interface LightProps {
  intensity?: number;
  color?: [number, number, number];
}

export const HemisphericLight: React.FC<LightProps & {
  direction?: [number, number, number];
}> = ({ 
  direction = [0, 1, 0],
  intensity = 1,
  color = [1, 1, 1],
}) => {
  const { scene } = useScene();

  useEffect(() => {
    if (!scene) return;

    const light = new BabylonHemisphericLight(
      'hemispheric-light',
      new Vector3(...direction),
      scene
    );

    light.intensity = intensity;
    light.diffuse = new Color3(...color);

    return () => {
      light.dispose();
    };
  }, [scene, intensity]);

  return null;
};

export const DirectionalLight: React.FC<LightProps & {
  direction?: [number, number, number];
  position?: [number, number, number];
}> = ({
  direction = [0, -1, 0],
  position = [0, 10, 0],
  intensity = 1,
  color = [1, 1, 1],
}) => {
  const { scene } = useScene();

  useEffect(() => {
    if (!scene) return;

    const light = new BabylonDirectionalLight(
      'directional-light',
      new Vector3(...direction),
      scene
    );

    light.position = new Vector3(...position);
    light.intensity = intensity;
    light.diffuse = new Color3(...color);

    return () => {
      light.dispose();
    };
  }, [scene, intensity]);

  return null;
};

export const PointLight: React.FC<LightProps & {
  position?: [number, number, number];
}> = ({
  position = [0, 5, 0],
  intensity = 1,
  color = [1, 1, 1],
}) => {
  const { scene } = useScene();

  useEffect(() => {
    if (!scene) return;

    const light = new BabylonPointLight(
      'point-light',
      new Vector3(...position),
      scene
    );

    light.intensity = intensity;
    light.diffuse = new Color3(...color);

    return () => {
      light.dispose();
    };
  }, [scene, intensity]);

  return null;
};
