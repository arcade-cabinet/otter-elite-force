import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { Plugin } from "vite";
import { generateAtlas } from "./atlas";
import { parseSpriteFile } from "./parser";
import type { AtlasResult, Rect, SpriteDefinition } from "./types";

/** Category names for atlas grouping */
export const SPRITE_CATEGORIES = ["units", "buildings", "terrain", "portraits", "misc"] as const;
export type SpriteCategory = (typeof SPRITE_CATEGORIES)[number];

/** Categorized file paths */
export type CategorizedSprites = Record<SpriteCategory, string[]>;

/** Atlas manifest: one atlas per category */
export type AtlasManifest = Record<SpriteCategory, AtlasResult>;

/** Virtual module prefix for atlas imports */
const VIRTUAL_PREFIX = "virtual:sprite-atlas/";

/**
 * Categorize .sprite file paths by their parent directory name.
 * Files not in a recognized subdirectory go into "misc".
 */
export function categorizeSprites(files: string[]): CategorizedSprites {
	const result: CategorizedSprites = {
		units: [],
		buildings: [],
		terrain: [],
		portraits: [],
		misc: [],
	};

	for (const file of files) {
		const parts = file.split(sep);
		// Find the parent directory name
		const parentDir = parts.length >= 2 ? parts[parts.length - 2] : "";

		if (parentDir === "units") result.units.push(file);
		else if (parentDir === "buildings") result.buildings.push(file);
		else if (parentDir === "terrain") result.terrain.push(file);
		else if (parentDir === "portraits") result.portraits.push(file);
		else result.misc.push(file);
	}

	return result;
}

/**
 * Build atlas manifest: parse all .sprite files, compile each category
 * into a single texture atlas with frame rects.
 */
export function buildAtlasManifest(files: string[], scale: number): AtlasManifest {
	const categories = categorizeSprites(files);
	const manifest = {} as AtlasManifest;

	for (const category of SPRITE_CATEGORIES) {
		const defs: SpriteDefinition[] = [];
		for (const file of categories[category]) {
			const content = readFileSync(file, "utf-8");
			defs.push(parseSpriteFile(content));
		}

		if (defs.length === 0) {
			// Empty atlas for categories with no sprites
			manifest[category] = {
				image: new ImageData(1, 1),
				frames: {},
			};
		} else {
			manifest[category] = generateAtlas(defs, scale);
		}
	}

	return manifest;
}

/**
 * Recursively find all .sprite files under a directory.
 */
function findSpriteFiles(dir: string): string[] {
	const results: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) results.push(...findSpriteFiles(full));
		else if (entry.endsWith(".sprite")) results.push(full);
	}
	return results;
}

/**
 * Serialize an AtlasResult into a JSON-safe format.
 * ImageData is converted to a base64-encoded PNG data URL
 * using raw RGBA pixel data (consumers decode on load).
 */
function serializeAtlasResult(atlas: AtlasResult): {
	width: number;
	height: number;
	data: number[];
	frames: Record<string, Rect>;
} {
	return {
		width: atlas.image.width,
		height: atlas.image.height,
		data: Array.from(atlas.image.data),
		frames: atlas.frames,
	};
}

/**
 * Vite plugin that pre-compiles .sprite files into texture atlases at build time.
 *
 * Provides virtual modules:
 *   import atlas from 'virtual:sprite-atlas/units'
 *   import atlas from 'virtual:sprite-atlas/buildings'
 *   import atlas from 'virtual:sprite-atlas/terrain'
 *   import atlas from 'virtual:sprite-atlas/portraits'
 *   import atlas from 'virtual:sprite-atlas/misc'
 *   import manifest from 'virtual:sprite-atlas/manifest'
 *
 * Each atlas module exports: { width, height, data: number[], frames: Record<string, Rect> }
 * The manifest module exports all category names and frame keys for BootScene registration.
 */
export function spritePlugin(options?: { scale?: number; assetsDir?: string }): Plugin {
	const scale = options?.scale ?? 2;
	const assetsDir = options?.assetsDir ?? "src/sprites/assets";
	let manifest: AtlasManifest | null = null;
	let projectRoot = "";

	return {
		name: "sprite-atlas",
		enforce: "pre",

		configResolved(config) {
			projectRoot = config.root;
		},

		buildStart() {
			const assetsPath = join(projectRoot, assetsDir);
			const files = findSpriteFiles(assetsPath);
			manifest = buildAtlasManifest(files, scale);

			const totalFrames = Object.values(manifest).reduce(
				(sum, atlas) => sum + Object.keys(atlas.frames).length,
				0,
			);
			console.log(
				`[sprite-atlas] Compiled ${files.length} sprites into ${SPRITE_CATEGORIES.length} atlases (${totalFrames} frames, scale ${scale}x)`,
			);
		},

		resolveId(id) {
			if (id.startsWith(VIRTUAL_PREFIX)) {
				return `\0${id}`;
			}
		},

		load(id) {
			if (!id.startsWith(`\0${VIRTUAL_PREFIX}`)) return;
			if (!manifest) return;

			const category = id.slice(`\0${VIRTUAL_PREFIX}`.length);

			if (category === "manifest") {
				// Export frame keys per category for BootScene texture registration
				const manifestData: Record<string, string[]> = {};
				for (const cat of SPRITE_CATEGORIES) {
					manifestData[cat] = Object.keys(manifest[cat].frames);
				}
				return `export default ${JSON.stringify(manifestData)};`;
			}

			if (SPRITE_CATEGORIES.includes(category as SpriteCategory)) {
				const atlas = manifest[category as SpriteCategory];
				const serialized = serializeAtlasResult(atlas);
				return `export default ${JSON.stringify(serialized)};`;
			}
		},
	};
}
