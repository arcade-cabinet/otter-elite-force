import type { MissionMapData } from "../types";
import { TerrainType as T } from "../types";

/**
 * Mission 13: Supply Lines — Logistics / Multi-base
 * ~60×50 tiles. Three base locations connected by supply roads.
 * Player's returning base from Mission 11 occupies the south position.
 * Two additional base sites (west and northeast) must be established.
 * Supply caravans travel between bases — vulnerable on the roads.
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
	"VVVVVVGGGGGGGGGGGGGGGGGGGGGGGGDDDDDDDDDDDDGGGGGGGVVVVVV", // 0: North edge
	"VVVVVGGGGGGGGGGGGGGGGGGGGGGGDDDDDDDDDDDDDDDGGGGGGVVVVVV", // 1
	"VVVVGGGGGGGGGGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDGGGGGVVVVVV", // 2
	"VVVGGGGGGGGGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDGGGGVVVVVV", // 3: NE base area
	"VVGGGGGGGGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDGGGVVVVVV", // 4
	"VVGGGGGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGVVVVVV", // 5
	"VGGGGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGVVVVVV", // 6
	"GGGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGVVVVV", // 7
	"GGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGG", // 8
	"GGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGG", // 9
	"GGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGG", // 10
	"GGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGG", // 11
	"GGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGG", // 12
	"GGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGG", // 13
	"GGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG", // 14
	"GGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG", // 15
	"GGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG", // 16
	"GGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG", // 17
	"GGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG", // 18: West base area
	"GGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG", // 19
	"GGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG", // 20
	"GGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG", // 21
	"GGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGG", // 22
	"GGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGG", // 23
	"GGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGG", // 24: Central road junction
	"GGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGG", // 25
	"GGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGG",  // 26
	"GGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGG",  // 27
	"GGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGG",  // 28
	"GGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGGG",  // 29
	"GGGGGGHHHGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGHHHGGGGGGG",  // 30: Tall grass ambush zones
	"GGGGHHHHHHGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGHHHHHGGGGG",  // 31
	"GGGHHHHHHHHDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDHHHHHHHGGG",  // 32
	"GGGGHHHHHHGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGHHHHHGGGGG",  // 33
	"GGGGGGHHHGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGHHHGGGGGGG",  // 34
	"GGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGG",   // 35
	"GGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGG",   // 36
	"GGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGG",   // 37
	"GGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGG",   // 38
	"GGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGG",   // 39
	"GGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG",   // 40
	"GGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGG",   // 41: South base area (returning)
	"GGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGG",   // 42
	"GGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGG",   // 43
	"GGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGG",   // 44
	"GGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG",   // 45
	"GGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGG",   // 46
	"GGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGG",  // 47
	"GGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGGG",  // 48
	"GGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGGGGG",  // 49
];

const terrain: T[][] = MAP_ROWS.map(parseRow);
const cols = terrain[0].length;
const rows = terrain.length;

export const mission13SupplyLines: MissionMapData = {
	missionId: 13,
	name: "Supply Lines",
	cols,
	rows,
	terrain,

	playerStart: { tileX: 27, tileY: 42 },

	entities: [
		// South base (returning from Mission 11 — default layout if no save)
		{
			type: "command-post",
			tileX: 27,
			tileY: 42,
			faction: "ura",
			properties: { preBuilt: true, tag: "south-cp" },
		},
		{
			type: "barracks",
			tileX: 24,
			tileY: 40,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "armory",
			tileX: 30,
			tileY: 40,
			faction: "ura",
			properties: { preBuilt: true },
		},

		// Starting garrison
		{ type: "mudfoot", tileX: 26, tileY: 41, faction: "ura" },
		{ type: "mudfoot", tileX: 27, tileY: 41, faction: "ura" },
		{ type: "mudfoot", tileX: 28, tileY: 41, faction: "ura" },
		{ type: "mudfoot", tileX: 26, tileY: 43, faction: "ura" },
		{ type: "mudfoot", tileX: 28, tileY: 43, faction: "ura" },
		{ type: "shellcracker", tileX: 25, tileY: 42, faction: "ura" },
		{ type: "shellcracker", tileX: 29, tileY: 42, faction: "ura" },
		{ type: "river-rat", tileX: 27, tileY: 44, faction: "ura" },
		{ type: "river-rat", tileX: 27, tileY: 45, faction: "ura" },

		// West base site (unbuilt)
		{
			type: "base-site",
			tileX: 8,
			tileY: 19,
			properties: { tag: "west-base-site" },
		},

		// Northeast base site (unbuilt)
		{
			type: "base-site",
			tileX: 40,
			tileY: 4,
			properties: { tag: "ne-base-site" },
		},

		// Scale-Guard ambush points along supply roads
		{ type: "gator", tileX: 15, tileY: 15, faction: "scale-guard" },
		{ type: "gator", tileX: 16, tileY: 16, faction: "scale-guard" },
		{ type: "scout-lizard", tileX: 35, tileY: 12, faction: "scale-guard" },
		{ type: "scout-lizard", tileX: 20, tileY: 30, faction: "scale-guard" },
		{ type: "viper", tileX: 30, tileY: 25, faction: "scale-guard" },
		{ type: "gator", tileX: 40, tileY: 20, faction: "scale-guard" },
		{ type: "gator", tileX: 10, tileY: 32, faction: "scale-guard" },

		// Resources at each base site
		{ type: "resource-fish", tileX: 5, tileY: 22, properties: { amount: 600 } },
		{ type: "resource-fish", tileX: 45, tileY: 7, properties: { amount: 600 } },
		{ type: "resource-timber", tileX: 12, tileY: 17, properties: { amount: 500 } },
		{ type: "resource-timber", tileX: 35, tileY: 2, properties: { amount: 500 } },
		{ type: "resource-salvage", tileX: 27, tileY: 24, properties: { amount: 400 } },
		{ type: "resource-salvage", tileX: 20, tileY: 35, properties: { amount: 400 } },
	],

	triggerZones: [
		{ id: "south-base", tileX: 22, tileY: 39, width: 12, height: 8 },
		{ id: "west-base", tileX: 4, tileY: 16, width: 12, height: 8 },
		{ id: "ne-base", tileX: 35, tileY: 1, width: 12, height: 8 },
		{ id: "road-junction", tileX: 20, tileY: 22, width: 14, height: 6 },
		{ id: "ambush-south", tileX: 8, tileY: 29, width: 12, height: 6 },
		{ id: "ambush-north", tileX: 30, tileY: 10, width: 12, height: 6 },
	],
};
