/**
 * Structure Assembler
 *
 * Procedurally generates individual structures (huts, platforms, towers)
 * from atomic components following assembly rules.
 */

import * as THREE from "three";
import type {
	AssemblyConfig,
	InteractionPoint,
	PlatformSection,
	SnapPoint,
	StructureComponent,
	StructureTemplate,
} from "./types";

// =============================================================================
// SEEDED RANDOM HELPER
// =============================================================================

class AssemblyRandom {
	private seed: number;

	constructor(seed: number) {
		this.seed = seed;
	}

	next(): number {
		this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
		return this.seed / 0x7fffffff;
	}

	range(min: number, max: number): number {
		return min + this.next() * (max - min);
	}

	int(min: number, max: number): number {
		return Math.floor(this.range(min, max + 1));
	}

	pick<T>(array: T[]): T {
		return array[this.int(0, array.length - 1)];
	}

	chance(probability: number): boolean {
		return this.next() < probability;
	}
}

// =============================================================================
// DEFAULT ASSEMBLY CONFIG
// =============================================================================

export const DEFAULT_ASSEMBLY_CONFIG: AssemblyConfig = {
	hut: {
		minStilts: 4,
		maxStilts: 9,
		floorHeight: { min: 0.5, max: 2.5 },
		roomSize: { min: 2.5, max: 5 },
		roofPitch: { min: 0.3, max: 0.6 },
		wearVariation: 0.3,
	},
	village: {
		minHuts: 3,
		maxHuts: 8,
		centralFeature: "FIRE_PIT",
		hasHealer: true,
		pathDensity: 0.7,
	},
	platforms: {
		minHeight: 1.5,
		maxHeight: 4,
		sectionSize: 3,
		connectRadius: 8,
		requiresLadderAccess: true,
	},
};

// =============================================================================
// HUT ASSEMBLY
// =============================================================================

/**
 * Generates a procedural hut structure
 *
 * Assembly Rules:
 * 1. Stilts placed at corners and optionally mid-edges
 * 2. Floor planks laid across stilts
 * 3. Wall frames on 3-4 sides (one may be open or have door)
 * 4. Roof beams span width, thatch laid on top
 * 5. Ladder on one side if elevated
 * 6. Decorative elements based on wear
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

// =============================================================================
// WATCHTOWER ASSEMBLY
// =============================================================================

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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateStiltPositions(
	width: number,
	depth: number,
	config: AssemblyConfig["hut"],
	random: AssemblyRandom,
): { x: number; z: number }[] {
	const positions: { x: number; z: number }[] = [];

	// Corner stilts (always present)
	positions.push({ x: -width / 2, z: -depth / 2 });
	positions.push({ x: width / 2, z: -depth / 2 });
	positions.push({ x: -width / 2, z: depth / 2 });
	positions.push({ x: width / 2, z: depth / 2 });

	// Additional stilts based on size
	const targetCount = random.int(config.minStilts, config.maxStilts);

	if (targetCount > 4 && width > 3) {
		// Mid-edge stilts on long sides
		positions.push({ x: 0, z: -depth / 2 });
		positions.push({ x: 0, z: depth / 2 });
	}

	if (targetCount > 6 && depth > 3) {
		// Mid-edge stilts on short sides
		positions.push({ x: -width / 2, z: 0 });
		positions.push({ x: width / 2, z: 0 });
	}

	if (targetCount > 8) {
		// Center stilt
		positions.push({ x: 0, z: 0 });
	}

	return positions.slice(0, targetCount);
}

function getWallPosition(
	side: "NORTH" | "SOUTH" | "EAST" | "WEST",
	width: number,
	depth: number,
	floorHeight: number,
	wallHeight: number,
): { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 } {
	const halfWall = wallHeight / 2;
	const y = floorHeight + halfWall;

	switch (side) {
		case "NORTH":
			return {
				position: new THREE.Vector3(0, y, -depth / 2),
				rotation: new THREE.Euler(0, 0, 0),
				scale: new THREE.Vector3(width, wallHeight, 0.08),
			};
		case "SOUTH":
			return {
				position: new THREE.Vector3(0, y, depth / 2),
				rotation: new THREE.Euler(0, Math.PI, 0),
				scale: new THREE.Vector3(width, wallHeight, 0.08),
			};
		case "EAST":
			return {
				position: new THREE.Vector3(width / 2, y, 0),
				rotation: new THREE.Euler(0, Math.PI / 2, 0),
				scale: new THREE.Vector3(depth, wallHeight, 0.08),
			};
		case "WEST":
			return {
				position: new THREE.Vector3(-width / 2, y, 0),
				rotation: new THREE.Euler(0, -Math.PI / 2, 0),
				scale: new THREE.Vector3(depth, wallHeight, 0.08),
			};
	}
}

function getLadderPosition(
	side: "NORTH" | "SOUTH" | "EAST" | "WEST",
	width: number,
	depth: number,
	floorHeight: number,
): { position: THREE.Vector3; rotation: THREE.Euler } {
	const offset = 0.3;

	switch (side) {
		case "NORTH":
			return {
				position: new THREE.Vector3(0, floorHeight / 2, -depth / 2 - offset),
				rotation: new THREE.Euler(-0.1, 0, 0),
			};
		case "SOUTH":
			return {
				position: new THREE.Vector3(0, floorHeight / 2, depth / 2 + offset),
				rotation: new THREE.Euler(0.1, Math.PI, 0),
			};
		case "EAST":
			return {
				position: new THREE.Vector3(width / 2 + offset, floorHeight / 2, 0),
				rotation: new THREE.Euler(0, Math.PI / 2, 0.1),
			};
		case "WEST":
			return {
				position: new THREE.Vector3(-width / 2 - offset, floorHeight / 2, 0),
				rotation: new THREE.Euler(0, -Math.PI / 2, -0.1),
			};
	}
}

function generateHutSnapPoints(
	width: number,
	depth: number,
	floorHeight: number,
	openSide: "NORTH" | "SOUTH" | "EAST" | "WEST",
): SnapPoint[] {
	const snapPoints: SnapPoint[] = [];
	const sides: ("NORTH" | "SOUTH" | "EAST" | "WEST")[] = ["NORTH", "SOUTH", "EAST", "WEST"];

	for (const side of sides) {
		if (side === openSide) continue; // Open side is entrance, not snap point

		const pos = getWallPosition(side, width, depth, floorHeight, 0);
		// Convert rotation to direction vector
		const direction = new THREE.Vector3(0, 0, 1).applyEuler(pos.rotation);
		snapPoints.push({
			id: `snap-${side}`,
			localPosition: pos.position.clone().setY(floorHeight),
			direction,
			acceptsTypes: ["BASIC_HUT", "LONGHOUSE", "STORAGE_SHED", "BRIDGE_SECTION"],
			occupied: false,
		});
	}

	return snapPoints;
}

function generateHutInteractionPoints(
	width: number,
	depth: number,
	floorHeight: number,
	openSide: "NORTH" | "SOUTH" | "EAST" | "WEST",
): InteractionPoint[] {
	const ladderPos = getLadderPosition(openSide, width, depth, floorHeight);

	const points: InteractionPoint[] = [
		{
			id: "enter",
			localPosition: ladderPos.position.clone().setY(0),
			type: "ENTER",
			radius: 1.5,
		},
	];

	if (floorHeight > 0.8) {
		points.push({
			id: "climb",
			localPosition: ladderPos.position.clone(),
			type: "CLIMB",
			radius: 1,
		});
	}

	return points;
}
