/**
 * Settlement Assembler
 *
 * Generates complete settlements (villages, outposts, camps) by:
 * 1. Determining structure count and types
 * 2. Laying out positions using pattern algorithms
 * 3. Connecting structures with paths
 * 4. Populating with inhabitants
 */

import * as THREE from "three";
import type { Faction } from "./componentLibrary";
import {
	assembleHut,
	assemblePlatformNetwork,
	assembleWatchtower,
	DEFAULT_ASSEMBLY_CONFIG,
} from "./structureAssembler";
import type {
	PathSegment,
	SettlementConfig,
	SettlementType,
	StructureArchetype,
	StructureTemplate,
} from "./types";
import { SettlementRandom } from "./settlementUtils";
// =============================================================================
// SETTLEMENT CONFIGS
// =============================================================================

export const SETTLEMENT_CONFIGS: Record<SettlementType, SettlementConfig> = {
	NATIVE_VILLAGE: {
		type: "NATIVE_VILLAGE",
		structures: [
			{ type: "BASIC_HUT", min: 3, max: 6, required: true },
			{ type: "LONGHOUSE", min: 0, max: 1, required: false },
			{ type: "MEDICAL_POST", min: 0, max: 1, required: false },
			{ type: "DOCK_PLATFORM", min: 0, max: 2, required: false },
		],
		layout: {
			pattern: "SCATTERED",
			spacing: { min: 4, max: 8 },
			centerBuffer: 3,
			rotation: "FACING_CENTER",
		},
		paths: {
			connectAll: true,
			style: "DIRT",
			width: 1.2,
		},
		decorations: [
			{ type: "FIRE_PIT", density: 0.02 },
			{ type: "DRYING_RACK", density: 0.03 },
			{ type: "POTTERY", density: 0.05 },
		],
		inhabitants: [
			{ type: "VILLAGER", count: { min: 4, max: 10 } },
			{ type: "HEALER", count: { min: 0, max: 1 } },
		],
	},

	FISHING_CAMP: {
		type: "FISHING_CAMP",
		structures: [
			{ type: "BASIC_HUT", min: 2, max: 4, required: true },
			{ type: "DOCK_PLATFORM", min: 1, max: 3, required: true },
			{ type: "STORAGE_SHED", min: 1, max: 2, required: false },
		],
		layout: {
			pattern: "LINEAR",
			spacing: { min: 3, max: 5 },
			centerBuffer: 0,
			rotation: "FACING_WATER",
		},
		paths: {
			connectAll: true,
			style: "PLANKS",
			width: 1.5,
		},
		decorations: [
			{ type: "FISHING_NET", density: 0.04 },
			{ type: "FISH_BASKET", density: 0.06 },
			{ type: "BOAT", density: 0.01 },
		],
		inhabitants: [{ type: "VILLAGER", count: { min: 2, max: 6 } }],
	},

	SCALE_GUARD_OUTPOST: {
		type: "SCALE_GUARD_OUTPOST",
		structures: [
			{ type: "COMMAND_POST", min: 1, max: 1, required: true },
			{ type: "BASIC_HUT", min: 2, max: 4, required: true },
			{ type: "WATCHTOWER", min: 1, max: 2, required: true },
			{ type: "AMMO_DEPOT", min: 1, max: 1, required: false },
		],
		layout: {
			pattern: "DEFENSIVE",
			spacing: { min: 5, max: 8 },
			centerBuffer: 4,
			rotation: "FACING_CENTER",
		},
		paths: {
			connectAll: true,
			style: "DIRT",
			width: 2,
		},
		decorations: [
			{ type: "BARRICADE", density: 0.03 },
			{ type: "SANDBAG", density: 0.04 },
			{ type: "AMMO_CRATE", density: 0.02 },
		],
		inhabitants: [{ type: "GUARD", count: { min: 4, max: 8 } }],
	},

	PRISON_COMPOUND: {
		type: "PRISON_COMPOUND",
		structures: [
			{ type: "COMMAND_POST", min: 1, max: 1, required: true },
			{ type: "WATCHTOWER", min: 2, max: 4, required: true },
			{ type: "BASIC_HUT", min: 1, max: 2, required: false },
		],
		layout: {
			pattern: "CIRCULAR",
			spacing: { min: 6, max: 10 },
			centerBuffer: 8, // Large center for prison cage
			rotation: "FACING_CENTER",
		},
		paths: {
			connectAll: true,
			style: "DIRT",
			width: 2,
		},
		decorations: [
			{ type: "BARRICADE", density: 0.05 },
			{ type: "SPOTLIGHT", density: 0.02 },
		],
		inhabitants: [
			{ type: "GUARD", count: { min: 4, max: 8 } },
			{ type: "PRISONER", count: { min: 1, max: 3 } },
		],
	},

	SIPHON_FACILITY: {
		type: "SIPHON_FACILITY",
		structures: [
			{ type: "COMMAND_POST", min: 1, max: 1, required: true },
			{ type: "STORAGE_SHED", min: 2, max: 4, required: true },
			{ type: "WATCHTOWER", min: 1, max: 2, required: false },
		],
		layout: {
			pattern: "GRID",
			spacing: { min: 6, max: 8 },
			centerBuffer: 5, // Central siphon
			rotation: "ALIGNED",
		},
		paths: {
			connectAll: true,
			style: "PLANKS",
			width: 2.5,
		},
		decorations: [
			{ type: "OIL_DRUM", density: 0.06 },
			{ type: "PIPE", density: 0.04 },
			{ type: "VALVE", density: 0.02 },
		],
		inhabitants: [{ type: "GUARD", count: { min: 3, max: 6 } }],
	},

	PLAYER_BASE: {
		type: "PLAYER_BASE",
		structures: [
			{ type: "DOCK_PLATFORM", min: 1, max: 1, required: true }, // Starting platform
		],
		layout: {
			pattern: "GRID",
			spacing: { min: 3, max: 3 },
			centerBuffer: 0,
			rotation: "ALIGNED",
		},
		paths: {
			connectAll: true,
			style: "PLANKS",
			width: 2,
		},
		decorations: [],
		inhabitants: [],
	},
};

