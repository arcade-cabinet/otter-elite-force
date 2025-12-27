/**
 * Game Constants
 * Central location for all game configuration values
 */

export const GAME_CONFIG = {
	// Player settings
	PLAYER_HEALTH: 100,
	PLAYER_SPEED: 14,
	PLAYER_STRAFE_SPEED: 8,

	// Camera settings
	CAMERA_DISTANCE: 20,
	CAMERA_DISTANCE_ZOOM: 10,
	CAMERA_HEIGHT: 12,

	// Combat settings
	FIRE_RATE: 0.1, // seconds between shots
	BULLET_SPEED: 80,
	BULLET_DAMAGE: 1,

	// Enemy settings
	ENEMY_SPAWN_DISTANCE: 50,
	ENEMY_LIGHT_HP: 3,
	ENEMY_HEAVY_HP: 8,
	ENEMY_LIGHT_SPEED: 7,
	ENEMY_HEAVY_SPEED: 4,
} as const;

export const LEVELS = [
	{
		id: 0,
		title: "PERIMETER BREACH",
		desc: "Iron Scale scouts have been spotted near the Mekong entrance. Clear the way for the platoon.",
		goal: 5,
		enemies: 8,
		sky: "#ffaa55", // Golden Hour
		fog: "#ffcc88",
		waterColor: "#1e3a5f",
		difficulty: "EASY",
	},
	{
		id: 1,
		title: "INDUSTRIAL SLUDGE",
		desc: "The Dominion is pumping toxic waste into the delta. Destroy the mechanized cleanup crews.",
		goal: 10,
		enemies: 15,
		sky: "#4a5a4a", // Sickly green/grey
		fog: "#2a3a2a",
		waterColor: "#1a2a1a", // Oily water
		difficulty: "MEDIUM",
	},
	{
		id: 2,
		title: "THE CLAM VAULT",
		desc: "Final stand. The Iron Scale Elite are guarding the Primal Clams. Do not fail, Bubbles.",
		goal: 15,
		enemies: 25,
		sky: "#1a002a", // Deep purple/night
		fog: "#0a001a",
		waterColor: "#050010",
		difficulty: "HARD",
	},
] as const;

export const RANKS = ["PUP", "ENSIGN", "LIEUTENANT", "COMMANDER", "ADMIRAL"] as const;

export const STORAGE_KEY = "otter_v8";
