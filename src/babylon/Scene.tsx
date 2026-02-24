/**
 * Babylon.js Scene Wrapper
 * React component for managing a Babylon.js scene
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Scene as BabylonScene } from '@babylonjs/core';
import { useBabylonEngine } from './BabylonEngine';

interface SceneContextValue {
  scene: BabylonScene | null;
}

const SceneContext = createContext<SceneContextValue>({
  scene: null,
});

export const useScene = () => useContext(SceneContext);

interface SceneProps {
  children: React.ReactNode;
  onSceneMount?: (scene: BabylonScene) => void;
  clearColor?: [number, number, number, number];
}

export const Scene: React.FC<SceneProps> = ({
  children,
  onSceneMount,
  clearColor = [0, 0, 0, 1],
}) => {
  const { engine } = useBabylonEngine();
  const [scene, setScene] = useState<BabylonScene | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!engine) return;

    const newScene = new BabylonScene(engine);
    newScene.clearColor = new (BabylonScene as any).Color4(...clearColor);
    
    setScene(newScene);

    if (onSceneMount) {
      onSceneMount(newScene);
    }

    // Render loop
    const renderLoop = () => {
      newScene.render();
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      newScene.dispose();
    };
  }, [engine]);

  if (!scene) {
    return null;
  }

  return (
    <SceneContext.Provider value={{ scene }}>
      {children}
    </SceneContext.Provider>
  );
};
