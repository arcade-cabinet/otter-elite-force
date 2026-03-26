/**
 * Asset loader — loads tile images and sprite atlas data for the rendering system.
 *
 * All asset paths are prefixed with import.meta.env.BASE_URL so they resolve
 * correctly on both local dev and deployed (GitHub Pages) builds.
 */

import type { TerrainTypeIdValue } from "./terrainRenderer";
import { TerrainTypeId } from "./terrainRenderer";

const BASE = import.meta.env.BASE_URL ?? "./";

/** Mapping from terrain type IDs to their tile fill image paths. */
const TERRAIN_TILE_PATHS: Record<number, string> = {
	[TerrainTypeId.grass]: `${BASE}assets/tiles/terrain/grass_fill.png`,
	[TerrainTypeId.water]: `${BASE}assets/tiles/terrain/water_fill.png`,
	[TerrainTypeId.sand]: `${BASE}assets/tiles/terrain/beach_fill.png`,
	[TerrainTypeId.forest]: `${BASE}assets/tiles/terrain/grass_dark_fill.png`,
	[TerrainTypeId.dirt]: `${BASE}assets/tiles/terrain/dirt_fill.png`,
	[TerrainTypeId.stone]: `${BASE}assets/tiles/terrain/dirt_fill.png`,
	[TerrainTypeId.mud]: `${BASE}assets/tiles/terrain/mud_fill.png`,
	[TerrainTypeId.mangrove]: `${BASE}assets/tiles/terrain/grass_dark_fill.png`,
	[TerrainTypeId.bridge]: `${BASE}assets/tiles/terrain/bridge_fill.png`,
	[TerrainTypeId.beach]: `${BASE}assets/tiles/terrain/beach_fill.png`,
	[TerrainTypeId.toxic_sludge]: `${BASE}assets/tiles/terrain/water_fill.png`,
};

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
		img.src = src;
	});
}

/**
 * Load tile images for all terrain types.
 *
 * Returns a Map from terrain type ID to the loaded HTMLImageElement.
 * Tiles that fail to load are silently omitted (the renderer will use
 * solid color fallbacks).
 */
export async function loadTileImages(): Promise<Map<number, HTMLImageElement>> {
	const result = new Map<number, HTMLImageElement>();
	const entries = Object.entries(TERRAIN_TILE_PATHS);

	const results = await Promise.allSettled(
		entries.map(async ([idStr, path]) => {
			const id = Number(idStr) as TerrainTypeIdValue;
			const img = await loadImage(path);
			return { id, img };
		}),
	);

	for (const outcome of results) {
		if (outcome.status === "fulfilled") {
			result.set(outcome.value.id, outcome.value.img);
		}
	}

	const failed = results.filter((r) => r.status === "rejected").length;
	if (failed > 0) {
		console.warn(`[assetLoader] ${failed}/${entries.length} terrain tiles failed to load`);
	}

	return result;
}

/** Metadata from an Aseprite JSON atlas export. */
export interface SpriteAtlasData {
	image: HTMLImageElement;
	frames: Array<{ x: number; y: number; w: number; h: number }>;
	animations: Map<string, Array<{ x: number; y: number; w: number; h: number }>>;
}

/**
 * Load a sprite atlas (JSON + PNG pair).
 *
 * @param basePath - Base directory containing the atlas files (relative to public/).
 * @param atlasName - Name of the atlas (e.g., "otter"). Expects `{atlasName}.json` and `{atlasName}.png`.
 */
export async function loadSpriteAtlas(
	basePath: string,
	atlasName: string,
): Promise<SpriteAtlasData> {
	const jsonPath = `${BASE}${basePath}/${atlasName}.json`;
	const pngPath = `${BASE}${basePath}/${atlasName}.png`;

	const [image, response] = await Promise.all([loadImage(pngPath), fetch(jsonPath)]);

	if (!response.ok) {
		throw new Error(`Failed to fetch atlas JSON: ${jsonPath} (${response.status})`);
	}

	const data = (await response.json()) as {
		frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
		meta: {
			frameTags?: Array<{ name: string; from: number; to: number }>;
		};
	};

	const allFrames = Object.values(data.frames).map((f) => f.frame);
	const animations = new Map<string, Array<{ x: number; y: number; w: number; h: number }>>();

	if (data.meta.frameTags && data.meta.frameTags.length > 0) {
		for (const tag of data.meta.frameTags) {
			const tagFrames: Array<{ x: number; y: number; w: number; h: number }> = [];
			for (let i = tag.from; i <= tag.to; i++) {
				if (i < allFrames.length) {
					tagFrames.push(allFrames[i]);
				}
			}
			animations.set(tag.name, tagFrames);
		}
	} else {
		animations.set("Idle", allFrames);
	}

	return { image, frames: allFrames, animations };
}
