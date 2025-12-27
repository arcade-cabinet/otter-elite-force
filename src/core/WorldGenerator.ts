import { Vector3 } from "yuka";

/**
 * Generates a deterministic seed for a specific chunk coordinate.
 */
export function getChunkSeed(x: number, y: number): number {
	const h1 = (x * 374761393) ^ (y * 668265263);
	return (h1 ^ (h1 >>> 13)) * 12741261;
}

/**
 * Generates static entities for a chunk.
 * This is deterministic—the same chunk at the same coordinates will always
 * produce the same layout unless modified by the player.
 */
export function generateChunkContent(x: number, y: number) {
	const seed = getChunkSeed(x, y);
	const pseudoRandom = () => {
		let s = seed;
		return () => {
			s = (s * 9301 + 49297) % 233280;
			return s / 233280;
		};
	};

	const next = pseudoRandom();

	// In a real implementation, this would return a list of entity templates:
	return {
		seed,
		vegetation: Array.from({ length: Math.floor(next() * 20) + 10 }, () => ({
			type: "MANGROVE",
			position: new Vector3(next() * 100 - 50, 0, next() * 100 - 50),
			rotation: next() * Math.PI * 2,
		})),
		hazards:
			next() > 0.8
				? [{ type: "OIL_SLICK", position: new Vector3(next() * 60 - 30, 0, next() * 60 - 30) }]
				: [],
	};
}
