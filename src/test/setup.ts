/**
 * Jest Test Setup for OTTER: ELITE FORCE
 *
 * Provides comprehensive mocks for:
 * - localStorage (save data persistence)
 * - matchMedia (responsive design)
 * - ResizeObserver (canvas resizing)
 * - WebGL context (Babylon.js rendering)
 * - Tone.js (audio synthesis)
 * - Yuka (AI steering behaviors)
 * - Touch events (mobile controls)
 */

// Declare global for Node.js test environment
declare const global: typeof globalThis;

import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock crypto.randomUUID for jsdom environments that lack it
if (!global.crypto || !global.crypto.randomUUID) {
	let _uuid = 0;
	Object.defineProperty(global, "crypto", {
		value: {
			...global.crypto,
			randomUUID: () => `test-uuid-${++_uuid}`,
		},
		writable: true,
	});
}

// Cleanup after each test
afterEach(() => {
	cleanup();
	jest.clearAllMocks();
});

// Clear localStorage before each test
beforeEach(() => {
	localStorageMock.clear();
});

// Mock localStorage with full implementation
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: jest.fn((key: string) => store[key] || null),
		setItem: jest.fn((key: string, value: string) => {
			store[key] = value.toString();
		}),
		removeItem: jest.fn((key: string) => {
			delete store[key];
		}),
		clear: jest.fn(() => {
			store = {};
		}),
		get length() {
			return Object.keys(store).length;
		},
		key: jest.fn((index: number) => Object.keys(store)[index] || null),
	};
})();

Object.defineProperty(window, "localStorage", {
	value: localStorageMock,
	writable: true,
});

// Mock matchMedia for responsive design testing
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: jest.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(),
		removeListener: jest.fn(),
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	})),
});

// Mock ResizeObserver - must use class syntax for proper constructor
class MockResizeObserver {
	callback: ResizeObserverCallback;
	constructor(callback: ResizeObserverCallback) {
		this.callback = callback;
	}
	observe = jest.fn();
	unobserve = jest.fn();
	disconnect = jest.fn();
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock IntersectionObserver - must use class syntax for proper constructor
class MockIntersectionObserver {
	callback: IntersectionObserverCallback;
	root: Element | null = null;
	rootMargin = "";
	thresholds: readonly number[] = [];
	constructor(callback: IntersectionObserverCallback) {
		this.callback = callback;
	}
	observe = jest.fn();
	unobserve = jest.fn();
	disconnect = jest.fn();
	takeRecords = jest.fn(() => []);
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
	return setTimeout(() => callback(Date.now()), 16) as unknown as number;
});
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

// Mock performance.now
if (!global.performance) {
	(global as Record<string, unknown>).performance = {};
}
global.performance.now = jest.fn(() => Date.now());

