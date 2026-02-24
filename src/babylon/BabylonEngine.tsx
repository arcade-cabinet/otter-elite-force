/**
 * Babylon.js Engine Wrapper for React Native / Web
 * Provides a React-friendly interface to Babylon.js Engine
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Engine, Scene as BabylonScene } from '@babylonjs/core';
import { Platform, View, StyleSheet } from 'react-native';

interface BabylonEngineContextValue {
  engine: Engine | null;
  canvas: HTMLCanvasElement | null;
}

const BabylonEngineContext = createContext<BabylonEngineContextValue>({
  engine: null,
  canvas: null,
});

export const useBabylonEngine = () => useContext(BabylonEngineContext);

interface BabylonEngineProps {
  children: React.ReactNode;
  antialias?: boolean;
  adaptToDeviceRatio?: boolean;
  style?: any;
}

export const BabylonEngine: React.FC<BabylonEngineProps> = ({
  children,
  antialias = true,
  adaptToDeviceRatio = true,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<Engine | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web platform - use canvas
      if (canvasRef.current) {
        const newEngine = new Engine(canvasRef.current, antialias, {
          adaptToDeviceRatio,
          preserveDrawingBuffer: true,
          stencil: true,
        });

        setEngine(newEngine);

        // Handle resize
        const handleResize = () => {
          newEngine.resize();
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          newEngine.dispose();
        };
      }
    } else {
      // Native platform - would use EngineView from @babylonjs/react-native
      console.warn('Native Babylon.js engine not yet implemented');
    }
  }, [antialias, adaptToDeviceRatio]);

  if (Platform.OS === 'web') {
    return (
      <BabylonEngineContext.Provider value={{ engine, canvas: canvasRef.current }}>
        <div style={{ width: '100%', height: '100%', ...style }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              touchAction: 'none',
            }}
          />
          {engine && children}
        </div>
      </BabylonEngineContext.Provider>
    );
  }

  // Native rendering would go here
  return (
    <View style={[styles.container, style]}>
      {/* Native EngineView would go here */}
      <BabylonEngineContext.Provider value={{ engine, canvas: null }}>
        {children}
      </BabylonEngineContext.Provider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
