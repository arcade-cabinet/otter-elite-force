/**
 * Unit tests for src/canvas/terrainPainter.ts
 *
 * Validates that paintTerrain produces a canvas with the correct pixel
 * dimensions (terrain.width * 32 × terrain.height * 32) and exercises
 * the region/override painting paths.
 */
import { describe, expect, it, vi, beforeAll } from "vitest";
import type { MissionDef } from "@/entities/types";

// ---------------------------------------------------------------------------
// Mock canvas — jsdom does not support canvas natively
// ---------------------------------------------------------------------------

function makeMockCtx() {
	return {
		fillRect: vi.fn(),
		fillStyle: "",
		save: vi.fn(),
		restore: vi.fn(),
		beginPath: vi.fn(),
		arc: vi.fn(),
		clip: vi.fn(),
		moveTo: vi.fn(),
		lineTo: vi.fn(),
		closePath: vi.fn(),
	};
}

let mockCtx: ReturnType<typeof makeMockCtx>;

beforeAll(() => {
	mockCtx = makeMockCtx();
	vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
		mockCtx as unknown as CanvasRenderingContext2D,
	);
});

// ---------------------------------------------------------------------------
// Import after mocks are in place
// ---------------------------------------------------------------------------

import { paintTerrain, TERRAIN_TILE_SIZE } from "@/canvas/terrainPainter";

// ---------------------------------------------------------------------------
// Minimal MissionDef fixture (only .terrain is read by paintTerrain)
// ---------------------------------------------------------------------------

const minimalMission: MissionDef = {
	id: "test_mission",
	chapter: 1,
	mission: 1,
	name: "Test",
	subtitle: "test",
	briefing: { portraitId: "test", lines: [] },
	terrain: {
		width: 48,
		height: 44,
		regions: [
			{ terrainId: "grass", fill: true },
			{ terrainId: "water", river: { points: [[0, 20], [48, 20]], width: 3 } },
			{ terrainId: "dirt", rect: { x: 0, y: 36, w: 48, h: 8 } },
			{ terrainId: "mangrove", circle: { cx: 8, cy: 30, r: 5 } },
		],
		overrides: [{ x: 5, y: 5, terrainId: "bridge" }],
	},
	zones: {},
	placements: [],
	startResources: { fish: 0, timber: 0, salvage: 0 },
	startPopCap: 4,
	objectives: { primary: [], bonus: [] },
	triggers: [],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("paintTerrain", () => {
	it("exports TERRAIN_TILE_SIZE as 32", () => {
		expect(TERRAIN_TILE_SIZE).toBe(32);
	});

	it("returns a canvas with correct pixel dimensions", () => {
		const canvas = paintTerrain(minimalMission);
		expect(canvas.width).toBe(48 * 32);
		expect(canvas.height).toBe(44 * 32);
	});

	it("calls fillRect at least once (base fill)", () => {
		mockCtx.fillRect.mockClear();
		paintTerrain(minimalMission);
		expect(mockCtx.fillRect).toHaveBeenCalled();
	});

	it("works with a 10×8 map (different dimensions)", () => {
		const small: MissionDef = {
			...minimalMission,
			terrain: {
				width: 10,
				height: 8,
				regions: [{ terrainId: "grass", fill: true }],
				overrides: [],
			},
		};
		const canvas = paintTerrain(small);
		expect(canvas.width).toBe(10 * 32);
		expect(canvas.height).toBe(8 * 32);
	});

	it("handles empty overrides array", () => {
		const noOverrides: MissionDef = {
			...minimalMission,
			terrain: {
				width: 20,
				height: 20,
				regions: [{ terrainId: "dirt", fill: true }],
				overrides: [],
			},
		};
		const canvas = paintTerrain(noOverrides);
		expect(canvas.width).toBe(20 * 32);
		expect(canvas.height).toBe(20 * 32);
	});
});