// =============================================================================
// SETTLEMENT OUTPUT
// =============================================================================

export interface SettlementStructure {
	template: StructureTemplate;
	worldPosition: THREE.Vector3;
	worldRotation: number;
	faction: Faction;
}

export interface SettlementInhabitant {
	type: "VILLAGER" | "HEALER" | "GUARD" | "PRISONER";
	position: THREE.Vector3;
	faction: Faction;
}

export interface Settlement {
	type: SettlementType;
	center: THREE.Vector3;
	radius: number;
	structures: SettlementStructure[];
	paths: PathSegment[];
	inhabitants: SettlementInhabitant[];
	faction: Faction;
}

// =============================================================================
// LAYOUT ALGORITHMS
// =============================================================================

/**
 * Scattered layout - organic, irregular placement
 */
function layoutScattered(
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
function layoutCircular(
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
function layoutLinear(
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
function layoutGrid(
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
function layoutDefensive(
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
function calculateRotation(
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

// =============================================================================
// PATH GENERATION
// =============================================================================

/**
 * Generates paths connecting structures using MST
 */
function generatePaths(
	structures: SettlementStructure[],
	config: SettlementConfig["paths"],
): PathSegment[] {
	if (structures.length < 2 || !config.connectAll) {
		return [];
	}

	const paths: PathSegment[] = [];

	// Build MST using Prim's algorithm
	const inMST = new Set<number>();
	inMST.add(0);

	while (inMST.size < structures.length) {
		let bestEdge: { from: number; to: number; dist: number } | null = null;

		for (const fromIdx of inMST) {
			for (let toIdx = 0; toIdx < structures.length; toIdx++) {
				if (inMST.has(toIdx)) continue;

				const dist = structures[fromIdx].worldPosition.distanceTo(structures[toIdx].worldPosition);

				if (!bestEdge || dist < bestEdge.dist) {
					bestEdge = { from: fromIdx, to: toIdx, dist };
				}
			}
		}

		if (bestEdge) {
			inMST.add(bestEdge.to);

			const start = structures[bestEdge.from].worldPosition.clone();
			const end = structures[bestEdge.to].worldPosition.clone();

			paths.push({
				id: `path-${bestEdge.from}-${bestEdge.to}`,
				start,
				end,
				width: config.width,
				style: config.style,
				elevation: config.style === "ELEVATED" ? 1.5 : 0,
				waypoints: [], // Straight paths for now
			});
		}
	}

	return paths;
}

// =============================================================================
// MAIN ASSEMBLY FUNCTION
// =============================================================================

/**
 * Assembles a complete settlement
 */
export function assembleSettlement(
	seed: number,
	type: SettlementType,
	center: THREE.Vector3,
	faction: Faction,
): Settlement {
	const random = new SettlementRandom(seed);
	const config = SETTLEMENT_CONFIGS[type];

	// Determine structure counts
	const structuresToBuild: { type: StructureArchetype; count: number }[] = [];

	for (const structureConfig of config.structures) {
		let count = random.int(structureConfig.min, structureConfig.max);
		if (structureConfig.required && count === 0) {
			count = 1;
		}
		if (count > 0) {
			structuresToBuild.push({ type: structureConfig.type, count });
		}
	}

	// Calculate total structure count
	const totalStructures = structuresToBuild.reduce((sum, s) => sum + s.count, 0);

	// Generate layout positions
	let positions: THREE.Vector3[];
	switch (config.layout.pattern) {
		case "SCATTERED":
			positions = layoutScattered(
				random,
				totalStructures,
				config.layout.spacing,
				config.layout.centerBuffer,
			);
			break;
		case "CIRCULAR":
			positions = layoutCircular(
				random,
				totalStructures,
				config.layout.spacing,
				config.layout.centerBuffer,
			);
			break;
		case "LINEAR":
			positions = layoutLinear(
				random,
				totalStructures,
				config.layout.spacing,
				config.layout.centerBuffer,
			);
			break;
		case "GRID":
			positions = layoutGrid(
				random,
				totalStructures,
				config.layout.spacing,
				config.layout.centerBuffer,
			);
			break;
		case "DEFENSIVE":
			positions = layoutDefensive(
				random,
				totalStructures,
				config.layout.spacing,
				config.layout.centerBuffer,
			);
			break;
		default:
			positions = layoutScattered(
				random,
				totalStructures,
				config.layout.spacing,
				config.layout.centerBuffer,
			);
	}

	// Shuffle positions for variety
	positions = random.shuffle(positions);

	// Build structures
	const structures: SettlementStructure[] = [];
	let positionIndex = 0;

	for (const { type, count } of structuresToBuild) {
		for (let i = 0; i < count && positionIndex < positions.length; i++) {
			const position = positions[positionIndex++].clone().add(center);
			const rotation = calculateRotation(
				position.clone().sub(center),
				config.layout.rotation,
				random,
			);

			// Generate appropriate template
			let template: StructureTemplate;
			const structureSeed = seed + positionIndex * 1000;

			switch (type) {
				case "BASIC_HUT":
					template = assembleHut(structureSeed, DEFAULT_ASSEMBLY_CONFIG.hut, "BASIC");
					break;
				case "LONGHOUSE":
					template = assembleHut(structureSeed, DEFAULT_ASSEMBLY_CONFIG.hut, "LONGHOUSE");
					break;
				case "MEDICAL_POST":
					template = assembleHut(structureSeed, DEFAULT_ASSEMBLY_CONFIG.hut, "HEALER");
					break;
				case "WATCHTOWER":
					template = assembleWatchtower(structureSeed);
					break;
				case "COMMAND_POST":
					template = assembleHut(
						structureSeed,
						{ ...DEFAULT_ASSEMBLY_CONFIG.hut, roomSize: { min: 4, max: 5 } },
						"BASIC",
					);
					break;
				default:
					template = assembleHut(structureSeed, DEFAULT_ASSEMBLY_CONFIG.hut, "BASIC");
			}

			structures.push({
				template,
				worldPosition: position,
				worldRotation: rotation,
				faction,
			});
		}
	}

	// Generate paths
	const paths = generatePaths(structures, config.paths);

	// Generate inhabitants
	const inhabitants: SettlementInhabitant[] = [];

	for (const inhabitantConfig of config.inhabitants) {
		const count = random.int(inhabitantConfig.count.min, inhabitantConfig.count.max);

		for (let i = 0; i < count; i++) {
			// Place inhabitants near structures
			const nearStructure = random.pick(structures);
			const offset = new THREE.Vector3(random.range(-3, 3), 0, random.range(-3, 3));

			inhabitants.push({
				type: inhabitantConfig.type,
				position: nearStructure.worldPosition.clone().add(offset),
				faction: inhabitantConfig.type === "PRISONER" ? "URA" : faction,
			});
		}
	}

	// Calculate settlement radius
	let maxRadius = 0;
	for (const structure of structures) {
		const dist = structure.worldPosition.distanceTo(center);
		if (dist > maxRadius) maxRadius = dist;
	}

	return {
		type,
		center,
		radius: maxRadius + 5,
		structures,
		paths,
		inhabitants,
		faction,
	};
}

// =============================================================================
// PLATFORM NETWORK GENERATION
// =============================================================================

/**
 * Generates an elevated platform network for a settlement
 */
export function assembleElevatedNetwork(
	seed: number,
	center: THREE.Vector3,
	areaSize: number,
	platformCount: number,
): {
	platforms: ReturnType<typeof assemblePlatformNetwork>;
	bridges: PathSegment[];
} {
	const platforms = assemblePlatformNetwork(seed, platformCount, areaSize);

	// Connect nearby platforms with bridges
	const bridges: PathSegment[] = [];
	const random = new SettlementRandom(seed + 5000);

	for (let i = 0; i < platforms.length; i++) {
		for (let j = i + 1; j < platforms.length; j++) {
			const p1 = platforms[i];
			const p2 = platforms[j];

			const dist = new THREE.Vector3(p1.position.x, 0, p1.position.z).distanceTo(
				new THREE.Vector3(p2.position.x, 0, p2.position.z),
			);

			// Connect if close enough
			if (dist < 10 && random.chance(0.7)) {
				bridges.push({
					id: `bridge-${i}-${j}`,
					start: p1.position.clone().add(center),
					end: p2.position.clone().add(center),
					width: 1.2,
					style: "BRIDGE",
					elevation: (p1.height + p2.height) / 2,
					waypoints: [],
				});
			}
		}
	}

	// Offset platforms to world position
	for (const platform of platforms) {
		platform.position.add(center);
	}

	return { platforms, bridges };
}
