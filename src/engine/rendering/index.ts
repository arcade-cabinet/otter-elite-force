/**
 * Rendering barrel — re-exports terrain type constants.
 *
 * The old Canvas2D renderers (terrainRenderer, spriteRenderer, fogRenderer,
 * combatText, assetLoader) have been deleted. LittleJS handles rendering
 * natively via drawRect/drawTile/drawText in the tacticalRuntime callbacks.
 *
 * TerrainTypeId and TerrainTypeIdValue are now in content/terrainTypes.ts.
 */

export { TerrainTypeId } from "../content/terrainTypes";
export type { TerrainTypeIdValue } from "../content/terrainTypes";
