import type { MissionMapData } from "../types";
import { TerrainType as T } from "../types";

/**
 * Mission 2: The Causeway — Escort / Defend
 * ~45×35 tiles. A road (dirt) runs west-to-east through dense jungle.
 * Player has a pre-built outpost at the east end. Supply convoy spawns
 * at the west edge and must reach the outpost. Three ambush points
 * along the road where Scale-Guard units attack.
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
	//        1111111111222222222233333333334444
	// 234567890123456789012345678901234567890123456
	"VVVVVVVVVVGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGV", // 0: Dense mangrove (north)
	"VVVVVVVGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGVVVV", // 1
	"VVVVVGGGGGGGGGGGGGHHHHGGGGGGGGGGGGGGGGGGVVVVV", // 2: Tall grass (concealment)
	"VVVVGGGGGGGGGGGGGHHHHHGGGGGGGGGGGGGGGGGVVVVVV", // 3
	"VVVGGGGGGGGGGGGGHHHHHHGGGGGGGGGGGGGGGGVVVVVVV", // 4
	"VVGGGGGGGGGGGGGGGHHHHHGGGGGGGGGGGGGGGVVVVVVVV", // 5
	"VVGGGGGGGGGGGGGGGHHHHGGGGGGGGGGGGGGGGVVVVVVVV", // 6
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGVVVVVV", // 7
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGVVVV", // 8
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGVVG", // 9
	"GGGGGWWWWGGGGGGGGGGGGGGGGGGGGGGWWWWWGGGGGGGGD", // 10: River crossing (west) + (center-east)
	"GGGWWWWWWWGGGGGGGGGGGGGGGGGGWWWWWWWWWGGGGGGDD", // 11
	"GGWWWWWWWWWGGGGGGGGGGGGGGGWWWWWWWWWWWWGGGGGDD", // 12
	"GWWWWWWWWWWWGGGGGGGGGGGGWWWWWWWWWWWWWWWGGGGDD", // 13: Player outpost area (east)
	"DDDDDDBBDDDDDDDDDDDDDDDDDDDDDDDBBBDDDDDDDDDD", // 14: THE CAUSEWAY — main road
	"DDDDDBBBBDDDDDDDDDDDDDDDDDDDDDBBBBDDDDDDDDDG", // 15: Road with bridges over rivers
	"DDDDDDBBDDDDDDDDDDDDDDDDDDDDDDDBBBDDDDDDDDDG", // 16
	"GWWWWWWWWWWWGGGGGGGGGGGGWWWWWWWWWWWWWWWGGGGGGG", // 17: Rivers south of road
	"GGWWWWWWWWWGGGGGGGGGGGGGGGWWWWWWWWWWWWWGGGGGGG", // 18
	"GGGWWWWWWWGGGGGGGGGGGGGGGGGGWWWWWWWWWGGGGGGGG", // 19
	"GGGGGWWWWGGGGGGGGGGGGGGGGGGGGGWWWWWGGGGGGGGG",  // 20
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG", // 21
	"GGGGGGGGGHHHGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG", // 22: Tall grass south
	"GGGGGGGGHHHHHGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG", // 23
	"GGGGGGGHHHHHHGGGGGGGGGGGGGHHHHGGGGGGGGGGGGGG",  // 24
	"GGGGGGGHHHHHGGGGGGGGGGGGGHHHHHGGGGGGGGGGGGGG",  // 25: Ambush flanking positions
	"GGGGGGGGGHHHGGGGGGGGGGGGGHHHHHHGGGGGGGGGGGGG",  // 26
	"GGGGGGGGGGGGGGGGGGGGGGGGGHHHHHGGGGGGGGGGGGGG",  // 27
	"GGGGGGGGGGGGGGGGGGGGGGGGGGHHHGGGGGGGGGGGGGGG",  // 28
	"VVVVGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGVVVV",  // 29: Southern mangrove border
	"VVVVVGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGVVVVVV",  // 30
	"VVVVVVVGGGGGGGGGGGGGGGGGGGGGGGGGGGGGVVVVVVVV",  // 31
	"VVVVVVVVVVGGGGGGGGGGGGGGGGGGGGGGGGVVVVVVVVVV",  // 32
	"VVVVVVVVVVVVGGGGGGGGGGGGGGGGGGGVVVVVVVVVVVVV",  // 33
	"VVVVVVVVVVVVVVVGGGGGGGGGGGGGVVVVVVVVVVVVVVVV",  // 34
];

const terrain: T[][] = MAP_ROWS.map(parseRow);
const cols = terrain[0].length;
const rows = terrain.length;

export const mission02Causeway: MissionMapData = {
	missionId: 2,
	name: "The Causeway",
	cols,
	rows,
	terrain,

	playerStart: { tileX: 40, tileY: 14 },

	entities: [
		// Pre-built outpost (east side)
		{
			type: "command-post",
			tileX: 41,
			tileY: 13,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "barracks",
			tileX: 41,
			tileY: 16,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "watchtower",
			tileX: 38,
			tileY: 12,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "watchtower",
			tileX: 38,
			tileY: 17,
			faction: "ura",
			properties: { preBuilt: true },
		},

		// Starting URA garrison
		{ type: "mudfoot", tileX: 39, tileY: 13, faction: "ura" },
		{ type: "mudfoot", tileX: 39, tileY: 14, faction: "ura" },
		{ type: "mudfoot", tileX: 39, tileY: 15, faction: "ura" },
		{ type: "mudfoot", tileX: 39, tileY: 16, faction: "ura" },
		{ type: "river-rat", tileX: 40, tileY: 12, faction: "ura" },
		{ type: "river-rat", tileX: 40, tileY: 17, faction: "ura" },

		// Supply convoy (spawns at west edge via trigger)
		// Convoy units are spawned by scenario triggers, not pre-placed

		// Ambush point 1 — west river crossing
		{ type: "gator", tileX: 3, tileY: 10, faction: "scale-guard" },
		{ type: "gator", tileX: 4, tileY: 18, faction: "scale-guard" },
		{ type: "viper", tileX: 5, tileY: 22, faction: "scale-guard" },

		// Ambush point 2 — tall grass (center)
		{ type: "gator", tileX: 18, tileY: 4, faction: "scale-guard" },
		{ type: "gator", tileX: 17, tileY: 5, faction: "scale-guard" },
		{ type: "viper", tileX: 19, tileY: 23, faction: "scale-guard" },
		{ type: "viper", tileX: 18, tileY: 24, faction: "scale-guard" },

		// Ambush point 3 — east river crossing
		{ type: "gator", tileX: 30, tileY: 10, faction: "scale-guard" },
		{ type: "gator", tileX: 31, tileY: 18, faction: "scale-guard" },
		{ type: "viper", tileX: 32, tileY: 25, faction: "scale-guard" },

		// Resources
		{
			type: "resource-fish",
			tileX: 7,
			tileY: 12,
			properties: { amount: 300 },
		},
		{
			type: "resource-timber",
			tileX: 3,
			tileY: 30,
			properties: { amount: 300 },
		},
	],

	triggerZones: [
		{
			id: "ambush-zone-1",
			tileX: 0,
			tileY: 10,
			width: 10,
			height: 10,
		},
		{
			id: "ambush-zone-2",
			tileX: 14,
			tileY: 10,
			width: 10,
			height: 10,
		},
		{
			id: "ambush-zone-3",
			tileX: 28,
			tileY: 10,
			width: 10,
			height: 10,
		},
		{
			id: "outpost-arrival",
			tileX: 36,
			tileY: 12,
			width: 8,
			height: 8,
		},
	],
};
