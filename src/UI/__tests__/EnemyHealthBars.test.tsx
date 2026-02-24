import { act, render } from "@testing-library/react";
import * as BabylonCore from "@babylonjs/core";
import { enemies } from "../../ecs/world";
import { EnemyHealthBars } from "../EnemyHealthBars";
import { mockObserver, mockScene } from "../../test/__mocks__/reactylon";

// Mock the world entities
jest.mock("../../ecs/world", () => ({
	enemies: [] as any[],
}));

describe("EnemyHealthBars", () => {
	let projectSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		// @ts-expect-error
		enemies.length = 0;

		// Provide a mock camera and engine so get2DPosition doesn't return early
		(mockScene as any).activeCamera = { projectionMatrix: {} };
		(mockScene as any).getEngine = () => ({
			getRenderWidth: () => 1024,
			getRenderHeight: () => 768,
		});
		(mockScene as any).getTransformMatrix = () => ({});

		// Spy on Vector3.Project to return a visible on-screen position
		projectSpy = jest
			.spyOn(BabylonCore.Vector3, "Project")
			.mockReturnValue(new BabylonCore.Vector3(100, 100, 0.5));
	});

	afterEach(() => {
		jest.useRealTimers();
		projectSpy.mockRestore();
		// Reset scene mocks
		(mockScene as any).activeCamera = null;
		delete (mockScene as any).getEngine;
		delete (mockScene as any).getTransformMatrix;
	});

	// Helper to trigger the onBeforeRender observable callback
	const triggerFrame = () => {
		act(() => {
			if (mockObserver.callback) {
				mockObserver.callback();
			}
		});
	};

	it("should render container", () => {
		const { container } = render(<EnemyHealthBars />);
		expect(container).toBeDefined();
	});

	it("should show health bars for damaged enemies", () => {
		const { rerender, container } = render(<EnemyHealthBars />);

		// Setup a damaged enemy
		const enemy = {
			id: "enemy-1",
			transform: { position: new BabylonCore.Vector3(10, 0, 0) },
			health: {
				current: 50,
				max: 100,
				lastDamageTime: Date.now(), // Just damaged
			},
			isDead: false,
		};
		// @ts-expect-error
		enemies.push(enemy);

		triggerFrame();

		// Force rerender to pick up state changes
		rerender(<EnemyHealthBars />);

		// Should have a health bar (width 50px wrapper div)
		const healthBar = container.querySelector('div[style*="width: 50px"]');
		expect(healthBar).not.toBeNull();
	});

	it("should not show health bars for undamaged enemies (long ago)", () => {
		const { rerender, container } = render(<EnemyHealthBars />);

		// Setup an enemy damaged long ago
		const now = Date.now();
		const enemy = {
			id: "enemy-long-ago",
			transform: { position: new BabylonCore.Vector3(10, 0, 0) },
			health: {
				current: 50,
				max: 100,
				lastDamageTime: now - 5000, // 5 seconds ago
			},
			isDead: false,
		};
		// @ts-expect-error
		enemies.push(enemy);

		triggerFrame();
		rerender(<EnemyHealthBars />);

		// Should NOT be visible (wasRecentlyDamaged < 3s)
		const bars = container.querySelectorAll('div[style*="width: 50px"]');
		expect(bars.length).toBe(0);
	});

	it("should show numeric HP when enabled", () => {
		const { rerender, getByText } = render(<EnemyHealthBars showNumericHP={true} />);

		// Setup a damaged enemy
		const enemy = {
			id: "enemy-1",
			transform: { position: new BabylonCore.Vector3(10, 0, 0) },
			health: {
				current: 50,
				max: 100,
				lastDamageTime: Date.now(),
			},
			isDead: false,
		};
		// @ts-expect-error
		enemies.push(enemy);

		triggerFrame();
		rerender(<EnemyHealthBars showNumericHP={true} />);

		expect(getByText("50/100")).toBeDefined();
	});

	it("should handle color coding correctly", () => {
		// 80% -> Green (#4caf50 = rgb(76, 175, 80))
		const enemyGreen = {
			id: "enemy-green",
			transform: { position: new BabylonCore.Vector3(0, 0, 0) },
			health: { current: 80, max: 100, lastDamageTime: Date.now() },
			isDead: false,
		};
		// 50% -> Yellow (#ffeb3b = rgb(255, 235, 59))
		const enemyYellow = {
			id: "enemy-yellow",
			transform: { position: new BabylonCore.Vector3(1, 0, 0) },
			health: { current: 50, max: 100, lastDamageTime: Date.now() },
			isDead: false,
		};
		// 10% -> Red (#f44336 = rgb(244, 67, 54))
		const enemyRed = {
			id: "enemy-red",
			transform: { position: new BabylonCore.Vector3(2, 0, 0) },
			health: { current: 10, max: 100, lastDamageTime: Date.now() },
			isDead: false,
		};

		// @ts-expect-error
		enemies.push(enemyGreen, enemyYellow, enemyRed);

		const { rerender, container } = render(<EnemyHealthBars />);
		triggerFrame();
		rerender(<EnemyHealthBars />);

		// Select the fill divs by their box-shadow style (unique to health bar fills)
		const bars = container.querySelectorAll('div[style*="box-shadow"]');

		// There should be 3 bars
		expect(bars.length).toBe(3);

		const colors = Array.from(bars).map((bar) => (bar as HTMLElement).style.backgroundColor);

		// jsdom normalizes hex colors to rgb() format when reading back style.backgroundColor
		// #4caf50 -> rgb(76, 175, 80)
		// #ffeb3b -> rgb(255, 235, 59)
		// #f44336 -> rgb(244, 67, 54)
		expect(colors).toContain("rgb(76, 175, 80)"); // Green (#4caf50)
		expect(colors).toContain("rgb(255, 235, 59)"); // Yellow (#ffeb3b)
		expect(colors).toContain("rgb(244, 67, 54)"); // Red (#f44336)
	});
});
