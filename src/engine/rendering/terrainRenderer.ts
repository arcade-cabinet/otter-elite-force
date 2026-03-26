/**
 * Terrain renderer — draws a tile-based terrain grid to a Canvas2D context.
 *
 * Loads Kenney tile images and renders them at 32x32px grid cells, offset by
 * camera position and zoom. Pre-renders terrain to offscreen chunk canvases
 * for performance, only drawing visible chunks to the main context.
 *
 * Terrain types match the tilePainter enum: grass, water, sand, forest, dirt,
 * stone, mud, mangrove, bridge, beach, toxic_sludge.
 */

const TILE_SIZE = 32;

/**
 * Maximum chunk size in tiles per axis. Each offscreen canvas covers up to
 * this many tiles, staying under mobile browser canvas limits (4096px).
 */
const CHUNK_TILES = 32;

/** Numeric terrain type IDs used in the tile grid. */
export const TerrainTypeId = {
	grass: 0,
	water: 1,
	sand: 2,
	forest: 3,
	dirt: 4,
	stone: 5,
	mud: 6,
	mangrove: 7,
	bridge: 8,
	beach: 9,
	toxic_sludge: 10,
} as const;

export type TerrainTypeIdValue = (typeof TerrainTypeId)[keyof typeof TerrainTypeId];

/** Fallback solid colors for each terrain type when tile images are unavailable. */
const TERRAIN_COLORS: Record<number, string> = {
	[TerrainTypeId.grass]: "#14532d",
	[TerrainTypeId.water]: "#0f2b32",
	[TerrainTypeId.sand]: "#d4a574",
	[TerrainTypeId.forest]: "#0f3d0f",
	[TerrainTypeId.dirt]: "#713f12",
	[TerrainTypeId.stone]: "#64748b",
	[TerrainTypeId.mud]: "#5c4033",
	[TerrainTypeId.mangrove]: "#0f3d0f",
	[TerrainTypeId.bridge]: "#8B6914",
	[TerrainTypeId.beach]: "#d4a574",
	[TerrainTypeId.toxic_sludge]: "#2d1b4e",
};

/** Map numeric terrain ID to the tile image key used for fill rendering. */
const TERRAIN_FILL_KEYS: Record<number, string[]> = {
	[TerrainTypeId.grass]: ["grass_fill", "grass_fill_2"],
	[TerrainTypeId.water]: ["water_fill", "water_fill_2"],
	[TerrainTypeId.sand]: ["beach_fill", "beach_fill_2"],
	[TerrainTypeId.forest]: ["grass_dark_fill", "grass_dark_fill_2"],
	[TerrainTypeId.dirt]: ["dirt_fill", "dirt_fill_2"],
	[TerrainTypeId.stone]: ["dirt_fill", "dirt_fill_2"],
	[TerrainTypeId.mud]: ["mud_fill"],
	[TerrainTypeId.mangrove]: ["grass_dark_fill", "grass_dark_fill_2"],
	[TerrainTypeId.bridge]: ["bridge_fill"],
	[TerrainTypeId.beach]: ["beach_fill", "beach_fill_2"],
	[TerrainTypeId.toxic_sludge]: ["water_fill", "water_fill_2"],
};

interface TerrainChunk {
	canvas: HTMLCanvasElement;
	worldX: number;
	worldY: number;
	pixelWidth: number;
	pixelHeight: number;
}

export interface TerrainRenderer {
	render(
		ctx: CanvasRenderingContext2D,
		camera: { x: number; y: number; zoom: number },
		viewport: { width: number; height: number },
	): void;
}

/** Simple seeded RNG for deterministic tile variation. */
function seededRandom(seed: number): () => number {
	let s = seed;
	return () => {
		s = (s * 1664525 + 1013904223) & 0xffffffff;
		return (s >>> 0) / 0xffffffff;
	};
}

/**
 * Pre-render a rectangular chunk of the terrain grid to an offscreen canvas.
 */
