/**
 * Comprehensive React Three Fiber and Three.js Mocks
 * 
 * These mocks allow testing R3F components without WebGL context.
 */

import { vi } from "vitest";
import type { ReactNode } from "react";

// Mock Three.js Vector3
export class MockVector3 {
	x: number;
	y: number;
	z: number;

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

	multiplyScalar(s: number) {
		this.x *= s;
		this.y *= s;
		this.z *= s;
		return this;
	}

	distanceTo(v: MockVector3) {
		const dx = this.x - v.x;
		const dy = this.y - v.y;
		const dz = this.z - v.z;
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}

	normalize() {
		const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
		if (len > 0) {
			this.x /= len;
			this.y /= len;
			this.z /= len;
		}
		return this;
	}

	setScalar(s: number) {
		this.x = s;
		this.y = s;
		this.z = s;
		return this;
	}
}

// Mock Three.js Color
export class MockColor {
	r: number;
	g: number;
	b: number;

	constructor(color?: string | number) {
		this.r = 1;
		this.g = 1;
		this.b = 1;
		if (typeof color === "string") {
			// Simple hex parsing
			if (color.startsWith("#")) {
				const hex = color.slice(1);
				this.r = parseInt(hex.slice(0, 2), 16) / 255;
				this.g = parseInt(hex.slice(2, 4), 16) / 255;
				this.b = parseInt(hex.slice(4, 6), 16) / 255;
			}
		}
	}

	set(color: string | number) {
		return this;
	}
}

// Mock Three.js Object3D
export class MockObject3D {
	position = new MockVector3();
	rotation = { x: 0, y: 0, z: 0, set: vi.fn() };
	scale = { x: 1, y: 1, z: 1, setScalar: vi.fn() };
	matrix = { elements: new Float32Array(16) };
	
	updateMatrix() {}
	updateMatrixWorld() {}
	add() { return this; }
	remove() { return this; }
	traverse(callback: (obj: MockObject3D) => void) {
		callback(this);
	}
}

// Mock Three.js Group
export class MockGroup extends MockObject3D {
	type = "Group";
	children: MockObject3D[] = [];
}

// Mock Three.js Mesh
export class MockMesh extends MockObject3D {
	type = "Mesh";
	geometry = {
		dispose: vi.fn(),
		setAttribute: vi.fn(),
		getAttribute: vi.fn(() => ({ array: new Float32Array(100), needsUpdate: false })),
		attributes: {
			position: { array: new Float32Array(100), needsUpdate: false },
		},
	};
	material = {
		dispose: vi.fn(),
		color: new MockColor(),
	};
}

// Mock Three.js Points
export class MockPoints extends MockObject3D {
	type = "Points";
	geometry = {
		dispose: vi.fn(),
		setAttribute: vi.fn(),
		getAttribute: vi.fn(() => ({ array: new Float32Array(100), needsUpdate: false })),
		attributes: {
			position: { array: new Float32Array(100), needsUpdate: false },
			color: { array: new Float32Array(100), needsUpdate: false },
		},
	};
	material = {
		dispose: vi.fn(),
	};
}

// Mock useFrame hook
export const mockUseFrame = vi.fn();

// Mock useThree hook
export const mockUseThree = vi.fn(() => ({
	camera: {
		position: new MockVector3(0, 5, 10),
		lookAt: vi.fn(),
		updateProjectionMatrix: vi.fn(),
	},
	scene: new MockGroup(),
	gl: {
		domElement: document.createElement("canvas"),
		render: vi.fn(),
		setSize: vi.fn(),
	},
	size: { width: 800, height: 600 },
	clock: { elapsedTime: 0, getDelta: () => 0.016 },
}));

// Mock Canvas component
export function MockCanvas({ children }: { children: ReactNode }) {
	return <div data-testid="r3f-canvas">{children}</div>;
}

// Setup mocks for vitest
export function setupR3FMocks() {
	vi.mock("@react-three/fiber", () => ({
		Canvas: MockCanvas,
		useFrame: mockUseFrame,
		useThree: mockUseThree,
		extend: vi.fn(),
	}));

	vi.mock("@react-three/drei", () => ({
		Environment: ({ children }: { children?: ReactNode }) => <div data-testid="drei-environment">{children}</div>,
		Sky: () => <div data-testid="drei-sky" />,
		OrbitControls: () => null,
		PerspectiveCamera: () => null,
		Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
		Html: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
	}));

	vi.mock("three", async () => {
		const actual = await vi.importActual("three");
		return {
			...actual,
			Vector3: MockVector3,
			Color: MockColor,
			Object3D: MockObject3D,
			Group: MockGroup,
			Mesh: MockMesh,
			Points: MockPoints,
			MeshStandardMaterial: vi.fn(() => ({ dispose: vi.fn() })),
			MeshBasicMaterial: vi.fn(() => ({ dispose: vi.fn() })),
			BoxGeometry: vi.fn(() => ({ dispose: vi.fn() })),
			SphereGeometry: vi.fn(() => ({ dispose: vi.fn() })),
			PlaneGeometry: vi.fn(() => ({ dispose: vi.fn() })),
			CylinderGeometry: vi.fn(() => ({ dispose: vi.fn() })),
			BufferGeometry: vi.fn(() => ({
				dispose: vi.fn(),
				setAttribute: vi.fn(),
				getAttribute: vi.fn(() => ({ array: new Float32Array(100), needsUpdate: false })),
			})),
			Float32BufferAttribute: vi.fn((array, itemSize) => ({
				array,
				itemSize,
				needsUpdate: false,
			})),
			InstancedMesh: vi.fn(() => ({
				...new MockMesh(),
				setMatrixAt: vi.fn(),
				instanceMatrix: { needsUpdate: false },
			})),
			AdditiveBlending: 2,
			DoubleSide: 2,
			MathUtils: {
				lerp: (a: number, b: number, t: number) => a + (b - a) * t,
				clamp: (v: number, min: number, max: number) => Math.max(min, Math.min(max, v)),
			},
		};
	});
}

// Export mock references for test assertions
export const mocks = {
	useFrame: mockUseFrame,
	useThree: mockUseThree,
};
