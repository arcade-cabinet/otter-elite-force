/**
 * Sprite Mapping — maps every unit and building type to its sprite atlas.
 *
 * Available animal sprite atlases (from public/assets/sprites/):
 *   otter      — OEF units and heroes (Idle, Idle Alt, Run, Jump, Land, Sleep, Spin)
 *   crocodile  — Scale-Guard heavy units (Idle, Movement, Attack, Damage, Death, Water variants)
 *   snake      — Scale-Guard ranged/scouts (Idle, Slither, Strike, Coil, Lunge, etc.)
 *   cobra      — Scale-Guard tech/bosses (Idle, Slither, Spit, Strike, Hurt)
 *   boar       — Neutral wildlife (Idle, Walk, Run, Attack, Charge, Dig, Eat, etc.)
 *   fox        — Available for specialist OEF units (Idle, Run, Attack, Pounce, etc.)
 *   squirrel   — Available for specialist OEF units (Idle, Run, Attack, Gather, Jump)
 *   hedgehog   — Available for defensive OEF units (Idle, Walk, Curl, Roll)
 *   vulture    — Neutral/aerial units (Fly, Dive, Peck, Perch)
 *   porcupine  — Available (Idle, Walk, QuillShot, Hurt, Death)
 *   skunk      — Available (Idle, Walk, Attack, Spray, Hurt)
 *   naked_mole_rat — Available (Idle, Walk, Attack, Dig, Burrow, Emerge, Hurt, Death)
 *
 * NO FALLBACK for units: if a unit type has no sprite mapping, getSpriteForUnit() throws.
 * Buildings return null if they use shape rendering (most buildings are tile-based, not atlas-based).
 */

export interface SpriteMapping {
	atlas: string;
	defaultAnim: string;
}

// ---------------------------------------------------------------------------
// Unit Sprite Map
// ---------------------------------------------------------------------------

const UNIT_SPRITE_MAP: Record<string, SpriteMapping> = {
	// OEF units — all otters with different animations
	river_rat: { atlas: "otter", defaultAnim: "Otter Idle" },
	mudfoot: { atlas: "otter", defaultAnim: "Otter Idle" },
	shellcracker: { atlas: "otter", defaultAnim: "Otter Idle" },
	sapper: { atlas: "otter", defaultAnim: "Otter Idle" },
	raftsman: { atlas: "otter", defaultAnim: "Otter Idle" },
	mortar_otter: { atlas: "otter", defaultAnim: "Otter Idle" },
	diver: { atlas: "otter", defaultAnim: "Otter Idle" },

	// OEF heroes — all otters
	col_bubbles: { atlas: "otter", defaultAnim: "Otter Idle" },
	gen_whiskers: { atlas: "otter", defaultAnim: "Otter Idle" },
	cpl_splash: { atlas: "otter", defaultAnim: "Otter Idle" },
	sgt_fang: { atlas: "otter", defaultAnim: "Otter Idle" },
	medic_marina: { atlas: "otter", defaultAnim: "Otter Idle" },
	pvt_muskrat: { atlas: "otter", defaultAnim: "Otter Idle" },

	// Scale-Guard units
	gator: { atlas: "crocodile", defaultAnim: "Crocodile Sprite Sheet Idle" },
	croc_champion: { atlas: "crocodile", defaultAnim: "Crocodile Sprite Sheet Idle" },
	snapper: { atlas: "crocodile", defaultAnim: "Crocodile Sprite Sheet Idle" },
	viper: { atlas: "snake", defaultAnim: "Snake Idle" },
	skink: { atlas: "snake", defaultAnim: "Snake Idle" },
	scout_lizard: { atlas: "cobra", defaultAnim: "Cobra Idle" },
	siphon_drone: { atlas: "cobra", defaultAnim: "Cobra Idle" },
	serpent_king: { atlas: "cobra", defaultAnim: "Cobra Idle" },

	// Neutral units
	civilian_otter: { atlas: "otter", defaultAnim: "Otter Idle" },
	wild_boar: { atlas: "boar", defaultAnim: "Boar Idle" },
	scavenger_vulture: { atlas: "vulture", defaultAnim: "Vulture Perch" },
};

// ---------------------------------------------------------------------------
// Building Sprite Map
// ---------------------------------------------------------------------------

/**
 * Buildings primarily use tile-based sprites loaded from the tile manifest.
 * The atlas mapping here is null for most buildings, meaning they use
 * the tile system (or shape rendering if tile is missing).
 *
 * A null return from getSpriteForBuilding means "use tile/shape rendering."
 */
const BUILDING_SPRITE_MAP: Record<string, SpriteMapping | null> = {
	// URA buildings — all tile-based
	burrow: null,
	command_post: null,
	barracks: null,
	armory: null,
	watchtower: null,
	fish_trap: null,
	dock: null,
	field_hospital: null,
	sandbag_wall: null,
	stone_wall: null,
	gun_tower: null,
	minefield: null,

	// Scale-Guard buildings — all tile-based
	flag_post: null,
	spawning_pool: null,
	fuel_tank: null,
	venom_spire: null,
	scale_wall: null,
	siphon: null,
	sludge_pit: null,
	great_siphon: null,
	shield_generator: null,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the sprite atlas mapping for a unit type.
 * THROWS if no mapping exists — no fallback.
 */
export function getSpriteForUnit(unitId: string): SpriteMapping {
	const mapping = UNIT_SPRITE_MAP[unitId];
	if (!mapping) {
		throw new Error(
			`getSpriteForUnit: no sprite mapping for unit '${unitId}'. ` +
				`Available: ${Object.keys(UNIT_SPRITE_MAP).join(", ")}`,
		);
	}
	return mapping;
}

/**
 * Get the sprite atlas mapping for a building type.
 * Returns null if the building uses tile/shape rendering (most buildings).
 */
export function getSpriteForBuilding(buildingId: string): SpriteMapping | null {
	if (!(buildingId in BUILDING_SPRITE_MAP)) {
		throw new Error(
			`getSpriteForBuilding: unknown building '${buildingId}'. ` +
				`Available: ${Object.keys(BUILDING_SPRITE_MAP).join(", ")}`,
		);
	}
	return BUILDING_SPRITE_MAP[buildingId];
}

/**
 * Check if a unit type has a sprite mapping.
 * Useful for validation without throwing.
 */
export function hasUnitSprite(unitId: string): boolean {
	return unitId in UNIT_SPRITE_MAP;
}

/**
 * Check if a building type has a sprite mapping entry.
 */
export function hasBuildingSprite(buildingId: string): boolean {
	return buildingId in BUILDING_SPRITE_MAP;
}
