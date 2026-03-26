/**
 * Fog of war renderer — draws a fog overlay on the tactical canvas.
 *
 * Fog grid values:
 *   0 = unexplored (black)
 *   1 = explored but not currently visible (semi-transparent dark)
 *   2 = visible (transparent — no overlay drawn)
 *
 * Renders per-tile at 32x32 grid cells aligned to the camera.
 */

const TILE_SIZE = 32;

/** Alpha value for explored-but-not-visible tiles. */
const EXPLORED_ALPHA = 0.5;

/**
 * Render fog of war overlay onto the given canvas context.
 *
 * @param ctx - The Canvas2D rendering context.
 * @param camera - Camera position and zoom level.
 * @param viewport - Viewport dimensions in screen pixels.
 * @param fogGrid - Flat Uint8Array: 0=unexplored, 1=explored, 2=visible.
 * @param gridWidth - Width of the fog grid in tiles.
 * @param gridHeight - Height of the fog grid in tiles.
 */
export function renderFogOverlay(
	ctx: CanvasRenderingContext2D,
	camera: { x: number; y: number; zoom: number },
	viewport: { width: number; height: number },
	fogGrid: Uint8Array,
	gridWidth: number,
	gridHeight: number,
): void {
	if (fogGrid.length === 0 || gridWidth === 0 || gridHeight === 0) return;

	// Compute visible tile range from camera and viewport
	const startTileX = Math.max(0, Math.floor(camera.x / TILE_SIZE));
	const startTileY = Math.max(0, Math.floor(camera.y / TILE_SIZE));
	const endTileX = Math.min(
		gridWidth,
		Math.ceil((camera.x + viewport.width / camera.zoom) / TILE_SIZE),
	);
	const endTileY = Math.min(
		gridHeight,
		Math.ceil((camera.y + viewport.height / camera.zoom) / TILE_SIZE),
	);

	for (let ty = startTileY; ty < endTileY; ty++) {
		for (let tx = startTileX; tx < endTileX; tx++) {
			const fogValue = fogGrid[ty * gridWidth + tx];

			// 2 = visible — skip (no fog overlay)
			if (fogValue === 2) continue;

			const screenX = (tx * TILE_SIZE - camera.x) * camera.zoom;
			const screenY = (ty * TILE_SIZE - camera.y) * camera.zoom;
			const screenSize = TILE_SIZE * camera.zoom;

			if (fogValue === 0) {
				// Unexplored — fully black
				ctx.fillStyle = "#000000";
				ctx.fillRect(screenX, screenY, screenSize, screenSize);
			} else {
				// Explored — semi-transparent dark
				ctx.fillStyle = `rgba(0, 0, 0, ${EXPLORED_ALPHA})`;
				ctx.fillRect(screenX, screenY, screenSize, screenSize);
			}
		}
	}
}

/**
 * Compute the fog value at a specific grid coordinate.
 * Exported for testing.
 */
export function getFogValue(
	fogGrid: Uint8Array,
	gridWidth: number,
	tileX: number,
	tileY: number,
): number {
	if (tileX < 0 || tileY < 0 || tileX >= gridWidth) return 0;
	const index = tileY * gridWidth + tileX;
	if (index >= fogGrid.length) return 0;
	return fogGrid[index];
}
