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
		title: "SUNRISE PATROL",
		desc: "The gators are scouting the perimeter.",
		goal: 5,
		enemies: 8,
		sky: 0xffaa55,
		fog: 0xffcc88,
	},
	{
		id: 1,
		title: "MUDDY DEPTHS",
		desc: "Heavy Gator presence detected.",
		goal: 10,
		enemies: 15,
		sky: 0x87ceeb,
		fog: 0x88ccee,
	},
	{
		id: 2,
		title: "THE HIVE",
		desc: "Eliminate the Elite Guard.",
		goal: 15,
		enemies: 20,
		sky: 0x220033,
		fog: 0x331122,
	},
] as const;

export const RANKS = ["PUP", "ENSIGN", "LIEUTENANT", "COMMANDER", "ADMIRAL"] as const;

export const STORAGE_KEY = "otter_v8";
