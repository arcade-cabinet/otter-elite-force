/**
 * Aseprite Atlas Adapter for LittleJS tile() system.
 *
 * Parses Aseprite JSON+PNG sprite atlases and produces LittleJS TileInfo objects
 * that drawTile() can use directly. Handles animation cycling based on elapsed time.
 *
 * The atlas PNGs are loaded by LittleJS engineInit() as texture images at indices
 * 0..N matching ATLAS_ORDER. This adapter maps entity types to their correct
 * texture + frame rect for any animation tag and elapsed time.
 *
 * Usage:
 *   await initAtlasAdapter();                           // call in gameInit
 *   const ti = getEntityTileInfo('mudfoot', 'Idle', elapsedMs);
 *   if (ti) ljs.drawTile(pos, size, ti);               // renders the correct sprite frame
 */

import type { TileInfo } from "littlejsengine";

/** Aseprite JSON atlas format. */
interface AsepriteFrame {
	frame: { x: number; y: number; w: number; h: number };
	duration: number;
}

interface AsepriteTag {
	name: string;
	from: number;
	to: number;
	direction: string;
}

interface AsepriteAtlas {
	frames: Record<string, AsepriteFrame>;
	meta: {
		frameTags?: AsepriteTag[];
		size: { w: number; h: number };
	};
}

/** Parsed animation: array of frame rects with durations. */
interface AnimationData {
	frames: Array<{
		x: number;
		y: number;
		w: number;
		h: number;
		durationMs: number;
	}>;
	totalDurationMs: number;
}

