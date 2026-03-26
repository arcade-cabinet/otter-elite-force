/**
 * Tile-based terrain renderer — paints mission terrain using Kenney pixel tiles.
 *
 * Replaces the procedural noise painter with proper tile-based rendering:
 * 1. Build a terrain type grid from the mission definition
 * 2. Auto-tile edge transitions (grass→water, grass→sand, etc.)
 * 3. Scatter prop tiles (trees, rocks, bushes) by terrain type
 * 4. Render everything to offscreen canvases
 *
 * Tile size: 32×32 (Kenney 16px tiles scaled 2×).
 *
 * Large-map support: maps up to 160×160 tiles (5120×5120px) are painted
 * using chunked rendering to stay within browser canvas limits (~4096px).
 */

import type { MissionDef } from "@/entities/types";
import type { TerrainType as PathfindingTerrainType } from "@/ai/terrainTypes";

const TILE_SIZE = 32;

/**
 * Maximum canvas dimension in pixels. Mobile Safari caps at ~4096px per axis;
 * desktop browsers are typically higher (8192–16384) but we pick the safe
 * mobile-friendly limit so the game works on every platform.
 */
const MAX_CANVAS_DIM = 4096;

/**
 * Chunk dimension in tiles. Each chunk canvas covers up to this many tiles
 * on each axis, keeping each canvas under MAX_CANVAS_DIM pixels.
 */
const CHUNK_TILES = Math.floor(MAX_CANVAS_DIM / TILE_SIZE); // 128 tiles = 4096px

// ─── Chunked terrain types ───

/** A single rectangular chunk of the terrain. */
export interface TerrainChunk {
	/** Canvas containing the rendered terrain for this chunk. */
	canvas: HTMLCanvasElement;
	/** Pixel X offset in world space. */
	x: number;
	/** Pixel Y offset in world space. */
	y: number;
	/** Pixel width of this chunk. */
	width: number;
	/** Pixel height of this chunk. */
	height: number;
}

// ─── Terrain type enum ───

type TerrainType = "grass" | "water" | "dirt" | "sand" | "mud" | "mangrove" | "bridge" | "beach" | "toxic_sludge";

// ─── Tile image cache ───

const tileImageCache = new Map<string, HTMLImageElement>();
let tilesLoaded = false;