// Mock WebGL context for Babylon.js
HTMLCanvasElement.prototype.getContext = jest
	.fn()
	.mockImplementation(
		(
			contextType: string,
		): RenderingContext | WebGLRenderingContext | WebGL2RenderingContext | null => {
			if (contextType === "webgl" || contextType === "webgl2") {
				return {
					canvas: document.createElement("canvas"),
					drawingBufferWidth: 800,
					drawingBufferHeight: 600,
					drawingBufferColorSpace: "srgb",
					getParameter: jest.fn(() => 4096),
					getExtension: jest.fn(() => ({})),
					createProgram: jest.fn(() => ({})),
					createShader: jest.fn(() => ({})),
					shaderSource: jest.fn(),
					compileShader: jest.fn(),
					getShaderParameter: jest.fn(() => true),
					attachShader: jest.fn(),
					linkProgram: jest.fn(),
					getProgramParameter: jest.fn(() => true),
					useProgram: jest.fn(),
					getUniformLocation: jest.fn(() => ({})),
					getAttribLocation: jest.fn(() => 0),
					uniform1f: jest.fn(),
					uniform1i: jest.fn(),
					uniform2f: jest.fn(),
					uniform3f: jest.fn(),
					uniform4f: jest.fn(),
					uniformMatrix3fv: jest.fn(),
					uniformMatrix4fv: jest.fn(),
					viewport: jest.fn(),
					clearColor: jest.fn(),
					clear: jest.fn(),
					enable: jest.fn(),
					disable: jest.fn(),
					blendFunc: jest.fn(),
					depthFunc: jest.fn(),
					cullFace: jest.fn(),
					createBuffer: jest.fn(() => ({})),
					bindBuffer: jest.fn(),
					bufferData: jest.fn(),
					createTexture: jest.fn(() => ({})),
					bindTexture: jest.fn(),
					texImage2D: jest.fn(),
					texParameteri: jest.fn(),
					activeTexture: jest.fn(),
					generateMipmap: jest.fn(),
					createFramebuffer: jest.fn(() => ({})),
					bindFramebuffer: jest.fn(),
					framebufferTexture2D: jest.fn(),
					createRenderbuffer: jest.fn(() => ({})),
					bindRenderbuffer: jest.fn(),
					renderbufferStorage: jest.fn(),
					framebufferRenderbuffer: jest.fn(),
					checkFramebufferStatus: jest.fn(() => 36053), // FRAMEBUFFER_COMPLETE
					deleteBuffer: jest.fn(),
					deleteTexture: jest.fn(),
					deleteFramebuffer: jest.fn(),
					deleteRenderbuffer: jest.fn(),
					deleteProgram: jest.fn(),
					deleteShader: jest.fn(),
					getContextAttributes: jest.fn(() => ({
						alpha: true,
						antialias: true,
						depth: true,
						stencil: false,
						powerPreference: "default",
					})),
					getShaderInfoLog: jest.fn(() => ""),
					getProgramInfoLog: jest.fn(() => ""),
					enableVertexAttribArray: jest.fn(),
					vertexAttribPointer: jest.fn(),
					drawArrays: jest.fn(),
					drawElements: jest.fn(),
					pixelStorei: jest.fn(),
					scissor: jest.fn(),
					colorMask: jest.fn(),
					depthMask: jest.fn(),
					stencilMask: jest.fn(),
					frontFace: jest.fn(),
					lineWidth: jest.fn(),
					polygonOffset: jest.fn(),
					blendEquation: jest.fn(),
					blendFuncSeparate: jest.fn(),
					blendEquationSeparate: jest.fn(),
					isContextLost: jest.fn(() => false),
				} as unknown as WebGLRenderingContext;
			}
			if (contextType === "2d") {
				return {
					fillRect: jest.fn(),
					clearRect: jest.fn(),
					getImageData: jest.fn(() => ({
						data: new Uint8ClampedArray(0),
					})),
					putImageData: jest.fn(),
					createImageData: jest.fn(() => ({
						data: new Uint8ClampedArray(0),
					})),
					setTransform: jest.fn(),
					drawImage: jest.fn(),
					save: jest.fn(),
					restore: jest.fn(),
					beginPath: jest.fn(),
					moveTo: jest.fn(),
					lineTo: jest.fn(),
					closePath: jest.fn(),
					stroke: jest.fn(),
					fill: jest.fn(),
					translate: jest.fn(),
					scale: jest.fn(),
					rotate: jest.fn(),
					arc: jest.fn(),
					fillText: jest.fn(),
					measureText: jest.fn(() => ({ width: 0 })),
					canvas: document.createElement("canvas"),
				} as unknown as CanvasRenderingContext2D;
			}
			return null;
		},
	);

