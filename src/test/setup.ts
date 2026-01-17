/**
 * Vitest Test Setup for OTTER: ELITE FORCE
 *
 * Provides comprehensive mocks for:
 * - localStorage (save data persistence)
 * - matchMedia (responsive design)
 * - ResizeObserver (canvas resizing)
 * - WebGL context (Three.js rendering)
 * - Tone.js (audio synthesis)
 * - Yuka (AI steering behaviors)
 * - Touch events (mobile controls)
 */

// Declare global for Node.js test environment
declare const global: typeof globalThis;

import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Cleanup after each test
afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

// Clear localStorage before each test
beforeEach(() => {
	localStorageMock.clear();
});

// Mock localStorage with full implementation
const localStorageMock = (() => {
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

// Mock ResizeObserver - must use class syntax for proper constructor
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

// Mock IntersectionObserver - must use class syntax for proper constructor
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

// Mock WebGL context for Three.js
HTMLCanvasElement.prototype.getContext = vi
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
					getParameter: vi.fn(() => 4096),
					getExtension: vi.fn(() => ({})),
					createProgram: vi.fn(() => ({})),
					createShader: vi.fn(() => ({})),
					shaderSource: vi.fn(),
					compileShader: vi.fn(),
					getShaderParameter: vi.fn(() => true),
					attachShader: vi.fn(),
					linkProgram: vi.fn(),
					getProgramParameter: vi.fn(() => true),
					useProgram: vi.fn(),
					getUniformLocation: vi.fn(() => ({})),
					getAttribLocation: vi.fn(() => 0),
					uniform1f: vi.fn(),
					uniform1i: vi.fn(),
					uniform2f: vi.fn(),
					uniform3f: vi.fn(),
					uniform4f: vi.fn(),
					uniformMatrix3fv: vi.fn(),
					uniformMatrix4fv: vi.fn(),
					viewport: vi.fn(),
					clearColor: vi.fn(),
					clear: vi.fn(),
					enable: vi.fn(),
					disable: vi.fn(),
					blendFunc: vi.fn(),
					depthFunc: vi.fn(),
					cullFace: vi.fn(),
					createBuffer: vi.fn(() => ({})),
					bindBuffer: vi.fn(),
					bufferData: vi.fn(),
					createTexture: vi.fn(() => ({})),
					bindTexture: vi.fn(),
					texImage2D: vi.fn(),
					texParameteri: vi.fn(),
					activeTexture: vi.fn(),
					generateMipmap: vi.fn(),
					createFramebuffer: vi.fn(() => ({})),
					bindFramebuffer: vi.fn(),
					framebufferTexture2D: vi.fn(),
					createRenderbuffer: vi.fn(() => ({})),
					bindRenderbuffer: vi.fn(),
					renderbufferStorage: vi.fn(),
					framebufferRenderbuffer: vi.fn(),
					checkFramebufferStatus: vi.fn(() => 36053), // FRAMEBUFFER_COMPLETE
					deleteBuffer: vi.fn(),
					deleteTexture: vi.fn(),
					deleteFramebuffer: vi.fn(),
					deleteRenderbuffer: vi.fn(),
					deleteProgram: vi.fn(),
					deleteShader: vi.fn(),
					getContextAttributes: vi.fn(() => ({
						alpha: true,
						antialias: true,
						depth: true,
						stencil: false,
						powerPreference: "default",
					})),
					getShaderInfoLog: vi.fn(() => ""),
					getProgramInfoLog: vi.fn(() => ""),
					enableVertexAttribArray: vi.fn(),
					vertexAttribPointer: vi.fn(),
					drawArrays: vi.fn(),
					drawElements: vi.fn(),
					pixelStorei: vi.fn(),
					scissor: vi.fn(),
					colorMask: vi.fn(),
					depthMask: vi.fn(),
					stencilMask: vi.fn(),
					frontFace: vi.fn(),
					lineWidth: vi.fn(),
					polygonOffset: vi.fn(),
					blendEquation: vi.fn(),
					blendFuncSeparate: vi.fn(),
					blendEquationSeparate: vi.fn(),
					isContextLost: vi.fn(() => false),
				} as unknown as WebGLRenderingContext;
			}
			if (contextType === "2d") {
				return {
					fillRect: vi.fn(),
					clearRect: vi.fn(),
					getImageData: vi.fn(() => ({
						data: new Uint8ClampedArray(0),
					})),
					putImageData: vi.fn(),
					createImageData: vi.fn(() => ({
						data: new Uint8ClampedArray(0),
					})),
					setTransform: vi.fn(),
					drawImage: vi.fn(),
					save: vi.fn(),
					restore: vi.fn(),
					beginPath: vi.fn(),
					moveTo: vi.fn(),
					lineTo: vi.fn(),
					closePath: vi.fn(),
					stroke: vi.fn(),
					fill: vi.fn(),
					translate: vi.fn(),
					scale: vi.fn(),
					rotate: vi.fn(),
					arc: vi.fn(),
					fillText: vi.fn(),
					measureText: vi.fn(() => ({ width: 0 })),
					canvas: document.createElement("canvas"),
				} as unknown as CanvasRenderingContext2D;
			}
			return null;
		},
	);

