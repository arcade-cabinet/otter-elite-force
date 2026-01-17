import { act, render } from "@testing-library/react";
import * as THREE from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { enemies } from "../../ecs/world";
import { EnemyHealthBars } from "../EnemyHealthBars";

// Mock Three.js hooks
vi.mock("@react-three/fiber", () => ({
	useFrame: (callback: any) => {
		// We can expose this callback to test it manually if needed,
		// or just mock it to execute once.
		// For testing the hook logic, we usually need to render the component.
		// But since we want to trigger the frame loop manually, let's store it.
		(global as any).mockUseFrameCallback = callback;
	},
	useThree: () => ({
		camera: {
			projectionMatrix: new THREE.Matrix4(),
			matrixWorldInverse: new THREE.Matrix4(),
		},
		size: { width: 1024, height: 768 },
	}),
}));

// Mock the world entities
vi.mock("../../ecs/world", () => ({
	enemies: [] as any[],
}));

// Mock vector project since we don't have a real GL context
THREE.Vector3.prototype.project = vi.fn(function (this: THREE.Vector3) {
	// Determine screen position based on mock logic
	// Let's say if x,y,z are within a certain range, it projects to 0,0,0
	this.set(0, 0, 0);
	return this;
});

describe("EnemyHealthBars", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		// @ts-expect-error
		enemies.length = 0;
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should render container", () => {
		const { container } = render(<EnemyHealthBars />);
		expect(container).toBeDefined();
	});

	it("should show health bars for damaged enemies", () => {
		const { rerender, container } = render(<EnemyHealthBars />);

		// Setup a damaged enemy
		const enemy = {
			id: "enemy-1",
			transform: { position: new THREE.Vector3(10, 0, 0) },
			health: {
				current: 50,
				max: 100,
				lastDamageTime: Date.now(), // Just damaged
			},
			isDead: false,
		};
		// @ts-expect-error
		enemies.push(enemy);

		// Trigger useFrame callback
		act(() => {
			if ((global as any).mockUseFrameCallback) {
				(global as any).mockUseFrameCallback();
			}
		});

		// Force rerender to pick up state changes
		rerender(<EnemyHealthBars />);

		// Should have a health bar (width 50%)
		// Using getByStyle-ish query by checking computed styles or structure
		// Since we can't use getByTestId without modifying source, we use querySelector but more specific
		// The health bar container has a specific width style
		const healthBar = container.querySelector('div[style*="width: 50px"]');
		expect(healthBar).not.toBeNull();
	});

	it("should not show health bars for undamaged enemies (long ago)", () => {
		const { rerender, container } = render(<EnemyHealthBars />);

		// Setup an enemy damaged long ago
		const now = Date.now();
		const enemy = {
			id: "enemy-long-ago",
			transform: { position: new THREE.Vector3(10, 0, 0) },
			health: {
				current: 50,
				max: 100,
				lastDamageTime: now - 5000, // 5 seconds ago
			},
			isDead: false,
		};
		// @ts-expect-error
		enemies.push(enemy);

		// Trigger useFrame callback
		act(() => {
			if ((global as any).mockUseFrameCallback) {
				(global as any).mockUseFrameCallback();
			}
		});
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
			transform: { position: new THREE.Vector3(10, 0, 0) },
			health: {
				current: 50,
				max: 100,
				lastDamageTime: Date.now(),
			},
			isDead: false,
		};
		// @ts-expect-error
		enemies.push(enemy);

		// Trigger useFrame callback
		act(() => {
			if ((global as any).mockUseFrameCallback) {
				(global as any).mockUseFrameCallback();
			}
		});
		rerender(<EnemyHealthBars showNumericHP={true} />);

		expect(getByText("50/100")).toBeDefined();
	});

	it("should handle color coding correctly", () => {
		// Helper to check color logic by injecting enemy with specific health
		// 80% -> Green
		const enemyGreen = {
			id: "enemy-green",
			transform: { position: new THREE.Vector3(0, 0, 0) },
			health: { current: 80, max: 100, lastDamageTime: Date.now() },
			isDead: false,
		};
		// 50% -> Yellow
		const enemyYellow = {
			id: "enemy-yellow",
			transform: { position: new THREE.Vector3(1, 0, 0) },
			health: { current: 50, max: 100, lastDamageTime: Date.now() },
			isDead: false,
		};
		// 10% -> Red
		const enemyRed = {
			id: "enemy-red",
			transform: { position: new THREE.Vector3(2, 0, 0) },
			health: { current: 10, max: 100, lastDamageTime: Date.now() },
			isDead: false,
		};

		// @ts-expect-error
		enemies.push(enemyGreen, enemyYellow, enemyRed);

		const { rerender, container } = render(<EnemyHealthBars />);
		act(() => {
			if ((global as any).mockUseFrameCallback) (global as any).mockUseFrameCallback();
		});
		rerender(<EnemyHealthBars />);

		// Check for colors using more robust selection logic instead of innerHTML
		// We look for divs with background-color style

		// Ideally we would use visual regression testing for colors, but for unit tests:
		const _greenBar = Array.from(container.querySelectorAll("div")).find(
			(el) => el.style.backgroundColor === "rgb(76, 175, 80)",
		); // #4caf50
		// Happy DOM might return hex or rgb. Let's match string loosely or hex.

		const _hasColor = (color: string) =>
			Array.from(container.querySelectorAll("div")).some(
				(el) => el.style.backgroundColor.includes(color) || el.style.backgroundColor === color,
			);

		// hex to rgb conversion might be needed if jsdom normalizes it
		// #4caf50 -> rgb(76, 175, 80)
		// #ffeb3b -> rgb(255, 235, 59)
		// #f44336 -> rgb(244, 67, 54)

		// Since we are using happy-dom, it usually keeps style string as set if not normalized?
		// Let's check for the hex strings as they are set in style prop.

		// React might normalize styles.
		// Let's verify via innerHTML in debug or trust that we set it as hex.
		// But the requirement is to avoid innerHTML assertions.

		// We can check style property of elements found.
		// Structure:
		// Container (absolute)
		//   > Background (width: 100%, height: 6px)
		//     > Fill (width: %, height: 100%, bg: color)

		// Let's select the fill div specifically by its unique style property (box-shadow)
		// The wrapper has height 100% too, causing 4 matches previously.
		const bars = container.querySelectorAll('div[style*="box-shadow"]');

		// There should be 3 bars
		expect(bars.length).toBe(3);

		const colors = Array.from(bars).map((bar) => (bar as HTMLElement).style.backgroundColor);

		// Check if our expected colors are present
		// happy-dom returns colors as hex strings if set as hex
		expect(colors).toContain("#4caf50"); // Green
		expect(colors).toContain("#ffeb3b"); // Yellow
		expect(colors).toContain("#f44336"); // Red
	});
});
