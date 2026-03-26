/**
 * Atlas-based sprite system — loads purchased sprite sheets + JSON atlases.
 *
 * Replaces the procedural spriteGen for entity rendering. Each animal type
 * has a sprite sheet with multiple animation rows (Idle, Walk, Attack, etc.).
 *
 * Usage:
 *   await loadAllAtlases();  // call once at boot
 *   const frame = getSpriteFrame('otter', 'Idle', frameIndex);
 *   // frame is an HTMLCanvasElement with one animation frame
 */

// ─── Types ───

export interface AtlasFrame {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface AtlasAnimation {
	name: string;
	frames: AtlasFrame[];
}

export interface SpriteAtlas {
	image: HTMLImageElement;
	animations: Map<string, AtlasFrame[]>;
	frameW: number;
	frameH: number;
	/** Pre-sliced canvases for each animation frame: animName → frame[] */
	sliced: Map<string, HTMLCanvasElement[]>;
}

// ─── Atlas Registry ───

/** All loaded sprite atlases keyed by animal name. */
const atlasRegistry = new Map<string, SpriteAtlas>();

/** Maps entity type IDs to their base animal sprite + animation overrides. */
const entitySpriteMap = new Map<string, { animal: string; defaultAnim: string }>();

/** Tile-based sprites: single static images loaded from tile-manifest.json. */
const tileSprites = new Map<string, HTMLCanvasElement>();

/** Maps entity type IDs to tile sprite names (for buildings/resources). */
const entityTileMap = new Map<string, string>();

// ─── Atlas manifest — lists every sprite sheet to load ───

const ATLAS_MANIFEST: Array<{ name: string; png: string; json: string }> = [
	{ name: "otter", png: "/assets/sprites/otter.png", json: "/assets/sprites/otter.json" },
	{ name: "crocodile", png: "/assets/sprites/crocodile.png", json: "/assets/sprites/crocodile.json" },
	{ name: "boar", png: "/assets/sprites/boar.png", json: "/assets/sprites/boar.json" },
	{ name: "cobra", png: "/assets/sprites/cobra.png", json: "/assets/sprites/cobra.json" },
	{ name: "fox", png: "/assets/sprites/fox.png", json: "/assets/sprites/fox.json" },
	{ name: "hedgehog", png: "/assets/sprites/hedgehog.png", json: "/assets/sprites/hedgehog.json" },
	{ name: "naked_mole_rat", png: "/assets/sprites/naked_mole_rat.png", json: "/assets/sprites/naked_mole_rat.json" },
	{ name: "porcupine", png: "/assets/sprites/porcupine.png", json: "/assets/sprites/porcupine.json" },
	{ name: "skunk", png: "/assets/sprites/skunk.png", json: "/assets/sprites/skunk.json" },
	{ name: "snake", png: "/assets/sprites/snake.png", json: "/assets/sprites/snake.json" },
	{ name: "squirrel", png: "/assets/sprites/squirrel.png", json: "/assets/sprites/squirrel.json" },
	{ name: "vulture", png: "/assets/sprites/vulture.png", json: "/assets/sprites/vulture.json" },
];

// ─── Loading ───

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
		img.src = src;
	});
}

interface AsepriteAtlas {
	frames: Record<string, { frame: { x: number; y: number; w: number; h: number }; duration: number }>;
	meta: {
		frameTags?: Array<{ name: string; from: number; to: number; direction: string }>;
		size: { w: number; h: number };
	};
}

function parseAtlas(data: AsepriteAtlas): Map<string, AtlasFrame[]> {
	const animations = new Map<string, AtlasFrame[]>();
	const allFrames = Object.values(data.frames).map((f) => f.frame);

	if (data.meta.frameTags && data.meta.frameTags.length > 0) {
		for (const tag of data.meta.frameTags) {
			const frames: AtlasFrame[] = [];
			for (let i = tag.from; i <= tag.to; i++) {
				if (i < allFrames.length) {
					frames.push(allFrames[i]);
				}
			}
			animations.set(tag.name, frames);
		}
	} else {
		// No tags — treat each row as an animation
		animations.set("Idle", allFrames);
	}

	return animations;
}

