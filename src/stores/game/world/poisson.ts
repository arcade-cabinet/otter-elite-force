import type { SeededRandom } from "./random";

/**
 * Generates evenly distributed points using Poisson Disc Sampling
 */
export function poissonDiscSample(
	random: SeededRandom,
	width: number,
	height: number,
	minDistance: number,
	maxAttempts: number = 30,
): Array<{ x: number; z: number }> {
	const cellSize = minDistance / Math.sqrt(2);
	const gridWidth = Math.ceil(width / cellSize);
	const gridHeight = Math.ceil(height / cellSize);
	const grid: Array<{ x: number; z: number } | null> = new Array(gridWidth * gridHeight).fill(null);

	const points: Array<{ x: number; z: number }> = [];
	const active: Array<{ x: number; z: number }> = [];

	// Start with center point (offset so 0,0 is center)
	const halfWidth = width / 2;
	const halfHeight = height / 2;
	const startX = 0;
	const startZ = 0;

	const startPoint = { x: startX, z: startZ };
	points.push(startPoint);
	active.push(startPoint);

	const gridX = Math.floor((startX + halfWidth) / cellSize);
	const gridZ = Math.floor((startZ + halfHeight) / cellSize);
	if (gridX >= 0 && gridX < gridWidth && gridZ >= 0 && gridZ < gridHeight) {
		grid[gridZ * gridWidth + gridX] = startPoint;
	}

	while (active.length > 0) {
		const idx = random.int(0, active.length - 1);
		const point = active[idx];
		let found = false;

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const angle = random.next() * Math.PI * 2;
			const distance = minDistance + random.next() * minDistance;
			const newX = point.x + Math.cos(angle) * distance;
			const newZ = point.z + Math.sin(angle) * distance;

			// Check bounds
			if (newX < -halfWidth || newX >= halfWidth || newZ < -halfHeight || newZ >= halfHeight) {
				continue;
			}

			const newGridX = Math.floor((newX + halfWidth) / cellSize);
			const newGridZ = Math.floor((newZ + halfHeight) / cellSize);

			// Check nearby cells for conflicts
			let valid = true;
			for (let dz = -2; dz <= 2 && valid; dz++) {
				for (let dx = -2; dx <= 2 && valid; dx++) {
					const checkX = newGridX + dx;
					const checkZ = newGridZ + dz;
					if (checkX >= 0 && checkX < gridWidth && checkZ >= 0 && checkZ < gridHeight) {
						const neighbor = grid[checkZ * gridWidth + checkX];
						if (neighbor) {
							const dist = Math.sqrt((newX - neighbor.x) ** 2 + (newZ - neighbor.z) ** 2);
							if (dist < minDistance) {
								valid = false;
							}
						}
					}
				}
			}

			if (valid) {
				const newPoint = { x: newX, z: newZ };
				points.push(newPoint);
				active.push(newPoint);
				grid[newGridZ * gridWidth + newGridX] = newPoint;
				found = true;
				break;
			}
		}

		if (!found) {
			active.splice(idx, 1);
		}
	}

	return points;
}
