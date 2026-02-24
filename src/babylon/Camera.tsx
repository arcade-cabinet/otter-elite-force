/**
 * Babylon.js Camera Components
 */

import { useEffect } from 'react';
import { 
  ArcRotateCamera as BabylonArcRotateCamera,
  UniversalCamera as BabylonUniversalCamera,
  Vector3 
} from '@babylonjs/core';
import { useScene } from './Scene';

interface CameraProps {
  position?: [number, number, number];
  target?: [number, number, number];
}

export const ArcRotateCamera: React.FC<CameraProps & { 
  alpha?: number;
  beta?: number;
  radius?: number;
}> = ({ 
  position = [0, 5, -10],
  target = [0, 0, 0],
  alpha = 0,
  beta = Math.PI / 4,
  radius = 10,
}) => {
  const { scene } = useScene();

  useEffect(() => {
    if (!scene) return;

    const camera = new BabylonArcRotateCamera(
      'camera',
      alpha,
      beta,
      radius,
      new Vector3(...target),
      scene
    );

    camera.attachControl(true);
    
    return () => {
      camera.dispose();
    };
  }, [scene, alpha, beta, radius]);

  return null;
};

export const UniversalCamera: React.FC<CameraProps> = ({
  position = [0, 5, -10],
  target = [0, 0, 0],
}) => {
  const { scene } = useScene();

  useEffect(() => {
    if (!scene) return;

    const camera = new BabylonUniversalCamera(
      'camera',
      new Vector3(...position),
      scene
    );

    camera.setTarget(new Vector3(...target));
    camera.attachControl(true);

    return () => {
      camera.dispose();
    };
  }, [scene]);

  return null;
};
