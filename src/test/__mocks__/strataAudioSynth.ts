/**
 * Mock for @strata-game-library/audio-synth
 * Provides stub implementations for test environments
 */

export const createSynthManager = jest.fn(() => ({
	init: jest.fn().mockResolvedValue(undefined),
	playSFX: jest.fn(),
	playMusic: jest.fn(),
	stopMusic: jest.fn(),
	setVolume: jest.fn(),
	isReady: jest.fn(() => true),
}));

export type ISynthManager = {
	init: () => Promise<void>;
	playSFX: (presetId: string) => void;
	playMusic: (pattern: string) => void;
	stopMusic: () => void;
	setVolume: (volume: number) => void;
	isReady: () => boolean;
};
