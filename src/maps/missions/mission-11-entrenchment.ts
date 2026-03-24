import type { MissionMapData } from "../types";
import { TerrainType as T } from "../types";

/**
 * Mission 11: Entrenchment — Heavy Defense
 * ~55×45 tiles. Open terrain ideal for defensive building.
 * Player starts from scratch — must build base and defenses.
 * 12 escalating waves from all directions.
 * BASE STATE IS SAVED after completion for Mission 13's returning base mechanic.
 *
 * Legend:
 *   G = Grass, D = Dirt, M = Mud, W = Water, V = Mangrove,
 *   B = Bridge, S = Toxic Sludge, H = Tall Grass
 */

function parseRow(row: string): T[] {
	const map: Record<string, T> = {
		G: T.Grass,
		D: T.Dirt,
		M: T.Mud,
		W: T.Water,
		V: T.Mangrove,
		B: T.Bridge,
		S: T.ToxicSludge,
		H: T.TallGrass,
	};
	return [...row].map((c) => map[c] ?? T.Grass);
}

// biome-ignore format: map layout must preserve visual alignment
const MAP_ROWS = [
	//        1111111111222222222233333333334444444444555555
	// 234567890123456789012345678901234567890123456789012345
	"GGGDDDDDGGGGGGGGGGGGGGGGGGGGGGGGGGGGDDDDDGGGGGGGGGGGG", // 0: North road (approach)
	"GGGDDDDDGGGGGGGGGGGGGGGGGGGGGGGGGGGGDDDDDGGGGGGGGGGGG", // 1
	"GGGDDDDDGGGGGGGGGGGGGGGGGGGGGGGGGGGGDDDDDGGGGGGGGGGGG", // 2
	"GGGDDDDDGGGGGGGGHHHHHGGGGGGHHHHHGGGGDDDDDGGGGGGGGGGGG", // 3
	"GGGDDDDDGGGGGGHHHHHHHGGGGGHHHHHHHGGGDDDDDGGGGGGGGGGGG", // 4
	"GGGDDDDDGGGGGHHHHHHHHHGGGHHHHHHHHHHGDDDDDGGGGGGGGGGGG", // 5
	"GGGDDDDDGGGGGGHHHHHHHGGGGGGHHHHHHHGGDDDDDGGGGGGGGGGGG", // 6
	"GGGDDDDDGGGGGGGGHHHHGGGGGGGGHHHGGGGDDDDDDGGGGGGGGGGGG", // 7
	"DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD", // 8: East-West road (north)
	"DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD", // 9
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG", // 10
	"GGGGGMMMGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGMMMMGGGGGG", // 11: Mud patches
	"GGGGMMMMMGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGMMMMMGGGGGGG", // 12
	"GGGMMMMMMMGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGMMMMMMGGGGGGGG", // 13
	"GGGGMMMMMGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGMMMMMGGGGGGG", // 14
	"GGGGGMMMGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGMMMMGGGGGG", // 15
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG", // 16
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG", // 17
	"GGGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDGGGGGGGGGGGGGGGGGGGG", // 18: Central build zone
	"GGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGGGGGGG", // 19
	"GGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGGGG",  // 20
	"GGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGG", // 21
	"GGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGG", // 22: BASE CENTER
	"GGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGG", // 23
	"GGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGG", // 24
	"GGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGGGG",  // 25
	"GGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGGGGGGG", // 26
	"GGGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDGGGGGGGGGGGGGGGGGGGG", // 27
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG", // 28
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG", // 29
	"GGGGGMMMGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGMMMMGGGGGG", // 30: Southern mud
	"GGGGMMMMMGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGMMMMMGGGGGGG", // 31
	"GGGMMMMMMMGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGMMMMMMGGGGGGGG", // 32
	"GGGGMMMMMGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGMMMMMGGGGGGG", // 33
	"GGGGGMMMGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGMMMMGGGGGG", // 34
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG", // 35
	"DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD", // 36: East-West road (south)
	"DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD", // 37
	"GGGDDDDDGGGGGGGGHHHHHGGGGGGGHHHHHGGGDDDDDGGGGGGGGGGGG", // 38
	"GGGDDDDDGGGGGGHHHHHHHHGGGGHHHHHHHHGGDDDDDGGGGGGGGGGGG", // 39
	"GGGDDDDDGGGGGHHHHHHHHHHGGHHHHHHHHHHGDDDDDGGGGGGGGGGGG", // 40
	"GGGDDDDDGGGGGGHHHHHHHHGGGGGHHHHHHHHGDDDDDGGGGGGGGGGGG", // 41
	"GGGDDDDDGGGGGGGGHHHHGGGGGGGGGHHHHGGGDDDDDGGGGGGGGGGGG", // 42
	"GGGDDDDDGGGGGGGGGGGGGGGGGGGGGGGGGGGGDDDDDGGGGGGGGGGGG", // 43: South road (approach)
	"GGGDDDDDGGGGGGGGGGGGGGGGGGGGGGGGGGGGDDDDDGGGGGGGGGGGG", // 44
];

