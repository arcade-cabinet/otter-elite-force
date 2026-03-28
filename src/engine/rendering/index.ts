/**
 * Rendering barrel — re-exports terrain type constants and atlas adapter.
 *
 * The old Canvas2D renderers (terrainRenderer, spriteRenderer, fogRenderer,
 * combatText, assetLoader) have been deleted. LittleJS handles rendering
 * natively via drawRect/drawTile/drawText in the tacticalRuntime callbacks.
 *
 * The atlasAdapter bridges Aseprite JSON+PNG sprite atlases to LittleJS
 * TileInfo objects for drawTile() rendering.
 */

export type { TerrainTypeIdValue } from "../content/terrainTypes";
export { TerrainTypeId } from "../content/terrainTypes";
export {
	getAnimalTextureIndex,
	getEntityAnimal,
	getEntityAnimationNames,
	getEntityDrawSize,
	getEntityTileInfo,
	initAtlasAdapter,
	isAtlasAdapterReady,
} from "./atlasAdapter";
