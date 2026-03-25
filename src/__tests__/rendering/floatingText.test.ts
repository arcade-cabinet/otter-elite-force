import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FloatingTextManager } from "@/rendering/FloatingTextManager";

/** Minimal Phaser.GameObjects.Text mock */
function createMockText() {
	return {
		x: 0,
		y: 0,
		setOrigin: vi.fn().mockReturnThis(),
		setDepth: vi.fn().mockReturnThis(),
		setScrollFactor: vi.fn().mockReturnThis(),
		setPosition: vi.fn(function (this: any, x: number, y: number) {
			this.x = x;
			this.y = y;
		}),
		setAlpha: vi.fn(),
		destroy: vi.fn(),
	};
}

/** Minimal Phaser.Scene mock */
function createMockScene() {
	return {
		add: {
			text: vi.fn((_x: number, _y: number, _msg: string, _style: unknown) => {
				return createMockText();
			}),
		},
	};
}

describe("FloatingTextManager (US-021)", () => {
	let scene: ReturnType<typeof createMockScene>;
	let manager: FloatingTextManager;

	beforeEach(() => {
		scene = createMockScene();
		manager = new FloatingTextManager(scene as any);
	});

	afterEach(() => {
		manager.destroy();
	});

	it("should spawn damage text with red color and -X HP format", () => {
		manager.spawn(100, 200, "damage", 15);

		expect(manager.count).toBe(1);
		// Two texts created (shadow + main)
		expect(scene.add.text).toHaveBeenCalledTimes(2);

		// Shadow is black
		expect(scene.add.text).toHaveBeenCalledWith(
			101,
			201,
			"-15 HP",
			expect.objectContaining({ color: "#000000" }),
		);

		// Main is red
		expect(scene.add.text).toHaveBeenCalledWith(
			100,
			200,
			"-15 HP",
			expect.objectContaining({ color: "#ff4444" }),
		);
	});

	it("should spawn healing text with green color and +X HP format", () => {
		manager.spawn(50, 60, "healing", 10);

		expect(manager.count).toBe(1);
		expect(scene.add.text).toHaveBeenCalledWith(
			50,
			60,
			"+10 HP",
			expect.objectContaining({ color: "#44ff44" }),
		);
	});

	it("should spawn resource text with green color and +X [resource] format", () => {
		manager.spawn(80, 90, "resource", 5, "fish");

		expect(manager.count).toBe(1);
		expect(scene.add.text).toHaveBeenCalledWith(
			80,
			90,
			"+5 fish",
			expect.objectContaining({ color: "#44ff44" }),
		);
	});

	it("should rise and fade over duration", () => {
		manager.spawn(100, 200, "damage", 5);
		const mainText = (scene.add.text as any).mock.results[1].value;

		// At 0.5s (50% progress), alpha should be 0.5 and text should have risen
		manager.update(0.5);

		expect(mainText.setAlpha).toHaveBeenCalledWith(0.5);
		expect(mainText.setPosition).toHaveBeenCalledWith(100, 200 + -15); // 30 * 0.5 = 15 rise
	});

	it("should remove text after duration expires", () => {
		manager.spawn(100, 200, "damage", 5);

		expect(manager.count).toBe(1);

		manager.update(1.1);

		expect(manager.count).toBe(0);
	});

	it("should enforce max 20 simultaneous texts by removing oldest", () => {
		for (let i = 0; i < 25; i++) {
			manager.spawn(i * 10, 0, "damage", i);
		}

		expect(manager.count).toBe(20);
	});

	it("should destroy all texts on cleanup", () => {
		manager.spawn(0, 0, "damage", 1);
		manager.spawn(0, 0, "healing", 2);

		expect(manager.count).toBe(2);

		manager.destroy();

		expect(manager.count).toBe(0);
	});
});
