import type { MissionMapData } from "../types";
import { TerrainType as T } from "../types";

/**
 * Mission 16: The Reckoning — Final Boss + Base
 * ~65×55 tiles. The Great Siphon occupies the center-north.
 * Three concentric defense rings around the siphon.
 * Player base at the south, all heroes available.
 * 3-phase boss encounter: perimeter → champions → core + sludge flood.
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
	//        1111111111222222222233333333334444444444555555555566666
	// 2345678901234567890123456789012345678901234567890123456789012345
	"SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS", // 0: Toxic sludge perimeter
	"SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS", // 1
	"SSSSSSSSSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSSSSSSSSS", // 2: Outer defense ring
	"SSSSSSSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSSSSSSS", // 3
	"SSSSSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSSSSS",  // 4
	"SSSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSS",   // 5
	"SSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSS",   // 6
	"SSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSS",  // 7
	"SSDDDDDDDDDDDDDGGGGGGGGGDDDDDDDDDDDDDDDDGGGGGGGGGDDDDDDDDDDDDSS",  // 8: Inner ring gap
	"SDDDDDDDDDDDDGGGGGGGGGGGGGDDDDDDDDDDDDDGGGGGGGGGGGGGDDDDDDDDDDS",  // 9
	"SDDDDDDDDDDDGGGGGGGGGGGGGGGDDDDDDDDDDDGGGGGGGGGGGGGGGDDDDDDDDDDS", // 10
	"SDDDDDDDDDDGGGGGGSSSSSSGGGGGGDDDDDDDGGGGGGSSSSSSGGGGGDDDDDDDDDDSS", // 11: Core sludge moat
	"SDDDDDDDDDGGGGGSSSSSSSSSSGGGGGDDDDDGGGGGSSSSSSSSSSGGGGGDDDDDDDDSS",  // 12
	"SDDDDDDDDDGGGGSSSSSSSSSSSSGGGGGDDDGGGGSSSSSSSSSSSSGGGDDDDDDDDDDSS", // 13
	"SDDDDDDDDGGGGSSSSSSDDDDDSSSSSGGGGGGGSSSSSDDDDDSSSSSGGGDDDDDDDDSS",  // 14: The Great Siphon
	"SDDDDDDDDGGGGSSSSSDDDDDDDSSSSGGGGGGSSSSSDDDDDDDSSSSGGGDDDDDDDDSS", // 15
	"SDDDDDDDDGGGGSSSSSDDDDDDDSSSSGGGGGGSSSSSDDDDDDDSSSSGGGDDDDDDDDSS", // 16
	"SDDDDDDDDGGGGSSSSSSDDDDDSSSSSGGGGGGGSSSSSDDDDDSSSSSGGGDDDDDDDDSS",  // 17
	"SDDDDDDDDDGGGGSSSSSSSSSSSSGGGGGDDDGGGGSSSSSSSSSSSSGGGDDDDDDDDDDSS", // 18
	"SDDDDDDDDDGGGGGSSSSSSSSSSGGGGGDDDDDGGGGGSSSSSSSSSSGGGGGDDDDDDDDSS",  // 19
	"SDDDDDDDDDDGGGGGGSSSSSSGGGGGGDDDDDDDGGGGGGSSSSSSGGGGGDDDDDDDDDDSS", // 20
	"SDDDDDDDDDDDGGGGGGGGGGGGGGGDDDDDDDDDDDGGGGGGGGGGGGGGGDDDDDDDDDDSS", // 21
	"SDDDDDDDDDDDDGGGGGGGGGGGGGDDDDDDDDDDDDDDGGGGGGGGGGGDDDDDDDDDDDSS", // 22
	"SSDDDDDDDDDDDDDGGGGGGGGGDDDDDDDDDDDDDDDDDDGGGGGGGDDDDDDDDDDDDDSS", // 23
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS",  // 24
	"SSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS",   // 25
	"SSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS",   // 26
	"SSSSSDDDDDDDDDDDDDDDDDDDDDDDDBBBBDDDDDDDDDDDDDDDDDDDDDDDDDDSS",   // 27: Gate to inner ring
	"SSSSSSDDDDDDDDDDDDDDDDDDDDDDDDBBDDDDDDDDDDDDDDDDDDDDDDDDDDSSS",   // 28
	"SSSSSSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSS",  // 29
	"SSSSSSSSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSSSS",  // 30
	"SSSSSSSSSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSSSSS",   // 31: Outer ring ends
	"GGGGGGGSSSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSGGGGGG",  // 32: Open approach
	"GGGGGGGGGSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSGGGGGGG",   // 33
	"GGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGG",   // 34
	"GGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG",   // 35
	"GGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGG",   // 36
	"GGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGG",   // 37
	"GGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGG",   // 38
	"GGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGG",   // 39
	"GGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGG",   // 40
	"GGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGG",   // 41: Player base area
	"GGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGG",   // 42
	"GGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGG",   // 43
	"GGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGG",   // 44
	"GGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGG",   // 45
	"GGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGG",   // 46
	"GGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGG",   // 47
	"GGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGG",   // 48
	"GGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGG",   // 49
	"GGGVVVGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGVVVGG",   // 50: Mangrove edges
	"GVVVVVVGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGVVVVVGG",   // 51
	"GVVVVVVVGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGVVVVVVGG",   // 52
	"GGVVVVVGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGVVVVGG",   // 53
	"GGGGGGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGGGGGGGG",   // 54
];

const terrain: T[][] = MAP_ROWS.map(parseRow);
const cols = terrain[0].length;
const rows = terrain.length;

export const mission16TheReckoning: MissionMapData = {
	missionId: 16,
	name: "The Reckoning",
	cols,
	rows,
	terrain,

	playerStart: { tileX: 32, tileY: 42 },

	entities: [
		// Player base (south) — full build with all heroes
		{
			type: "command-post",
			tileX: 32,
			tileY: 42,
			faction: "ura",
			properties: { preBuilt: true, tag: "ura-final-cp" },
		},
		{
			type: "barracks",
			tileX: 27,
			tileY: 40,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "barracks",
			tileX: 37,
			tileY: 40,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "armory",
			tileX: 32,
			tileY: 39,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "field-hospital",
			tileX: 32,
			tileY: 44,
			faction: "ura",
			properties: { preBuilt: true },
		},

		// All heroes
		{
			type: "sgt-bubbles",
			tileX: 32,
			tileY: 41,
			faction: "ura",
			properties: { isHero: true, tag: "hero-bubbles" },
		},
		{
			type: "gen-whiskers",
			tileX: 31,
			tileY: 42,
			faction: "ura",
			properties: { isHero: true, tag: "hero-whiskers" },
		},
		{
			type: "cpl-splash",
			tileX: 33,
			tileY: 42,
			faction: "ura",
			properties: { isHero: true, tag: "hero-splash" },
		},
		{
			type: "medic-marina",
			tileX: 32,
			tileY: 43,
			faction: "ura",
			properties: { isHero: true, tag: "hero-marina" },
		},
		{
			type: "sgt-fang",
			tileX: 30,
			tileY: 42,
			faction: "ura",
			properties: { isHero: true, tag: "hero-fang" },
		},
		{
			type: "pvt-muskrat",
			tileX: 34,
			tileY: 42,
			faction: "ura",
			properties: { isHero: true, tag: "hero-muskrat" },
		},

		// Player army
		{ type: "mudfoot", tileX: 29, tileY: 41, faction: "ura" },
		{ type: "mudfoot", tileX: 30, tileY: 41, faction: "ura" },
		{ type: "mudfoot", tileX: 31, tileY: 41, faction: "ura" },
		{ type: "mudfoot", tileX: 33, tileY: 41, faction: "ura" },
		{ type: "mudfoot", tileX: 34, tileY: 41, faction: "ura" },
		{ type: "mudfoot", tileX: 35, tileY: 41, faction: "ura" },
		{ type: "shellcracker", tileX: 28, tileY: 42, faction: "ura" },
		{ type: "shellcracker", tileX: 36, tileY: 42, faction: "ura" },
		{ type: "mortar-otter", tileX: 31, tileY: 43, faction: "ura" },
		{ type: "mortar-otter", tileX: 33, tileY: 43, faction: "ura" },
		{ type: "sapper", tileX: 30, tileY: 43, faction: "ura" },
		{ type: "sapper", tileX: 34, tileY: 43, faction: "ura" },

		// The Great Siphon (64x64 boss structure in center)
		{
			type: "great-siphon",
			tileX: 30,
			tileY: 14,
			faction: "scale-guard",
			properties: {
				preBuilt: true,
				tag: "great-siphon",
				phases: 3,
				perimeterHP: 500,
				coreHP: 1000,
			},
		},

		// Outer defense ring — Venom Spires
		{
			type: "venom-spire",
			tileX: 15,
			tileY: 6,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{
			type: "venom-spire",
			tileX: 50,
			tileY: 6,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{
			type: "venom-spire",
			tileX: 10,
			tileY: 20,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{
			type: "venom-spire",
			tileX: 55,
			tileY: 20,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},

		// Outer garrison
		{ type: "gator", tileX: 20, tileY: 8, faction: "scale-guard" },
		{ type: "gator", tileX: 45, tileY: 8, faction: "scale-guard" },
		{ type: "gator", tileX: 15, tileY: 18, faction: "scale-guard" },
		{ type: "gator", tileX: 50, tileY: 18, faction: "scale-guard" },
		{ type: "viper", tileX: 25, tileY: 6, faction: "scale-guard" },
		{ type: "viper", tileX: 40, tileY: 6, faction: "scale-guard" },
		{ type: "snapper", tileX: 32, tileY: 5, faction: "scale-guard" },
		{ type: "snapper", tileX: 20, tileY: 24, faction: "scale-guard" },
		{ type: "snapper", tileX: 45, tileY: 24, faction: "scale-guard" },

		// Inner garrison (around siphon)
		{ type: "gator", tileX: 28, tileY: 10, faction: "scale-guard" },
		{ type: "gator", tileX: 37, tileY: 10, faction: "scale-guard" },
		{ type: "viper", tileX: 25, tileY: 15, faction: "scale-guard" },
		{ type: "viper", tileX: 40, tileY: 15, faction: "scale-guard" },
		{ type: "snapper", tileX: 30, tileY: 20, faction: "scale-guard" },
		{ type: "snapper", tileX: 35, tileY: 20, faction: "scale-guard" },

		// Resources
		{ type: "resource-fish", tileX: 8, tileY: 45, properties: { amount: 1000 } },
		{ type: "resource-fish", tileX: 57, tileY: 45, properties: { amount: 1000 } },
		{ type: "resource-timber", tileX: 8, tileY: 50, properties: { amount: 800 } },
		{ type: "resource-timber", tileX: 57, tileY: 50, properties: { amount: 800 } },
		{ type: "resource-salvage", tileX: 32, tileY: 35, properties: { amount: 600 } },
	],

	triggerZones: [
		{ id: "player-base", tileX: 24, tileY: 38, width: 18, height: 12 },
		{ id: "outer-ring", tileX: 8, tileY: 4, width: 50, height: 26 },
		{ id: "inner-ring", tileX: 18, tileY: 8, width: 30, height: 16 },
		{ id: "siphon-core", tileX: 27, tileY: 12, width: 12, height: 8 },
		{ id: "gate-approach", tileX: 28, tileY: 26, width: 10, height: 4 },
		{ id: "sludge-flood-zone", tileX: 0, tileY: 0, width: 65, height: 55 },
	],
};
