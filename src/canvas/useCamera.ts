/**
 * useCamera — React hook for camera state management.
 *
 * Manages camera position (pan), zoom level, and bounds clamping.
 * Provides imperative methods for panning and zooming that other
 * systems (input handlers, edge scroll) can call.
 *
 * Camera coordinates are in world-space pixels. The Stage renders
 * layers offset by (-camX, -camY) so visible content scrolls.
 */

import { useCallback, useRef, useState } from "react";
import { clampZoom, type DeviceClass, detectDeviceClass, lerpZoom } from "@/input/cameraLimits";

// ─── Types ───

export interface CameraState {
	/** Camera X offset in world pixels. */
	x: number;
	/** Camera Y offset in world pixels. */
	y: number;
	/** Current zoom level (1 = 100%). */
	zoom: number;
}

export interface CameraBounds {
	/** World width in pixels. */
	worldW: number;
	/** World height in pixels. */
	worldH: number;
}

export interface UseCameraResult {
	/** Current camera state. */
	camera: CameraState;
	/** Pan the camera by a delta (pixels). Clamped to world bounds. */
	pan: (dx: number, dy: number) => void;
	/** Set camera position absolutely. Clamped to world bounds. */
	setPosition: (x: number, y: number) => void;
	/** Zoom toward a target level, clamped by device class. */
	setZoom: (zoom: number) => void;
	/** Smoothly interpolate zoom toward target. Call per frame. */
	lerpZoomTo: (target: number, factor: number) => void;
	/** Update world bounds (call when mission loads). */
	setBounds: (bounds: CameraBounds) => void;
	/** Current device class for zoom range. */
	deviceClass: DeviceClass;
}

// ─── Hook ───

/**
 * Manages camera position and zoom with bounds clamping.
 *
 * @param viewportW - Current viewport width in pixels.
 * @param viewportH - Current viewport height in pixels.
 */
export function useCamera(viewportW: number, viewportH: number): UseCameraResult {
	const [camera, setCameraState] = useState<CameraState>({ x: 0, y: 0, zoom: 1 });
	const boundsRef = useRef<CameraBounds>({ worldW: 4096, worldH: 4096 });

	// Detect device class from viewport
	const hasTouch =
		typeof navigator !== "undefined" && "maxTouchPoints" in navigator
			? navigator.maxTouchPoints > 0
			: false;
	const deviceClass = detectDeviceClass(viewportW, hasTouch);

	const clampPosition = useCallback(
		(x: number, y: number): { x: number; y: number } => {
			const { worldW, worldH } = boundsRef.current;
			return {
				x: Math.max(0, Math.min(x, Math.max(0, worldW - viewportW))),
				y: Math.max(0, Math.min(y, Math.max(0, worldH - viewportH))),
			};
		},
		[viewportW, viewportH],
	);

	const pan = useCallback(
		(dx: number, dy: number) => {
			setCameraState((prev) => {
				const clamped = clampPosition(prev.x + dx, prev.y + dy);
				return { ...prev, ...clamped };
			});
		},
		[clampPosition],
	);

	const setPosition = useCallback(
		(x: number, y: number) => {
			setCameraState((prev) => {
				const clamped = clampPosition(x, y);
				return { ...prev, ...clamped };
			});
		},
		[clampPosition],
	);

	const setZoom = useCallback(
		(zoom: number) => {
			const clamped = clampZoom(zoom, deviceClass);
			setCameraState((prev) => ({ ...prev, zoom: clamped }));
		},
		[deviceClass],
	);

	const lerpZoomTo = useCallback(
		(target: number, factor: number) => {
			setCameraState((prev) => {
				const next = lerpZoom(prev.zoom, clampZoom(target, deviceClass), factor);
				// Skip update if negligibly close
				if (Math.abs(next - prev.zoom) < 0.001) return prev;
				return { ...prev, zoom: next };
			});
		},
		[deviceClass],
	);

	const setBounds = useCallback((bounds: CameraBounds) => {
		boundsRef.current = bounds;
	}, []);

	return {
		camera,
		pan,
		setPosition,
		setZoom,
		lerpZoomTo,
		setBounds,
		deviceClass,
	};
}
