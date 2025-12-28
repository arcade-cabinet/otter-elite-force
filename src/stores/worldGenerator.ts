import { generateChunk } from "./game/world/generator/chunkGenerator";
import { spawnPOISettlement } from "./game/world/generator/settlementGenerator";
import type { WorldLayout } from "./game/world/types";
import {
	DEFAULT_WORLD_CONFIG,
	generateWorldLayout,
	getKeyCoordinateForChunk,
	getTerrainForChunk,
} from "./worldLayout";

export { spawnPOISettlement, generateChunk };
export { DEFAULT_WORLD_CONFIG, generateWorldLayout, getKeyCoordinateForChunk, getTerrainForChunk };
export type { WorldLayout };

// Global world layout - generated once per game session
let _worldLayout: WorldLayout | null = null;

/**
 * Get or generate the world layout
 */
export function getWorldLayout(seed?: number): WorldLayout {
	if (!_worldLayout || (seed !== undefined && seed !== _worldLayout.seed)) {
		_worldLayout = generateWorldLayout({
			...DEFAULT_WORLD_CONFIG,
			seed: seed ?? Date.now(),
		});
	}
	return _worldLayout;
}

/**
 * Reset world layout
 */
export function resetWorldLayout(): void {
	_worldLayout = null;
}

/**
 * Legacy KEY_COORDINATES export for backward compatibility
 */
export function getKeyCoordinates(): Record<
	string,
	{
		x: number;
		z: number;
		name: string;
		rescueCharacter?: string;
		isBossArea?: boolean;
		specialObjective?: string;
	}
> {
	const layout = getWorldLayout();
	const result: Record<string, any> = {};

	for (const [id, point] of layout.points) {
		if (point.type !== "WAYPOINT") {
			result[id] = {
				x: point.x,
				z: point.z,
				name: getPointName(point),
				rescueCharacter: point.rescueCharacter,
				isBossArea: point.isBossArea,
				specialObjective: point.specialObjective,
			};
		}
	}

	return result;
}

function getPointName(point: any): string {
	switch (point.type) {
		case "LZ":
			return "Landing Zone / Base";
		case "VILLAGE":
			return "Native Village";
		case "HEALER_HUB":
			return "Healer's Grove";
		case "PRISON_CAMP":
			return "Prison Camp";
		case "ENEMY_OUTPOST":
			return "Scale-Guard Outpost";
		case "SIPHON_CLUSTER":
			return "Siphon Cluster";
		case "GAS_DEPOT":
			return "Gas Depot";
		case "BOSS_ARENA":
			return "The Great Siphon";
		case "RAFT_DOCK":
			return "River Crossing";
		default:
			return "Unknown Location";
	}
}
