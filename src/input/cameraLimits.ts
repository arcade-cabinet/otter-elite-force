/**
 * Camera Limits — zoom range configuration per device class.
 *
 * Phone:   0.5x - 1.5x
 * Tablet:  0.5x - 2.0x
 * Desktop: 0.25x - 3.0x
 */

export type DeviceClass = "phone" | "tablet" | "desktop";

export interface ZoomRange {
	min: number;
	max: number;
}

const ZOOM_RANGES: Record<DeviceClass, ZoomRange> = {
	phone: { min: 0.5, max: 1.5 },
	tablet: { min: 0.5, max: 2.0 },
	desktop: { min: 0.25, max: 3.0 },
};

/**
 * Detect device class based on viewport width and touch capability.
 */
export function detectDeviceClass(viewportWidth: number, hasTouch: boolean): DeviceClass {
	if (hasTouch && viewportWidth < 768) return "phone";
	if (hasTouch && viewportWidth < 1200) return "tablet";
	return "desktop";
}

/**
 * Get zoom range for a device class.
 */
export function getZoomRange(device: DeviceClass): ZoomRange {
	return ZOOM_RANGES[device];
}

/**
 * Clamp a zoom level to the range for the given device class.
 */
export function clampZoom(zoom: number, device: DeviceClass): number {
	const range = ZOOM_RANGES[device];
	return Math.max(range.min, Math.min(zoom, range.max));
}

/**
 * Smoothly interpolate toward a target zoom using lerp.
 *
 * @param current  Current zoom level
 * @param target   Desired zoom level
 * @param factor   Interpolation factor (0..1, higher = faster)
 * @returns Interpolated zoom value
 */
export function lerpZoom(current: number, target: number, factor: number): number {
	const clamped = Math.max(0, Math.min(1, factor));
	return current + (target - current) * clamped;
}

/** Edge scroll threshold in pixels */
export const EDGE_SCROLL_THRESHOLD = 20;

/** Default camera pan speed in pixels per second (matches WASD) */
export const DEFAULT_PAN_SPEED = 400;