// Mock Tone.js globally
jest.mock("tone", () => {
	const mockParam = {
		value: 0,
		rampTo: jest.fn(),
		setValueAtTime: jest.fn(),
		linearRampToValueAtTime: jest.fn(),
		exponentialRampToValueAtTime: jest.fn(),
	};

	const synthMock = {
		toDestination: jest.fn().mockReturnThis(),
		connect: jest.fn().mockReturnThis(),
		disconnect: jest.fn(),
		triggerAttack: jest.fn(),
		triggerRelease: jest.fn(),
		triggerAttackRelease: jest.fn(),
		dispose: jest.fn(),
		volume: mockParam,
		frequency: mockParam,
	};

	function MockSynth() {
		return { ...synthMock };
	}
	function MockPolySynth() {
		return { ...synthMock };
	}
	function MockFMSynth() {
		return { ...synthMock };
	}
	function MockAMSynth() {
		return { ...synthMock };
	}
	function MockNoiseSynth() {
		return { ...synthMock };
	}
	function MockMembraneSynth() {
		return { ...synthMock };
	}
	function MockMetalSynth() {
		return { ...synthMock };
	}
	function MockPluckSynth() {
		return { ...synthMock };
	}

	const effectMock = {
		toDestination: jest.fn().mockReturnThis(),
		connect: jest.fn().mockReturnThis(),
		disconnect: jest.fn(),
		dispose: jest.fn(),
		wet: mockParam,
	};

	function MockFilter() {
		return { ...effectMock, frequency: mockParam, Q: mockParam };
	}
	function MockReverb() {
		return { ...effectMock, decay: 1.5 };
	}
	function MockDelay() {
		return { ...effectMock, delayTime: mockParam, feedback: mockParam };
	}
	function MockDistortion() {
		return { ...effectMock, distortion: 0.5 };
	}
	function MockGain() {
		return { ...effectMock, gain: mockParam };
	}

	return {
		start: jest.fn().mockResolvedValue(undefined),
		now: jest.fn().mockReturnValue(0),
		gainToDb: jest.fn((gain: number) => 20 * Math.log10(gain)),
		dbToGain: jest.fn((db: number) => 10 ** (db / 20)),
		getDestination: jest.fn().mockReturnValue({ volume: mockParam }),
		getTransport: jest.fn().mockReturnValue({
			start: jest.fn(),
			stop: jest.fn(),
			pause: jest.fn(),
			bpm: mockParam,
			position: 0,
			seconds: 0,
			schedule: jest.fn(),
			scheduleRepeat: jest.fn(),
			cancel: jest.fn(),
		}),
		getContext: jest.fn().mockReturnValue({
			state: "running",
			sampleRate: 44100,
			currentTime: 0,
			resume: jest.fn().mockResolvedValue(undefined),
		}),
		Synth: MockSynth,
		PolySynth: MockPolySynth,
		FMSynth: MockFMSynth,
		AMSynth: MockAMSynth,
		NoiseSynth: MockNoiseSynth,
		MembraneSynth: MockMembraneSynth,
		MetalSynth: MockMetalSynth,
		PluckSynth: MockPluckSynth,
		Filter: MockFilter,
		Reverb: MockReverb,
		Delay: MockDelay,
		Distortion: MockDistortion,
		Gain: MockGain,
		Noise: class {
			start = jest.fn().mockReturnThis();
			stop = jest.fn().mockReturnThis();
			connect = jest.fn().mockReturnThis();
			toDestination = jest.fn().mockReturnThis();
			dispose = jest.fn();
			type = "white";
		},
		Oscillator: class {
			start = jest.fn().mockReturnThis();
			stop = jest.fn().mockReturnThis();
			connect = jest.fn().mockReturnThis();
			toDestination = jest.fn().mockReturnThis();
			dispose = jest.fn();
			frequency = mockParam;
			type = "sine";
		},
		Player: class {
			load = jest.fn().mockResolvedValue(undefined);
			start = jest.fn().mockReturnThis();
			stop = jest.fn().mockReturnThis();
			connect = jest.fn().mockReturnThis();
			toDestination = jest.fn().mockReturnThis();
			dispose = jest.fn();
			loaded = true;
		},
		Loop: class {
			callback: (time: number) => void;
			constructor(callback: (time: number) => void) {
				this.callback = callback;
			}
			start = jest.fn().mockReturnThis();
			stop = jest.fn().mockReturnThis();
			dispose = jest.fn().mockReturnThis();
		},
		Sequence: class {
			events: unknown[];
			callback: (time: number, note: unknown) => void;
			constructor(callback: (time: number, note: unknown) => void, events: unknown[]) {
				this.callback = callback;
				this.events = events;
			}
			start = jest.fn().mockReturnThis();
			stop = jest.fn().mockReturnThis();
			dispose = jest.fn().mockReturnThis();
		},
		Pattern: class {
			start = jest.fn().mockReturnThis();
			stop = jest.fn().mockReturnThis();
			dispose = jest.fn().mockReturnThis();
		},
		context: {
			state: "running",
			sampleRate: 44100,
			resume: jest.fn().mockResolvedValue(undefined),
		},
		Destination: { volume: mockParam },
		Transport: {
			start: jest.fn(),
			stop: jest.fn(),
			bpm: mockParam,
		},
	};
});

