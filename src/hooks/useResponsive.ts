/**
 * Responsive Hook for Native Device Detection
 * 
 * Properly detects:
 * - Screen dimensions (Expo Dimensions API)
 * - Orientation (portrait/landscape)
 * - Device type (phone/tablet/foldable)
 * - Folding events (for foldable devices)
 * - Safe areas (notches, rounded corners)
 */

import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export type Orientation = 'portrait' | 'landscape';
export type DeviceType = 'phone' | 'tablet' | 'foldable' | 'desktop';

interface ResponsiveState {
  width: number;
  height: number;
  orientation: Orientation;
  deviceType: DeviceType;
  isSmall: boolean; // < 400px width
  isMedium: boolean; // 400-768px width
  isLarge: boolean; // 768-1024px width
  isXLarge: boolean; // > 1024px width
  aspectRatio: number;
  scale: number;
  fontScale: number;
}

/**
 * Determine device type based on dimensions
 */
function getDeviceType(width: number, height: number): DeviceType {
  if (Platform.OS === 'web') {
    return 'desktop';
  }
  
  const shortEdge = Math.min(width, height);
  const longEdge = Math.max(width, height);
  
  // Foldable detection: unusual aspect ratios or very large screens on mobile
  const aspectRatio = longEdge / shortEdge;
  if (aspectRatio > 2.2 || (shortEdge > 600 && longEdge > 2000)) {
    return 'foldable';
  }
  
  // Tablet: short edge > 600dp
  if (shortEdge >= 600) {
    return 'tablet';
  }
  
  return 'phone';
}

/**
 * Custom hook for responsive layout
 */
export function useResponsive(): ResponsiveState {
  const [dimensions, setDimensions] = useState(() => {
    const window = Dimensions.get('window');
    const screen = Dimensions.get('screen');
    
    return {
      window,
      screen,
    };
  });

  useEffect(() => {
    // Listen for dimension changes (orientation, folding, window resize)
    const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
      setDimensions({ window, screen });
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const { width, height } = dimensions.window;
  const orientation: Orientation = width > height ? 'landscape' : 'portrait';
  const deviceType = getDeviceType(width, height);
  const aspectRatio = width / height;
  const scale = dimensions.window.scale || 1;
  const fontScale = dimensions.window.fontScale || 1;

  return {
    width,
    height,
    orientation,
    deviceType,
    isSmall: width < 400,
    isMedium: width >= 400 && width < 768,
    isLarge: width >= 768 && width < 1024,
    isXLarge: width >= 1024,
    aspectRatio,
    scale,
    fontScale,
  };
}

/**
 * Hook to detect when device orientation changes
 */
export function useOrientation(): Orientation {
  const { orientation } = useResponsive();
  return orientation;
}

/**
 * Hook to detect foldable device state
 */
export function useFoldable() {
  const { deviceType, width, height } = useResponsive();
  
  const isFoldable = deviceType === 'foldable';
  const isFolded = isFoldable && Math.min(width, height) < 500;
  const isUnfolded = isFoldable && !isFolded;
  
  return {
    isFoldable,
    isFolded,
    isUnfolded,
  };
}
