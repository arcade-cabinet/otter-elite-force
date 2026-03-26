import { describe, expect, it } from "vitest";
import {
	clampCameraPosition,
	lerpCameraZoom,
	panCamera,
	setCameraBounds,
	setCameraPosition,
	setCameraZoom,
} from "./cameraProjection";

describe("engine/runtime/cameraProjection", () => {
	const viewport = { width: 1280, height: 720 };
	const bounds = { worldW: 4096, worldH: 2048 };

	it("clamps camera position within runtime bounds", () => {
		expect(
			clampCameraPosition({ x: 5000, y: -40, zoom: 1 }, bounds, viewport),
		).toEqual({
			x: 2816,
			y: 0,
			zoom: 1,
		});
	});

	it("pans camera while respecting bounds", () => {
		expect(
			panCamera({ x: 2800, y: 1300, zoom: 1 }, bounds, viewport, 200, 100),
		).toEqual({
			x: 2816,
			y: 1328,
			zoom: 1,
		});
	});

	it("re-clamps the active camera when bounds change", () => {
		expect(
			setCameraBounds(
				{ x: 2400, y: 900, zoom: 1 },
				{ worldW: 2048, worldH: 1024 },
				viewport,
			),
		).toEqual({
			x: 768,
			y: 304,
			zoom: 1,
		});
	});

	it("sets camera position deterministically", () => {
		expect(
			setCameraPosition({ x: 0, y: 0, zoom: 1 }, bounds, viewport, 300, 400),
		).toEqual({
			x: 300,
			y: 400,
			zoom: 1,
		});
	});

	it("clamps camera zoom by device class", () => {
		expect(setCameraZoom({ x: 0, y: 0, zoom: 1 }, "phone", 3)).toEqual({
			x: 0,
			y: 0,
			zoom: 1.5,
		});
	});

	it("lerps zoom toward the clamped runtime target", () => {
		expect(lerpCameraZoom({ x: 0, y: 0, zoom: 1 }, "desktop", 2, 0.5)).toEqual({
			x: 0,
			y: 0,
			zoom: 1.5,
		});
	});
});
