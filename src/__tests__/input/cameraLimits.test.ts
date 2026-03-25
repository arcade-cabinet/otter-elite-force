import { describe, expect, it } from "vitest";
import {
	clampZoom,
	detectDeviceClass,
	EDGE_SCROLL_THRESHOLD,
	getZoomRange,
	lerpZoom,
} from "@/input/cameraLimits";

describe("detectDeviceClass", () => {
	it("returns phone for narrow touch viewports", () => {
		expect(detectDeviceClass(375, true)).toBe("phone");
		expect(detectDeviceClass(414, true)).toBe("phone");
	});

	it("returns tablet for medium touch viewports", () => {
		expect(detectDeviceClass(768, true)).toBe("tablet");
		expect(detectDeviceClass(1024, true)).toBe("tablet");
	});

	it("returns desktop for wide viewports regardless of touch", () => {
		expect(detectDeviceClass(1920, false)).toBe("desktop");
		expect(detectDeviceClass(1200, true)).toBe("desktop");
	});

	it("returns desktop for non-touch devices even at small widths", () => {
		expect(detectDeviceClass(375, false)).toBe("desktop");
	});
});

describe("getZoomRange", () => {
	it("returns phone range: 0.5-1.5", () => {
		const range = getZoomRange("phone");
		expect(range.min).toBe(0.5);
		expect(range.max).toBe(1.5);
	});

	it("returns tablet range: 0.5-2.0", () => {
		const range = getZoomRange("tablet");
		expect(range.min).toBe(0.5);
		expect(range.max).toBe(2.0);
	});

	it("returns desktop range: 0.25-3.0", () => {
		const range = getZoomRange("desktop");
		expect(range.min).toBe(0.25);
		expect(range.max).toBe(3.0);
	});
});

describe("clampZoom", () => {
	it("clamps below minimum", () => {
		expect(clampZoom(0.1, "phone")).toBe(0.5);
		expect(clampZoom(-1, "desktop")).toBe(0.25);
	});

	it("clamps above maximum", () => {
		expect(clampZoom(5, "phone")).toBe(1.5);
		expect(clampZoom(5, "desktop")).toBe(3.0);
	});

	it("does not clamp within range", () => {
		expect(clampZoom(1.0, "phone")).toBe(1.0);
		expect(clampZoom(2.5, "desktop")).toBe(2.5);
	});
});

describe("lerpZoom", () => {
	it("returns current when factor is 0", () => {
		expect(lerpZoom(1.0, 2.0, 0)).toBe(1.0);
	});

	it("returns target when factor is 1", () => {
		expect(lerpZoom(1.0, 2.0, 1)).toBe(2.0);
	});

	it("interpolates at 50%", () => {
		expect(lerpZoom(1.0, 2.0, 0.5)).toBe(1.5);
	});

	it("clamps factor to 0..1", () => {
		expect(lerpZoom(1.0, 2.0, -1)).toBe(1.0);
		expect(lerpZoom(1.0, 2.0, 5)).toBe(2.0);
	});
});

describe("EDGE_SCROLL_THRESHOLD", () => {
	it("is 20px", () => {
		expect(EDGE_SCROLL_THRESHOLD).toBe(20);
	});
});
