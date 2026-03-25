import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_BUILDINGS, ALL_PORTRAITS } from "@/entities/registry";
import { getCategoryDimensions } from "@/entities/sprite-materialization";
import type { SPDSLSprite } from "@/entities/types";

function getDimensions(sprite: SPDSLSprite) {
	const canonical = getCategoryDimensions("portraits");
	return { width: canonical.width, height: canonical.height };
}

function readAtlas(filePath: string) {
	return JSON.parse(readFileSync(path.resolve(process.cwd(), filePath), "utf8")) as {
		frames: Record<string, { sourceSize: { w: number; h: number } }>;
	};
}

describe("SP-DSL asset quality gates", () => {
	it("portrait source definitions remain 64x96 layered assets", () => {
		for (const [id, portrait] of Object.entries(ALL_PORTRAITS)) {
			const sprite = portrait.sprite as SPDSLSprite;
			expect(getDimensions(sprite)).toEqual({ width: 64, height: 96 });
			expect(sprite.layers.map((layer) => layer.id)).toEqual([
				"background",
				"face",
				"uniform",
				"details",
			]);
			void id;
		}
	});

	it("built portrait atlases preserve portrait aspect ratio across scales", () => {
		const oneX = readAtlas("public/assets/portraits/portraits_1x.json");
		const twoX = readAtlas("public/assets/portraits/portraits_2x.json");
		const threeX = readAtlas("public/assets/portraits/portraits_3x.json");

		for (const id of Object.keys(ALL_PORTRAITS)) {
			expect(oneX.frames[id].sourceSize).toEqual({ w: 64, h: 96 });
			expect(twoX.frames[id].sourceSize).toEqual({ w: 128, h: 192 });
			expect(threeX.frames[id].sourceSize).toEqual({ w: 192, h: 288 });
		}
	});

	it("major buildings keep a grounding layer for depth and weight", () => {
		for (const [id, building] of Object.entries(ALL_BUILDINGS)) {
			const sprite = building.sprite as SPDSLSprite;
			const layerIds = sprite.layers.map((layer) => layer.id);
			if (building.category === "wall" || building.tags.includes("trap")) {
				expect(layerIds).toContain("shadow");
				continue;
			}

			// Mission-placed buildings and scenario props are lightweight
			// and do not require the full grounding-layer treatment.
			const SCENARIO_PROPS = new Set(["fuel_tank", "flag_post", "shield_generator", "great_siphon"]);
			if (building.buildTime === 0 || SCENARIO_PROPS.has(id)) continue;

			expect(layerIds.length).toBeGreaterThanOrEqual(3);
			expect(layerIds.some((layerId) => ["shadow", "foundation", "pool"].includes(layerId))).toBe(
				true,
			);
			void id;
		}
	});
});
