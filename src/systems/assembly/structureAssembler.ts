/**
 * Structure Assembler
 *
 * Procedurally generates individual structures (huts, platforms, towers)
 * from atomic components following assembly rules.
 */

import * as THREE from "three";
import type {
	AssemblyConfig,
	PlatformSection,
	StructureComponent,
	StructureTemplate,
} from "./types";
import { AssemblyRandom } from "./assemblyUtils";
import { DEFAULT_ASSEMBLY_CONFIG } from "./assemblyConstants";
import {
	calculateStiltPositions,
	getWallPosition,
	getLadderPosition,
	generateHutSnapPoints,
	generateHutInteractionPoints,
} from "./structureUtils";

// Re-exports for convenience
export { DEFAULT_ASSEMBLY_CONFIG };

// =============================================================================
// HUT ASSEMBLY
// =============================================================================

/**
 * Generates a procedural hut structure
 */
export function assembleHut(
	seed: number,
	config: AssemblyConfig["hut"] = DEFAULT_ASSEMBLY_CONFIG.hut,
	variant: "BASIC" | "LONGHOUSE" | "HEALER" = "BASIC",
): StructureTemplate {
	const random = new AssemblyRandom(seed);
	const components: StructureComponent[] = [];

	// Determine hut dimensions
	const width =
		variant === "LONGHOUSE"
			? random.range(config.roomSize.max, config.roomSize.max * 2)
			: random.range(config.roomSize.min, config.roomSize.max);
	const depth = random.range(config.roomSize.min, config.roomSize.max);
	const floorHeight = random.range(config.floorHeight.min, config.floorHeight.max);
	const roofPitch = random.range(config.roofPitch.min, config.roofPitch.max);

	// Calculate stilt positions
	const stiltPositions = calculateStiltPositions(width, depth, config, random);

	// 1. Generate stilts
	for (let i = 0; i < stiltPositions.length; i++) {
		const pos = stiltPositions[i];
		const wear = 1 - random.range(0, config.wearVariation);

		components.push({
			id: `stilt-${i}`,
			type: "STILT",
			localPosition: new THREE.Vector3(pos.x, floorHeight / 2, pos.z),
			localRotation: new THREE.Euler(0, random.range(-0.05, 0.05), random.range(-0.02, 0.02)),
			scale: new THREE.Vector3(0.15, floorHeight, 0.15),
			material: "WOOD",
			condition: wear,
			isDestructible: true,
		});

		// Add rope bindings at top of stilts
		components.push({
			id: `binding-${i}`,
			type: "ROPE_BINDING",
			localPosition: new THREE.Vector3(pos.x, floorHeight - 0.1, pos.z),
			localRotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(0.2, 0.15, 0.2),
			material: "ROPE",
			condition: wear,
			isDestructible: false,
		});
	}

	// 2. Generate floor planks
	const plankCount = Math.ceil(depth / 0.3);
	for (let i = 0; i < plankCount; i++) {
		const z = -depth / 2 + (i + 0.5) * (depth / plankCount);
		const wear = 1 - random.range(0, config.wearVariation);

		components.push({
			id: `plank-${i}`,
			type: "FLOOR_PLANK",
			localPosition: new THREE.Vector3(0, floorHeight, z),
			localRotation: new THREE.Euler(0, 0, random.range(-0.02, 0.02)),
			scale: new THREE.Vector3(width, 0.05, depth / plankCount - 0.02),
			material: "WOOD",
			condition: wear,
			isDestructible: true,
		});
	}

	// 3. Generate walls (3-4 sides)
	const wallHeight = 1.8;
	const wallSides: ("NORTH" | "SOUTH" | "EAST" | "WEST")[] = ["NORTH", "SOUTH", "EAST", "WEST"];
	const openSide = random.pick(wallSides); // One side open or has door

	for (const side of wallSides) {
		if (side === openSide) {
			// Door frame instead of wall
			const doorPos = getWallPosition(side, width, depth, floorHeight, wallHeight);
			components.push({
				id: `door-${side}`,
				type: "DOOR_FRAME",
				localPosition: doorPos.position,
				localRotation: doorPos.rotation,
				scale: new THREE.Vector3(1.2, wallHeight, 0.1),
				material: "WOOD",
				condition: 1 - random.range(0, config.wearVariation),
				isDestructible: true,
			});
		} else {
			// Full wall
			const wallPos = getWallPosition(side, width, depth, floorHeight, wallHeight);
			const wallMaterial = random.chance(0.5) ? "BAMBOO" : "THATCH";

			components.push({
				id: `wall-${side}`,
				type: wallMaterial === "BAMBOO" ? "WALL_BAMBOO" : "WALL_THATCH",
				localPosition: wallPos.position,
				localRotation: wallPos.rotation,
				scale: wallPos.scale,
				material: wallMaterial,
				condition: 1 - random.range(0, config.wearVariation),
				isDestructible: true,
			});

			// Optional window
			if (random.chance(0.4)) {
				components.push({
					id: `window-${side}`,
					type: "WINDOW_OPENING",
					localPosition: new THREE.Vector3(
						wallPos.position.x,
						wallPos.position.y + 0.3,
						wallPos.position.z,
					),
					localRotation: wallPos.rotation,
					scale: new THREE.Vector3(0.6, 0.5, 0.1),
					material: "WOOD",
					condition: 1,
					isDestructible: false,
				});
			}
		}
	}

	// 4. Generate roof
	const roofHeight = wallHeight * roofPitch;
	const roofMaterial = random.chance(0.2) ? "METAL" : "THATCH";

	// Main roof beam
	components.push({
		id: "roof-beam-main",
		type: "ROOF_BEAM",
		localPosition: new THREE.Vector3(0, floorHeight + wallHeight + roofHeight / 2, 0),
		localRotation: new THREE.Euler(0, 0, 0),
		scale: new THREE.Vector3(0.12, 0.12, depth + 0.5),
		material: "WOOD",
		condition: 1 - random.range(0, config.wearVariation * 0.5),
		isDestructible: true,
	});

	// Roof sections (two angled sides)
	for (const side of [-1, 1]) {
		const roofAngle = Math.atan2(roofHeight, width / 2) * side;
		components.push({
			id: `roof-${side > 0 ? "east" : "west"}`,
			type: roofMaterial === "METAL" ? "ROOF_TIN" : "ROOF_THATCH",
			localPosition: new THREE.Vector3(
				(side * width) / 4,
				floorHeight + wallHeight + roofHeight / 2,
				0,
			),
			localRotation: new THREE.Euler(0, 0, roofAngle),
			scale: new THREE.Vector3(width / 2 + 0.3, 0.1, depth + 0.4),
			material: roofMaterial === "METAL" ? "METAL" : "THATCH",
			condition: 1 - random.range(0, config.wearVariation),
			isDestructible: true,
		});
	}

	// 5. Ladder (if elevated)
	if (floorHeight > 0.8) {
		const ladderSide = openSide;
		const ladderPos = getLadderPosition(ladderSide, width, depth, floorHeight);

		components.push({
			id: "ladder",
			type: "LADDER",
			localPosition: ladderPos.position,
			localRotation: ladderPos.rotation,
			scale: new THREE.Vector3(0.5, floorHeight, 0.1),
			material: "WOOD",
			condition: 1 - random.range(0, config.wearVariation),
			isDestructible: true,
		});
	}

	// 6. Healer-specific additions
	if (variant === "HEALER") {
		components.push({
			id: "lantern",
			type: "LANTERN_HOOK",
			localPosition: new THREE.Vector3(0, floorHeight + wallHeight - 0.3, 0),
			localRotation: new THREE.Euler(0, 0, 0),
			scale: new THREE.Vector3(0.3, 0.4, 0.3),
			material: "METAL",
			condition: 1,
			isDestructible: false,
		});
	}

	// Generate snap points for connecting to other structures
	const snapPoints = generateHutSnapPoints(width, depth, floorHeight, openSide);

	// Generate interaction points
	const interactionPoints = generateHutInteractionPoints(width, depth, floorHeight, openSide);

	return {
		archetype:
			variant === "LONGHOUSE" ? "LONGHOUSE" : variant === "HEALER" ? "MEDICAL_POST" : "BASIC_HUT",
		components,
		footprint: { width: width + 1, depth: depth + 1 },
		height: floorHeight + wallHeight + roofHeight,
		snapPoints,
		interactionPoints,
	};
}