/** All tile paths we need to preload. */
const TILE_PATHS: Record<string, string> = {
	// ── Fill tiles (hand-painted interiors) ──
	grass_fill: "/assets/tiles/terrain/grass_fill.png",
	grass_fill_2: "/assets/tiles/terrain/grass_fill_2.png",
	grass_dark_fill: "/assets/tiles/terrain/grass_dark_fill.png",
	grass_dark_fill_2: "/assets/tiles/terrain/grass_dark_fill_2.png",
	dirt_fill: "/assets/tiles/terrain/dirt_fill.png",
	dirt_fill_2: "/assets/tiles/terrain/dirt_fill_2.png",
	mud_fill: "/assets/tiles/terrain/mud_fill.png",
	beach_fill: "/assets/tiles/terrain/beach_fill.png",
	beach_fill_2: "/assets/tiles/terrain/beach_fill_2.png",
	water_fill: "/assets/tiles/terrain/water_fill.png",
	water_fill_2: "/assets/tiles/terrain/water_fill_2.png",
	bridge_fill: "/assets/tiles/terrain/bridge_fill.png",

	// ── Blend transition tiles (procedurally generated, exact fill colors) ──
	// grass <-> water (riverbanks)
	blend_grass_water_tl: "/assets/tiles/terrain/blend_grass_water_tl.png",
	blend_grass_water_t: "/assets/tiles/terrain/blend_grass_water_t.png",
	blend_grass_water_tr: "/assets/tiles/terrain/blend_grass_water_tr.png",
	blend_grass_water_l: "/assets/tiles/terrain/blend_grass_water_l.png",
	blend_grass_water_r: "/assets/tiles/terrain/blend_grass_water_r.png",
	blend_grass_water_bl: "/assets/tiles/terrain/blend_grass_water_bl.png",
	blend_grass_water_b: "/assets/tiles/terrain/blend_grass_water_b.png",
	blend_grass_water_br: "/assets/tiles/terrain/blend_grass_water_br.png",
	blend_water_grass_tl: "/assets/tiles/terrain/blend_water_grass_tl.png",
	blend_water_grass_t: "/assets/tiles/terrain/blend_water_grass_t.png",
	blend_water_grass_tr: "/assets/tiles/terrain/blend_water_grass_tr.png",
	blend_water_grass_l: "/assets/tiles/terrain/blend_water_grass_l.png",
	blend_water_grass_r: "/assets/tiles/terrain/blend_water_grass_r.png",
	blend_water_grass_bl: "/assets/tiles/terrain/blend_water_grass_bl.png",
	blend_water_grass_b: "/assets/tiles/terrain/blend_water_grass_b.png",
	blend_water_grass_br: "/assets/tiles/terrain/blend_water_grass_br.png",
	// grass <-> beach (coastline)
	blend_grass_beach_tl: "/assets/tiles/terrain/blend_grass_beach_tl.png",
	blend_grass_beach_t: "/assets/tiles/terrain/blend_grass_beach_t.png",
	blend_grass_beach_tr: "/assets/tiles/terrain/blend_grass_beach_tr.png",
	blend_grass_beach_l: "/assets/tiles/terrain/blend_grass_beach_l.png",
	blend_grass_beach_r: "/assets/tiles/terrain/blend_grass_beach_r.png",
	blend_grass_beach_bl: "/assets/tiles/terrain/blend_grass_beach_bl.png",
	blend_grass_beach_b: "/assets/tiles/terrain/blend_grass_beach_b.png",
	blend_grass_beach_br: "/assets/tiles/terrain/blend_grass_beach_br.png",
	blend_beach_grass_tl: "/assets/tiles/terrain/blend_beach_grass_tl.png",
	blend_beach_grass_t: "/assets/tiles/terrain/blend_beach_grass_t.png",
	blend_beach_grass_tr: "/assets/tiles/terrain/blend_beach_grass_tr.png",
	blend_beach_grass_l: "/assets/tiles/terrain/blend_beach_grass_l.png",
	blend_beach_grass_r: "/assets/tiles/terrain/blend_beach_grass_r.png",
	blend_beach_grass_bl: "/assets/tiles/terrain/blend_beach_grass_bl.png",
	blend_beach_grass_b: "/assets/tiles/terrain/blend_beach_grass_b.png",
	blend_beach_grass_br: "/assets/tiles/terrain/blend_beach_grass_br.png",
	// grass <-> dirt
	blend_grass_dirt_tl: "/assets/tiles/terrain/blend_grass_dirt_tl.png",
	blend_grass_dirt_t: "/assets/tiles/terrain/blend_grass_dirt_t.png",
	blend_grass_dirt_tr: "/assets/tiles/terrain/blend_grass_dirt_tr.png",
	blend_grass_dirt_l: "/assets/tiles/terrain/blend_grass_dirt_l.png",
	blend_grass_dirt_r: "/assets/tiles/terrain/blend_grass_dirt_r.png",
	blend_grass_dirt_bl: "/assets/tiles/terrain/blend_grass_dirt_bl.png",
	blend_grass_dirt_b: "/assets/tiles/terrain/blend_grass_dirt_b.png",
	blend_grass_dirt_br: "/assets/tiles/terrain/blend_grass_dirt_br.png",
	blend_dirt_grass_tl: "/assets/tiles/terrain/blend_dirt_grass_tl.png",
	blend_dirt_grass_t: "/assets/tiles/terrain/blend_dirt_grass_t.png",
	blend_dirt_grass_tr: "/assets/tiles/terrain/blend_dirt_grass_tr.png",
	blend_dirt_grass_l: "/assets/tiles/terrain/blend_dirt_grass_l.png",
	blend_dirt_grass_r: "/assets/tiles/terrain/blend_dirt_grass_r.png",
	blend_dirt_grass_bl: "/assets/tiles/terrain/blend_dirt_grass_bl.png",
	blend_dirt_grass_b: "/assets/tiles/terrain/blend_dirt_grass_b.png",
	blend_dirt_grass_br: "/assets/tiles/terrain/blend_dirt_grass_br.png",
	// grass <-> mud
	blend_grass_mud_tl: "/assets/tiles/terrain/blend_grass_mud_tl.png",
	blend_grass_mud_t: "/assets/tiles/terrain/blend_grass_mud_t.png",
	blend_grass_mud_tr: "/assets/tiles/terrain/blend_grass_mud_tr.png",
	blend_grass_mud_l: "/assets/tiles/terrain/blend_grass_mud_l.png",
	blend_grass_mud_r: "/assets/tiles/terrain/blend_grass_mud_r.png",
	blend_grass_mud_bl: "/assets/tiles/terrain/blend_grass_mud_bl.png",
	blend_grass_mud_b: "/assets/tiles/terrain/blend_grass_mud_b.png",
	blend_grass_mud_br: "/assets/tiles/terrain/blend_grass_mud_br.png",
	blend_mud_grass_tl: "/assets/tiles/terrain/blend_mud_grass_tl.png",
	blend_mud_grass_t: "/assets/tiles/terrain/blend_mud_grass_t.png",
	blend_mud_grass_tr: "/assets/tiles/terrain/blend_mud_grass_tr.png",
	blend_mud_grass_l: "/assets/tiles/terrain/blend_mud_grass_l.png",
	blend_mud_grass_r: "/assets/tiles/terrain/blend_mud_grass_r.png",
	blend_mud_grass_bl: "/assets/tiles/terrain/blend_mud_grass_bl.png",
	blend_mud_grass_b: "/assets/tiles/terrain/blend_mud_grass_b.png",
	blend_mud_grass_br: "/assets/tiles/terrain/blend_mud_grass_br.png",
	// grass <-> mangrove
	blend_grass_mangrove_tl: "/assets/tiles/terrain/blend_grass_mangrove_tl.png",
	blend_grass_mangrove_t: "/assets/tiles/terrain/blend_grass_mangrove_t.png",
	blend_grass_mangrove_tr: "/assets/tiles/terrain/blend_grass_mangrove_tr.png",
	blend_grass_mangrove_l: "/assets/tiles/terrain/blend_grass_mangrove_l.png",
	blend_grass_mangrove_r: "/assets/tiles/terrain/blend_grass_mangrove_r.png",
	blend_grass_mangrove_bl: "/assets/tiles/terrain/blend_grass_mangrove_bl.png",
	blend_grass_mangrove_b: "/assets/tiles/terrain/blend_grass_mangrove_b.png",
	blend_grass_mangrove_br: "/assets/tiles/terrain/blend_grass_mangrove_br.png",
	blend_mangrove_grass_tl: "/assets/tiles/terrain/blend_mangrove_grass_tl.png",
	blend_mangrove_grass_t: "/assets/tiles/terrain/blend_mangrove_grass_t.png",
	blend_mangrove_grass_tr: "/assets/tiles/terrain/blend_mangrove_grass_tr.png",
	blend_mangrove_grass_l: "/assets/tiles/terrain/blend_mangrove_grass_l.png",
	blend_mangrove_grass_r: "/assets/tiles/terrain/blend_mangrove_grass_r.png",
	blend_mangrove_grass_bl: "/assets/tiles/terrain/blend_mangrove_grass_bl.png",
	blend_mangrove_grass_b: "/assets/tiles/terrain/blend_mangrove_grass_b.png",
	blend_mangrove_grass_br: "/assets/tiles/terrain/blend_mangrove_grass_br.png",
	// water <-> beach (shoreline)
	blend_water_beach_tl: "/assets/tiles/terrain/blend_water_beach_tl.png",
	blend_water_beach_t: "/assets/tiles/terrain/blend_water_beach_t.png",
	blend_water_beach_tr: "/assets/tiles/terrain/blend_water_beach_tr.png",
	blend_water_beach_l: "/assets/tiles/terrain/blend_water_beach_l.png",
	blend_water_beach_r: "/assets/tiles/terrain/blend_water_beach_r.png",
	blend_water_beach_bl: "/assets/tiles/terrain/blend_water_beach_bl.png",
	blend_water_beach_b: "/assets/tiles/terrain/blend_water_beach_b.png",
	blend_water_beach_br: "/assets/tiles/terrain/blend_water_beach_br.png",
	blend_beach_water_tl: "/assets/tiles/terrain/blend_beach_water_tl.png",
	blend_beach_water_t: "/assets/tiles/terrain/blend_beach_water_t.png",
	blend_beach_water_tr: "/assets/tiles/terrain/blend_beach_water_tr.png",
	blend_beach_water_l: "/assets/tiles/terrain/blend_beach_water_l.png",
	blend_beach_water_r: "/assets/tiles/terrain/blend_beach_water_r.png",
	blend_beach_water_bl: "/assets/tiles/terrain/blend_beach_water_bl.png",
	blend_beach_water_b: "/assets/tiles/terrain/blend_beach_water_b.png",
	blend_beach_water_br: "/assets/tiles/terrain/blend_beach_water_br.png",
	// dirt <-> beach (sandy trails)
	blend_dirt_beach_tl: "/assets/tiles/terrain/blend_dirt_beach_tl.png",
	blend_dirt_beach_t: "/assets/tiles/terrain/blend_dirt_beach_t.png",
	blend_dirt_beach_tr: "/assets/tiles/terrain/blend_dirt_beach_tr.png",
	blend_dirt_beach_l: "/assets/tiles/terrain/blend_dirt_beach_l.png",
	blend_dirt_beach_r: "/assets/tiles/terrain/blend_dirt_beach_r.png",
	blend_dirt_beach_bl: "/assets/tiles/terrain/blend_dirt_beach_bl.png",
	blend_dirt_beach_b: "/assets/tiles/terrain/blend_dirt_beach_b.png",
	blend_dirt_beach_br: "/assets/tiles/terrain/blend_dirt_beach_br.png",
	blend_beach_dirt_tl: "/assets/tiles/terrain/blend_beach_dirt_tl.png",
	blend_beach_dirt_t: "/assets/tiles/terrain/blend_beach_dirt_t.png",
	blend_beach_dirt_tr: "/assets/tiles/terrain/blend_beach_dirt_tr.png",
	blend_beach_dirt_l: "/assets/tiles/terrain/blend_beach_dirt_l.png",
	blend_beach_dirt_r: "/assets/tiles/terrain/blend_beach_dirt_r.png",
	blend_beach_dirt_bl: "/assets/tiles/terrain/blend_beach_dirt_bl.png",
	blend_beach_dirt_b: "/assets/tiles/terrain/blend_beach_dirt_b.png",
	blend_beach_dirt_br: "/assets/tiles/terrain/blend_beach_dirt_br.png",

	// ── Bridge ──
	bridge_h: "/assets/tiles/terrain/bridge_h.png",
	bridge_v: "/assets/tiles/terrain/bridge_v.png",

	// ── Path ──
	path_h: "/assets/tiles/terrain/path_h.png",
	path_v: "/assets/tiles/terrain/path_v.png",

	// ── Props ──
	tree_pine_sm: "/assets/tiles/props/tree_pine_sm.png",
	tree_pine_lg: "/assets/tiles/props/tree_pine_lg.png",
	tree_round_sm: "/assets/tiles/props/tree_round_sm.png",
	tree_round_lg: "/assets/tiles/props/tree_round_lg.png",
	tree_cluster_1: "/assets/tiles/props/tree_cluster_1.png",
	tree_tall_1: "/assets/tiles/props/tree_tall_1.png",
	tree_tall_2: "/assets/tiles/props/tree_tall_2.png",
	rock_gray_1: "/assets/tiles/props/rock_gray_1.png",
	rock_gray_2: "/assets/tiles/props/rock_gray_2.png",
	rock_cluster: "/assets/tiles/props/rock_cluster.png",
	bush_green: "/assets/tiles/props/bush_green.png",
	mushroom: "/assets/tiles/props/mushroom.png",
	stump: "/assets/tiles/props/stump.png",
	forest_sparse: "/assets/tiles/props/forest_sparse.png",
	forest_dense_1: "/assets/tiles/props/forest_dense_1.png",
	forest_dense_2: "/assets/tiles/props/forest_dense_2.png",
	forest_full: "/assets/tiles/props/forest_full.png",
};

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`Failed: ${src}`));
		img.src = src;
	});
}