// Mock Tone.js globally
vi.mock("tone", () => {
	const mockParam = {
		value: 0,
		rampTo: vi.fn(),
		setValueAtTime: vi.fn(),
		linearRampToValueAtTime: vi.fn(),
		exponentialRampToValueAtTime: vi.fn(),
	};

	const synthMock = {
		toDestination: vi.fn().mockReturnThis(),
		connect: vi.fn().mockReturnThis(),
		disconnect: vi.fn(),
		triggerAttack: vi.fn(),
		triggerRelease: vi.fn(),
		triggerAttackRelease: vi.fn(),
		dispose: vi.fn(),
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
		toDestination: vi.fn().mockReturnThis(),
		connect: vi.fn().mockReturnThis(),
		disconnect: vi.fn(),
		dispose: vi.fn(),
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
		start: vi.fn().mockResolvedValue(undefined),
		now: vi.fn().mockReturnValue(0),
		gainToDb: vi.fn((gain: number) => 20 * Math.log10(gain)),
		dbToGain: vi.fn((db: number) => 10 ** (db / 20)),
		getDestination: vi.fn().mockReturnValue({ volume: mockParam }),
		getTransport: vi.fn().mockReturnValue({
			start: vi.fn(),
			stop: vi.fn(),
			pause: vi.fn(),
			bpm: mockParam,
			position: 0,
			seconds: 0,
			schedule: vi.fn(),
			scheduleRepeat: vi.fn(),
			cancel: vi.fn(),
		}),
		getContext: vi.fn().mockReturnValue({
			state: "running",
			sampleRate: 44100,
			currentTime: 0,
			resume: vi.fn().mockResolvedValue(undefined),
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
			start = vi.fn().mockReturnThis();
			stop = vi.fn().mockReturnThis();
			connect = vi.fn().mockReturnThis();
			toDestination = vi.fn().mockReturnThis();
			dispose = vi.fn();
			type = "white";
		},
		Oscillator: class {
			start = vi.fn().mockReturnThis();
			stop = vi.fn().mockReturnThis();
			connect = vi.fn().mockReturnThis();
			toDestination = vi.fn().mockReturnThis();
			dispose = vi.fn();
			frequency = mockParam;
			type = "sine";
		},
		Player: class {
			load = vi.fn().mockResolvedValue(undefined);
			start = vi.fn().mockReturnThis();
			stop = vi.fn().mockReturnThis();
			connect = vi.fn().mockReturnThis();
			toDestination = vi.fn().mockReturnThis();
			dispose = vi.fn();
			loaded = true;
		},
		Loop: class {
			callback: (time: number) => void;
			constructor(callback: (time: number) => void) {
				this.callback = callback;
			}
			start = vi.fn().mockReturnThis();
			stop = vi.fn().mockReturnThis();
			dispose = vi.fn().mockReturnThis();
		},
		Sequence: class {
			events: unknown[];
			callback: (time: number, note: unknown) => void;
			constructor(callback: (time: number, note: unknown) => void, events: unknown[]) {
				this.callback = callback;
				this.events = events;
			}
			start = vi.fn().mockReturnThis();
			stop = vi.fn().mockReturnThis();
			dispose = vi.fn().mockReturnThis();
		},
		Pattern: class {
			start = vi.fn().mockReturnThis();
			stop = vi.fn().mockReturnThis();
			dispose = vi.fn().mockReturnThis();
		},
		context: {
			state: "running",
			sampleRate: 44100,
			resume: vi.fn().mockResolvedValue(undefined),
		},
		Destination: { volume: mockParam },
		Transport: {
			start: vi.fn(),
			stop: vi.fn(),
			bpm: mockParam,
		},
	};
});

// Mock Yuka globally
vi.mock("yuka", () => {
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
		update = vi.fn();
	}

	class MockVehicle extends MockGameEntity {
		maxSpeed = 1;
		maxForce = 1;
		mass = 1;
		steering = {
			add: vi.fn(),
			remove: vi.fn(),
			clear: vi.fn(),
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
		add = vi.fn((entity: MockGameEntity) => {
			this.entities.push(entity);
			return this;
		});
		remove = vi.fn((entity: MockGameEntity) => {
			const idx = this.entities.indexOf(entity);
			if (idx > -1) this.entities.splice(idx, 1);
			return this;
		});
		update = vi.fn();
		clear = vi.fn(() => {
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
		add = vi.fn((name: string, state: { name: string }) => {
			this.states.set(name, state);
			return this;
		});
		changeTo = vi.fn((name: string) => {
			this.currentState = this.states.get(name) || { name };
		});
		update = vi.fn();
		handleMessage = vi.fn(() => false);
	}

	class MockState {
		name = "MockState";
		enter = vi.fn();
		execute = vi.fn();
		exit = vi.fn();
		onMessage = vi.fn(() => false);
	}

	const MockTime = {
		delta: 0.016,
		elapsed: 0,
		update: vi.fn(),
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

// Mock Three.js components that are heavy or require WebGL
vi.mock("three", async (importOriginal) => {
	const actual = await importOriginal<typeof import("three")>();
	return {
		...actual,
		// Override heavy classes with mocks if needed
		WebGLRenderer: vi.fn().mockImplementation(() => ({
			setSize: vi.fn(),
			setPixelRatio: vi.fn(),
			render: vi.fn(),
			dispose: vi.fn(),
			domElement: document.createElement("canvas"),
			shadowMap: { enabled: false, type: 0 },
			outputColorSpace: "srgb",
			toneMapping: 0,
			toneMappingExposure: 1,
			info: { render: { calls: 0, triangles: 0 } },
		})),
	};
});

// Mock @react-three/fiber
vi.mock("@react-three/fiber", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@react-three/fiber")>();
	const React = await import("react");

	return {
		...actual,
		// Canvas mock - renders as empty div, 3D elements are not rendered in RTL tests
		Canvas: ({ children: _children }: { children: React.ReactNode }) => {
			// Don't render R3F children - they can't exist in DOM
			return React.createElement("div", { "data-testid": "r3f-canvas" });
		},
		useFrame: vi.fn(),
		useThree: vi.fn(() => ({
			camera: {
				position: { x: 0, y: 10, z: 20, set: vi.fn(), copy: vi.fn() },
				lookAt: vi.fn(),
				updateProjectionMatrix: vi.fn(),
			},
			scene: { add: vi.fn(), remove: vi.fn() },
			gl: { domElement: document.createElement("canvas") },
			size: { width: 800, height: 600 },
			viewport: { width: 800, height: 600 },
			clock: { getElapsedTime: () => 0 },
		})),
	};
});

// Mock @react-three/drei - common utility components
vi.mock("@react-three/drei", () => {
	return {
		Environment: () => null,
		Sky: () => null,
		OrbitControls: () => null,
		PerspectiveCamera: () => null,
		Text: () => null,
		Html: () => null,
		useTexture: vi.fn(() => null),
		useGLTF: vi.fn(() => ({ scene: {}, nodes: {}, materials: {} })),
		useProgress: vi.fn(() => ({ progress: 100, loaded: true })),
		Billboard: () => null,
		Float: () => null,
		Center: () => null,
		Sparkles: () => null,
		Stars: () => null,
		Cloud: () => null,
		Clouds: () => null,
	};
});

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
