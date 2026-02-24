/**
 * Game Constants
 * Grounded 1960s Riverine Warfare aesthetic - Open World Design
 */

export const GAME_CONFIG = {
	PLAYER_HEALTH: 100,
	PLAYER_SPEED: 14,
	PLAYER_STRAFE_SPEED: 8,
	CAMERA_DISTANCE: 20,
	CAMERA_DISTANCE_ZOOM: 10,
	CAMERA_HEIGHT: 12,
	FIRE_RATE: 0.12,
	BULLET_SPEED: 90,
	BULLET_DAMAGE: 1,
	ENEMY_SPAWN_DISTANCE: 60,
	ENEMY_LIGHT_HP: 3,
	ENEMY_HEAVY_HP: 10,
	ENEMY_LIGHT_SPEED: 6,
	ENEMY_HEAVY_SPEED: 3.5,
	CHUNK_SIZE: 100,
	MAX_CHUNK_CACHE: 50,
} as const;

// Export CHUNK_SIZE for easier access
export const CHUNK_SIZE = GAME_CONFIG.CHUNK_SIZE;

/**
 * Difficulty Mode Order (for escalation logic)
 * Single source of truth for difficulty hierarchy.
 * Difficulty can go UP but NEVER DOWN (escalation only).
 */
export const DIFFICULTY_ORDER = ["SUPPORT", "TACTICAL", "ELITE"] as const;

/**
 * Difficulty Mode Configurations
 * Difficulty can go UP but NEVER DOWN (escalation only)
 */
export const DIFFICULTY_CONFIGS = {
	SUPPORT: {
		mode: "SUPPORT" as const,
		displayName: "SUPPORT",
		description: "Supply drops available anywhere. Extract from any coordinate.",
		supplyDropsAnywhere: true,
		extractionAnywhere: true,
		fallThreshold: 0, // No fall mechanic
		permadeath: false,
		enemyDamageMultiplier: 0.75,
		enemyDensityMultiplier: 0.6,
		xpMultiplier: 0.75,
	},
	TACTICAL: {
		mode: "TACTICAL" as const,
		displayName: "TACTICAL",
		description: "The Fall triggers at 30% HP. Must return to LZ for extraction.",
		supplyDropsAnywhere: false,
		extractionAnywhere: false,
		fallThreshold: 30, // Fall triggers at 30% HP
		permadeath: false,
		enemyDamageMultiplier: 1.0,
		enemyDensityMultiplier: 1.0,
		xpMultiplier: 1.0,
	},
	ELITE: {
		mode: "ELITE" as const,
		displayName: "ELITE",
		description: "Permadeath. One death ends your campaign entirely.",
		supplyDropsAnywhere: false,
		extractionAnywhere: false,
		fallThreshold: 0, // No fall, just death
		permadeath: true,
		enemyDamageMultiplier: 1.25,
		enemyDensityMultiplier: 1.5,
		xpMultiplier: 1.5,
	},
} as const;

/**
 * Victory Conditions
 * Three verticals for diverse gameplay
 */
export const VICTORY_CONDITIONS = {
	TERRITORY: {
		name: "TERRITORIAL DOMINANCE",
		description: "Secure enough territory by destroying siphons",
		thresholds: [5, 10, 20], // Bronze, Silver, Gold
	},
	RESCUE: {
		name: "PLATOON RESCUE",
		description: "Rescue all trapped platoon members",
		requiredRescues: 3, // Total rescuable characters
	},
	PEACEKEEPING: {
		name: "PEACEKEEPING VICTORY",
		description: "Liberate enough native villages",
		thresholds: [50, 100, 200], // Peacekeeping score thresholds
	},
} as const;

/**
 * Key Coordinates of Interest
 * Fixed locations for strategic objectives and character rescues
 */
export const KEY_COORDINATES = {
	LZ: { x: 0, z: 0, name: "Landing Zone / Base", description: "Starting point, extraction hub" },
	PRISON_CAMP: {
		x: 5,
		z: 5,
		name: "Prison Camp",
		description: "GEN. WHISKERS rescue location",
		unlocks: "whiskers",
	},
	GREAT_SIPHON: {
		x: 10,
		z: -10,
		name: "The Great Siphon",
		description: "Scale-Guard HQ, boss encounter",
	},
	HEALERS_GROVE: {
		x: -15,
		z: 20,
		name: "Healer's Grove",
		description: "Peacekeeping hub, medical upgrades",
	},
	UNDERWATER_CACHE: {
		x: -10,
		z: 15,
		name: "Underwater Cache",
		description: "CPL. SPLASH rescue location",
		unlocks: "splash",
	},
	GAS_DEPOT: { x: 8, z: 8, name: "Gas Depot", description: "Strategic objective cluster" },
	FANG_STRONGHOLD: {
		x: 12,
		z: -5,
		name: "Scale-Guard Stronghold",
		description: "SGT. FANG rescue location",
		unlocks: "fang",
	},
} as const;

/**
 * Terrain Types
 * Different biomes in the Copper-Silt Reach
 */
export const TERRAIN_TYPES = {
	RIVER: {
		name: "River",
		waterColor: "#4d4233",
		fogColor: "#d4c4a8",
		skyColor: "#f0e6d2",
		enemyDensity: 0.6,
		hazardDensity: 0.3,
	},
	MARSH: {
		name: "Marsh",
		waterColor: "#2a251a",
		fogColor: "#8a7a6a",
		skyColor: "#ffccaa",
		enemyDensity: 0.8,
		hazardDensity: 0.5,
	},
	DENSE_JUNGLE: {
		name: "Dense Jungle",
		waterColor: "#3d3d29",
		fogColor: "#e0e0e0",
		skyColor: "#ffffff",
		enemyDensity: 1.0,
		hazardDensity: 0.4,
	},
} as const;

/**
 * Player Ranks
 * Progression through XP
 */
export const RANKS = ["PUP", "ENSIGN", "LIEUTENANT", "COMMANDER", "ADMIRAL"] as const;

/**
 * Save Data Storage Key
 */
export const STORAGE_KEY = "otter_v8";

// Note: UPGRADE_COSTS is defined in stores/gameData.ts as the single source of truth
// Import from there: import { UPGRADE_COSTS } from "../stores/gameData";