// ─── Color tinting ───

/** Tint rules: which tiles get what color adjustment. */
const TINT_RULES: Record<string, { hueRotate: number; saturate: number; brightness: number }> = {};

// Fill tiles and blend tiles — no tint needed (already exact colors)

// Tree/prop tiles: aggressive jungle green tint (must match dark fill tiles)
for (const name of [
	"tree_pine_sm", "tree_pine_lg", "tree_round_sm", "tree_round_lg",
	"tree_cluster_1", "tree_tall_1", "tree_tall_2", "bush_green",
	"forest_sparse", "forest_dense_1", "forest_dense_2", "forest_full",
	"tree_pine_tall",
]) {
	TINT_RULES[name] = { hueRotate: -35, saturate: 1.6, brightness: 0.55 };
}

/**
 * Apply color tint to a tile image using CSS filters.
 * Returns a tinted HTMLImageElement-compatible canvas.
 */
function tintTile(img: HTMLImageElement, tileName: string): HTMLImageElement | HTMLCanvasElement {
	const rule = TINT_RULES[tileName];
	if (!rule) return img; // no tint needed

	const canvas = document.createElement("canvas");
	canvas.width = img.width;
	canvas.height = img.height;
	const ctx = canvas.getContext("2d")!;

	ctx.filter = `hue-rotate(${rule.hueRotate}deg) saturate(${rule.saturate}) brightness(${rule.brightness})`;
	ctx.drawImage(img, 0, 0);
	ctx.filter = "none";

	return canvas as unknown as HTMLImageElement;
}

