/**
 * Enemy Component Rendering Tests
 */

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";

// Mock React Three Fiber
vi.mock("@react-three/fiber", () => ({
	Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	useFrame: vi.fn(),
	useThree: vi.fn(() => ({
		camera: new THREE.PerspectiveCamera(),
		scene: new THREE.Scene(),
		gl: { domElement: document.createElement("canvas") },
	})),
}));

// Mock drei
vi.mock("@react-three/drei", () => ({
	Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	Billboard: ({ children }: { children: React.ReactNode }) => <group>{children}</group>,
}));

// Mock yuka
vi.mock("yuka", () => {
	class MockVehicle {
		position = { set: vi.fn(), x: 0, y: 0, z: 0 };
		maxSpeed = 0;
	}
	return {
		Vehicle: MockVehicle,
	};
});

describe("Enemy Component Rendering", () => {
	// Note: Gator, Snake, Scout components use Yuka's Vehicle class in ways
	// that require WebGL/canvas context. Snapper works because it doesn't
	// instantiate Vehicle in the same way.

	describe("Snapper", () => {
		it("should render Snapper without error", async () => {
			const { Snapper } = await import("../Snapper");
			const data = {
				id: "snapper-1",
				position: new THREE.Vector3(0, 0, 0),
				hp: 30,
				maxHp: 30,
				suppression: 0,
			};
			expect(() => {
				render(
					<group>
						<Snapper data={data} targetPosition={new THREE.Vector3(5, 0, 5)} />
					</group>,
				);
			}).not.toThrow();
		});

		it("should render Snapper with low health", async () => {
			const { Snapper } = await import("../Snapper");
			const data = {
				id: "snapper-2",
				position: new THREE.Vector3(0, 0, 0),
				hp: 5,
				maxHp: 30,
				suppression: 0.5,
			};
			expect(() => {
				render(
					<group>
						<Snapper data={data} targetPosition={new THREE.Vector3(5, 0, 5)} />
					</group>,
				);
			}).not.toThrow();
		});
	});
});
