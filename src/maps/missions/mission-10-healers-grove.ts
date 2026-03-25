import type { MissionMapData } from "../types";
import { TerrainType as T } from "../types";

/**
 * Mission 10: The Healer's Grove — Liberation
 * ~55×45 tiles. Five villages scattered across jungle terrain.
 * Player starts with a small base in the southwest.
 * Medic Marina is held at the central village.
 * Scale-Guard occupies each village — liberate all 5.
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
	"VVVVVGGGGGGGGHHHHHGGGDDDDDDDDDDGGGGHHHHHGGGGGGGVVVVV", // 0: North edge
	"VVVVGGGGGGGHHHHHHHGGDDDDDDDDDDDDGGGHHHHHHHGGGGGGVVVV", // 1
	"VVVGGGGGGHHHHHHHHHGDDDDDDDDDDDDDDDGHHHHHHHHHGGGGGVVV", // 2
	"VVGGGGGGHHHHHHHHHHGDDDDDDDDDDDDDDDDGHHHHHHHHHGGGGVVV", // 3
	"VGGGGGGGHHHHHHHGGGGDDDDDDDDDDDDDDDDGGGGHHHHHHHGGGGVV", // 4
	"GGGGGGGGHHHHHGGGGDDDDDDDDDDDDDDDDDDDDGGGGHHHHHGGGGGG", // 5: Village 1 area (NW)
	"GGGGGGGGHHHGGGGDDDDDDDDDDDDDDDDDDDDDDDDGGGGHHGGGGGGG", // 6
	"GGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGG", // 7
	"GGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGG", // 8
	"GGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGG", // 9
	"GGGGGGGGGDDDDDDDDDDDDDDGGGGGDDDDDDDDDDDDDDDGGGGGGGGG", // 10
	"GGGGGGGGDDDDDDDDDDDDDGGGGGGGGGDDDDDDDDDDDDDDGGGGGGGG", // 11: Village 2 area (NE)
	"GGGGGGGDDDDDDDDDDDDGGGGVVVVVGGGGDDDDDDDDDDDDDGGGGGGG", // 12: River + mangroves
	"GGGGGGDDDDDDDDDDDDGGGVVVVVVVVVGGGDDDDDDDDDDDDGGGGGGG", // 13
	"GGGGGDDDDDDDDDDDDGGVVVWWWWWWVVVGGDDDDDDDDDDDDDGGGGGG", // 14
	"GGGGDDDDDDDDDDDDGGVVVWWWWWWWWVVVGGDDDDDDDDDDDDGGGGGG", // 15
	"GGGGDDDDDDDDDDDDGVVVWWWWWWWWWWVVVGDDDDDDDDDDDDGGGGGG", // 16
	"GGGDDDDDDDDDDDDGGVVVWWWWWWWWWWVVVGDDDDDDDDDDDDGGGGGG", // 17
	"GGGDDDDDDDDDDDDGGVVVWWWWWWWWWWVVVGDDDDDDDDDDDDGGGGGG", // 18
	"GGGDDDDDDDDDDDDGGVVVVWWWWWWWWVVVGGDDDDDDDDDDDDGGGGGG", // 19
	"GGGDDDDDDDDDDDDGGGVVVVWWWWWVVVVGGGDDDDDDDDDDDDGGGGGG", // 20
	"GGGGDDDDDDDDDDDDGGGGVVVVVVVVVGGGGDDDDDDDDDDDDGGGGGGG", // 21: Village 3 area (center) — Medic Marina
	"GGGGDDDDDDDDDDDDDDGGGGGVVVGGGGGGDDDDDDDDDDDDDGGGGGGG", // 22
	"GGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGG",  // 23
	"GGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGG", // 24
	"GGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGG", // 25
	"GGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGG", // 26
	"GGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGG", // 27
	"GGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGG", // 28
	"GGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG", // 29
	"GGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGG", // 30
	"GGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG", // 31: Village 4 area (SW)
	"GGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGG", // 32
	"GGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGG", // 33
	"GGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGG", // 34: Village 5 area (SE)
	"GGGHHHHGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGHHHGGGG", // 35
	"GGHHHHHGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGHHHHHGGG", // 36
	"GHHHHHHGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGHHHHHGGG", // 37
	"GHHHHHHHGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGHHHHHHGG", // 38
	"GGHHHHHHGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGHHHHHHG", // 39
	"GGGHHHHGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGHHHHGG", // 40: Player base area (south)
	"GGGGHHHGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGHHGGG", // 41
	"GGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGMGG", // 42
	"GGMMMMGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGMMMMGG", // 43
	"GMMMMMMGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGMMMMMMG", // 44
];

const terrain: T[][] = MAP_ROWS.map(parseRow);
const cols = terrain[0].length;
const rows = terrain.length;

export const mission10HealersGrove: MissionMapData = {
	missionId: 10,
	name: "The Healer's Grove",
	cols,
	rows,
	terrain,

	playerStart: { tileX: 10, tileY: 42 },

	entities: [
		// Player base (SW) — small
		{
			type: "command-post",
			tileX: 10,
			tileY: 42,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "barracks",
			tileX: 7,
			tileY: 40,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "armory",
			tileX: 13,
			tileY: 40,
			faction: "ura",
			properties: { preBuilt: true },
		},

		// Player starting units
		{ type: "mudfoot", tileX: 9, tileY: 41, faction: "ura" },
		{ type: "mudfoot", tileX: 10, tileY: 41, faction: "ura" },
		{ type: "mudfoot", tileX: 11, tileY: 41, faction: "ura" },
		{ type: "mudfoot", tileX: 9, tileY: 43, faction: "ura" },
		{ type: "shellcracker", tileX: 8, tileY: 42, faction: "ura" },
		{ type: "shellcracker", tileX: 12, tileY: 42, faction: "ura" },
		{ type: "mortar-otter", tileX: 10, tileY: 43, faction: "ura" },

		// Village 1 (NW — tileX: 8, tileY: 5)
		{
			type: "village",
			tileX: 8,
			tileY: 5,
			properties: { tag: "village-1" },
		},
		{ type: "gator", tileX: 7, tileY: 4, faction: "scale-guard" },
		{ type: "gator", tileX: 9, tileY: 6, faction: "scale-guard" },
		{ type: "scout-lizard", tileX: 10, tileY: 5, faction: "scale-guard" },

		// Village 2 (NE — tileX: 42, tileY: 11)
		{
			type: "village",
			tileX: 42,
			tileY: 11,
			properties: { tag: "village-2" },
		},
		{ type: "gator", tileX: 41, tileY: 10, faction: "scale-guard" },
		{ type: "gator", tileX: 43, tileY: 12, faction: "scale-guard" },
		{ type: "viper", tileX: 44, tileY: 11, faction: "scale-guard" },

		// Village 3 (center — tileX: 25, tileY: 21) — Medic Marina held here
		{
			type: "village",
			tileX: 25,
			tileY: 21,
			properties: { tag: "village-3" },
		},
		{
			type: "medic-marina",
			tileX: 25,
			tileY: 21,
			faction: "ura",
			properties: { isHero: true, imprisoned: true, tag: "medic-marina" },
		},
		{ type: "gator", tileX: 23, tileY: 20, faction: "scale-guard" },
		{ type: "gator", tileX: 27, tileY: 20, faction: "scale-guard" },
		{ type: "gator", tileX: 25, tileY: 23, faction: "scale-guard" },
		{ type: "viper", tileX: 24, tileY: 22, faction: "scale-guard" },
		{ type: "viper", tileX: 26, tileY: 22, faction: "scale-guard" },

		// Village 4 (SW — tileX: 12, tileY: 31)
		{
			type: "village",
			tileX: 12,
			tileY: 31,
			properties: { tag: "village-4" },
		},
		{ type: "gator", tileX: 11, tileY: 30, faction: "scale-guard" },
		{ type: "gator", tileX: 13, tileY: 32, faction: "scale-guard" },
		{ type: "scout-lizard", tileX: 14, tileY: 31, faction: "scale-guard" },

		// Village 5 (SE — tileX: 40, tileY: 34)
		{
			type: "village",
			tileX: 40,
			tileY: 34,
			properties: { tag: "village-5" },
		},
		{ type: "gator", tileX: 39, tileY: 33, faction: "scale-guard" },
		{ type: "gator", tileX: 41, tileY: 35, faction: "scale-guard" },
		{ type: "viper", tileX: 42, tileY: 34, faction: "scale-guard" },

		// Resources
		{ type: "resource-fish", tileX: 5, tileY: 38, properties: { amount: 500 } },
		{ type: "resource-fish", tileX: 46, tileY: 38, properties: { amount: 500 } },
		{ type: "resource-timber", tileX: 3, tileY: 5, properties: { amount: 400 } },
		{ type: "resource-timber", tileX: 48, tileY: 5, properties: { amount: 400 } },
		{ type: "resource-salvage", tileX: 25, tileY: 35, properties: { amount: 300 } },
	],

	triggerZones: [
		{ id: "village-1-zone", tileX: 5, tileY: 3, width: 8, height: 6 },
		{ id: "village-2-zone", tileX: 39, tileY: 8, width: 8, height: 6 },
		{ id: "village-3-zone", tileX: 22, tileY: 18, width: 8, height: 8 },
		{ id: "village-4-zone", tileX: 9, tileY: 28, width: 8, height: 6 },
		{ id: "village-5-zone", tileX: 37, tileY: 31, width: 8, height: 6 },
		{ id: "player-base", tileX: 5, tileY: 38, width: 12, height: 7 },
	],
};
