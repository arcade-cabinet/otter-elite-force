import type { TerrainType } from "../../types";

/**
 * Determines terrain type based on position and world features
 * Uses coherent noise-like patterns for natural-looking biomes
 */
export function determineTerrainType(
	x: number,
	z: number,
	seed: number,
	riverPaths: Array<{ x: number; z: number }[]>,
): TerrainType {
	// Check if near a river path
	for (const path of riverPaths) {
		for (const point of path) {
			const dist = Math.sqrt((x - point.x) ** 2 + (z - point.z) ** 2);
			if (dist < 2) {
				return "RIVER";
			}
		}
	}

	// Use coherent pseudo-noise for biome assignment
	const noiseX = Math.sin(x * 0.1 + seed) * Math.cos(z * 0.15 + seed * 0.7);
	const noiseZ = Math.cos(x * 0.12 + seed * 0.5) * Math.sin(z * 0.08 + seed * 1.2);
	const combinedNoise = (noiseX + noiseZ) / 2;

	// Distance from origin affects terrain (jungles further out)
	const distFromOrigin = Math.sqrt(x * x + z * z);
	const distanceFactor = Math.min(1, distFromOrigin / 50);

	// Combine factors
	const terrainValue = combinedNoise + distanceFactor * 0.3;

	if (terrainValue < -0.2) {
		return "RIVER";
	}
	if (terrainValue < 0.3) {
		return "MARSH";
	}
	return "DENSE_JUNGLE";
}
