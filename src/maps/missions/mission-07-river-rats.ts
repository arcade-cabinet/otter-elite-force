import type { MissionMapData } from "../types";
import { TerrainType as T } from "../types";

/**
 * Mission 7: River Rats — Capture the Flag
 * ~55×40 tiles. A wide river divides the map east-west.
 * Player base on the west side, enemy base on the east side.
 * Two bridges connect the halves. Must capture 5 enemy supply crates
 * from the east side and return them to the player's base.
 * Teaches: Raftsmen, water traversal, Dock building.
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
	"VVVVVGGGGGGGGGDDDDDDDDWWWWWWWWWDDDDDDDDGGGGGGGGGVVVVV", // 0
	"VVVVGGGGGGGGDDDDDDDDDDWWWWWWWWWDDDDDDDDDDGGGGGGGVVVVV", // 1
	"VVVGGGGGGGDDDDDDDDDDDDDWWWWWWWDDDDDDDDDDDDGGGGGGGVVVV", // 2
	"VVGGGGGGGDDDDDDDDDDDDDDWWWWWWWDDDDDDDDDDDDDDGGGGGVVVV", // 3
	"VGGGGGGDDDDDDDDDDDDDDDDWWWWWWWDDDDDDDDDDDDDDDGGGGGVVV", // 4
	"GGGGGGDDDDDHHHGGGGGGDDDDWWWWWWDDDDGGGGGGHHHDDDDDDGGGGG", // 5
	"GGGGGDDDDHHHHHHGGGGGDDDDWWWWWWDDDDGGGGGHHHHHDDDDDDGGGG", // 6
	"GGGGDDDDDHHHHHHHGGGGDDDDWWWWWWDDDDGGGGHHHHHHDDDDDDDGGG", // 7
	"GGGDDDDDGHHHHHGGGGGGDDDDWWWWWWDDDDGGGGGHHHHHGDDDDDDDGG", // 8
	"GGGDDDDDDGHHGGGGGGDDDDDDBBBBBBDDDDDDGGGGHHGGDDDDDDDDGG", // 9: North bridge
	"GGDDDDDDDDGGGGGGGGDDDDDDBBBBBBDDDDDDDGGGGGDDDDDDDDDDGG", // 10
	"GGDDDDDDDDGGGGGGGGDDDDDDWWWWWWDDDDDDDDGGGGDDDDDDDDDDGG", // 11
	"GDDDDDDDDDGVVVGGGGGDDDDWWWWWWWDDDDGGGGVVVGDDDDDDDDDDGG", // 12: Mangrove islands
	"GDDDDDDDDDVVVVVGGGGDDDDWWWWWWWDDDDGGGVVVVVDDDDDDDDDDGG", // 13
	"GDDDDDDDDDVVVVVGGGGDDDDWWWWWWWDDDDGGGVVVVVDDDDDDDDDDGG", // 14
	"GDDDDDDDDDDVVVGGGGDDDDWWWWWWWWDDDDGGGGVVVDDDDDDDDDDDGG", // 15
	"GDDDDDDDDDDGGGGGGDDDDDDWWWWWWDDDDDDGGGGGDDDDDDDDDDDDGG", // 16
	"GDDDDDDDDDDDGGGGDDDDDDWWWWWWWWDDDDDDGGGDDDDDDDDDDDDDGG", // 17
	"GDDDDDDDDDDDDGDDDDDDDDWWWWWWWWDDDDDDDDGDDDDDDDDDDDDDGG", // 18
	"GDDDDDDDDDDDDDDDDDDDDWWWWWWWWWWDDDDDDDDDDDDDDDDDDDDDGG", // 19: River center (widest)
	"GDDDDDDDDDDDDDDDDDDDDWWWWWWWWWWDDDDDDDDDDDDDDDDDDDDDGG", // 20
	"GDDDDDDDDDDDDGDDDDDDDDWWWWWWWWDDDDDDDDGDDDDDDDDDDDDDGG", // 21
	"GDDDDDDDDDDDGGGGDDDDDDWWWWWWWWDDDDDDGGGDDDDDDDDDDDDDGG", // 22
	"GDDDDDDDDDDGGGGGGDDDDDDWWWWWWDDDDDDGGGGGDDDDDDDDDDDDGG", // 23
	"GDDDDDDDDDDGVVVGGGGGDDDWWWWWWWDDDGGGGVVVGDDDDDDDDDDDGG", // 24: More mangroves
	"GDDDDDDDDDDVVVVVGGGGDDDWWWWWWWDDDGGGVVVVVDDDDDDDDDDDGG", // 25
	"GDDDDDDDDDDDVVVGGGGDDDDWWWWWWWDDDDGGGVVVDDDDDDDDDDDDGG", // 26
	"GGDDDDDDDDGGGGGGGGDDDDDDWWWWWWDDDDDDGGGGDDDDDDDDDDDDGG", // 27
	"GGDDDDDDDDGGGGGGGGDDDDDDBBBBBBDDDDDDGGGGDDDDDDDDDDDDGG", // 28: South bridge
	"GGGDDDDDDDGGHHGGGGGDDDDDBBBBBBDDDDDGGGGHGDDDDDDDDDDDGG", // 29
	"GGGDDDDDDGHHHHHGGGGGDDDDWWWWWWDDDDGGGHHHHGDDDDDDDDDGGG", // 30
	"GGGGDDDDDHHHHHHHHGGGDDDDWWWWWWDDDDGGHHHHHHDDDDDDDDGGGG", // 31
	"GGGGGDDDDGHHHHHGGGGDDDDDDWWWWWDDDDDGGGHHHGGDDDDDGGGGGG", // 32
	"GGGGGGDDDDDGHGGGGGDDDDDDDWWWWWDDDDDDDGGGGDDDDDDGGGGGG",  // 33
	"VVGGGGGDDDDDDDDDDDDDDDDDDWWWWDDDDDDDDDDDDDDDDDDGGGVVV", // 34
	"VVVGGGGGDDDDDDDDDDDDDDDDWWWWWWDDDDDDDDDDDDDDDDDGGGVVV", // 35
	"VVVVGGGGGDDDDDDDDDDDDDDDWWWWWWDDDDDDDDDDDDDDDDGGGGVVV", // 36
	"VVVVVGGGGGGDDDDDDDDDDDDDDWWWWDDDDDDDDDDDDDDDGGGGGVVVV", // 37
	"VVVVVVGGGGGGGGDDDDDDDDDDDDWWWDDDDDDDDDDDDDDGGGGGVVVVV", // 38
	"VVVVVVVGGGGGGGGGGDDDDDDDDDDWDDDDDDDDDDDDGGGGGGGVVVVVV", // 39
];

const terrain: T[][] = MAP_ROWS.map(parseRow);
const cols = terrain[0].length;
const rows = terrain.length;

export const mission07RiverRats: MissionMapData = {
	missionId: 7,
	name: "River Rats",
	cols,
	rows,
	terrain,

	playerStart: { tileX: 10, tileY: 19 },

	entities: [
		// Player base (west side)
		{
			type: "command-post",
			tileX: 8,
			tileY: 19,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "barracks",
			tileX: 5,
			tileY: 17,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "armory",
			tileX: 5,
			tileY: 21,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "burrow",
			tileX: 10,
			tileY: 17,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "burrow",
			tileX: 10,
			tileY: 21,
			faction: "ura",
			properties: { preBuilt: true },
		},

		// Player starting units
		{ type: "mudfoot", tileX: 9, tileY: 18, faction: "ura" },
		{ type: "mudfoot", tileX: 10, tileY: 18, faction: "ura" },
		{ type: "mudfoot", tileX: 11, tileY: 18, faction: "ura" },
		{ type: "mudfoot", tileX: 9, tileY: 20, faction: "ura" },
		{ type: "mudfoot", tileX: 10, tileY: 20, faction: "ura" },
		{ type: "mudfoot", tileX: 11, tileY: 20, faction: "ura" },
		{ type: "shellcracker", tileX: 7, tileY: 18, faction: "ura" },
		{ type: "shellcracker", tileX: 7, tileY: 20, faction: "ura" },
		{ type: "river-rat", tileX: 12, tileY: 19, faction: "ura" },
		{ type: "river-rat", tileX: 12, tileY: 20, faction: "ura" },
		{ type: "river-rat", tileX: 12, tileY: 21, faction: "ura" },

		// Enemy supply crates (east side — 5 total)
		{
			type: "supply-crate",
			tileX: 42,
			tileY: 8,
			properties: { tag: "crate-1" },
		},
		{
			type: "supply-crate",
			tileX: 48,
			tileY: 15,
			properties: { tag: "crate-2" },
		},
		{
			type: "supply-crate",
			tileX: 45,
			tileY: 22,
			properties: { tag: "crate-3" },
		},
		{
			type: "supply-crate",
			tileX: 40,
			tileY: 30,
			properties: { tag: "crate-4" },
		},
		{
			type: "supply-crate",
			tileX: 46,
			tileY: 35,
			properties: { tag: "crate-5" },
		},

		// Scale-Guard defenders (east side)
		{
			type: "sludge-pit",
			tileX: 44,
			tileY: 19,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{
			type: "spawning-pool",
			tileX: 44,
			tileY: 22,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{
			type: "venom-spire",
			tileX: 38,
			tileY: 10,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{
			type: "venom-spire",
			tileX: 38,
			tileY: 28,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{ type: "gator", tileX: 40, tileY: 10, faction: "scale-guard" },
		{ type: "gator", tileX: 42, tileY: 18, faction: "scale-guard" },
		{ type: "gator", tileX: 42, tileY: 20, faction: "scale-guard" },
		{ type: "gator", tileX: 40, tileY: 28, faction: "scale-guard" },
		{ type: "viper", tileX: 45, tileY: 12, faction: "scale-guard" },
		{ type: "viper", tileX: 45, tileY: 26, faction: "scale-guard" },
		{ type: "scout-lizard", tileX: 35, tileY: 15, faction: "scale-guard" },
		{ type: "scout-lizard", tileX: 35, tileY: 25, faction: "scale-guard" },

		// Resources
		{ type: "resource-fish", tileX: 3, tileY: 12, properties: { amount: 500 } },
		{ type: "resource-fish", tileX: 3, tileY: 28, properties: { amount: 500 } },
		{ type: "resource-timber", tileX: 12, tileY: 5, properties: { amount: 400 } },
		{ type: "resource-timber", tileX: 12, tileY: 35, properties: { amount: 400 } },
		{ type: "resource-salvage", tileX: 15, tileY: 19, properties: { amount: 300 } },
	],

	triggerZones: [
		// Bridge zones
		{ id: "north-bridge", tileX: 22, tileY: 8, width: 6, height: 4 },
		{ id: "south-bridge", tileX: 22, tileY: 27, width: 6, height: 4 },
		// Player base (crate delivery zone)
		{ id: "player-base-delivery", tileX: 4, tileY: 16, width: 10, height: 8 },
		// East side zones near crates
		{ id: "east-territory", tileX: 35, tileY: 0, width: 20, height: 40 },
	],
};