// =============================================================================
// PLATFORM ASSEMBLY
// =============================================================================

/**
 * Generates an elevated wooden platform
 */
export function assemblePlatform(
	seed: number,
	size: { width: number; depth: number },
	height: number,
	options: {
		hasRailings?: boolean;
		hasLadder?: boolean;
		ladderSide?: "NORTH" | "SOUTH" | "EAST" | "WEST";
	} = {},
): PlatformSection {
	const random = new AssemblyRandom(seed);
	const {
		hasRailings = true,
		hasLadder = true,
		ladderSide = random.pick(["NORTH", "SOUTH", "EAST", "WEST"]),
	} = options;

	// Calculate stilt positions (corners + optional center supports)
	const stilts: THREE.Vector3[] = [
		new THREE.Vector3(-size.width / 2, 0, -size.depth / 2),
		new THREE.Vector3(size.width / 2, 0, -size.depth / 2),
		new THREE.Vector3(-size.width / 2, 0, size.depth / 2),
		new THREE.Vector3(size.width / 2, 0, size.depth / 2),
	];

	// Add center stilts for larger platforms
	if (size.width > 4 || size.depth > 4) {
		stilts.push(new THREE.Vector3(0, 0, 0));
	}

	// Determine which sides need railings (not the ladder side)
	const railingSides: ("NORTH" | "SOUTH" | "EAST" | "WEST")[] = [];
	if (hasRailings) {
		const allSides: ("NORTH" | "SOUTH" | "EAST" | "WEST")[] = ["NORTH", "SOUTH", "EAST", "WEST"];
		for (const side of allSides) {
			if (side !== ladderSide) {
				railingSides.push(side);
			}
		}
	}

	return {
		id: `platform-${seed}`,
		position: new THREE.Vector3(0, height, 0),
		size,
		height,
		stilts,
		railings: railingSides,
		hasLadder,
		ladderSide,
	};
}

