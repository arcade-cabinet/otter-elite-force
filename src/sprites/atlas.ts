import { compileSpriteToPixels } from "./compiler";
import type { AtlasResult, Rect, SpriteDefinition } from "./types";

interface PackItem {
	key: string;
	w: number;
	h: number;
	imageData: ImageData;
	x: number;
	y: number;
}

/**
 * Simple shelf-based bin packing: sort by height descending,
 * place items left-to-right on shelves.
 */
function shelfPack(items: PackItem[]): { width: number; height: number } {
	items.sort((a, b) => b.h - a.h);

	let shelfX = 0;
	let shelfY = 0;
	let shelfH = 0;
	// Start with a reasonable width estimate
	const totalArea = items.reduce((s, i) => s + i.w * i.h, 0);
	const maxW = Math.max(nextPow2(Math.ceil(Math.sqrt(totalArea))), ...items.map((i) => i.w));

	for (const item of items) {
		if (shelfX + item.w > maxW) {
			// New shelf
			shelfY += shelfH;
			shelfX = 0;
			shelfH = 0;
		}
		item.x = shelfX;
		item.y = shelfY;
		shelfX += item.w;
		shelfH = Math.max(shelfH, item.h);
	}

	return {
		width: maxW,
		height: nextPow2(shelfY + shelfH),
	};
}

function nextPow2(n: number): number {
	let v = 1;
	while (v < n) v <<= 1;
	return v;
}

/**
 * Generate a texture atlas from multiple SpriteDefinitions.
 * Each frame of each sprite gets its own rect in the atlas.
 * Frame keys are "{spriteName}_{frameIndex}".
 */
export function generateAtlas(sprites: SpriteDefinition[], scale: number): AtlasResult {
	const items: PackItem[] = [];

	for (const def of sprites) {
		for (const frame of def.frames) {
			const imageData = compileSpriteToPixels(def, frame.index, scale);
			items.push({
				key: `${def.meta.name}_${frame.index}`,
				w: imageData.width,
				h: imageData.height,
				imageData,
				x: 0,
				y: 0,
			});
		}
	}

	const { width, height } = shelfPack(items);
	const atlasData = new Uint8ClampedArray(width * height * 4);

	for (const item of items) {
		// Blit item pixels into atlas
		for (let row = 0; row < item.h; row++) {
			const srcOffset = row * item.w * 4;
			const dstOffset = ((item.y + row) * width + item.x) * 4;
			atlasData.set(item.imageData.data.subarray(srcOffset, srcOffset + item.w * 4), dstOffset);
		}
	}

	const frames: Record<string, Rect> = {};
	for (const item of items) {
		frames[item.key] = { x: item.x, y: item.y, w: item.w, h: item.h };
	}

	return {
		image: new ImageData(atlasData, width, height),
		frames,
	};
}
