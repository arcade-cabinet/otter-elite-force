/**
 * Vitest Test Setup for OTTER: ELITE FORCE
 */

// Declare global for Node.js test environment
declare const global: typeof globalThis;

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { setupAudioMocks } from "./mocks/audioMocks";
import { localStorageMock, setupDomMocks } from "./mocks/domMocks";
import { setupThreeMocks } from "./mocks/threeMocks";
import { setupYukaMocks } from "./mocks/yukaMocks";

// Initialize all mocks
setupDomMocks(global);
setupAudioMocks();
setupThreeMocks();
setupYukaMocks();

// Cleanup after each test
afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
	const message = args[0]?.toString() || "";
	if (
		message.includes("THREE.") ||
		message.includes("React does not recognize") ||
		message.includes("WebGL")
	) {
		return;
	}
	originalWarn.apply(console, args);
};

// Export mocks for use in individual tests
export { localStorageMock };
