import type { MissionMapData } from "../types";
import { TerrainType as T } from "../types";

/**
 * Mission 5: Siphon Valley — Base Build + Destroy
 * ~60×45 tiles. A wide river valley with 3 siphon installations.
 * Player starts at the south with full base-building capability.
 * Three siphons are spread across the map: west, center-north, east.
 * Toxic sludge radiates from each active siphon.
 * Destroying a siphon restores the surrounding terrain.
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
	//        1111111111222222222233333333334444444444555555555
	// 234567890123456789012345678901234567890123456789012345678
	"VVVVVGGGGGGGGGGGGGGGGDDDDDDDDDDDDDDDGGGGGGGGGGGGGGVVVVV", // 0: North edge
	"VVVVGGGGGGGGGGGGGGDDDDDDDSSSSDDDDDDDDDDGGGGGGGGGGGGVVVV", // 1
	"VVVGGGGGGGGGGGGGDDDDDDDSSSSSSSDDDDDDDDDDGGGGGGGGGGGVVVV", // 2
	"VVGGGGGGGGGGGGDDDDDDDSSSSSSSSSSDDDDDDDDDDGGGGGGGGGGVVVV", // 3: Siphon 2 (center-north) — toxic zone
	"VVGGGGGGGGGGGDDDDDDDSSSSSDSSSSSSDDDDDDDDDGGGGGGGGGGVVVV", // 4
	"VVGGGGGGGGGGDDDDDDDDSSSSDDDSSSSDDDDDDDDDDDGGGGGGGGGVVVV", // 5
	"VGGGGGGGGGGGDDDDDDDDDSDDDDDDSSDDDDDDDDDDDDGGGGGGGGGGVV", // 6
	"GGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGG", // 7
	"GGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGG", // 8
	"GGGGGGGGGGDDDDDDDDDGGGGGDDDDDDDDGGGGGDDDDDDDDGGGGGGGGGG", // 9
	"GGGGGGGGGDDDDDDDDGGGGGGGGDDDDDDGGGGGGGGDDDDDDDDGGGGGGG",  // 10
	"SSSGGGGGDDDDDDDDGGGGGGGGGDDDDDDGGGGGGGGGDDDDDDDDGGGGGG",  // 11: Siphon 1 (west) toxic zone
	"SSSSGGDDDDDDDDDGGGGGGGGGGDDDDDDGGGGGGGGGGDDDDDDDDGSSSS",  // 12: Siphon 3 (east) toxic zone
	"SSSSDDDDDDDDDDDGGGGGGGGGGDDDDDDGGGGGGGGGGGDDDDDDDDSSSSS", // 13
	"SSSSDDDDDDDDDGGGGGGGGGGGDDDDDDDGGGGGGGGGGGDDDDDDDSSSSS",  // 14
	"SSSGGDDDDDDGGGGGGGGGGGGDDDDDDDDDGGGGGGGGGGGGDDDDDDSSSS",  // 15
	"SSGGGGDDDDGGGGGGGGGGGDDDDDDDDDDDDGGGGGGGGGGGGGDDDDDGSS",  // 16
	"GGGGGGGDGGGGGGGGGGGGDDDDDDDDDDDDDDDGGGGGGGGGGGGGGDDGGGG", // 17
	"GGGGGGGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDGGGGGGGGGGGGGGGGG",  // 18
	"GGGGGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGGGGG",  // 19
	"GGGGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGGGG",  // 20
	"WWWWWWWGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGWWWWWWWW", // 21: River crossing
	"WWWWWWWWWGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGWWWWWWWWWW", // 22
	"WWWWWWWWWWWGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDWWWWWWWWWWW", // 23
	"WWWWWWWWWWWWBBBDDDDDDDDDDDDDDDDDDDDDDDDDDBBBWWWWWWWWWW", // 24: Bridges
	"WWWWWWWWWWWWBBBDDDDDDDDDDDDDDDDDDDDDDDDDDBBBWWWWWWWWWW", // 25
	"WWWWWWWWWWWGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDWWWWWWWWWWW", // 26
	"WWWWWWWWWGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGWWWWWWWWWW", // 27
	"WWWWWWWGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGWWWWWW", // 28
	"GGGGGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGG", // 29
	"GGGGGGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGG", // 30
	"GGGGGGGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGG", // 31
	"GGHHHHGGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDGGGGGGHHHGG", // 32
	"GHHHHHHGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGGGHHHHGG", // 33
	"GHHHHHHHGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDGGGGGHHHHHGG", // 34: Tall grass flanking
	"GHHHHHHGGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDGGGGGGHHHHHGG", // 35
	"GGHHHHGGGGVVVGGGGGGGGDDDDDDDDDDDDDDDDDDDDGGGGVVGGHHHGG", // 36
	"GGGHHGGGVVVVVVGGGGGGGGDDDDDDDDDDDDDDDDDDDGGVVVVGGGHGGG", // 37
	"GGGGGGVVVVVVVVVGGGGGGGDDDDDDDDDDDDDDDDDDDGVVVVVVGGGGGG", // 38: Mangrove groves
	"GGGGGVVVVVVVVVVVGGGGGGDDDDDDDDDDDDDDDDDDDVVVVVVVVGGGGG", // 39
	"GGGGVVVVVMMMVVVVGGGGGDDDDDDDDDDDDDDDDDDDDVVVVMMMVVGGGG", // 40
	"GGGVVVVMMMMMMVVVGGGGGDDDDDDDDDDDDDDDDDDDDVVVMMMMVVVGGG", // 41
	"GGGVVVVMMMMMMVVVGGGGGDDDDDDDDDDDDDDDDDDDDVVVMMMMVVVGGG", // 42: Player base area
	"GGGGVVVMMMMMVVVGGGGGGGDDDDDDDDDDDDDDDDDDDGVVVMMMVVGGGG", // 43
	"GGGGGVVVVVVVVVGGGGGGGGDDDDDDDDDDDDDDDDDDDGGVVVVVVGGGGG", // 44
];

const terrain: T[][] = MAP_ROWS.map(parseRow);
const cols = terrain[0].length;
const rows = terrain.length;

export const mission05SiphonValley: MissionMapData = {
	missionId: 5,
	name: "Siphon Valley",
	cols,
	rows,
	terrain,

	playerStart: { tileX: 27, tileY: 42 },

	entities: [
		// Player starting units
		{ type: "river-rat", tileX: 25, tileY: 42, faction: "ura" },
		{ type: "river-rat", tileX: 26, tileY: 42, faction: "ura" },
		{ type: "river-rat", tileX: 27, tileY: 42, faction: "ura" },
		{ type: "river-rat", tileX: 28, tileY: 42, faction: "ura" },
		{ type: "mudfoot", tileX: 25, tileY: 41, faction: "ura" },
		{ type: "mudfoot", tileX: 26, tileY: 41, faction: "ura" },
		{ type: "mudfoot", tileX: 28, tileY: 41, faction: "ura" },
		{ type: "mudfoot", tileX: 29, tileY: 41, faction: "ura" },
		{ type: "shellcracker", tileX: 27, tileY: 40, faction: "ura" },
		{ type: "shellcracker", tileX: 28, tileY: 40, faction: "ura" },

		// Siphon 1 (west)
		{
			type: "siphon",
			tileX: 3,
			tileY: 13,
			faction: "scale-guard",
			properties: { tag: "siphon-1", preBuilt: true },
		},
		{ type: "gator", tileX: 5, tileY: 12, faction: "scale-guard" },
		{ type: "gator", tileX: 4, tileY: 14, faction: "scale-guard" },
		{ type: "snapper", tileX: 6, tileY: 11, faction: "scale-guard" },

		// Siphon 2 (center-north)
		{
			type: "siphon",
			tileX: 27,
			tileY: 4,
			faction: "scale-guard",
			properties: { tag: "siphon-2", preBuilt: true },
		},
		{ type: "gator", tileX: 25, tileY: 3, faction: "scale-guard" },
		{ type: "gator", tileX: 29, tileY: 3, faction: "scale-guard" },
		{ type: "gator", tileX: 27, tileY: 6, faction: "scale-guard" },
		{ type: "viper", tileX: 24, tileY: 5, faction: "scale-guard" },
		{ type: "viper", tileX: 30, tileY: 5, faction: "scale-guard" },
		{ type: "snapper", tileX: 26, tileY: 2, faction: "scale-guard" },
		{ type: "snapper", tileX: 28, tileY: 2, faction: "scale-guard" },

		// Siphon 3 (east)
		{
			type: "siphon",
			tileX: 52,
			tileY: 13,
			faction: "scale-guard",
			properties: { tag: "siphon-3", preBuilt: true },
		},
		{ type: "gator", tileX: 50, tileY: 12, faction: "scale-guard" },
		{ type: "gator", tileX: 51, tileY: 14, faction: "scale-guard" },
		{ type: "snapper", tileX: 49, tileY: 11, faction: "scale-guard" },
		{ type: "viper", tileX: 53, tileY: 15, faction: "scale-guard" },

		// Siphon Drones (harass units)
		{ type: "siphon-drone", tileX: 20, tileY: 20, faction: "scale-guard" },
		{ type: "siphon-drone", tileX: 35, tileY: 20, faction: "scale-guard" },

		// Resources
		{ type: "resource-fish", tileX: 15, tileY: 28, properties: { amount: 600 } },
		{ type: "resource-fish", tileX: 40, tileY: 28, properties: { amount: 600 } },
		{ type: "resource-timber", tileX: 5, tileY: 38, properties: { amount: 500 } },
		{ type: "resource-timber", tileX: 50, tileY: 38, properties: { amount: 500 } },
		{ type: "resource-salvage", tileX: 27, tileY: 30, properties: { amount: 400 } },
	],

	triggerZones: [
		{ id: "siphon-1-zone", tileX: 0, tileY: 10, width: 8, height: 8 },
		{ id: "siphon-2-zone", tileX: 23, tileY: 0, width: 10, height: 8 },
		{ id: "siphon-3-zone", tileX: 48, tileY: 10, width: 8, height: 8 },
		{ id: "river-crossing-west", tileX: 10, tileY: 22, width: 6, height: 6 },
		{ id: "river-crossing-east", tileX: 40, tileY: 22, width: 6, height: 6 },
	],
};
