/**
 * Minimap Input — translates minimap click/drag into camera positioning.
 *
 * Pure logic module: given minimap canvas dimensions, world dimensions (in tiles),
 * and a canvas-local pointer position, computes the world-space camera target.
 *
 * Used by the React Minimap component to snap/pan the game camera.
 */

const CELL_SIZE = 32;

export interface MinimapDimensions {
	/** Minimap canvas CSS width (px) */
	canvasWidth: number;
	/** Minimap canvas CSS height (px) */
	canvasHeight: number;
	/** World width in tiles */
	worldTilesW: number;
	/** World height in tiles */
	worldTilesH: number;
}

export interface CameraTarget {
	/** World-space X scroll target (pixels) */
	scrollX: number;
	/** World-space Y scroll target (pixels) */
	scrollY: number;
}

/**
 * Convert a minimap canvas-local coordinate to world-space camera scroll position.
 *
 * The returned scroll value centers the camera viewport on the clicked tile.
 *
 * @param canvasX - X position on the minimap canvas (CSS pixels, 0..canvasWidth)
 * @param canvasY - Y position on the minimap canvas (CSS pixels, 0..canvasHeight)
 * @param dims - minimap and world dimensions
 * @param viewportWidth - camera viewport width in pixels
 * @param viewportHeight - camera viewport height in pixels
 */
export function minimapToWorld(
	canvasX: number,
	canvasY: number,
	dims: MinimapDimensions,
	viewportWidth: number,
	viewportHeight: number,
): CameraTarget {
	const { canvasWidth, canvasHeight, worldTilesW, worldTilesH } = dims;

	// Convert minimap pixel -> tile coordinate
	const tileX = (canvasX / Math.max(1, canvasWidth)) * worldTilesW;
	const tileY = (canvasY / Math.max(1, canvasHeight)) * worldTilesH;

	// Convert tile -> world pixels, centering the viewport
	const scrollX = tileX * CELL_SIZE - viewportWidth / 2;
	const scrollY = tileY * CELL_SIZE - viewportHeight / 2;

	return { scrollX, scrollY };
}

/**
 * Clamp camera scroll to map boundaries.
 *
 * @param target - desired scroll position
 * @param mapWidth - map width in world pixels
 * @param mapHeight - map height in world pixels
 * @param viewportWidth - camera viewport width in pixels
 * @param viewportHeight - camera viewport height in pixels
 */
export function clampCameraScroll(
	target: CameraTarget,
	mapWidth: number,
	mapHeight: number,
	viewportWidth: number,
	viewportHeight: number,
): CameraTarget {
	return {
		scrollX: Math.max(0, Math.min(target.scrollX, mapWidth - viewportWidth)),
		scrollY: Math.max(0, Math.min(target.scrollY, mapHeight - viewportHeight)),
	};
}
