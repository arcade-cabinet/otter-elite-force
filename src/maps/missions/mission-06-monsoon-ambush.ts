import type { MissionMapData } from "../types";
import { TerrainType as T } from "../types";

/**
 * Mission 6: Monsoon Ambush — Survival / Timed
 * ~50×40 tiles. Player has a pre-built base in the center.
 * 8 waves of Scale-Guard attack from all directions across 3 monsoon cycles.
 * Terrain is mostly open grass with mud patches that slow during rain.
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
	//        1111111111222222222233333333334444444444
	// 234567890123456789012345678901234567890123456789
	"GGGGDDDDDGGGGGGGGGGGGGGGGGGGGGGGGGDDDDDGGGGGGGG", // 0: North approach roads
	"GGGGDDDDDGGGGGGGGGGGGGGGGGGGGGGGGGDDDDDGGGGGGGG", // 1
	"GGGGDDDDDGGGGGGGGHHHHHGGGGGHHHHGGDDDDDGGGGGGGGG", // 2
	"GGGGDDDDDGGGGGGGHHHHHHGGGGHHHHHGGDDDDDGGGGGGGGG", // 3
	"GGGGDDDDDGGGGGGHHHHHHHGGGHHHHHHGGDDDDDGGGGGGGGG", // 4
	"GGGGDDDDDGGGGGGGHHHHHGGGGGHHHHHGGGDDDDDGGGGGGGG", // 5
	"GGGGDDDDDGGGGGGGGHHHGGGGGGGHHGGGGGDDDDDGGGGGGGG", // 6
	"GGGGDDDDDGGGGGGGGGGGGGGGGGGGGGGGGGGDDDDDGGGGGGG", // 7
	"GGGGGDDDDGGGGGGGGGGGGGGGGGGGGGGGGGGDDDDGGGGGGGG", // 8
	"GGGGGDDDDMMMMMGGGGGGGGGGGGGGGGMMMMMDDDDGGGGGGGG", // 9: Mud patches (slow during rain)
	"GGGGGGDDDDMMMMMGGGGGGGGGGGGGGMMMMMDDDDGGGGGGGGG", // 10
	"GGGGGGGDDDDMMMMGGGGGGGGGGGGGGMMMMDDDDGGGGGGGGGG", // 11
	"DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD", // 12: East-West road
	"DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD", // 13
	"GGGGGGGGGGGMMMMGGGGGGGGGGGGGMMMMMGGGGGGGGGGGGGGG", // 14
	"GGGGGGGGGGMMMMGGGDDDDDDDDDDDDGGGMMMMMGGGGGGGGGG", // 15: Inner base area
	"GGGGGGGGGMMMMGGDDDDDDDDDDDDDDDDGGGMMMGGGGGGGGGG", // 16
	"GGGGGGGGMMMMGGDDDDDDDDDDDDDDDDDDDGGMMMGGGGGGGGG", // 17
	"GGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGG",  // 18: BASE CENTER
	"GGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGG",  // 19
	"GGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGG",  // 20
	"GGGGGGGGMMMMGGDDDDDDDDDDDDDDDDDDDGGMMMGGGGGGGGG", // 21
	"GGGGGGGGGMMMGGDDDDDDDDDDDDDDDDDDGGGMMMGGGGGGGG",  // 22
	"GGGGGGGGGGMMMGGDDDDDDDDDDDDDDDDGGGMMMGGGGGGGGG",  // 23
	"GGGGGGGGGGGMMMMGGGDDDDDDDDDDDDGGGMMMMMGGGGGGGG",   // 24
	"DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD", // 25: East-West road (south)
	"DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD", // 26
	"GGGGGGGGGGMMMMMGGGGGGGGGGGGGGMMMMMGGGGGGGGGGGGGG", // 27
	"GGGGGGGGGMMMMMGGGGGGGGGGGGGGGMMMMMGGGGGGGGGGGGG",  // 28
	"GGGGGGGGMMMMMGGGGGGGGGGGGGGGGMMMMMGGGGGGGGGGGGGG", // 29
	"GGGGGGGGGMMMGGGGGGGHHHHGGGGGGGMMMGGGGGGGGGGGGGGG", // 30
	"GGGGGGGGGGGGGGGGGHHHHHHHHGGGGGGGGGGGGGGGGGGGGGGG",  // 31
	"GGGDDDDDGGGGGGGHHHHHHHHHHHGGGGGGGGGDDDDDGGGGGGGG", // 32: South approach roads
	"GGGDDDDDGGGGGGHHHHHHHHHHHHHGGGGGGGGDDDDDGGGGGGGG", // 33
	"GGGDDDDDGGGGGGGHHHHHHHHHHGGGGGGGGGDDDDDGGGGGGGGG", // 34
	"GGGDDDDDGGGGGGGGGHHHHHHGGGGGGGGGGDDDDDGGGGGGGGGG", // 35
	"GGGDDDDDGGGGGGGGGGGHHHGGGGGGGGGGGDDDDDGGGGGGGGG",  // 36
	"GGGDDDDDGGGGGGGGGGGGGGGGGGGGGGGGDDDDDGGGGGGGGGG",  // 37
	"GGGDDDDDGGGGGGGGGGGGGGGGGGGGGGGGDDDDDGGGGGGGGGG",  // 38
	"GGGDDDDDGGGGGGGGGGGGGGGGGGGGGGGGDDDDDGGGGGGGGGG",  // 39
];

const terrain: T[][] = MAP_ROWS.map(parseRow);
const cols = terrain[0].length;
const rows = terrain.length;

export const mission06MonsoonAmbush: MissionMapData = {
	missionId: 6,
	name: "Monsoon Ambush",
	cols,
	rows,
	terrain,

	playerStart: { tileX: 24, tileY: 19 },

	entities: [
		// Pre-built base (center)
		{
			type: "command-post",
			tileX: 24,
			tileY: 19,
			faction: "ura",
			properties: { preBuilt: true, tag: "ura-command-post" },
		},
		{
			type: "barracks",
			tileX: 21,
			tileY: 17,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "barracks",
			tileX: 27,
			tileY: 17,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "armory",
			tileX: 24,
			tileY: 16,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "watchtower",
			tileX: 18,
			tileY: 15,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "watchtower",
			tileX: 30,
			tileY: 15,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "watchtower",
			tileX: 18,
			tileY: 23,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "watchtower",
			tileX: 30,
			tileY: 23,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "sandbag-wall",
			tileX: 19,
			tileY: 14,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "sandbag-wall",
			tileX: 29,
			tileY: 14,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "burrow",
			tileX: 22,
			tileY: 21,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "burrow",
			tileX: 26,
			tileY: 21,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "fish-trap",
			tileX: 20,
			tileY: 19,
			faction: "ura",
			properties: { preBuilt: true },
		},

		// Starting garrison
		{ type: "mudfoot", tileX: 22, tileY: 18, faction: "ura" },
		{ type: "mudfoot", tileX: 23, tileY: 18, faction: "ura" },
		{ type: "mudfoot", tileX: 25, tileY: 18, faction: "ura" },
		{ type: "mudfoot", tileX: 26, tileY: 18, faction: "ura" },
		{ type: "shellcracker", tileX: 20, tileY: 19, faction: "ura" },
		{ type: "shellcracker", tileX: 28, tileY: 19, faction: "ura" },
		{ type: "shellcracker", tileX: 20, tileY: 20, faction: "ura" },
		{ type: "shellcracker", tileX: 28, tileY: 20, faction: "ura" },
		{ type: "river-rat", tileX: 23, tileY: 20, faction: "ura" },
		{ type: "river-rat", tileX: 25, tileY: 20, faction: "ura" },

		// Resources (scattered around the base perimeter)
		{ type: "resource-fish", tileX: 10, tileY: 19, properties: { amount: 400 } },
		{ type: "resource-fish", tileX: 38, tileY: 19, properties: { amount: 400 } },
		{ type: "resource-timber", tileX: 24, tileY: 5, properties: { amount: 300 } },
		{ type: "resource-timber", tileX: 24, tileY: 34, properties: { amount: 300 } },
		{ type: "resource-salvage", tileX: 5, tileY: 5, properties: { amount: 200 } },
		{ type: "resource-salvage", tileX: 43, tileY: 35, properties: { amount: 200 } },
	],

	triggerZones: [
		// Spawn corridors — 4 approach roads
		{ id: "north-west-approach", tileX: 2, tileY: 0, width: 6, height: 5 },
		{ id: "north-east-approach", tileX: 32, tileY: 0, width: 6, height: 5 },
		{ id: "south-west-approach", tileX: 2, tileY: 35, width: 6, height: 5 },
		{ id: "south-east-approach", tileX: 32, tileY: 35, width: 6, height: 5 },
		// Base perimeter
		{ id: "base-perimeter", tileX: 16, tileY: 14, width: 16, height: 12 },
	],
};
