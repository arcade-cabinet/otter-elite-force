/**
 * Main App Entry Point for Expo
 * Migrated to Babylon.js + Reactylon Native
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { useGameStore } from './stores/gameStore';
import { audioEngine } from './Core/AudioEngine';
import { BabylonEngine } from './babylon/BabylonEngine';
import { Scene } from './babylon/Scene';
import { ArcRotateCamera } from './babylon/Camera';
import { HemisphericLight } from './babylon/Light';
import { Box } from './babylon/primitives/Box';
import { Ground } from './babylon/primitives/Ground';

// Expose store for E2E testing
declare global {
  interface Window {
    __gameStore?: typeof useGameStore;
  }
}

export default function App() {
  const { mode, loadData } = useGameStore();

  useEffect(() => {
    // Expose store to window for testing
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.__gameStore = useGameStore;
    }

    // Load save data
    loadData();

    // Initialize audio on interaction
    const initAudio = async () => {
      await audioEngine.init();
      audioEngine.playMusic('menu');
    };

    if (Platform.OS === 'web') {
      const handleInteraction = () => {
        initAudio();
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
      };

      document.addEventListener('click', handleInteraction);
      document.addEventListener('touchstart', handleInteraction);

      return () => {
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
      };
    }
  }, [loadData]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Babylon.js 3D Scene */}
      <BabylonEngine style={styles.canvas}>
        <Scene clearColor={[0.1, 0.1, 0.15, 1]}>
          <ArcRotateCamera 
            position={[0, 5, -10]}
            target={[0, 0, 0]}
            radius={15}
            beta={Math.PI / 3}
          />
          <HemisphericLight intensity={0.7} />
          <Ground width={20} height={20} color={[0.3, 0.5, 0.3]} />
          <Box position={[0, 1, 0]} size={2} color={[1, 0.5, 0]} />
          <Box position={[3, 1, 0]} size={1.5} color={[0.5, 0.5, 1]} />
          <Box position={[-3, 0.5, 2]} size={1} color={[1, 0.2, 0.2]} />
        </Scene>
      </BabylonEngine>

      {/* UI Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.title}>🦦 OTTER: ELITE FORCE</Text>
        <Text style={styles.subtitle}>Mode: {mode}</Text>
        <Text style={styles.info}>Babylon.js + Reactylon Native + Expo</Text>
        <Text style={styles.info}>Platform: {Platform.OS}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  canvas: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffaa00',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
  },
  info: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
});
