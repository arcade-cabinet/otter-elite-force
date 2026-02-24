/**
 * Mock for reactylon - stubs out Babylon.js Scene context to prevent
 * engine initialization in test environment
 */
import React from "react";

// Mock scene object with onBeforeRenderObservable
export const mockObserver = { callback: null as (((...args: unknown[]) => void) | null) };

export const mockScene = {
	onBeforeRenderObservable: {
		add: jest.fn((cb: (...args: unknown[]) => void) => {
			mockObserver.callback = cb;
			return { callback: cb };
		}),
		remove: jest.fn(),
	},
	clearColor: null,
	fogMode: 0,
	fogColor: null,
	fogDensity: 0,
	ambientColor: null,
	activeCamera: null,
};

export const useScene = jest.fn(() => mockScene);

export const Scene = ({
	children,
	onSceneReady,
}: {
	children?: React.ReactNode;
	onSceneReady?: (scene: typeof mockScene) => void;
}) => {
	if (onSceneReady) {
		onSceneReady(mockScene);
	}
	return React.createElement("div", { "data-testid": "babylon-scene" }, children);
};