/** Preload all terrain tiles with color tinting. Called once at boot. */
export async function loadTerrainTiles(): Promise<void> {
	if (tilesLoaded) return;
	const entries = Object.entries(TILE_PATHS);
	const results = await Promise.allSettled(
		entries.map(async ([name, path]) => {
			const img = await loadImage(path);
			const tinted = tintTile(img, name);
			tileImageCache.set(name, tinted as HTMLImageElement);
		}),
	);
	const failed = results.filter((r) => r.status === "rejected").length;
	if (failed > 0) console.warn(`[tilePainter] ${failed}/${entries.length} tiles failed to load`);
	tilesLoaded = true;
}

function getTile(name: string): HTMLImageElement | undefined {
	return tileImageCache.get(name);
}

// ─── Terrain grid builder ───

/**
 * Build a terrain type grid from mission definition.
 * Used by tilePainter internally AND exported for pathfinding graph building.
 */
export function buildTerrainGridForPathfinding(missionDef: MissionDef): PathfindingTerrainType[][] {
	return buildTerrainGrid(missionDef.terrain) as PathfindingTerrainType[][];
}

function buildTerrainGrid(terrain: MissionDef["terrain"]): TerrainType[][] {
	const { width, height, regions } = terrain;
	const grid: TerrainType[][] = Array.from({ length: height }, () =>
		Array.from({ length: width }, () => "grass" as TerrainType),
	);

	// Fill base
	const base = regions.find((r) => r.fill);
	if (base) {
		const t = base.terrainId as TerrainType;
		for (let y = 0; y < height; y++)
			for (let x = 0; x < width; x++)
				grid[y][x] = t;
	}

	// Apply regions
	for (const region of regions) {
		if (region.fill) continue;
		const t = region.terrainId as TerrainType;

		if (region.rect) {
			const { x: rx, y: ry, w, h } = region.rect;
			for (let y = ry; y < Math.min(ry + h, height); y++)
				for (let x = rx; x < Math.min(rx + w, width); x++)
					grid[y][x] = t;
		}

		if (region.circle) {
			const { cx, cy, r } = region.circle;
			for (let y = 0; y < height; y++)
				for (let x = 0; x < width; x++)
					if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r)
						grid[y][x] = t;
		}

		if (region.river) {
			const { points, width: rw } = region.river;
			const halfW = rw / 2;
			// For each tile, check distance to river segments
			for (let y = 0; y < height; y++) {
				for (let x = 0; x < width; x++) {
					for (let i = 0; i < points.length - 1; i++) {
						const [ax, ay] = points[i];
						const [bx, by] = points[i + 1];
						const dist = pointToSegmentDist(x + 0.5, y + 0.5, ax, ay, bx, by);
						if (dist < halfW) {
							grid[y][x] = t;
							break;
						}
					}
				}
			}
		}
	}

	// Apply overrides
	for (const ov of terrain.overrides) {
		if (ov.x >= 0 && ov.x < width && ov.y >= 0 && ov.y < height) {
			grid[ov.y][ov.x] = ov.terrainId as TerrainType;
		}
	}

	return grid;
}

function pointToSegmentDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
	const dx = bx - ax;
	const dy = by - ay;
	const lenSq = dx * dx + dy * dy;
	if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
	let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
	t = Math.max(0, Math.min(1, t));
	const cx = ax + t * dx;
	const cy = ay + t * dy;
	return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
}

// ─── Seeded RNG for deterministic prop scatter ───

function seededRandom(seed: number): () => number {
	let s = seed;
	return () => {
		s = (s * 1664525 + 1013904223) & 0xffffffff;
		return (s >>> 0) / 0xffffffff;
	};
}

// ─── Auto-tile logic ───

/**
 * Map from terrain type to the name used in blend tile filenames.
 * "sand" maps to "beach" since we share the beach fill color.
 */
const TERRAIN_BLEND_NAME: Record<string, string> = {
	grass: "grass",
	mangrove: "mangrove",
	water: "water",
	dirt: "dirt",
	mud: "mud",
	sand: "beach",
	beach: "beach",
	bridge: "bridge",
	toxic_sludge: "water",
};

/**
 * Try to resolve a blend tile for the given inside/outside terrain pair
 * and direction. Returns the tile key if it exists in TILE_PATHS, else null.
 */
function resolveBlendTile(inside: string, outside: string, dir: string): string | null {
	const key = `blend_${inside}_${outside}_${dir}`;
	return key in TILE_PATHS ? key : null;
}

function getAutoTile(
	grid: TerrainType[][],
	x: number,
	y: number,
	rand: () => number,
): string {
	const h = grid.length;
	const w = grid[0].length;
	const t = grid[y][x];
	const get = (gx: number, gy: number): TerrainType =>
		gx >= 0 && gx < w && gy >= 0 && gy < h ? grid[gy][gx] : t;

	const n = get(x, y - 1);
	const s = get(x, y + 1);
	const e = get(x + 1, y);
	const ww = get(x - 1, y);

	const myBlend = TERRAIN_BLEND_NAME[t] ?? "grass";

	// Check neighbors for different terrain types and pick the best blend tile.
	// Priority: corners (2 neighbors differ) > edges (1 neighbor differs).
	const nDiff = n !== t;
	const sDiff = s !== t;
	const eDiff = e !== t;
	const wDiff = ww !== t;

	// Corner checks (two adjacent edges differ and share the same outside terrain)
	if (nDiff && wDiff && n === ww) {
		const outside = TERRAIN_BLEND_NAME[n] ?? null;
		if (outside) {
			const tile = resolveBlendTile(myBlend, outside, "tl");
			if (tile) return tile;
		}
	}
	if (nDiff && eDiff && n === e) {
		const outside = TERRAIN_BLEND_NAME[n] ?? null;
		if (outside) {
			const tile = resolveBlendTile(myBlend, outside, "tr");
			if (tile) return tile;
		}
	}
	if (sDiff && wDiff && s === ww) {
		const outside = TERRAIN_BLEND_NAME[s] ?? null;
		if (outside) {
			const tile = resolveBlendTile(myBlend, outside, "bl");
			if (tile) return tile;
		}
	}
	if (sDiff && eDiff && s === e) {
		const outside = TERRAIN_BLEND_NAME[s] ?? null;
		if (outside) {
			const tile = resolveBlendTile(myBlend, outside, "br");
			if (tile) return tile;
		}
	}

	// Edge checks (single neighbor differs)
	if (nDiff) {
		const outside = TERRAIN_BLEND_NAME[n] ?? null;
		if (outside) {
			const tile = resolveBlendTile(myBlend, outside, "t");
			if (tile) return tile;
		}
	}
	if (sDiff) {
		const outside = TERRAIN_BLEND_NAME[s] ?? null;
		if (outside) {
			const tile = resolveBlendTile(myBlend, outside, "b");
			if (tile) return tile;
		}
	}
	if (wDiff) {
		const outside = TERRAIN_BLEND_NAME[ww] ?? null;
		if (outside) {
			const tile = resolveBlendTile(myBlend, outside, "l");
			if (tile) return tile;
		}
	}
	if (eDiff) {
		const outside = TERRAIN_BLEND_NAME[e] ?? null;
		if (outside) {
			const tile = resolveBlendTile(myBlend, outside, "r");
			if (tile) return tile;
		}
	}

	// No transition needed — use interior fill tile
	switch (t) {
		case "grass":
			return rand() < 0.5 ? "grass_fill" : "grass_fill_2";

		case "mangrove":
			return rand() < 0.5 ? "grass_dark_fill" : "grass_dark_fill_2";

		case "water":
			return rand() < 0.5 ? "water_fill" : "water_fill_2";

		case "dirt":
			return rand() < 0.5 ? "dirt_fill" : "dirt_fill_2";

		case "mud":
			return "mud_fill";

		case "sand":
		case "beach":
			return rand() < 0.5 ? "beach_fill" : "beach_fill_2";

		case "bridge":
			return "bridge_fill";

		case "toxic_sludge":
			return rand() < 0.5 ? "water_fill" : "water_fill_2";

		default:
			return "grass_fill";
	}
}

