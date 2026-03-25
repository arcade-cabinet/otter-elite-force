/** Terrain types matching spec §8.1 */
export enum TerrainType {
	Grass = 0,
	Dirt = 1,
	Mud = 2,
	Water = 3,
	Mangrove = 4,
	Bridge = 5,
	ToxicSludge = 6,
	TallGrass = 7,
}

/** Pathfinding cost per terrain type (spec §8.3) */
export const TERRAIN_COST: Record<TerrainType, number> = {
	[TerrainType.Grass]: 1,
	[TerrainType.Dirt]: 1,
	[TerrainType.Mud]: 2,
	[TerrainType.Water]: Infinity,
	[TerrainType.Mangrove]: 3,
	[TerrainType.Bridge]: 1,
	[TerrainType.ToxicSludge]: 2,
	[TerrainType.TallGrass]: 1.5,
};

/** Map terrain texture key lookup */
export const TERRAIN_TEXTURE: Record<TerrainType, string> = {
	[TerrainType.Grass]: "grass",
	[TerrainType.Dirt]: "dirt",
	[TerrainType.Mud]: "mud",
	[TerrainType.Water]: "water",
	[TerrainType.Mangrove]: "mangrove",
	[TerrainType.Bridge]: "bridge",
	[TerrainType.ToxicSludge]: "toxic-sludge",
	[TerrainType.TallGrass]: "tall-grass",
};

/** Entity placed on the object layer */
export interface MapEntity {
	type: string;
	tileX: number;
	tileY: number;
	faction?: "ura" | "scale-guard";
	properties?: Record<string, unknown>;
}

/** Trigger zone for scenario scripting */
export interface MapTriggerZone {
	id: string;
	tileX: number;
	tileY: number;
	width: number;
	height: number;
}

/** Complete mission map data */
export interface MissionMapData {
	missionId: number;
	name: string;
	cols: number;
	rows: number;
	terrain: TerrainType[][];
	entities: MapEntity[];
	triggerZones: MapTriggerZone[];
	playerStart: { tileX: number; tileY: number };
}
