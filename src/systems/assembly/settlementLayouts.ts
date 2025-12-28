import * as THREE from "three";
import type { SettlementConfig } from "./types";
import type { SettlementRandom } from "./settlementUtils";

/**
 * Scattered layout - organic, irregular placement
 */
export function layoutScattered(
	random: SettlementRandom,
	count: number,
	spacing: { min: number; max: number },
	centerBuffer: number,
): THREE.Vector3[] {
	const positions: THREE.Vector3[] = [];
	let attempts = 0;
	const maxAttempts = count * 50;

	while (positions.length < count && attempts < maxAttempts) {
		// Generate position in expanding rings
		const ring = Math.floor(positions.length / 4) + 1;
		const angle = random.range(0, Math.PI * 2);
		const distance = centerBuffer + ring * random.range(spacing.min, spacing.max);

		const x = Math.cos(angle) * distance;
		const z = Math.sin(angle) * distance;
		const candidate = new THREE.Vector3(x, 0, z);

		// Check minimum distance from existing positions
		let valid = true;
		for (const existing of positions) {
			if (candidate.distanceTo(existing) < spacing.min) {
				valid = false;
				break;
			}
		}

		if (valid) {
			positions.push(candidate);
		}
		attempts++;
	}

	return positions;
}

/**
 * Circular layout - evenly spaced around center
 */
export function layoutCircular(
	random: SettlementRandom,
	count: number,
	spacing: { min: number; max: number },
	centerBuffer: number,
): THREE.Vector3[] {
	const positions: THREE.Vector3[] = [];
	const avgSpacing = (spacing.min + spacing.max) / 2;
	const radius = Math.max(centerBuffer, (count * avgSpacing) / (Math.PI * 2));

	for (let i = 0; i < count; i++) {
		const angle = (i / count) * Math.PI * 2 + random.range(-0.1, 0.1);
		const dist = radius + random.range(-1, 1);
		positions.push(new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist));
	}

	return positions;
}

/**
 * Linear layout - along a line (for waterfront)
 */
export function layoutLinear(
	random: SettlementRandom,
	count: number,
	spacing: { min: number; max: number },
	_centerBuffer: number,
): THREE.Vector3[] {
	const positions: THREE.Vector3[] = [];
	let currentX = 0;

	for (let i = 0; i < count; i++) {
		const offset = random.range(-1, 1);
		positions.push(new THREE.Vector3(currentX, 0, offset));
		currentX += random.range(spacing.min, spacing.max);
	}

	// Center the line
	const centerOffset = currentX / 2;
	for (const pos of positions) {
		pos.x -= centerOffset;
	}

	return positions;
}

/**
 * Grid layout - organized rows and columns
 */
export function layoutGrid(
	random: SettlementRandom,
	count: number,
	spacing: { min: number; max: number },
	centerBuffer: number,
): THREE.Vector3[] {
	const positions: THREE.Vector3[] = [];
	const cols = Math.ceil(Math.sqrt(count));
	const rows = Math.ceil(count / cols);
	const avgSpacing = (spacing.min + spacing.max) / 2;

	let placed = 0;
	for (let row = 0; row < rows && placed < count; row++) {
		for (let col = 0; col < cols && placed < count; col++) {
			const x = (col - (cols - 1) / 2) * avgSpacing + random.range(-0.5, 0.5);
			const z = (row - (rows - 1) / 2) * avgSpacing + random.range(-0.5, 0.5);

			// Skip center buffer area
			if (Math.abs(x) < centerBuffer && Math.abs(z) < centerBuffer) {
				continue;
			}

			positions.push(new THREE.Vector3(x, 0, z));
			placed++;
		}
	}

	return positions;
}

/**
 * Defensive layout - perimeter with open center
 */
export function layoutDefensive(
	random: SettlementRandom,
	count: number,
	spacing: { min: number; max: number },
	centerBuffer: number,
): THREE.Vector3[] {
	// Command post in center, others around perimeter
	const positions: THREE.Vector3[] = [];

	// Center position for command structure
	positions.push(new THREE.Vector3(0, 0, 0));

	// Perimeter positions
	const perimeterCount = count - 1;
	const radius = centerBuffer + spacing.min;

	for (let i = 0; i < perimeterCount; i++) {
		const angle = (i / perimeterCount) * Math.PI * 2;
		const dist = radius + random.range(0, spacing.max - spacing.min);
		positions.push(new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist));
	}

	return positions;
}

/**
 * Calculate rotation for structure based on pattern
 */
export function calculateRotation(
	position: THREE.Vector3,
	pattern: SettlementConfig["layout"]["rotation"],
	random: SettlementRandom,
	waterDirection?: THREE.Vector3,
): number {
	switch (pattern) {
		case "FACING_CENTER":
			return Math.atan2(-position.x, -position.z);
		case "FACING_WATER":
			if (waterDirection) {
				return Math.atan2(waterDirection.x, waterDirection.z);
			}
			return 0;
		case "ALIGNED":
			return 0;
		default:
			return random.range(0, Math.PI * 2);
	}
}
