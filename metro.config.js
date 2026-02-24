/**
 * Metro configuration for React Native
 * https://reactnative.dev/docs/metro
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add Babylon.js support
config.resolver.sourceExts.push('cjs');

// Support for web
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.js', 'web.jsx', 'web.ts', 'web.tsx'];

module.exports = config;
