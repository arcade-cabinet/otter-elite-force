import type Phaser from "phaser";
import type { MissionMapData } from "./types";
import { TERRAIN_TEXTURE, TerrainType } from "./types";

/** Tile size in pixels — matches spec §8.1 */
export const TILE_SIZE = 32;

/**
 * Load a mission map into a Phaser scene.
 * Creates a tilemap from the terrain data array and positions entities on the object layer.
 * Returns the tilemap and layer for camera bounds and collision setup.
 */
export function loadMission(
	scene: Phaser.Scene,
	missionData: MissionMapData,
): { tilemap: Phaser.Tilemaps.Tilemap; layer: Phaser.Tilemaps.TilemapLayer } {
	const { cols, rows, terrain } = missionData;

	// Build tileset texture: a single strip of 32x32 tiles, one per terrain type
	const terrainTypes = Object.values(TerrainType).filter(
		(v): v is TerrainType => typeof v === "number",
	);
	const tilesetWidth = terrainTypes.length * TILE_SIZE;
	const tilesetHeight = TILE_SIZE;

	const tilesetCanvas = document.createElement("canvas");
	tilesetCanvas.width = tilesetWidth;
	tilesetCanvas.height = tilesetHeight;
	const ctx = tilesetCanvas.getContext("2d");

	if (ctx) {
		for (const terrainType of terrainTypes) {
			const textureKey = TERRAIN_TEXTURE[terrainType];
			const x = terrainType * TILE_SIZE;

			// Try to draw from Phaser texture, fall back to solid color
			if (scene.textures.exists(textureKey)) {
				const source = scene.textures.get(textureKey).getSourceImage();
				ctx.drawImage(source as HTMLImageElement, x, 0, TILE_SIZE, TILE_SIZE);
			} else {
				ctx.fillStyle = getTerrainFallbackColor(terrainType);
				ctx.fillRect(x, 0, TILE_SIZE, TILE_SIZE);
			}
		}
	}

	// Register the composite tileset texture with Phaser
	const tilesetKey = `tileset-mission-${missionData.missionId}`;
	if (scene.textures.exists(tilesetKey)) {
		scene.textures.remove(tilesetKey);
	}
	scene.textures.addCanvas(tilesetKey, tilesetCanvas);

	// Build the 2D tile index array for Phaser's tilemap
	const tileData: number[][] = [];
	for (let y = 0; y < rows; y++) {
		const row: number[] = [];
		for (let x = 0; x < cols; x++) {
			row.push(terrain[y][x]);
		}
		tileData.push(row);
	}

	// Create Phaser tilemap from raw data
	const tilemap = scene.make.tilemap({
		data: tileData,
		tileWidth: TILE_SIZE,
		tileHeight: TILE_SIZE,
	});

	const tileset = tilemap.addTilesetImage("terrain", tilesetKey, TILE_SIZE, TILE_SIZE, 0, 0);

	if (!tileset) {
		throw new Error("Failed to create tileset from terrain texture");
	}

	const layer = tilemap.createLayer(0, tileset, 0, 0);

	if (!layer) {
		throw new Error("Failed to create tilemap layer");
	}

	// Mark water and toxic sludge as collision tiles
	tilemap.setCollision([TerrainType.Water, TerrainType.ToxicSludge], true, true, layer);

	return { tilemap, layer };
}

function getTerrainFallbackColor(type: TerrainType): string {
	switch (type) {
		case TerrainType.Grass:
			return "#228b22";
		case TerrainType.Dirt:
			return "#a0522d";
		case TerrainType.Mud:
			return "#8b7355";
		case TerrainType.Water:
			return "#1e90ff";
		case TerrainType.Mangrove:
			return "#006400";
		case TerrainType.Bridge:
			return "#8b7765";
		case TerrainType.ToxicSludge:
			return "#7cfc00";
		case TerrainType.TallGrass:
			return "#32cd32";
	}
}
