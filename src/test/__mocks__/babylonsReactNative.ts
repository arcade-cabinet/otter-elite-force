/**
 * Mock for @babylonjs/react-native - stubs out native module to prevent
 * react-native native code from loading in test environment
 */
export const EngineView = () => null;
export const useEngine = () => null;
export const BabylonModule = {
	init: jest.fn(),
};