/**
 * Generates a network of connected platforms
 */
export function assemblePlatformNetwork(
	seed: number,
	count: number,
	areaSize: number,
	config: AssemblyConfig["platforms"] = DEFAULT_ASSEMBLY_CONFIG.platforms,
): PlatformSection[] {
	const random = new AssemblyRandom(seed);
	const platforms: PlatformSection[] = [];

	// Generate initial platform positions using rejection sampling
	const positions: THREE.Vector3[] = [];
	const minDistance = config.sectionSize * 1.5;

	let attempts = 0;
	while (positions.length < count && attempts < count * 10) {
		const x = random.range(-areaSize / 2, areaSize / 2);
		const z = random.range(-areaSize / 2, areaSize / 2);
		const height = random.range(config.minHeight, config.maxHeight);

		// Check distance from existing platforms
		let valid = true;
		for (const existing of positions) {
			const dist = Math.sqrt((x - existing.x) ** 2 + (z - existing.z) ** 2);
			if (dist < minDistance) {
				valid = false;
				break;
			}
		}

		if (valid) {
			positions.push(new THREE.Vector3(x, height, z));
		}
		attempts++;
	}

	// Create platforms at each position
	for (let i = 0; i < positions.length; i++) {
		const pos = positions[i];
		const platform = assemblePlatform(
			seed + i * 1000,
			{
				width: config.sectionSize + random.range(-0.5, 0.5),
				depth: config.sectionSize + random.range(-0.5, 0.5),
			},
			pos.y,
			{
				hasLadder: i === 0 || random.chance(0.3), // First platform always has ladder
			},
		);
		platform.position.set(pos.x, pos.y, pos.z);
		platforms.push(platform);
	}

	// Connect nearby platforms with bridges (handled by path generation)
	return platforms;
}

/**
 * Generates a watchtower structure
 */
