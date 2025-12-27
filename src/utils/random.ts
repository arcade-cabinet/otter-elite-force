/**
 * Creates a deterministic pseudo-random number generator.
 * @param seed The seed value to start with.
 * @param offset An optional offset to the seed.
 * @returns A function that returns a pseudo-random number between 0 and 1.
 */
export function createSeededRandom(seed: number, offset = 0) {
	let s = seed + offset;
	return () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
}