/** Full atlas data: all animations for one animal sprite sheet. */
interface AtlasData {
	textureIndex: number;
	animations: Map<string, AnimationData>;
	frameW: number;
	frameH: number;
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

const atlasDataMap = new Map<string, AtlasData>();
let initialized = false;

/** Cached LittleJS module reference, set during initAtlasAdapter. */
let ljsRef: typeof import("littlejsengine") | null = null;

/**
 * The order in which atlas PNGs are passed to engineInit imageSources.
 * This MUST match the order in tacticalRuntime.ts engineInit call.
 */
const ATLAS_ORDER = [
	"otter",
	"crocodile",
	"boar",
	"cobra",
	"fox",
	"hedgehog",
	"naked_mole_rat",
	"porcupine",
	"skunk",
	"snake",
	"squirrel",
	"vulture",
] as const;

type AnimalName = (typeof ATLAS_ORDER)[number];

/**
 * Entity type -> animal sprite mapping.
 */
const ENTITY_ANIMAL_MAP: Record<string, { animal: AnimalName; defaultAnim: string }> = {
	// OEF units
	river_rat: { animal: "otter", defaultAnim: "Idle" },
	mudfoot: { animal: "otter", defaultAnim: "Idle" },
	shellcracker: { animal: "otter", defaultAnim: "Idle" },
	sapper: { animal: "otter", defaultAnim: "Idle" },
	raftsman: { animal: "otter", defaultAnim: "Idle" },
	mortar_otter: { animal: "otter", defaultAnim: "Idle" },
	diver: { animal: "otter", defaultAnim: "Idle" },
	// OEF heroes
	col_bubbles: { animal: "otter", defaultAnim: "Idle" },
	gen_whiskers: { animal: "otter", defaultAnim: "Idle" },
	cpl_splash: { animal: "otter", defaultAnim: "Idle" },
	sgt_fang: { animal: "otter", defaultAnim: "Idle" },
	medic_marina: { animal: "otter", defaultAnim: "Idle" },
	pvt_muskrat: { animal: "otter", defaultAnim: "Idle" },
	// Scale-Guard
	gator: { animal: "crocodile", defaultAnim: "Idle" },
	croc_champion: { animal: "crocodile", defaultAnim: "Idle" },
	snapper: { animal: "crocodile", defaultAnim: "Idle" },
	viper: { animal: "snake", defaultAnim: "Idle" },
	skink: { animal: "snake", defaultAnim: "Idle" },
	scout_lizard: { animal: "cobra", defaultAnim: "Idle" },
	siphon_drone: { animal: "cobra", defaultAnim: "Idle" },
	serpent_king: { animal: "cobra", defaultAnim: "Idle" },
	kommandant_ironjaw: { animal: "crocodile", defaultAnim: "Idle" },
	// Neutrals
	bandit_boar: { animal: "boar", defaultAnim: "Idle" },
	wild_fox: { animal: "fox", defaultAnim: "Idle" },
};

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function parseAsepriteAtlas(data: AsepriteAtlas): {
	animations: Map<string, AnimationData>;
	frameW: number;
	frameH: number;
} {
	const allFrameEntries = Object.values(data.frames);
	const animations = new Map<string, AnimationData>();

	const firstFrame = allFrameEntries[0];
	const frameW = firstFrame?.frame.w ?? 32;
	const frameH = firstFrame?.frame.h ?? 32;

	if (data.meta.frameTags && data.meta.frameTags.length > 0) {
		for (const tag of data.meta.frameTags) {
			const frames: AnimationData["frames"] = [];
			let totalMs = 0;
			for (let i = tag.from; i <= tag.to; i++) {
				const entry = allFrameEntries[i];
				if (!entry) continue;
				const dur = entry.duration || 100;
				frames.push({
					x: entry.frame.x,
					y: entry.frame.y,
					w: entry.frame.w,
					h: entry.frame.h,
					durationMs: dur,
				});
				totalMs += dur;
			}
			if (frames.length > 0) {
				animations.set(tag.name, { frames, totalDurationMs: totalMs });
			}
		}
	} else {
		// No tags: treat all frames as a single "Idle" animation
		const frames: AnimationData["frames"] = [];
		let totalMs = 0;
		for (const entry of allFrameEntries) {
			const dur = entry.duration || 100;
			frames.push({
				x: entry.frame.x,
				y: entry.frame.y,
				w: entry.frame.w,
				h: entry.frame.h,
				durationMs: dur,
			});
			totalMs += dur;
		}
		if (frames.length > 0) {
			animations.set("Idle", { frames, totalDurationMs: totalMs });
		}
	}

	return { animations, frameW, frameH };
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

const BASE = import.meta.env.BASE_URL ?? "./";

/**
 * Initialize the atlas adapter by fetching all Aseprite JSON files and
 * caching a reference to the LittleJS module for TileInfo creation.
 *
 * Call once during gameInit, after engineInit has loaded the textures.
 */
export async function initAtlasAdapter(): Promise<void> {
	if (initialized) return;

	// Cache LittleJS module reference for TileInfo creation
	ljsRef = await import("littlejsengine");

	const results = await Promise.allSettled(
		ATLAS_ORDER.map(async (name, index) => {
			const url = `${BASE}assets/sprites/${name}.json`;
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Failed to fetch atlas JSON: ${url} (${response.status})`);
			}
			const data: AsepriteAtlas = await response.json();
			const { animations, frameW, frameH } = parseAsepriteAtlas(data);

			atlasDataMap.set(name, {
				textureIndex: index,
				animations,
				frameW,
				frameH,
			});
		}),
	);

	for (let i = 0; i < results.length; i++) {
		if (results[i].status === "rejected") {
			console.error(
				`[atlasAdapter] Failed to load atlas "${ATLAS_ORDER[i]}":`,
				(results[i] as PromiseRejectedResult).reason,
			);
		}
	}

	initialized = true;
}

// ---------------------------------------------------------------------------
// Frame resolution
// ---------------------------------------------------------------------------

/**
 * Given an animation and elapsed time, resolve which frame index to display.
 * Respects per-frame durations from Aseprite.
 */
function resolveFrameIndex(anim: AnimationData, elapsedMs: number): number {
	if (anim.frames.length <= 1) return 0;

	const loopedMs = elapsedMs % anim.totalDurationMs;
	let accumulated = 0;
	for (let i = 0; i < anim.frames.length; i++) {
		accumulated += anim.frames[i].durationMs;
		if (loopedMs < accumulated) return i;
	}
	return anim.frames.length - 1;
}

/**
 * Resolve animation name with fallbacks.
 */
function resolveAnimation(
	atlas: AtlasData,
	requested: string,
	defaultAnim: string,
): AnimationData | null {
	return (
		atlas.animations.get(requested) ??
		atlas.animations.get(defaultAnim) ??
		atlas.animations.get("Idle") ??
		atlas.animations.values().next().value ??
		null
	);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a LittleJS TileInfo for an entity type at a specific animation and time.
 *
 * Uses the cached LittleJS module from initAtlasAdapter() to construct TileInfo
 * objects with proper Vector2 positions from Aseprite frame data.
 *
 * @param entityType - Game entity type ID (e.g. "mudfoot", "gator")
 * @param animation - Animation tag name (e.g. "Idle", "Run", "Attack")
 * @param elapsedMs - Elapsed time for animation cycling
 * @returns TileInfo object for drawTile(), or null if no atlas available
 */
export function getEntityTileInfo(
	entityType: string,
	animation: string,
	elapsedMs: number,
): TileInfo | null {
	if (!ljsRef) return null;

	const mapping = ENTITY_ANIMAL_MAP[entityType];
	if (!mapping) return null;

	const atlas = atlasDataMap.get(mapping.animal);
	if (!atlas) return null;

	const anim = resolveAnimation(atlas, animation, mapping.defaultAnim);
	if (!anim || anim.frames.length === 0) return null;

	const frameIdx = resolveFrameIndex(anim, elapsedMs);
	const frame = anim.frames[frameIdx];

	// Get the texture info loaded by engineInit for this atlas index
	const textureInfo = ljsRef.textureInfos[atlas.textureIndex];
	if (!textureInfo) return null;

	// Create TileInfo with pixel position and size within the sprite sheet
	return new ljsRef.TileInfo(
		ljsRef.vec2(frame.x, frame.y),
		ljsRef.vec2(frame.w, frame.h),
		textureInfo,
		0, // no padding
		0, // no bleed
	);
}

/**
 * Get the frame size in world units (tiles) for rendering an entity sprite.
 *
 * @param entityType - Game entity type ID
 * @param scale - Scale multiplier (default 1.0)
 * @returns Size in tile units for drawTile, or null if no atlas
 */
export function getEntityDrawSize(
	entityType: string,
	scale = 1.0,
): { x: number; y: number } | null {
	const mapping = ENTITY_ANIMAL_MAP[entityType];
	if (!mapping) return null;

	const atlas = atlasDataMap.get(mapping.animal);
	if (!atlas) return null;

	// Target: sprites ~1.2 tiles tall, maintaining aspect ratio
	const targetTilesH = 1.2 * scale;
	const aspect = atlas.frameW / atlas.frameH;
	return {
		x: targetTilesH * aspect,
		y: targetTilesH,
	};
}

/**
 * Get all animation tag names available for an entity type.
 */
export function getEntityAnimationNames(entityType: string): string[] {
	const mapping = ENTITY_ANIMAL_MAP[entityType];
	if (!mapping) return [];

	const atlas = atlasDataMap.get(mapping.animal);
	if (!atlas) return [];

	return [...atlas.animations.keys()];
}

/**
 * Check if the atlas adapter has been initialized.
 */
export function isAtlasAdapterReady(): boolean {
	return initialized;
}

/**
 * Get the animal name for an entity type.
 */
export function getEntityAnimal(entityType: string): string | null {
	return ENTITY_ANIMAL_MAP[entityType]?.animal ?? null;
}

/**
 * Get the texture index for an animal.
 */
export function getAnimalTextureIndex(animal: string): number | null {
	const atlas = atlasDataMap.get(animal);
	return atlas?.textureIndex ?? null;
}
