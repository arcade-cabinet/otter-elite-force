/**
 * Noise utility — deterministic pseudo-random number generator.
 *
 * Two usage patterns:
 *
 * 1. DESIGN noise — seeded by entity/asset ID for consistent visual decoration.
 *    Used by spriteGen for building texture dots, terrain painter for terrain
 *    variation. Same seed → same output every time. This is cosmetic.
 *
 *    const rng = createNoise(hashString("lodge"));
 *    for (let i = 0; i < 20; i++) px(rng.next() * 24, rng.next() * 12);
 *
 * 2. GAMEPLAY noise — seeded by GameClock.tick for runtime randomness.
 *    Used for loot drops, patrol path variance, wave composition, encounter
 *    rolls. Same tick → same outcome (deterministic replays possible).
 *
 *    const rng = createNoise(world.get(GameClock).tick);
 *    const shouldDrop = rng.next() < 0.3; // 30% chance
 */

export interface Noise {
	/** Returns a value in [0, 1). */
	next(): number;
	/** Returns an integer in [min, max]. */
	int(min: number, max: number): number;
	/** Returns true with the given probability [0, 1]. */
	chance(probability: number): boolean;
	/** Pick a random element from an array. */
	pick<T>(arr: readonly T[]): T;
}

/**
 * Create a deterministic noise generator from a numeric seed.
 * Uses a simple LCG (linear congruential generator) — fast, small, deterministic.
 */
export function createNoise(seed: number): Noise {
	let state = Math.abs(seed) || 1;

	function next(): number {
		state = (state * 16807 + 0) % 2147483647;
		return (state - 1) / 2147483646;
	}

	return {
		next,
		int(min: number, max: number): number {
			return min + Math.floor(next() * (max - min + 1));
		},
		chance(probability: number): boolean {
			return next() < probability;
		},
		pick<T>(arr: readonly T[]): T {
			return arr[Math.floor(next() * arr.length)];
		},
	};
}

/**
 * Hash a string to a numeric seed.
 * Use for entity-type-based design noise: `createNoise(hashString("lodge"))`.
 */
export function hashString(s: string): number {
	let hash = 0;
	for (let i = 0; i < s.length; i++) {
		hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
	}
	return Math.abs(hash) || 1;
}
