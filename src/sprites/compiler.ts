import type { SpriteDefinition } from "./types";

/**
 * Parse a hex color string (#RRGGBB) into [R, G, B] tuple.
 */
function hexToRgb(hex: string): [number, number, number] {
	const h = hex.startsWith("#") ? hex.slice(1) : hex;
	return [
		Number.parseInt(h.slice(0, 2), 16),
		Number.parseInt(h.slice(2, 4), 16),
		Number.parseInt(h.slice(4, 6), 16),
	];
}

/**
 * Compile a single frame of a SpriteDefinition into raw pixel data (ImageData).
 *
 * Each character in the art grid maps to a palette color.
 * Space = fully transparent. Scale multiplies pixel size.
 */
export function compileSpriteToPixels(
	def: SpriteDefinition,
	frameIndex: number,
	scale: number,
): ImageData {
	const { width, height } = def.meta;
	const frame = def.frames[frameIndex];
	const outW = width * scale;
	const outH = height * scale;
	const data = new Uint8ClampedArray(outW * outH * 4);

	for (let y = 0; y < height; y++) {
		const row = frame.art[y];
		for (let x = 0; x < width; x++) {
			const ch = row[x];
			if (ch === " ") continue; // transparent

			const color = def.palette[ch];
			if (!color) continue; // unmapped character treated as transparent

			const [r, g, b] = hexToRgb(color);

			// Fill scaled block
			for (let sy = 0; sy < scale; sy++) {
				for (let sx = 0; sx < scale; sx++) {
					const px = x * scale + sx;
					const py = y * scale + sy;
					const idx = (py * outW + px) * 4;
					data[idx] = r;
					data[idx + 1] = g;
					data[idx + 2] = b;
					data[idx + 3] = 255;
				}
			}
		}
	}

	return new ImageData(data, outW, outH);
}
