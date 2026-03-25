import type { MissionMapData } from "../types";
import { TerrainType as T } from "../types";

/**
 * Mission 1: Beachhead
 * ~50×40 tiles. Southern beach (player start), mangrove forest in center,
 * fishing spot (SE river), timber grove (NW), salvage cache (NE),
 * Scale-Guard patrol area (north).
 *
 * Legend:
 *   G = Grass, D = Dirt, M = Mud, W = Water, V = Mangrove,
 *   B = Bridge, S = Toxic Sludge, H = Tall Grass
 */

// Helper to expand a compact row string into terrain array
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

// 50×40 hand-painted map
// biome-ignore format: map layout must preserve visual alignment
const MAP_ROWS = [
	//         1111111111222222222233333333334444444444
	// 1234567890123456789012345678901234567890123456789
	"GGGGGGGGGGGGGGGVVVGGGGGGGGGDDDDDDDDDGGGGGGGGGGGG", // 0: North — Scale-Guard territory
	"GGGGGGGGGGGGGGVVVVGGGGGGGGDDDDDDDDDDGGGGGGGGGGGG", // 1
	"GGGGGGGGGGGGGVVVVVGGGGGGGDDDDDDDDDDDGGGGGGGGGGGG", // 2
	"GGGGGGGGGGGGVVVVVVGGGGGGDDDDDSDDDDDDGGGGGGGGGGGG", // 3: Toxic sludge pocket in patrol zone
	"GGGGGGGGGGGVVVVVVVGGGGGDDDDDSSDDDDDDGGGGGGGGGGGG", // 4
	"GGGGGGGGGGGGVVVVVVGGGGGDDDDDSDDDDDDGGGGGGGGGGGGG", // 5
	"GGGGGGGGGGGGGVVVVVGGGGGGDDDDDDDDDDGGGGGGGGGGGGGG", // 6
	"GGGGGGGGGGGGGGVVVGGGGGGGDDDDDDDDDGGGGGGGGGGGGGGG", // 7
	"GGGGGGGGGGGGGGGVGGGGGGGGGDDDDDDDGGGGGGGGGGGGGGGG", // 8: Salvage cache area (NE)
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGDDDDGGGGGGGGGGGGGGGGG", // 9
	"GGGGGGGGGVVVGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGHHG", // 10
	"GGGGGGGGVVVVVGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGHHHG", // 11: Tall grass concealment (east)
	"GGGGGGGVVVVVVVGGGGGGGGGGGGGGGGGGGGGGGGGGGGGHHHHG", // 12
	"GGGGGGVVVVVVVVGGGGGGGGGGGGGGGGGGGGGGGGGGGGGHHHGG", // 13: Central mangrove forest
	"GGGGGVVVVVVVVVGGGGGGGGGGGGGGGGGGGGGGGGGGGGGHHGGG", // 14
	"GGGGGVVVVVVVVVVGGGGGGGGGGGGGGGGGGGGGGGGGGGGHHGGG", // 15
	"GGGGGGVVVVVVVVVGGGGGGGGGGGGGGGGGGGGGGGGGGGGGHGGG", // 16
	"GGGGGGGVVVVVVVGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWWW", // 17
	"GGGGGGGGVVVVVGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWWWWW", // 18: River starts (SE)
	"GGGGGGGGGVVVGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWWWWWW", // 19
	"GGGGGGGGGGVGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWW", // 20: Fishing spot (SE river)
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWWW", // 21
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWWWW", // 22
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGBBBWWWWWWWWWW", // 23: Bridge crossing
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGBBBWWWWWWWWWW", // 24
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWWWW", // 25
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWWWWW", // 26
	"GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWWWWWW", // 27
	"GGGVVGGGGGGGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWWWWWWWW", // 28: Timber grove (SW)
	"GGVVVVGGGGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWWWWWWWWWW", // 29
	"GGVVVVVGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWWWWWWWWWWWW", // 30
	"GGGVVVGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWWWWWWWWWWWWW", // 31
	"GGGGVGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWWWWWWWWWWWWWW", // 32
	"GGGGGGGGGGGGGGGGGGGGGGGGGGWWWWWWWWWWWWWWWWWWWWWW", // 33
	"MMMMMDDDDDDDDDDDDDDDDDDDWWWWWWWWWWWWWWWWWWWWWWW", // 34: Beach approach — mud and dirt
	"MMMMMMDDDDDDDDDDDDDDDDDDWWWWWWWWWWWWWWWWWWWWWWW", // 35
	"DDDDDDDDDDDDDDDDDDDDDDDWWWWWWWWWWWWWWWWWWWWWWW", // 36: Landing beach — dirt
	"DDDDDDDDDDDDDDDDDDDDDDDWWWWWWWWWWWWWWWWWWWWWWW", // 37
	"DDDDDDDDDDDDDDDDDDDDDDDWWWWWWWWWWWWWWWWWWWWWWW", // 38: Player starting area
	"DDDDDDDDDDDDDDDDDDDDDDDWWWWWWWWWWWWWWWWWWWWWWW", // 39
];

const terrain: T[][] = MAP_ROWS.map(parseRow);
const cols = terrain[0].length;
const rows = terrain.length;

export const mission01Beachhead: MissionMapData = {
	missionId: 1,
	name: "Beachhead",
	cols,
	rows,
	terrain,

	playerStart: { tileX: 10, tileY: 38 },

	entities: [
		// Player starting units (URA faction)
		{ type: "river-rat", tileX: 9, tileY: 38, faction: "ura" },
		{ type: "river-rat", tileX: 10, tileY: 38, faction: "ura" },
		{ type: "river-rat", tileX: 11, tileY: 38, faction: "ura" },

		// Resource nodes
		{
			type: "resource-fish",
			tileX: 38,
			tileY: 20,
			properties: { amount: 500 },
		},
		{
			type: "resource-timber",
			tileX: 3,
			tileY: 30,
			properties: { amount: 400 },
		},
		{
			type: "resource-salvage",
			tileX: 40,
			tileY: 8,
			properties: { amount: 200 },
		},

		// Scale-Guard patrol units (enemy)
		{ type: "gator", tileX: 30, tileY: 3, faction: "scale-guard" },
		{ type: "gator", tileX: 33, tileY: 5, faction: "scale-guard" },
		{ type: "gator", tileX: 28, tileY: 4, faction: "scale-guard" },
	],

	triggerZones: [
		{
			id: "salvage-cache-discovery",
			tileX: 38,
			tileY: 6,
			width: 6,
			height: 6,
		},
		{
			id: "enemy-patrol-alert",
			tileX: 25,
			tileY: 0,
			width: 15,
			height: 10,
		},
	],
};