const terrain: T[][] = MAP_ROWS.map(parseRow);
const cols = terrain[0].length;
const rows = terrain.length;

export const mission11Entrenchment: MissionMapData = {
	missionId: 11,
	name: "Entrenchment",
	cols,
	rows,
	terrain,

	playerStart: { tileX: 25, tileY: 22 },

	entities: [
		// Player starts with units only — no buildings
		{ type: "river-rat", tileX: 24, tileY: 22, faction: "ura" },
		{ type: "river-rat", tileX: 25, tileY: 22, faction: "ura" },
		{ type: "river-rat", tileX: 26, tileY: 22, faction: "ura" },
		{ type: "river-rat", tileX: 25, tileY: 21, faction: "ura" },
		{ type: "river-rat", tileX: 25, tileY: 23, faction: "ura" },
		{ type: "mudfoot", tileX: 23, tileY: 21, faction: "ura" },
		{ type: "mudfoot", tileX: 27, tileY: 21, faction: "ura" },
		{ type: "mudfoot", tileX: 23, tileY: 23, faction: "ura" },
		{ type: "mudfoot", tileX: 27, tileY: 23, faction: "ura" },
		{ type: "shellcracker", tileX: 24, tileY: 20, faction: "ura" },
		{ type: "shellcracker", tileX: 26, tileY: 20, faction: "ura" },
		{ type: "mortar-otter", tileX: 25, tileY: 20, faction: "ura" },

		// Resources (generous — player needs to build everything)
		{ type: "resource-fish", tileX: 5, tileY: 22, properties: { amount: 800 } },
		{ type: "resource-fish", tileX: 47, tileY: 22, properties: { amount: 800 } },
		{ type: "resource-timber", tileX: 15, tileY: 5, properties: { amount: 600 } },
		{ type: "resource-timber", tileX: 15, tileY: 40, properties: { amount: 600 } },
		{ type: "resource-timber", tileX: 37, tileY: 5, properties: { amount: 600 } },
		{ type: "resource-timber", tileX: 37, tileY: 40, properties: { amount: 600 } },
		{ type: "resource-salvage", tileX: 25, tileY: 10, properties: { amount: 500 } },
		{ type: "resource-salvage", tileX: 25, tileY: 35, properties: { amount: 500 } },
	],

	triggerZones: [
		// 4 approach roads (spawn points)
		{ id: "north-west-road", tileX: 1, tileY: 0, width: 6, height: 4 },
		{ id: "north-east-road", tileX: 34, tileY: 0, width: 6, height: 4 },
		{ id: "south-west-road", tileX: 1, tileY: 41, width: 6, height: 4 },
		{ id: "south-east-road", tileX: 34, tileY: 41, width: 6, height: 4 },
		// East-West road spawn points
		{ id: "west-road", tileX: 0, tileY: 8, width: 4, height: 2 },
		{ id: "east-road", tileX: 48, tileY: 8, width: 4, height: 2 },
		{ id: "west-road-south", tileX: 0, tileY: 36, width: 4, height: 2 },
		{ id: "east-road-south", tileX: 48, tileY: 36, width: 4, height: 2 },
		// Base perimeter
		{ id: "base-perimeter", tileX: 12, tileY: 17, width: 28, height: 12 },
	],
};
