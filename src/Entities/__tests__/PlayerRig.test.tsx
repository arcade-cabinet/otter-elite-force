/**
 * PlayerRig Component Tests
 *
 * Tests the Babylon.js-based PlayerRig that uses reactylon for 3D rendering.
 */

import { render } from "@testing-library/react";
import { PlayerRig } from "../PlayerRig";

// Mock reactylon to provide a fake scene (stubs useScene)
jest.mock("reactylon");

// Mock Weapon component (child, also uses Babylon.js)
jest.mock("../Weapon", () => ({
	Weapon: () => null,
}));

describe("PlayerRig", () => {
	it("should render without crashing", () => {
		const { container } = render(<PlayerRig />);
		expect(container).toBeDefined();
	});

	it("should apply default traits if none provided", () => {
		const { container } = render(<PlayerRig />);
		// Babylon.js 3D components render into the scene, not the DOM
		// Verify the component mounts cleanly without throwing
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
			headgear: "helmet" as const,
			vest: "tactical" as const,
			backgear: "none" as const,
			weaponId: "service-pistol",
		};
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

	it("should register a scene observer for animations", () => {
		// Use require (cached module) to get same mockScene instance injected by jest.mock("reactylon")
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { mockScene } = require("../../test/__mocks__/reactylon") as {
			mockScene: { onBeforeRenderObservable: { add: jest.Mock; remove: jest.Mock } };
		};
		render(<PlayerRig />);
		expect(mockScene.onBeforeRenderObservable.add).toHaveBeenCalled();
	});
});
