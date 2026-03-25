import type { MissionMapData } from "../types";
import { TerrainType as T } from "../types";

/**
 * Mission 15: Sacred Sludge — All-out War
 * ~70×55 tiles — LARGEST MAP in the game.
 * Full army vs full army. Sludge flood timer creates urgency.
 * Player base (south), enemy base (north-center), Great Siphon preview (far north).
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
	//        1111111111222222222233333333334444444444555555555566666666
	// 23456789012345678901234567890123456789012345678901234567890123456789
	"SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS", // 0: Sludge origin (north)
	"SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS", // 1
	"SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS", // 2
	"SSSSSSSSSSSSSSSSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSSSSSSSSSSSSSSSSSSS",  // 3
	"SSSSSSSSSSSSSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSSSSSSSSSSSSSSSS",  // 4: Enemy north zone
	"SSSSSSSSSSSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSSSSSSSSSSSSS",   // 5
	"SSSSSSSSSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSSSSSSSSSSSS",  // 6
	"SSSSSSSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSSSSSSSSSS",   // 7
	"SSSSSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSSSSSSSSSS",  // 8
	"SSSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSSSSSSSSS",  // 9
	"SSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSSSSSSSS",   // 10: Enemy base area
	"SSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSSSSSSS",   // 11
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSSSSSS",   // 12
	"SDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSSSSS",   // 13
	"GDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGSSSSS",    // 14
	"GDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGSSSS",    // 15
	"GDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGSSS",    // 16
	"GGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGG",    // 17
	"GGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGG",    // 18
	"GGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGG",    // 19
	"GGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG",    // 20: Mid-field
	"GGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG",    // 21
	"GGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGG",    // 22
	"GGGGGGGDDDDDDDDDDDDDDDDDDDWWWWWWWWWDDDDDDDDDDDDDDDDDDDDDDDGGGGGGG",   // 23: River crossing
	"GGGGGGDDDDDDDDDDDDDDDDDDWWWWWWWWWWWWWDDDDDDDDDDDDDDDDDDDDDGGGGGGG",   // 24
	"GGGGGDDDDDDDDDDDDDDDDDWWWWWWWWWWWWWWWWWDDDDDDDDDDDDDDDDDDDGGGGGGG",   // 25
	"GGGGGDDDDDDDDDDDDDDDDBBBBWWWWWWWWWWWBBBBDDDDDDDDDDDDDDDDDDGGGGGGG",   // 26: Bridges
	"GGGGGDDDDDDDDDDDDDDDDBBBBWWWWWWWWWWWBBBBDDDDDDDDDDDDDDDDDDGGGGGGG",   // 27
	"GGGGGDDDDDDDDDDDDDDDDDWWWWWWWWWWWWWWWWWDDDDDDDDDDDDDDDDDDDGGGGGGG",   // 28
	"GGGGGGDDDDDDDDDDDDDDDDDDWWWWWWWWWWWWWDDDDDDDDDDDDDDDDDDDDDGGGGGGG",   // 29
	"GGGGGGGDDDDDDDDDDDDDDDDDDDWWWWWWWWWDDDDDDDDDDDDDDDDDDDDDDDGGGGGGG",   // 30
	"GGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGG",    // 31
	"GGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGG",    // 32
	"GGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGG",    // 33
	"GGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGG",    // 34
	"GGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGG",    // 35
	"GGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG",    // 36
	"GGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGG",    // 37
	"GGGGHHHDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDHHGGGG",     // 38: Player zone
	"GGGHHHHDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDHHHGGG",     // 39
	"GGHHHHHDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDHHHHGG",     // 40
	"GGGHHHHDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDHHHGGG",     // 41
	"GGGGHHHDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDHHGGGG",     // 42
	"GGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGG",    // 43: Player base area
	"GGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGG",    // 44
	"GGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG",    // 45
	"GGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGG",    // 46
	"GGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGG",    // 47
	"GGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGG",    // 48
	"GGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGG",    // 49
	"GGGVVVGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGVVVGGG",    // 50: Mangrove edges
	"GVVVVVVGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGVVVVVGG",    // 51
	"GVVVVVVVGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGVVVVVVGG",    // 52
	"GGGVVVGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGGVVVGGGG",   // 53
	"GGGGGGGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGGGGGGGG",     // 54
];

const terrain: T[][] = MAP_ROWS.map(parseRow);
const cols = terrain[0].length;
const rows = terrain.length;

export const mission15SacredSludge: MissionMapData = {
	missionId: 15,
	name: "Sacred Sludge",
	cols,
	rows,
	terrain,

	playerStart: { tileX: 35, tileY: 44 },

	entities: [
		// Player base (south) — full
		{
			type: "command-post",
			tileX: 35,
			tileY: 44,
			faction: "ura",
			properties: { preBuilt: true, tag: "ura-main-cp" },
		},
		{
			type: "barracks",
			tileX: 30,
			tileY: 42,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "barracks",
			tileX: 40,
			tileY: 42,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "armory",
			tileX: 35,
			tileY: 41,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "field-hospital",
			tileX: 35,
			tileY: 46,
			faction: "ura",
			properties: { preBuilt: true },
		},

		// Player army
		{ type: "mudfoot", tileX: 32, tileY: 43, faction: "ura" },
		{ type: "mudfoot", tileX: 33, tileY: 43, faction: "ura" },
		{ type: "mudfoot", tileX: 34, tileY: 43, faction: "ura" },
		{ type: "mudfoot", tileX: 36, tileY: 43, faction: "ura" },
		{ type: "mudfoot", tileX: 37, tileY: 43, faction: "ura" },
		{ type: "mudfoot", tileX: 38, tileY: 43, faction: "ura" },
		{ type: "shellcracker", tileX: 31, tileY: 44, faction: "ura" },
		{ type: "shellcracker", tileX: 39, tileY: 44, faction: "ura" },
		{ type: "mortar-otter", tileX: 34, tileY: 45, faction: "ura" },
		{ type: "mortar-otter", tileX: 36, tileY: 45, faction: "ura" },
		{ type: "sapper", tileX: 35, tileY: 45, faction: "ura" },

		// Enemy main base (north-center)
		{
			type: "command-post",
			tileX: 35,
			tileY: 10,
			faction: "scale-guard",
			properties: { preBuilt: true, tag: "sg-main-cp" },
		},
		{
			type: "spawning-pool",
			tileX: 30,
			tileY: 8,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{
			type: "spawning-pool",
			tileX: 40,
			tileY: 8,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{
			type: "sludge-pit",
			tileX: 35,
			tileY: 6,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{
			type: "venom-spire",
			tileX: 25,
			tileY: 12,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{
			type: "venom-spire",
			tileX: 45,
			tileY: 12,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},

		// Enemy army
		{ type: "gator", tileX: 32, tileY: 10, faction: "scale-guard" },
		{ type: "gator", tileX: 33, tileY: 10, faction: "scale-guard" },
		{ type: "gator", tileX: 37, tileY: 10, faction: "scale-guard" },
		{ type: "gator", tileX: 38, tileY: 10, faction: "scale-guard" },
		{ type: "gator", tileX: 35, tileY: 12, faction: "scale-guard" },
		{ type: "gator", tileX: 35, tileY: 13, faction: "scale-guard" },
		{ type: "viper", tileX: 30, tileY: 11, faction: "scale-guard" },
		{ type: "viper", tileX: 40, tileY: 11, faction: "scale-guard" },
		{ type: "snapper", tileX: 33, tileY: 8, faction: "scale-guard" },
		{ type: "snapper", tileX: 37, tileY: 8, faction: "scale-guard" },

		// Sludge source marker (for flood mechanic)
		{
			type: "sludge-source",
			tileX: 35,
			tileY: 1,
			properties: { tag: "sludge-origin", floodRate: 1 },
		},

		// Resources
		{ type: "resource-fish", tileX: 10, tileY: 44, properties: { amount: 800 } },
		{ type: "resource-fish", tileX: 60, tileY: 44, properties: { amount: 800 } },
		{ type: "resource-timber", tileX: 8, tileY: 50, properties: { amount: 600 } },
		{ type: "resource-timber", tileX: 62, tileY: 50, properties: { amount: 600 } },
		{ type: "resource-salvage", tileX: 35, tileY: 35, properties: { amount: 500 } },
	],

	triggerZones: [
		{ id: "player-base", tileX: 27, tileY: 40, width: 18, height: 10 },
		{ id: "enemy-base", tileX: 27, tileY: 6, width: 18, height: 10 },
		{ id: "river-west-bridge", tileX: 18, tileY: 25, width: 6, height: 4 },
		{ id: "river-east-bridge", tileX: 46, tileY: 25, width: 6, height: 4 },
		{ id: "mid-field", tileX: 20, tileY: 18, width: 30, height: 8 },
		{ id: "sludge-zone", tileX: 0, tileY: 0, width: 70, height: 4 },
	],
};
