import { clampZoom, lerpZoom, type DeviceClass } from "@/input/cameraLimits";

export interface CameraState {
	x: number;
	y: number;
	zoom: number;
}

export interface CameraBounds {
	worldW: number;
	worldH: number;
}

export interface CameraViewport {
	width: number;
	height: number;
}

function clampCameraAxis(position: number, worldSize: number, viewportSize: number): number {
	return Math.max(0, Math.min(position, Math.max(0, worldSize - viewportSize)));
}

export function clampCameraPosition(
	camera: CameraState,
	bounds: CameraBounds,
	viewport: CameraViewport,
): CameraState {
	return {
		...camera,
		x: clampCameraAxis(camera.x, bounds.worldW, viewport.width),
		y: clampCameraAxis(camera.y, bounds.worldH, viewport.height),
	};
}

export function panCamera(
	camera: CameraState,
	bounds: CameraBounds,
	viewport: CameraViewport,
	dx: number,
	dy: number,
): CameraState {
	return clampCameraPosition(
		{
			...camera,
			x: camera.x + dx,
			y: camera.y + dy,
		},
		bounds,
		viewport,
	);
}

export function setCameraPosition(
	camera: CameraState,
	bounds: CameraBounds,
	viewport: CameraViewport,
	x: number,
	y: number,
): CameraState {
	return clampCameraPosition(
		{
			...camera,
			x,
			y,
		},
		bounds,
		viewport,
	);
}

export function setCameraBounds(
	camera: CameraState,
	bounds: CameraBounds,
	viewport: CameraViewport,
): CameraState {
	return clampCameraPosition(camera, bounds, viewport);
}

export function setCameraZoom(camera: CameraState, deviceClass: DeviceClass, zoom: number): CameraState {
	return {
		...camera,
		zoom: clampZoom(zoom, deviceClass),
	};
}

export function lerpCameraZoom(
	camera: CameraState,
	deviceClass: DeviceClass,
	target: number,
	factor: number,
): CameraState {
	const nextZoom = lerpZoom(camera.zoom, clampZoom(target, deviceClass), factor);
	if (Math.abs(nextZoom - camera.zoom) < 0.001) {
		return camera;
	}
	return {
		...camera,
		zoom: nextZoom,
	};
}
