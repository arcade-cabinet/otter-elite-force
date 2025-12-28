import { beforeEach, vi } from "vitest";

// Mock localStorage with full implementation
export const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value.toString();
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
		get length() {
			return Object.keys(store).length;
		},
		key: vi.fn((index: number) => Object.keys(store)[index] || null),
	};
})();

/**
 * Setup DOM-related global mocks
 */
export function setupDomMocks(global: any) {
	Object.defineProperty(window, "localStorage", {
		value: localStorageMock,
		writable: true,
	});

	// Mock matchMedia for responsive design testing
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});

	// Mock ResizeObserver
	class MockResizeObserver {
		callback: ResizeObserverCallback;
		constructor(callback: ResizeObserverCallback) {
			this.callback = callback;
		}
		observe = vi.fn();
		unobserve = vi.fn();
		disconnect = vi.fn();
	}
	global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

	// Mock IntersectionObserver
	class MockIntersectionObserver {
		callback: IntersectionObserverCallback;
		root: Element | null = null;
		rootMargin = "";
		thresholds: readonly number[] = [];
		constructor(callback: IntersectionObserverCallback) {
			this.callback = callback;
		}
		observe = vi.fn();
		unobserve = vi.fn();
		disconnect = vi.fn();
		takeRecords = vi.fn(() => []);
	}
	global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

	// Mock requestAnimationFrame
	global.requestAnimationFrame = vi.fn((callback) => {
		return setTimeout(() => callback(Date.now()), 16) as unknown as number;
	});
	global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

	// Mock performance.now
	if (!global.performance) {
		(global as Record<string, unknown>).performance = {};
	}
	global.performance.now = vi.fn(() => Date.now());

	// Mock navigator for haptics and device detection
	Object.defineProperty(navigator, "vibrate", {
		value: vi.fn(() => true),
		writable: true,
	});

	Object.defineProperty(navigator, "maxTouchPoints", {
		value: 0,
		writable: true,
	});

	// Mock touch events
	class MockTouchEvent extends Event {
		touches: Touch[] = [];
		targetTouches: Touch[] = [];
		changedTouches: Touch[] = [];
	}
	global.TouchEvent = MockTouchEvent as unknown as typeof TouchEvent;

	// Clear localStorage before each test
	beforeEach(() => {
		localStorageMock.clear();
	});
}