/** Target height in pixels for rendered sprites. Maintains aspect ratio. */
const UNIT_TARGET_H = 48; // ~1.5 tiles tall — good RTS unit size

function sliceFrames(
	image: HTMLImageElement,
	animations: Map<string, AtlasFrame[]>,
	targetH: number = UNIT_TARGET_H,
): Map<string, HTMLCanvasElement[]> {
	const sliced = new Map<string, HTMLCanvasElement[]>();

	for (const [name, frames] of animations) {
		const canvases: HTMLCanvasElement[] = [];
		for (const frame of frames) {
			// Scale to target height, maintaining aspect ratio
			const scale = targetH / frame.h;
			const outW = Math.round(frame.w * scale);
			const outH = targetH;

			const canvas = document.createElement("canvas");
			canvas.width = outW;
			canvas.height = outH;
			const ctx = canvas.getContext("2d")!;
			ctx.imageSmoothingEnabled = false; // crisp pixel art
			ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, 0, 0, outW, outH);
			canvases.push(canvas);
		}
		sliced.set(name, canvases);
	}

	return sliced;
}

async function loadAtlas(entry: { name: string; png: string; json: string }): Promise<void> {
	const [image, response] = await Promise.all([
		loadImage(entry.png),
		fetch(entry.json),
	]);

	const data: AsepriteAtlas = await response.json();
	const animations = parseAtlas(data);
	const sliced = sliceFrames(image, animations);

	// Determine scaled frame size from first sliced canvas
	const firstSliced = sliced.values().next().value;
	const frameW = firstSliced?.[0]?.width ?? 32;
	const frameH = firstSliced?.[0]?.height ?? UNIT_TARGET_H;

	atlasRegistry.set(entry.name, {
		image,
		animations,
		frameW,
		frameH,
		sliced,
	});
}

/**
 * Load all sprite atlases AND tile-based building/resource sprites.
 * Call once at app boot.
 */
export async function loadAllAtlases(): Promise<void> {
	await Promise.all([
		...ATLAS_MANIFEST.map(loadAtlas),
		loadTileSprites(),
	]);
	buildEntitySpriteMap();
	buildEntityTileMap();
}

/** Load building/resource tile sprites from the tile manifest. */
async function loadTileSprites(): Promise<void> {
	try {
		const response = await fetch("/assets/tiles/tile-manifest.json");
		const manifest: Record<string, { path: string; category: string }> = await response.json();

		// Only load buildings and resources (terrain/props are used by the terrain painter)
		const toLoad = Object.entries(manifest).filter(
			([, v]) => v.category === "buildings" || v.category === "resources" || v.category === "props",
		);

		await Promise.all(
			toLoad.map(async ([name, entry]) => {
				const img = await loadImage(entry.path);
				const canvas = document.createElement("canvas");
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext("2d")!;
				ctx.imageSmoothingEnabled = false;
				ctx.drawImage(img, 0, 0);
				tileSprites.set(name, canvas);
			}),
		);
	} catch (e) {
		console.warn("[spriteAtlas] Failed to load tile manifest:", e);
	}
}

