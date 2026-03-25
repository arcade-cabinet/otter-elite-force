/**
 * Vitest global test setup.
 *
 * This file runs before every test suite. Add global mocks,
 * polyfills, or test environment configuration here.
 */

// happy-dom does not provide ImageData — polyfill it for the sprite compiler.
if (typeof globalThis.ImageData === "undefined") {
	(globalThis as Record<string, unknown>).ImageData = class ImageData {
		readonly data: Uint8ClampedArray;
		readonly width: number;
		readonly height: number;
		readonly colorSpace: string = "srgb";

		constructor(
			dataOrWidth: Uint8ClampedArray | number,
			widthOrHeight: number,
			heightOrUndefined?: number,
		) {
			if (dataOrWidth instanceof Uint8ClampedArray) {
				this.data = dataOrWidth;
				this.width = widthOrHeight;
				this.height = heightOrUndefined ?? dataOrWidth.length / (widthOrHeight * 4);
			} else {
				this.width = dataOrWidth;
				this.height = widthOrHeight;
				this.data = new Uint8ClampedArray(this.width * this.height * 4);
			}
		}
	};
}
