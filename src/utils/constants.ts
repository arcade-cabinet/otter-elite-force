/**
 * Global game configuration constants.
 */
export const GAME_CONFIG = {
	/** Size of a single world chunk in units. */
	CHUNK_SIZE: 100,

	/** Number of chunks to render around the player. */
	RENDER_DISTANCE: 3,

	/** Fog density settings. */
	FOG: {
		NEAR: 50,
		FAR: 250,
		COLOR: "#e0e0e0", // Bleached Ektachrome white
	},

	/** Physics constants. */
	PHYSICS: {
		GRAVITY: -9.81,
		PLAYER_SPEED: 5.0,
		CLIMB_SPEED: 3.0,
		JUMP_FORCE: 5.0,
	},

	/** Tactical suppression settings. */
	SUPPRESSION: {
		RADIUS: 5.0,
		MAX_EFFECT: 0.5, // Reduction in speed
	},

	/** persistence keys. */
	STORAGE_KEYS: {
		GAME_SAVE: "otter_elite_force_save",
	},
} as const;

export type GameConfig = typeof GAME_CONFIG;