/** Map building/resource entity IDs to tile sprite names. */
function buildEntityTileMap(): void {
	entityTileMap.clear();

	// OEF buildings
	entityTileMap.set("command_post", "command_post");
	entityTileMap.set("barracks", "barracks");
	entityTileMap.set("armory", "armory");
	entityTileMap.set("watchtower", "watchtower");
	entityTileMap.set("fish_trap", "fish_trap");
	entityTileMap.set("burrow", "burrow");
	entityTileMap.set("dock", "dock");
	entityTileMap.set("field_hospital", "field_hospital");
	entityTileMap.set("sandbag_wall", "sandbag_wall");
	entityTileMap.set("stone_wall", "stone_wall");
	entityTileMap.set("gun_tower", "gun_tower");
	entityTileMap.set("minefield", "minefield");

	// Scale-Guard buildings
	entityTileMap.set("flag_post", "flag_post");
	entityTileMap.set("fuel_tank", "fuel_tank");
	entityTileMap.set("great_siphon", "great_siphon");
	entityTileMap.set("sludge_pit", "sludge_pit");
	entityTileMap.set("spawning_pool", "spawning_pool");
	entityTileMap.set("venom_spire", "venom_spire");
	entityTileMap.set("siphon", "siphon");
	entityTileMap.set("scale_wall", "scale_wall");
	entityTileMap.set("shield_generator", "shield_generator");

	// Resources
	entityTileMap.set("salvage_cache", "salvage_cache");
	entityTileMap.set("supply_crate", "supply_crate");
	entityTileMap.set("intel_marker", "intel_marker");

	// Tree/nature resources use prop tiles
	entityTileMap.set("mangrove_tree", "tree_round_lg");
	entityTileMap.set("fish_spot", "rock_crystal_1"); // blue crystal = water resource marker
}

/** Whether atlases have been loaded. */
export function atlasesLoaded(): boolean {
	return atlasRegistry.size > 0;
}

// ─── Entity → Animal mapping ───

/**
 * Maps every game entity type to its base animal sprite.
 * This is the creative heart of the visual overhaul:
 * - OEF units → otter, fox, squirrel, hedgehog
 * - Scale-Guard units → crocodile, snake, cobra, vulture
 * - Neutrals → boar, naked_mole_rat, porcupine, skunk
 */
function buildEntitySpriteMap(): void {
	entitySpriteMap.clear();

	// ─── OEF (Otter Elite Force) ───
	// Core otter units — same base sprite, different rank emblems
	entitySpriteMap.set("river_rat", { animal: "otter", defaultAnim: "Idle" });
	entitySpriteMap.set("mudfoot", { animal: "otter", defaultAnim: "Idle" });
	entitySpriteMap.set("shellcracker", { animal: "otter", defaultAnim: "Idle" });
	entitySpriteMap.set("sapper", { animal: "otter", defaultAnim: "Idle" });
	entitySpriteMap.set("raftsman", { animal: "otter", defaultAnim: "Idle" });
	entitySpriteMap.set("mortar_otter", { animal: "otter", defaultAnim: "Idle" });
	entitySpriteMap.set("diver", { animal: "otter", defaultAnim: "Idle" });

	// OEF heroes — otter base
	entitySpriteMap.set("col_bubbles", { animal: "otter", defaultAnim: "Idle" });
	entitySpriteMap.set("gen_whiskers", { animal: "otter", defaultAnim: "Idle" });
	entitySpriteMap.set("cpl_splash", { animal: "otter", defaultAnim: "Idle" });
	entitySpriteMap.set("sgt_fang", { animal: "otter", defaultAnim: "Idle" });
	entitySpriteMap.set("medic_marina", { animal: "otter", defaultAnim: "Idle" });
	entitySpriteMap.set("pvt_muskrat", { animal: "otter", defaultAnim: "Idle" });

	// OEF specialist animals
	// (fox = scouts, squirrel = engineers, hedgehog = defensive)
	// These can be added as the unit roster expands

	// ─── Scale-Guard ───
	entitySpriteMap.set("gator", { animal: "crocodile", defaultAnim: "Idle" });
	entitySpriteMap.set("croc_champion", { animal: "crocodile", defaultAnim: "Idle" });
	entitySpriteMap.set("snapper", { animal: "crocodile", defaultAnim: "Idle" });
	entitySpriteMap.set("viper", { animal: "snake", defaultAnim: "Idle" });
	entitySpriteMap.set("skink", { animal: "snake", defaultAnim: "Idle" });
	entitySpriteMap.set("scout_lizard", { animal: "cobra", defaultAnim: "Idle" });
	entitySpriteMap.set("siphon_drone", { animal: "cobra", defaultAnim: "Idle" });
	entitySpriteMap.set("serpent_king", { animal: "cobra", defaultAnim: "Idle" });

	// ─── Resources — NOT mapped here, fall through to procedural sprites ───
	// fish_spot, mangrove_tree, salvage_cache, supply_crate, intel_marker
	// keep their dedicated procedural drawing functions in spriteGen.ts
}

