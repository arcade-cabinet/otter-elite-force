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
import { SETTLEMENT_CONFIGS } from "./settlementConfigs";
import {
	calculateRotation,
	layoutCircular,
	layoutDefensive,
	layoutGrid,
	layoutLinear,
	layoutScattered,
} from "./settlementLayouts";
import { SettlementRandom } from "./settlementUtils";
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

// Re-exports for convenience
export { SETTLEMENT_CONFIGS };

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