function renderChunk(
	tileGrid: number[][],
	tileImages: Map<number, HTMLImageElement>,
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
	const ctx = canvas.getContext("2d", { alpha: false });
	if (!ctx) return canvas;

	for (let ty = startTileY; ty < endTileY; ty++) {
		for (let tx = startTileX; tx < endTileX; tx++) {
			const terrainId = tileGrid[ty]?.[tx] ?? 0;
			const px = (tx - startTileX) * TILE_SIZE;
			const py = (ty - startTileY) * TILE_SIZE;

			// Try tile image first
			const fillKeys = TERRAIN_FILL_KEYS[terrainId];
			let drawn = false;
			if (fillKeys && fillKeys.length > 0) {
				// Consume random value for deterministic chunk rendering
				rand();
				const tileImg = tileImages.get(terrainId);
				if (tileImg) {
					ctx.drawImage(tileImg, px, py, TILE_SIZE, TILE_SIZE);
					drawn = true;
				}
			} else {
				// Consume the random value for determinism
				rand();
			}

			if (!drawn) {
				ctx.fillStyle = TERRAIN_COLORS[terrainId] ?? TERRAIN_COLORS[0];
				ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
			}
		}
	}

	return canvas;
}

/**
 * Create a terrain renderer from a 2D grid of terrain type IDs.
 *
 * @param tileGrid - 2D array (rows of columns) of numeric terrain type IDs.
 * @param tileImages - Map from terrain type ID to a loaded HTMLImageElement.
 */
export function createTerrainRenderer(
	tileGrid: number[][],
	tileImages: Map<number, HTMLImageElement>,
): TerrainRenderer {
	const gridHeight = tileGrid.length;
	const gridWidth = gridHeight > 0 ? (tileGrid[0]?.length ?? 0) : 0;

	// Pre-render terrain into offscreen chunks
	const chunks: TerrainChunk[] = [];
	const baseSeed = gridWidth * 1000 + gridHeight;

	for (let cy = 0; cy < gridHeight; cy += CHUNK_TILES) {
		for (let cx = 0; cx < gridWidth; cx += CHUNK_TILES) {
			const endX = Math.min(cx + CHUNK_TILES, gridWidth);
			const endY = Math.min(cy + CHUNK_TILES, gridHeight);
			const chunkSeed = baseSeed + cy * 10000 + cx;
			const rand = seededRandom(chunkSeed);
			const chunkCanvas = renderChunk(tileGrid, tileImages, cx, cy, endX, endY, rand);
			chunks.push({
				canvas: chunkCanvas,
				worldX: cx * TILE_SIZE,
				worldY: cy * TILE_SIZE,
				pixelWidth: (endX - cx) * TILE_SIZE,
				pixelHeight: (endY - cy) * TILE_SIZE,
			});
		}
	}

	function render(
		ctx: CanvasRenderingContext2D,
		camera: { x: number; y: number; zoom: number },
		viewport: { width: number; height: number },
	): void {
		// Compute visible world-space bounds
		const visibleLeft = camera.x;
		const visibleTop = camera.y;
		const visibleRight = camera.x + viewport.width / camera.zoom;
		const visibleBottom = camera.y + viewport.height / camera.zoom;

		for (const chunk of chunks) {
			// Viewport culling: skip chunks entirely outside the visible area
			if (
				chunk.worldX + chunk.pixelWidth < visibleLeft ||
				chunk.worldX > visibleRight ||
				chunk.worldY + chunk.pixelHeight < visibleTop ||
				chunk.worldY > visibleBottom
			) {
				continue;
			}

			// Transform chunk position to screen coordinates
			const screenX = (chunk.worldX - camera.x) * camera.zoom;
			const screenY = (chunk.worldY - camera.y) * camera.zoom;
			const screenW = chunk.pixelWidth * camera.zoom;
			const screenH = chunk.pixelHeight * camera.zoom;

			ctx.drawImage(chunk.canvas, screenX, screenY, screenW, screenH);
		}
	}

	return { render };
}
