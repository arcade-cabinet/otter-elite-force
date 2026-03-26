import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for sprite frame resolution logic.
 *
 * The resolveSpriteFrame function delegates to getEntityAnimFrame from spriteAtlas.
 * Since spriteAtlas relies on browser APIs (HTMLImageElement, canvas), we mock the
 * module to test the frame index cycling logic in isolation.
 */

// Mock the spriteAtlas module
vi.mock("@/canvas/spriteAtlas", () => {
	const mockFrames = new Map<string, Map<string, string[]>>();

	// Simulate an otter atlas with Idle (4 frames) and Walk (6 frames)
	const otterAnims = new Map<string, string[]>();
	otterAnims.set("Idle", ["idle_0", "idle_1", "idle_2", "idle_3"]);
	otterAnims.set("Walk", ["walk_0", "walk_1", "walk_2", "walk_3", "walk_4", "walk_5"]);
	mockFrames.set("otter", otterAnims);

	// Entity type -> animal mapping
	const entityMap = new Map<string, { animal: string; defaultAnim: string }>();
	entityMap.set("river_rat", { animal: "otter", defaultAnim: "Idle" });
	entityMap.set("mudfoot", { animal: "otter", defaultAnim: "Idle" });

	return {
		atlasesLoaded: vi.fn(() => true),
		getEntityAnimFrame: vi.fn(
			(entityType: string, animation: string, elapsedMs: number, frameDurationMs: number) => {
				const mapping = entityMap.get(entityType);
				if (!mapping) return undefined;

				const anims = mockFrames.get(mapping.animal);
				if (!anims) return undefined;

				let frames = anims.get(animation);
				if (!frames || frames.length === 0) {
					frames = anims.get(mapping.defaultAnim);
				}
				if (!frames || frames.length === 0) return undefined;

				const frameIndex = Math.floor(elapsedMs / frameDurationMs) % frames.length;
				return frames[frameIndex]; // Returns string instead of canvas for testing
			},
		),
		getEntitySprite: vi.fn((entityType: string) => {
			const mapping = entityMap.get(entityType);
			if (!mapping) return undefined;
			const anims = mockFrames.get(mapping.animal);
			if (!anims) return undefined;
			const frames = anims.get(mapping.defaultAnim);
			return frames?.[0];
		}),
		getEntityFrameSize: vi.fn((entityType: string) => {
			const mapping = entityMap.get(entityType);
			if (!mapping) return undefined;
			return { w: 32, h: 48 };
		}),
		getEntityAnimations: vi.fn(() => ["Idle", "Walk"]),
		getAtlas: vi.fn(() => undefined),
		loadAllAtlases: vi.fn(async () => {}),
		getSpriteFrame: vi.fn(() => undefined),
	};
});

import { resolveSpriteFrame } from "./spriteRenderer";

describe("engine/rendering/spriteRenderer/resolveSpriteFrame", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns the correct idle frame at time 0", () => {
		const frame = resolveSpriteFrame("river_rat", "Idle", 0);
		expect(frame).toBe("idle_0");
	});

	it("cycles through idle frames based on elapsed time", () => {
		// 4 idle frames at 100ms each
		expect(resolveSpriteFrame("river_rat", "Idle", 0, 100)).toBe("idle_0");
		expect(resolveSpriteFrame("river_rat", "Idle", 100, 100)).toBe("idle_1");
		expect(resolveSpriteFrame("river_rat", "Idle", 200, 100)).toBe("idle_2");
		expect(resolveSpriteFrame("river_rat", "Idle", 300, 100)).toBe("idle_3");
		// Wraps around
		expect(resolveSpriteFrame("river_rat", "Idle", 400, 100)).toBe("idle_0");
		expect(resolveSpriteFrame("river_rat", "Idle", 500, 100)).toBe("idle_1");
	});

	it("resolves walk animation frames", () => {
		// 6 walk frames
		expect(resolveSpriteFrame("river_rat", "Walk", 0, 100)).toBe("walk_0");
		expect(resolveSpriteFrame("river_rat", "Walk", 500, 100)).toBe("walk_5");
		// Wraps at 6
		expect(resolveSpriteFrame("river_rat", "Walk", 600, 100)).toBe("walk_0");
	});

	it("returns undefined for unknown entity types", () => {
		const frame = resolveSpriteFrame("unknown_unit", "Idle", 0);
		expect(frame).toBeUndefined();
	});

	it("falls back to default animation for missing animation name", () => {
		// "Attack" animation doesn't exist, should fall back to "Idle"
		const frame = resolveSpriteFrame("river_rat", "Attack", 0, 100);
		expect(frame).toBe("idle_0");
	});

	it("handles sub-frame timing correctly", () => {
		// At 50ms with 100ms frame duration, should still be frame 0
		expect(resolveSpriteFrame("river_rat", "Idle", 50, 100)).toBe("idle_0");
		// At 99ms, still frame 0
		expect(resolveSpriteFrame("river_rat", "Idle", 99, 100)).toBe("idle_0");
		// At 150ms, frame 1
		expect(resolveSpriteFrame("river_rat", "Idle", 150, 100)).toBe("idle_1");
	});

	it("works with different entity types sharing the same animal", () => {
		// Both river_rat and mudfoot use otter
		expect(resolveSpriteFrame("mudfoot", "Idle", 0, 100)).toBe("idle_0");
		expect(resolveSpriteFrame("mudfoot", "Walk", 100, 100)).toBe("walk_1");
	});

	it("handles custom frame durations", () => {
		// 200ms per frame
		expect(resolveSpriteFrame("river_rat", "Idle", 0, 200)).toBe("idle_0");
		expect(resolveSpriteFrame("river_rat", "Idle", 199, 200)).toBe("idle_0");
		expect(resolveSpriteFrame("river_rat", "Idle", 200, 200)).toBe("idle_1");
		expect(resolveSpriteFrame("river_rat", "Idle", 400, 200)).toBe("idle_2");
	});
});
