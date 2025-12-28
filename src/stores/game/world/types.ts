import type { TerrainType } from "../../types";

export type PointOfInterestType =
	| "LZ" // Landing zone / player spawn
	| "VILLAGE" // Friendly village with civilians
	| "HEALER_HUB" // Healer location
	| "PRISON_CAMP" // Rescue location
	| "ENEMY_OUTPOST" // Scale-Guard outpost
	| "SIPHON_CLUSTER" // Oil extraction points
	| "GAS_DEPOT" // Gas stockpile cluster
	| "BOSS_ARENA" // Major objective / boss
	| "WAYPOINT" // Path connection point
	| "RAFT_DOCK"; // River crossing point

export interface WorldPoint {
	x: number;
	z: number;
	type: PointOfInterestType;
	difficulty: number; // 0-1, affects enemy density and tier
	terrainType: TerrainType;
	connections: string[]; // IDs of connected points
	rescueCharacter?: string;
	isBossArea?: boolean;
	specialObjective?: string;
}

export interface WorldLayout {
	seed: number;
	points: Map<string, WorldPoint>;
	rescueLocations: Map<string, WorldPoint>;
	paths: Array<{ from: string; to: string; terrainType: TerrainType }>;
	terrainZones: Map<string, TerrainType>; // chunk ID -> terrain type
}

export interface WorldLayoutConfig {
	seed: number;
	worldRadius: number; // How far the world extends from origin
	minPOIDistance: number; // Minimum distance between POIs
	villageCount: number;
	outpostCount: number;
	siphonClusterCount: number;
	rescueCharacters: string[]; // Characters to place in rescue locations
}