// ─── Prop scatter ───

/**
 * Region-aware prop scatter. Coordinates are in tile space; pixel output
 * is offset so origin is at (startTileX, startTileY).
 */
function scatterPropsRegion(
	ctx: CanvasRenderingContext2D,
	grid: TerrainType[][],
	startTileX: number,
	startTileY: number,
	endTileX: number,
	endTileY: number,
	rand: () => number,
): void {
	for (let y = startTileY; y < endTileY; y++) {
		for (let x = startTileX; x < endTileX; x++) {
			const t = grid[y][x];
			const px = (x - startTileX) * TILE_SIZE;
			const py = (y - startTileY) * TILE_SIZE;
			const r = rand();

			if (t === "mangrove") {
				if (r < 0.45) {
					const treeNames = ["tree_pine_lg", "tree_round_lg", "tree_tall_1", "tree_tall_2", "tree_cluster_1"];
					const treeName = treeNames[Math.floor(rand() * treeNames.length)];
					const tree = getTile(treeName);
					if (tree) {
						const treeH = TILE_SIZE + Math.floor(rand() * TILE_SIZE);
						const treeW = TILE_SIZE + Math.floor(rand() * 8);
						ctx.drawImage(tree, px - 4, py - treeH + TILE_SIZE, treeW, treeH);
					}
				} else if (r < 0.55) {
					const bush = getTile("bush_green");
					if (bush) ctx.drawImage(bush, px, py, TILE_SIZE, TILE_SIZE);
				}
			} else if (t === "grass") {
				if (r < 0.025) {
					const treeNames = ["tree_pine_sm", "tree_round_sm", "tree_pine_lg"];
					const treeName = treeNames[Math.floor(rand() * treeNames.length)];
					const tree = getTile(treeName);
					if (tree) {
						const treeH = TILE_SIZE + Math.floor(rand() * 16);
						ctx.drawImage(tree, px, py - treeH + TILE_SIZE, TILE_SIZE, treeH);
					}
				} else if (r < 0.04) {
					const rock = rand() < 0.5 ? getTile("rock_gray_1") : getTile("rock_gray_2");
					if (rock) ctx.drawImage(rock, px, py, TILE_SIZE, TILE_SIZE);
				} else if (r < 0.05) {
					const bush = getTile("bush_green");
					if (bush) ctx.drawImage(bush, px, py, TILE_SIZE, TILE_SIZE);
				} else if (r < 0.055) {
					const mush = getTile("mushroom");
					if (mush) ctx.drawImage(mush, px, py, TILE_SIZE, TILE_SIZE);
				}
			} else if (t === "dirt" || t === "mud") {
				if (r < 0.03) {
					const rock = rand() < 0.5 ? getTile("rock_gray_1") : getTile("rock_gray_2");
					if (rock) ctx.drawImage(rock, px, py, TILE_SIZE, TILE_SIZE);
				} else if (r < 0.04) {
					const stump = getTile("stump");
					if (stump) ctx.drawImage(stump, px, py, TILE_SIZE, TILE_SIZE);
				}
			} else if (t === "beach" || t === "sand") {
				if (r < 0.02) {
					const rock = getTile("rock_gray_1");
					if (rock) ctx.drawImage(rock, px, py, TILE_SIZE, TILE_SIZE);
				}
			} else if (t === "water") {
				if (r < 0.08) {
					ctx.fillStyle = "rgba(100, 180, 220, 0.15)";
					const shimW = 4 + Math.floor(rand() * 12);
					ctx.fillRect(px + rand() * TILE_SIZE, py + rand() * TILE_SIZE, shimW, 2);
				}
			}
		}
	}
}

// ─── Internal chunk painter ───

/**
 * Paint a rectangular region of the terrain grid onto a canvas.
 * Coordinates are in tile space: startTileX..endTileX, startTileY..endTileY.
 */
