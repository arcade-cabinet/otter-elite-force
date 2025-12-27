/**
 * Game Constants
 * Grounded 1960s Riverine Warfare aesthetic
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
} as const;

export const LEVELS = [
	{
		id: 0,
		title: "MUDDY CROSSING",
		desc: "High noon in the delta. Clear the Iron Scale snipers from the reeds.",
		goal: 8,
		enemies: 12,
		sky: "#f0e6d2", // Bleached sky
		fog: "#d4c4a8", // Dust/Heat haze
		waterColor: "#4d4233", // Murky silt
		difficulty: "EASY",
	},
	{
		id: 1,
		title: "THE SMOKE RUN",
		desc: "The smell of napalm is thick here. Navigate through the burnt mangroves.",
		goal: 15,
		enemies: 20,
		sky: "#ffccaa", // Fire-tinted sky
		fog: "#8a7a6a", // Smoke haze
		waterColor: "#2a251a", // Oily sludge
		difficulty: "MEDIUM",
	},
	{
		id: 2,
		title: "CLAM POINT BASE",
		desc: "The Iron Scale's forward operating base. Break their supply line.",
		goal: 25,
		enemies: 30,
		sky: "#ffffff", // Overexposed daylight
		fog: "#e0e0e0", // Heat shimmer
		waterColor: "#3d3d29", // Algae-choked
		difficulty: "HARD",
	},
] as const;

export const RANKS = ["PUP", "ENSIGN", "LIEUTENANT", "COMMANDER", "ADMIRAL"] as const;
export const STORAGE_KEY = "otter_v8";
