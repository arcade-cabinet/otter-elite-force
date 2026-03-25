import { PALETTE, PALETTES } from "./palettes";
import type { SPDSLSprite, SpriteDef, SpriteLayer } from "./types";

export type SpriteCategory =
	| "units"
	| "buildings"
	| "terrain"
	| "portraits"
	| "resources"
	| "props";

export interface CanonicalSpriteDimensions {
	width: number;
	height: number;
	size: number;
}

const CATEGORY_DIMENSIONS: Record<SpriteCategory, CanonicalSpriteDimensions> = {
	units: { width: 16, height: 16, size: 16 },
	buildings: { width: 32, height: 32, size: 32 },
	terrain: { width: 16, height: 16, size: 16 },
	portraits: { width: 64, height: 96, size: 64 },
	resources: { width: 16, height: 16, size: 16 },
	props: { width: 16, height: 16, size: 16 },
};

const LEGACY_COLOR_TO_CHAR = new Map(
	Object.entries(PALETTE)
		.filter(([, color]) => color !== "transparent")
		.map(([char, color]) => [color.toLowerCase(), char]),
);

export function getCategoryDimensions(category: SpriteCategory): CanonicalSpriteDimensions {
	return CATEGORY_DIMENSIONS[category];
}

export function isLegacySprite(sprite: SpriteDef | SPDSLSprite): sprite is SpriteDef {
	return "frames" in sprite && "size" in sprite;
}

function resolveGrid(grid: string[][], frameIndex: number): string[] {
	if (grid.length === 0) return [];
	if (Array.isArray(grid[0]) && typeof grid[0] !== "string") {
		return ((grid as unknown as string[][][])[frameIndex] ??
			(grid as unknown as string[][][])[0] ??
			[]) as string[];
	}
	return grid as unknown as string[];
}

function translateSPDSLChar(char: string, paletteName: string): string {
	if (char === "0" || char === ".") return ".";
	const color = PALETTES[paletteName]?.[char];
	if (!color || color === "transparent") return ".";
	return LEGACY_COLOR_TO_CHAR.get(color.toLowerCase()) ?? "#";
}

function composeSPDSLFrame(
	layers: SpriteLayer[],
	paletteName: string,
	dimensions: CanonicalSpriteDimensions,
	frameIndex: number,
	overrides?: Record<string, { grid: string[][] }>,
): string[] {
	const buffer = Array.from({ length: dimensions.height }, () => Array(dimensions.width).fill("."));
	const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

	for (const layer of sortedLayers) {
		const grid = overrides?.[layer.id]?.grid ?? layer.grid;
		const rows = resolveGrid(grid, frameIndex);
		const offX = layer.offset?.[0] ?? 0;
		const offY = layer.offset?.[1] ?? 0;

		for (let y = 0; y < rows.length; y++) {
			const row = rows[y] ?? "";
			for (let x = 0; x < row.length; x++) {
				const px = x + offX;
				const py = y + offY;
				if (px < 0 || py < 0 || px >= dimensions.width || py >= dimensions.height) continue;
				const translated = translateSPDSLChar(row[x], paletteName);
				if (translated !== ".") {
					buffer[py][px] = translated;
				}
			}
		}
	}

	return buffer.map((row) => row.join(""));
}

export function materializeSpriteToLegacy(
	sprite: SpriteDef | SPDSLSprite,
	dimensions: CanonicalSpriteDimensions,
): SpriteDef {
	if (isLegacySprite(sprite)) {
		return sprite;
	}

	const frames: Record<string, string[][]> = {};
	const baseFrame = composeSPDSLFrame(sprite.layers, sprite.palette, dimensions, 0);

	frames.idle = sprite.animations?.idle?.length
		? sprite.animations.idle.map((frame, index) =>
				composeSPDSLFrame(sprite.layers, sprite.palette, dimensions, index, frame.layerOverrides),
			)
		: [baseFrame];

	for (const [animName, animFrames] of Object.entries(sprite.animations ?? {})) {
		if (animName === "idle") continue;
		frames[animName] = animFrames.map((frame, index) =>
			composeSPDSLFrame(sprite.layers, sprite.palette, dimensions, index, frame.layerOverrides),
		);
	}

	return {
		size: dimensions.size,
		frames,
	};
}

export function getMaterializedDimensions(
	category: SpriteCategory,
	_sprite: SpriteDef | SPDSLSprite,
): CanonicalSpriteDimensions {
	return getCategoryDimensions(category);
}