function paintRegion(
	grid: TerrainType[][],
	startTileX: number,
	startTileY: number,
	endTileX: number,
	endTileY: number,
	rand: () => number,
): HTMLCanvasElement {
	const regionW = endTileX - startTileX;
	const regionH = endTileY - startTileY;
	const canvas = document.createElement("canvas");
	canvas.width = regionW * TILE_SIZE;
	canvas.height = regionH * TILE_SIZE;
	const ctx = canvas.getContext("2d", { alpha: false })!;

	if (!tilesLoaded) {
		const colors: Record<string, string> = {
			grass: "#14532d", water: "#0f2b32", dirt: "#713f12",
			sand: "#d4a574", mud: "#5c4033", mangrove: "#0f3d0f",
			bridge: "#8B6914", beach: "#d4a574", toxic_sludge: "#2d1b4e",
		};
		for (let ty = startTileY; ty < endTileY; ty++) {
			for (let tx = startTileX; tx < endTileX; tx++) {
				ctx.fillStyle = colors[grid[ty][tx]] ?? "#14532d";
				ctx.fillRect((tx - startTileX) * TILE_SIZE, (ty - startTileY) * TILE_SIZE, TILE_SIZE, TILE_SIZE);
			}
		}
		return canvas;
	}

	// Render base terrain tiles
	for (let ty = startTileY; ty < endTileY; ty++) {
		for (let tx = startTileX; tx < endTileX; tx++) {
			const tileName = getAutoTile(grid, tx, ty, rand);
			const img = getTile(tileName);
			const px = (tx - startTileX) * TILE_SIZE;
			const py = (ty - startTileY) * TILE_SIZE;
			if (img) {
				ctx.drawImage(img, px, py, TILE_SIZE, TILE_SIZE);
			} else {
				ctx.fillStyle = TERRAIN_COLORS[grid[ty][tx]] ?? TERRAIN_COLORS.grass;
				ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
			}
		}
	}

	// Boundary blending pass (offset-aware)
	blendTileBoundariesRegion(ctx, grid, startTileX, startTileY, endTileX, endTileY, rand);

	// Scatter props (offset-aware)
	scatterPropsRegion(ctx, grid, startTileX, startTileY, endTileX, endTileY, rand);

	return canvas;
}

// ─── Main render functions ───

/**
 * Paint the terrain for a mission as a single canvas.
 *
 * For maps that fit within browser canvas limits (≤128 tiles per axis)
 * this creates one canvas. For larger maps it internally composites chunks
 * and returns the result — but callers should prefer paintTerrainChunked()
 * for maps larger than 128×128 to avoid the composite cost.
 *
 * Falls back to a simple colored fill if tiles haven't loaded yet.
 */
export function paintTerrainTiled(missionDef: MissionDef): HTMLCanvasElement {
	const { terrain } = missionDef;
	const pixelW = terrain.width * TILE_SIZE;
	const pixelH = terrain.height * TILE_SIZE;

	// If the map fits in a single canvas, paint directly
	if (pixelW <= MAX_CANVAS_DIM && pixelH <= MAX_CANVAS_DIM) {
		const grid = buildTerrainGrid(terrain);
		const seed = terrain.width * 1000 + terrain.height;
		const rand = seededRandom(seed);
		return paintRegion(grid, 0, 0, terrain.width, terrain.height, rand);
	}

	// Large map: paint in chunks, then composite down to a single canvas
	// clamped to MAX_CANVAS_DIM (losing some resolution, but workable for minimap).
	// Callers rendering the main view should use paintTerrainChunked() instead.
	const chunks = paintTerrainChunked(missionDef);
	const canvas = document.createElement("canvas");
	canvas.width = Math.min(pixelW, MAX_CANVAS_DIM);
	canvas.height = Math.min(pixelH, MAX_CANVAS_DIM);
	const ctx = canvas.getContext("2d", { alpha: false })!;
	const scaleX = canvas.width / pixelW;
	const scaleY = canvas.height / pixelH;
	ctx.scale(scaleX, scaleY);
	for (const chunk of chunks) {
		ctx.drawImage(chunk.canvas, chunk.x, chunk.y);
	}
	return canvas;
}

/**
 * Paint the terrain as an array of chunk canvases.
 *
 * Each chunk stays within browser canvas limits (≤4096px per axis).
 * For small maps (≤128 tiles per axis) this returns a single chunk.
 * For larger maps it tiles the terrain into a grid of chunks.
 *
 * Use this for the main game view (TerrainLayer) to avoid exceeding
 * mobile browser canvas limits on maps up to 160×160.
 */
export function paintTerrainChunked(missionDef: MissionDef): TerrainChunk[] {
	const { terrain } = missionDef;
	const grid = buildTerrainGrid(terrain);
	const seed = terrain.width * 1000 + terrain.height;

	const chunks: TerrainChunk[] = [];

	for (let cy = 0; cy < terrain.height; cy += CHUNK_TILES) {
		for (let cx = 0; cx < terrain.width; cx += CHUNK_TILES) {
			const endX = Math.min(cx + CHUNK_TILES, terrain.width);
			const endY = Math.min(cy + CHUNK_TILES, terrain.height);

			// Each chunk gets its own seeded RNG derived from its position
			// so that prop/blend scatter is deterministic per chunk.
			const chunkSeed = seed + cy * 10000 + cx;
			const rand = seededRandom(chunkSeed);

			const canvas = paintRegion(grid, cx, cy, endX, endY, rand);
			chunks.push({
				canvas,
				x: cx * TILE_SIZE,
				y: cy * TILE_SIZE,
				width: (endX - cx) * TILE_SIZE,
				height: (endY - cy) * TILE_SIZE,
			});
		}
	}

	return chunks;
}

