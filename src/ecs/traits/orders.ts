import { trait } from "koota";

/**
 * Order types that can be queued on a unit.
 * - move: pathfind to (targetX, targetY)
 * - attack: pathfind to target entity, engage when in range
 * - gather: pathfind to resource node, begin gathering
 * - build: pathfind to (targetX, targetY), construct buildingType
 * - stop: clear all orders, halt movement
 * - patrol: cycle between waypoints
 */
export interface Order {
	type: "move" | "attack" | "gather" | "build" | "stop" | "patrol";
	targetX?: number;
	targetY?: number;
	targetEntity?: number;
	buildingType?: string;
	waypoints?: Array<{ x: number; y: number }>;
}

/** Queue of commands for this entity — AoS for array data */
export const OrderQueue = trait(() => [] as Order[]);

/** Rally point for buildings that produce units */
export const RallyPoint = trait({ x: 0, y: 0 });