export function assembleWatchtower(seed: number): StructureTemplate {
	const random = new AssemblyRandom(seed);
	const components: StructureComponent[] = [];

	const towerHeight = random.range(4, 6);
	const platformSize = 2.5;

	// Main support poles (4 corners, angled inward)
	for (let i = 0; i < 4; i++) {
		const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
		const bottomRadius = 1.2;
		const topRadius = 0.8;

		const bottomX = Math.cos(angle) * bottomRadius;
		const bottomZ = Math.sin(angle) * bottomRadius;
		const topX = Math.cos(angle) * topRadius;
		const topZ = Math.sin(angle) * topRadius;

		// Calculate lean angle
		const leanX = Math.atan2(bottomX - topX, towerHeight);
		const leanZ = Math.atan2(bottomZ - topZ, towerHeight);

		components.push({
			id: `pole-${i}`,
			type: "STILT",
			localPosition: new THREE.Vector3((bottomX + topX) / 2, towerHeight / 2, (bottomZ + topZ) / 2),
			localRotation: new THREE.Euler(leanZ, 0, -leanX),
			scale: new THREE.Vector3(0.12, towerHeight * 1.1, 0.12),
			material: "WOOD",
			condition: 1 - random.range(0, 0.2),
			isDestructible: true,
		});
	}

	// Cross braces at multiple heights
	const braceHeights = [towerHeight * 0.3, towerHeight * 0.6];
	for (const height of braceHeights) {
		for (let i = 0; i < 4; i++) {
			const angle = (i / 4) * Math.PI * 2;
			const nextAngle = ((i + 1) / 4) * Math.PI * 2;
			const radius = 1.2 - (height / towerHeight) * 0.4;

			const midX = ((Math.cos(angle) + Math.cos(nextAngle)) / 2) * radius;
			const midZ = ((Math.sin(angle) + Math.sin(nextAngle)) / 2) * radius;

			components.push({
				id: `brace-${height}-${i}`,
				type: "WALL_FRAME",
				localPosition: new THREE.Vector3(midX, height, midZ),
				localRotation: new THREE.Euler(0, -angle - Math.PI / 4, 0),
				scale: new THREE.Vector3(1.5, 0.08, 0.08),
				material: "WOOD",
				condition: 1 - random.range(0, 0.15),
				isDestructible: true,
			});
		}
	}

	// Top platform
	components.push({
		id: "platform",
		type: "FLOOR_SECTION",
		localPosition: new THREE.Vector3(0, towerHeight, 0),
		localRotation: new THREE.Euler(0, 0, 0),
		scale: new THREE.Vector3(platformSize, 0.1, platformSize),
		material: "WOOD",
		condition: 1 - random.range(0, 0.15),
		isDestructible: true,
	});

	// Railings around platform
	for (let i = 0; i < 4; i++) {
		const angle = (i / 4) * Math.PI * 2;
		const x = Math.cos(angle) * (platformSize / 2);
		const z = Math.sin(angle) * (platformSize / 2);

		components.push({
			id: `railing-${i}`,
			type: "RAILING",
			localPosition: new THREE.Vector3(x, towerHeight + 0.5, z),
			localRotation: new THREE.Euler(0, angle, 0),
			scale: new THREE.Vector3(platformSize, 0.8, 0.05),
			material: "WOOD",
			condition: 1 - random.range(0, 0.2),
			isDestructible: true,
		});
	}

	// Ladder
	components.push({
		id: "ladder",
		type: "LADDER",
		localPosition: new THREE.Vector3(0, towerHeight / 2, platformSize / 2 + 0.2),
		localRotation: new THREE.Euler(0.1, 0, 0),
		scale: new THREE.Vector3(0.6, towerHeight, 0.15),
		material: "WOOD",
		condition: 1 - random.range(0, 0.15),
		isDestructible: true,
	});

	// Simple roof (four-sided pyramid)
	components.push({
		id: "roof",
		type: "ROOF_THATCH",
		localPosition: new THREE.Vector3(0, towerHeight + 1.2, 0),
		localRotation: new THREE.Euler(0, Math.PI / 4, 0),
		scale: new THREE.Vector3(platformSize + 0.5, 0.8, platformSize + 0.5),
		material: "THATCH",
		condition: 1 - random.range(0, 0.2),
		isDestructible: true,
	});

	return {
		archetype: "WATCHTOWER",
		components,
		footprint: { width: 3, depth: 3 },
		height: towerHeight + 2,
		snapPoints: [],
		interactionPoints: [
			{
				id: "climb",
				localPosition: new THREE.Vector3(0, 0.5, platformSize / 2 + 0.3),
				type: "CLIMB",
				radius: 1,
			},
		],
	};
}
