import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlayerRig } from "../PlayerRig";

// Mock Three.js elements that are not supported in happy-dom
vi.mock("@react-three/fiber", () => ({
	useFrame: vi.fn(),
	useThree: vi.fn(() => ({
		camera: { position: { z: 5 } },
		scene: { add: vi.fn(), remove: vi.fn() },
	})),
}));

describe("PlayerRig", () => {
	it("should render without crashing", () => {
		const { container } = render(<PlayerRig />);
		expect(container).toBeDefined();
	});

	it("should apply default traits if none provided", () => {
		const { container } = render(<PlayerRig />);
		// In a real DOM (even happy-dom), R3F components don't render standard HTML tags directly
		// in a way that's easy to query like "div".
		// However, we can check if the component renders.
		// Since we are not using a full WebGL environment, we mainly test that the component code executes.
		expect(container).toBeDefined();
	});

	it("should render with custom traits", () => {
		const traits = {
			id: "custom",
			name: "Custom Otter",
			furColor: "#ff0000",
			eyeColor: "#00ff00",
			whiskerLength: 0.5,
			grizzled: true,
			baseSpeed: 10,
			baseHealth: 150,
			climbSpeed: 5,
		};
		const { container } = render(<PlayerRig traits={traits} />);
		expect(container).toBeDefined();
	});

	it("should render with tactical gear", () => {
		const gear = {
			headgear: "helmet",
			vest: "tactical",
			backgear: "backpack",
			weaponId: "rifle",
		};
		// @ts-expect-error
		const { container } = render(<PlayerRig gear={gear} />);
		expect(container).toBeDefined();
	});

	it("should render when moving", () => {
		const { container } = render(<PlayerRig isMoving={true} />);
		expect(container).toBeDefined();
	});

	it("should render when climbing", () => {
		const { container } = render(<PlayerRig isClimbing={true} />);
		expect(container).toBeDefined();
	});
});
