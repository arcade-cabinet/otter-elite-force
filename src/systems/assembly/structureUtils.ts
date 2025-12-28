import * as THREE from "three";
import type { AssemblyRandom } from "./assemblyUtils";
import type { AssemblyConfig, InteractionPoint, SnapPoint } from "./types";

/**
 * Calculates positions for stilts based on hut dimensions
 */
export function calculateStiltPositions(
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

/**
 * Calculates position and rotation for a wall on a given side
 */
export function getWallPosition(
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

/**
 * Calculates position and rotation for a ladder on a given side
 */
export function getLadderPosition(
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

/**
 * Generates snap points for a hut
 */
export function generateHutSnapPoints(
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

/**
 * Generates interaction points for a hut
 */
export function generateHutInteractionPoints(
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