// ─── Public API ───

/**
 * Get a specific animation frame for an animal.
 * Returns undefined if the atlas isn't loaded or animation doesn't exist.
 */
export function getSpriteFrame(
	animal: string,
	animation: string,
	frameIndex: number,
): HTMLCanvasElement | undefined {
	const atlas = atlasRegistry.get(animal);
	if (!atlas) return undefined;

	const frames = atlas.sliced.get(animation);
	if (!frames || frames.length === 0) return undefined;

	return frames[frameIndex % frames.length];
}

/**
 * Get the idle frame (frame 0) for a game entity type.
 * This is the main entry point for EntityLayer rendering.
 *
 * Falls back through: tile sprite → atlas sprite → undefined (procedural fallback).
 */
export function getEntitySprite(entityType: string): HTMLCanvasElement | undefined {
	// Check tile-based sprites first (buildings, resources)
	const tileName = entityTileMap.get(entityType);
	if (tileName) {
		const tileCanvas = tileSprites.get(tileName);
		if (tileCanvas) return tileCanvas;
	}

	// Then check atlas-based sprites (units, heroes)
	const mapping = entitySpriteMap.get(entityType);
	if (!mapping) return undefined;

	const atlas = atlasRegistry.get(mapping.animal);
	if (!atlas) return undefined;

	// Try the mapped default animation
	const defaultFrames = atlas.sliced.get(mapping.defaultAnim);
	if (defaultFrames && defaultFrames.length > 0) return defaultFrames[0];

	// Fallback: try common animation names
	for (const name of ["Idle", "Perch", "idle"]) {
		const frames = atlas.sliced.get(name);
		if (frames && frames.length > 0) return frames[0];
	}

	// Last resort: first frame of first animation
	const first = atlas.sliced.values().next().value;
	return first?.[0];
}

/**
 * Get an animated frame for a game entity, cycling based on elapsed time.
 */
export function getEntityAnimFrame(
	entityType: string,
	animation: string,
	elapsedMs: number,
	frameDurationMs = 100,
): HTMLCanvasElement | undefined {
	const mapping = entitySpriteMap.get(entityType);
	if (!mapping) return undefined;

	const atlas = atlasRegistry.get(mapping.animal);
	if (!atlas) return undefined;

	// Try requested animation, fall back to default
	let frames = atlas.sliced.get(animation);
	if (!frames || frames.length === 0) {
		frames = atlas.sliced.get(mapping.defaultAnim);
	}
	if (!frames || frames.length === 0) return undefined;

	const frameIndex = Math.floor(elapsedMs / frameDurationMs) % frames.length;
	return frames[frameIndex];
}

/**
 * Get the frame dimensions for an entity type.
 */
export function getEntityFrameSize(entityType: string): { w: number; h: number } | undefined {
	const mapping = entitySpriteMap.get(entityType);
	if (!mapping) return undefined;

	const atlas = atlasRegistry.get(mapping.animal);
	if (!atlas) return undefined;

	return { w: atlas.frameW, h: atlas.frameH };
}

/**
 * Get all available animation names for an entity type.
 */
export function getEntityAnimations(entityType: string): string[] {
	const mapping = entitySpriteMap.get(entityType);
	if (!mapping) return [];

	const atlas = atlasRegistry.get(mapping.animal);
	if (!atlas) return [];

	return [...atlas.animations.keys()];
}

/**
 * Get the raw atlas for an animal (for advanced usage like the rank emblem system).
 */
export function getAtlas(animal: string): SpriteAtlas | undefined {
	return atlasRegistry.get(animal);
}
