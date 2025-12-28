import type { SeededRandom } from "./random";

/**
 * Generates river paths that flow through the world
 * Rivers start from edges and flow toward center or across
 */
export function generateRiverPaths(
	random: SeededRandom,
	worldRadius: number,
	riverCount: number = 3,
): Array<Array<{ x: number; z: number }>> {
	const rivers: Array<Array<{ x: number; z: number }>> = [];

	for (let i = 0; i < riverCount; i++) {
		const river: Array<{ x: number; z: number }> = [];

		// Start from edge
		const startAngle = random.range(0, Math.PI * 2);
		const x = Math.cos(startAngle) * worldRadius * 0.9;
		const z = Math.sin(startAngle) * worldRadius * 0.9;

		// Flow direction (generally toward center with meandering)
		const endAngle = startAngle + Math.PI + random.range(-0.5, 0.5);
		const endX = Math.cos(endAngle) * worldRadius * 0.7;
		const endZ = Math.sin(endAngle) * worldRadius * 0.7;

		const steps = 20 + random.int(0, 10);
		for (let step = 0; step <= steps; step++) {
			const t = step / steps;

			// Interpolate with meandering
			const baseX = x + (endX - x) * t;
			const baseZ = z + (endZ - z) * t;

			// Add meandering
			const meander = Math.sin(t * Math.PI * 4) * 5;
			const perpX = -(endZ - z);
			const perpZ = endX - x;
			const perpLen = Math.sqrt(perpX * perpX + perpZ * perpZ);

			river.push({
				x: baseX + (perpX / perpLen) * meander,
				z: baseZ + (perpZ / perpLen) * meander,
			});
		}

		rivers.push(river);
	}

	return rivers;
}
