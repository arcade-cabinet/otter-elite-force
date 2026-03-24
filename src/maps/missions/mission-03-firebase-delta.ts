import type { MissionMapData } from "../types";
import { TerrainType as T } from "../types";

/**
 * Mission 3: Firebase Delta — King of the Hill
 * ~40×40 tiles. Three capture points arranged in a triangle with
 * paths between them. Player has a small base at the south.
 * Scale-Guard controls the north. Must hold all 3 points for 2 minutes.
 *
 * Layout:
 *   Point A (NW) --- path --- Point B (NE)
 *       \                       /
 *        \                     /
 *         \      center       /
 *          \                 /
 *           --- Point C (S) ---
 *                 |
 *             Player Base
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
	//        1111111111222222222233333333
	// 234567890123456789012345678901234567890
	"VVVVGGGGGGGGGGGDDDDDDDDGGGGGGGGGGVVVV", // 0: Scale-Guard territory (north)
	"VVVGGGGGGGGGGDDDDDDDDDDDGGGGGGGGGVVVV", // 1
	"VVGGGGGGGGGDDDDDDDDDDDDDDGGGGGGGGVVVV", // 2
	"VGGGGGGGGDDDDDDDDDDDDDDDDDDGGGGGGGVVV", // 3: Enemy base area
	"GGGGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGGGGG", // 4
	"GGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG", // 5
	"GGGGGDDDDDDGGGGGGGGGGGGGGGDDDDDDGGGGGG", // 6
	"GGGGDDDDDGGGGGGGGGGGGGGGGGGDDDDDDGGGGG", // 7: Point A (NW) ---- path ---- Point B (NE)
	"GGGDDDDDGGGGGGGGGGGGGGGGGGGGDDDDDDGGGG", // 8
	"GGDDDDGGGGGGGGGGGGGGGGGGGGGGGGDDDDDGGG", // 9
	"GGDDDGGGGGGGGGGGGGGGGGGGGGGGGGGGDDDDGG", // 10
	"GDDDDGGGGGGGGGGGGGGGGGGGGGGGGGGGDDDDGG", // 11
	"GDDDGGGGGGGGGGGGGGGGGGGGGGGGGGGGGDDDGG", // 12
	"GDDGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGDDG", // 13
	"GDDGGGGGGGGGGGHHHHHHHHGGGGGGGGGGGGGDDG", // 14: Central concealment
	"GDGGGGGGGGGGGHHHHHHHHHHHGGGGGGGGGGGGDDG", // 15
	"GDGGGGGGGGGHHHHHHHHHHHHHHHGGGGGGGGGGDDG", // 16
	"GDGGGGGGGGHHHHHHHGGGHHHHHHHGGGGGGGGGDDG", // 17: Open center
	"GDGGGGGGGHHHHHGGGGGGGGGHHHHHHGGGGGGGDDG", // 18
	"GDGGGGGGHHHGGGGGGGGGGGGGGGHHHHGGGGGGGDG", // 19
	"GDGGGGGHHGGGGGGGGGGGGGGGGGGGHHHGGGGGGDG", // 20
	"GDGGGGHGGGGGGGGGGGGGGGGGGGGGGGHHGGGGGDG", // 21
	"GDDGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGDDGG", // 22
	"GGDDGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGDDGGG", // 23
	"GGGDDGGGGGGGGGGGGGGGGGGGGGGGGGGGDDDGGGG", // 24
	"GGGDDDGGGGGGGGGGGGGGGGGGGGGGGGGDDDGGGGG", // 25
	"GGGGDDDGGGGGGGGGGGGGGGGGGGGGGDDDDGGGGGG", // 26
	"GGGGGDDDDGGGGGGGGGGGGGGGGGDDDDDGGGGGGG",  // 27: Converging paths
	"GGGGGGDDDDDGGGGGGGGGGGGDDDDDDGGGGGGGGGG", // 28
	"GGGGGGGDDDDDDDDGGGDDDDDDDDGGGGGGGGGWWW", // 29: Point C (south)
	"GGGGGGGGGDDDDDDDDDDDDDDDDGGGGGGGGGWWWW", // 30
	"GGGGGGGGGGGDDDDDDDDDDDDDGGGGGGGGWWWWWW", // 31
	"GGGGGGGGGGGGDDDDDDDDDDDGGGGGGGWWWWWWWW", // 32
	"GGGGGGGGGGGGGDDDDDDDDDGGGGGWWWWWWWWWWW", // 33
	"GGGGGGGGGGGGGGDDDDDDDGGGGWWWWWWWWWWWWW", // 34
	"GGGMMMGGGGGGGGGDDDDDDGGWWWWWWWWWWWWWWW", // 35: Player base area
	"GGMMMMMMGGGGGGGGDDDDDDGWWWWWWWWWWWWWWWW", // 36
	"GMMMMMMMMGGGGGGDDDDDDDGWWWWWWWWWWWWWWWW", // 37
	"GMMMMMMMMGGGGGDDDDDDDDGWWWWWWWWWWWWWWWW", // 38
	"MMMMMMMMMGGGGGDDDDDDDDGWWWWWWWWWWWWWWWW", // 39
];

const terrain: T[][] = MAP_ROWS.map(parseRow);
const cols = terrain[0].length;
const rows = terrain.length;

export const mission03FirebaseDelta: MissionMapData = {
	missionId: 3,
	name: "Firebase Delta",
	cols,
	rows,
	terrain,

	playerStart: { tileX: 15, tileY: 37 },

	entities: [
		// Player small base (south)
		{
			type: "command-post",
			tileX: 15,
			tileY: 37,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "barracks",
			tileX: 12,
			tileY: 37,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "burrow",
			tileX: 18,
			tileY: 37,
			faction: "ura",
			properties: { preBuilt: true },
		},

		// Starting URA units
		{ type: "mudfoot", tileX: 13, tileY: 36, faction: "ura" },
		{ type: "mudfoot", tileX: 14, tileY: 36, faction: "ura" },
		{ type: "mudfoot", tileX: 15, tileY: 36, faction: "ura" },
		{ type: "mudfoot", tileX: 16, tileY: 36, faction: "ura" },
		{ type: "shellcracker", tileX: 14, tileY: 35, faction: "ura" },
		{ type: "shellcracker", tileX: 16, tileY: 35, faction: "ura" },
		{ type: "river-rat", tileX: 17, tileY: 38, faction: "ura" },
		{ type: "river-rat", tileX: 18, tileY: 38, faction: "ura" },

		// Scale-Guard defenders at capture points
		// Point A (NW ~ tile 5,8)
		{ type: "gator", tileX: 5, tileY: 7, faction: "scale-guard" },
		{ type: "gator", tileX: 4, tileY: 8, faction: "scale-guard" },
		{ type: "viper", tileX: 6, tileY: 9, faction: "scale-guard" },

		// Point B (NE ~ tile 33,8)
		{ type: "gator", tileX: 33, tileY: 7, faction: "scale-guard" },
		{ type: "gator", tileX: 34, tileY: 8, faction: "scale-guard" },
		{ type: "viper", tileX: 32, tileY: 9, faction: "scale-guard" },

		// Point C (S ~ tile 18,30)
		{ type: "gator", tileX: 18, tileY: 29, faction: "scale-guard" },
		{ type: "viper", tileX: 17, tileY: 30, faction: "scale-guard" },

		// Scale-Guard base (north) — reinforcement source
		{
			type: "spawning-pool",
			tileX: 18,
			tileY: 3,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},

		// Resources
		{
			type: "resource-fish",
			tileX: 32,
			tileY: 32,
			properties: { amount: 400 },
		},
		{
			type: "resource-timber",
			tileX: 3,
			tileY: 35,
			properties: { amount: 300 },
		},
		{
			type: "resource-salvage",
			tileX: 19,
			tileY: 20,
			properties: { amount: 200 },
		},
	],

	triggerZones: [
		// Capture point zones
		{
			id: "capture-point-a",
			tileX: 3,
			tileY: 6,
			width: 5,
			height: 5,
		},
		{
			id: "capture-point-b",
			tileX: 31,
			tileY: 6,
			width: 5,
			height: 5,
		},
		{
			id: "capture-point-c",
			tileX: 16,
			tileY: 28,
			width: 5,
			height: 5,
		},
		// Central ambush area
		{
			id: "center-approach",
			tileX: 12,
			tileY: 14,
			width: 14,
			height: 8,
		},
	],
};