// Mock Yuka globally
jest.mock("yuka", () => {
	class MockVector3 {
		x = 0;
		y = 0;
		z = 0;
		constructor(x = 0, y = 0, z = 0) {
			this.x = x;
			this.y = y;
			this.z = z;
		}
		set(x: number, y: number, z: number) {
			this.x = x;
			this.y = y;
			this.z = z;
			return this;
		}
		copy(v: MockVector3) {
			this.x = v.x;
			this.y = v.y;
			this.z = v.z;
			return this;
		}
		clone() {
			return new MockVector3(this.x, this.y, this.z);
		}
		add(v: MockVector3) {
			this.x += v.x;
			this.y += v.y;
			this.z += v.z;
			return this;
		}
		sub(v: MockVector3) {
			this.x -= v.x;
			this.y -= v.y;
			this.z -= v.z;
			return this;
		}
		multiplyScalar(s: number) {
			this.x *= s;
			this.y *= s;
			this.z *= s;
			return this;
		}
		length() {
			return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
		}
		normalize() {
			const len = this.length();
			if (len > 0) this.multiplyScalar(1 / len);
			return this;
		}
		distanceTo(v: MockVector3) {
			return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2 + (this.z - v.z) ** 2);
		}
		squaredDistanceTo(v: MockVector3) {
			return (this.x - v.x) ** 2 + (this.y - v.y) ** 2 + (this.z - v.z) ** 2;
		}
	}

	class MockQuaternion {
		x = 0;
		y = 0;
		z = 0;
		w = 1;
	}

	class MockGameEntity {
		uuid = crypto.randomUUID();
		position = new MockVector3();
		rotation = new MockQuaternion();
		velocity = new MockVector3();
		boundingRadius = 1;
		active = true;
		update = jest.fn();
	}

	class MockVehicle extends MockGameEntity {
		maxSpeed = 1;
		maxForce = 1;
		mass = 1;
		steering = {
			add: jest.fn(),
			remove: jest.fn(),
			clear: jest.fn(),
			behaviors: [],
		};
	}

	class MockSteeringBehavior {
		active = true;
		weight = 1;
	}

	class MockSeekBehavior extends MockSteeringBehavior {
		target = new MockVector3();
	}

	class MockFleeBehavior extends MockSteeringBehavior {
		target = new MockVector3();
		panicDistance = 10;
	}

	class MockWanderBehavior extends MockSteeringBehavior {
		radius = 1;
		distance = 1;
		jitter = 0.5;
	}

	class MockArriveBehavior extends MockSteeringBehavior {
		target = new MockVector3();
		deceleration = 3;
	}

	class MockPursuitBehavior extends MockSteeringBehavior {
		evader: MockVehicle | null = null;
	}

	class MockEvadeBehavior extends MockSteeringBehavior {
		pursuer: MockVehicle | null = null;
		panicDistance = 10;
	}

	class MockEntityManager {
		entities: MockGameEntity[] = [];
		add = jest.fn((entity: MockGameEntity) => {
			this.entities.push(entity);
			return this;
		});
		remove = jest.fn((entity: MockGameEntity) => {
			const idx = this.entities.indexOf(entity);
			if (idx > -1) this.entities.splice(idx, 1);
			return this;
		});
		update = jest.fn();
		clear = jest.fn(() => {
			this.entities = [];
			return this;
		});
	}

	class MockStateMachine {
		owner: MockGameEntity;
		currentState: { name: string } | null = null;
		globalState: { name: string } | null = null;
		states = new Map();
		constructor(owner: MockGameEntity) {
			this.owner = owner;
		}
		add = jest.fn((name: string, state: { name: string }) => {
			this.states.set(name, state);
			return this;
		});
		changeTo = jest.fn((name: string) => {
			this.currentState = this.states.get(name) || { name };
		});
		update = jest.fn();
		handleMessage = jest.fn(() => false);
	}

	class MockState {
		name = "MockState";
		enter = jest.fn();
		execute = jest.fn();
		exit = jest.fn();
		onMessage = jest.fn(() => false);
	}

	const MockTime = {
		delta: 0.016,
		elapsed: 0,
		update: jest.fn(),
	};

	return {
		Vector3: MockVector3,
		Quaternion: MockQuaternion,
		GameEntity: MockGameEntity,
		Vehicle: MockVehicle,
		SteeringBehavior: MockSteeringBehavior,
		SeekBehavior: MockSeekBehavior,
		FleeBehavior: MockFleeBehavior,
		WanderBehavior: MockWanderBehavior,
		ArriveBehavior: MockArriveBehavior,
		PursuitBehavior: MockPursuitBehavior,
		EvadeBehavior: MockEvadeBehavior,
		EntityManager: MockEntityManager,
		StateMachine: MockStateMachine,
		State: MockState,
		Time: MockTime,
	};
});

// Mock navigator for haptics and device detection
Object.defineProperty(navigator, "vibrate", {
	value: jest.fn(() => true),
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

// Suppress console warnings in tests (optional - remove if you want to see them)
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
	// Filter out known harmless warnings
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

// Suppress console errors for React Three Fiber intrinsic elements in tests
const originalError = console.error;
console.error = (...args: unknown[]) => {
	const message = args[0]?.toString() || "";
	if (message.includes("The tag <") && message.includes("is unrecognized in this browser")) {
		return;
	}
	if (message.includes("is using incorrect casing")) {
		return;
	}
	if (message.includes("React does not recognize the")) {
		return;
	}
	originalError.apply(console, args);
};

// Export mocks for use in individual tests
export { localStorageMock };