/**
 * Paint a small minimap canvas for the terrain.
 * Always returns a single canvas ≤ MAX_CANVAS_DIM regardless of map size.
 * Uses a simplified color-fill approach for speed when the map is very large.
 */
export function paintTerrainMinimap(missionDef: MissionDef, maxW = 256, maxH = 256): HTMLCanvasElement {
	const { terrain } = missionDef;

	// For small maps, just scale down the full render
	if (terrain.width <= CHUNK_TILES && terrain.height <= CHUNK_TILES) {
		return paintTerrainTiled(missionDef);
	}

	// For large maps, paint a color-fill minimap (fast, no tile images needed)
	const grid = buildTerrainGrid(terrain);
	const canvas = document.createElement("canvas");
	// Scale so each tile is at least 1px but canvas doesn't exceed maxW/maxH
	const scale = Math.min(maxW / terrain.width, maxH / terrain.height, 4);
	canvas.width = Math.ceil(terrain.width * scale);
	canvas.height = Math.ceil(terrain.height * scale);
	const ctx = canvas.getContext("2d", { alpha: false })!;

	for (let y = 0; y < terrain.height; y++) {
		for (let x = 0; x < terrain.width; x++) {
			ctx.fillStyle = TERRAIN_COLORS[grid[y][x]] ?? TERRAIN_COLORS.grass;
			ctx.fillRect(x * scale, y * scale, Math.ceil(scale), Math.ceil(scale));
		}
	}
	return canvas;
}

// ─── Terrain colors (used for fallback fill + boundary blending) ───

const TERRAIN_COLORS: Record<string, string> = {
	grass: "#14532d",
	water: "#0f2b32",
	dirt: "#713f12",
	sand: "#c4956a",
	mud: "#5c4033",
	mangrove: "#0f3d0f",
	bridge: "#8B6914",
	beach: "#c4956a",
	toxic_sludge: "#2d1b4e",
};

// ─── Tile boundary blending ───

/**
 * Post-process pass that scatters noise at tile boundaries to soften
 * the visible grid between different terrain types.
 *
 * Region-aware version: only processes tiles within the given tile range
 * and offsets pixel coordinates so the output lands correctly on the
 * chunk canvas whose origin is at (startTileX, startTileY).
 *
 * For large maps (>64 tiles on either axis) the scatter count per edge
 * is reduced to keep total fillRect calls manageable.
 */
function blendTileBoundariesRegion(
	ctx: CanvasRenderingContext2D,
	grid: TerrainType[][],
	startTileX: number,
	startTileY: number,
	endTileX: number,
	endTileY: number,
	rand: () => number,
): void {
	const h = grid.length;
	const w = grid[0].length;

	// Scale scatter density for large maps: full density up to 64 tiles,
	// linearly reduced beyond that (min 8 scatter pixels per edge).
	const mapDim = Math.max(w, h);
	const scatterScale = mapDim <= 64 ? 1.0 : Math.max(0.3, 64 / mapDim);

	for (let y = startTileY; y < endTileY; y++) {
		for (let x = startTileX; x < endTileX; x++) {
			const t = grid[y][x];
			// Pixel coords relative to chunk origin
			const px = (x - startTileX) * TILE_SIZE;
			const py = (y - startTileY) * TILE_SIZE;

			// Check each neighbor (uses full grid for correct edge detection)
			const neighbors: Array<{ nx: number; ny: number; edge: "n" | "s" | "e" | "w" }> = [
				{ nx: x, ny: y - 1, edge: "n" },
				{ nx: x, ny: y + 1, edge: "s" },
				{ nx: x + 1, ny: y, edge: "e" },
				{ nx: x - 1, ny: y, edge: "w" },
			];

			for (const { nx, ny, edge } of neighbors) {
				if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
				const nt = grid[ny][nx];
				if (nt === t) continue;

				const neighborColor = TERRAIN_COLORS[nt] ?? TERRAIN_COLORS.grass;
				const myColor = TERRAIN_COLORS[t] ?? TERRAIN_COLORS.grass;
				const baseCount = 25 + Math.floor(rand() * 15);
				const count = Math.max(8, Math.floor(baseCount * scatterScale));

				for (let i = 0; i < count; i++) {
					let sx: number, sy: number;
					const spread = 6 + rand() * 14;
					const along = rand() * TILE_SIZE;

					switch (edge) {
						case "n": sx = px + along; sy = py + rand() * spread; break;
						case "s": sx = px + along; sy = py + TILE_SIZE - rand() * spread; break;
						case "e": sx = px + TILE_SIZE - rand() * spread; sy = py + along; break;
						case "w": sx = px + rand() * spread; sy = py + along; break;
					}

					const useNeighborColor = rand() < 0.55;
					ctx.fillStyle = useNeighborColor ? neighborColor : myColor;
					ctx.globalAlpha = 0.25 + rand() * 0.5;
					const size = 1 + Math.floor(rand() * 3);
					ctx.fillRect(sx, sy, size, size);
				}
			}
		}
	}
	ctx.globalAlpha = 1;
}
