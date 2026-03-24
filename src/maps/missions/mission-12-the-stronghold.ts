import type { MissionMapData } from "../types";
import { TerrainType as T } from "../types";

/**
 * Mission 12: The Stronghold — Siege Assault
 * ~55×45 tiles. Enemy fortress in the north, player base in the south.
 * Multi-layered fortress walls with gun towers and garrison.
 * Sgt. Fang is held in the innermost keep.
 * Teaches: siege tactics, combined arms, wall breaching.
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
	"SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS", // 0: Toxic sludge moat (north)
	"SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS", // 1
	"SSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSS", // 2: Outer wall perimeter
	"SSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSS", // 3
	"SSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSS", // 4
	"SSSDDDDDDGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGDDDDDDDDDSSS", // 5: Inside outer wall
	"SSSDDDDDDGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGDDDDDDDDDSSS", // 6
	"SSSDDDDDDGGGGDDDDDDDDDDDDDDDDDDDDDDDDGGGGDDDDDDDDSSS", // 7: Inner wall
	"SSSDDDDDDGGGGDDDDDDDDDDDDDDDDDDDDDDDDGGGGDDDDDDDDSSS", // 8
	"SSSDDDDDDGGGGDDDDDDDDDDDDDDDDDDDDDDDDGGGGDDDDDDDDSSS", // 9
	"SSSDDDDDDGGGGDDDDDDGGGGGGGGGGGGDDDDDDGGGGDDDDDDDDSSS", // 10: Keep area
	"SSSDDDDDDGGGGDDDDDDGGGGGGGGGGGGDDDDDDGGGGDDDDDDDDSSS", // 11
	"SSSDDDDDDGGGGDDDDDDGGGGDDDDGGGGDDDDDDGGGGDDDDDDDDSSS", // 12: Innermost keep
	"SSSDDDDDDGGGGDDDDDDGGGGDDDDGGGGDDDDDDGGGGDDDDDDDDSSS", // 13: Sgt. Fang cell
	"SSSDDDDDDGGGGDDDDDDGGGGDDDDGGGGDDDDDDGGGGDDDDDDDDSSS", // 14
	"SSSDDDDDDGGGGDDDDDDGGGGGGGGGGGGDDDDDDGGGGDDDDDDDDSSS", // 15
	"SSSDDDDDDGGGGDDDDDDGGGGGGGGGGGGDDDDDDGGGGDDDDDDDDSSS", // 16
	"SSSDDDDDDGGGGDDDDDDDDDDDDDDDDDDDDDDDDGGGGDDDDDDDDSSS", // 17
	"SSSDDDDDDGGGGDDDDDDDDDDDDDDDDDDDDDDDDGGGGDDDDDDDDSSS", // 18
	"SSSDDDDDDGGGGDDDDDDDDDDDDBBDDDDDDDDDDGGGGDDDDDDDDSSS", // 19: Inner gate (bridge)
	"SSSDDDDDDGGGGGGGGGGGGGGGGBBBBGGGGGGGGGGGGGGDDDDDDDDSSS", // 20: Inner wall exit
	"SSSDDDDDDGGGGGGGGGGGGGGGGDDDDGGGGGGGGGGGGGGDDDDDDDDSSS", // 21
	"SSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSS", // 22
	"SSSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSSS", // 23
	"SSSDDDDDDDDDDDDDDDDDDDDDBBBBDDDDDDDDDDDDDDDDDDDDDSSS", // 24: Outer gate
	"SSSSSSSSSSSSSSSSSSSSSSSSSBBBBBBSSSSSSSSSSSSSSSSSSSSSSS", // 25: Sludge moat crossing
	"SSSSSSSSSSSSSSSSSSSSSSSSSBBBBBBSSSSSSSSSSSSSSSSSSSSSSS", // 26
	"GGGGGGGGGGGGGGGGGGGGGGGGGDDDDDDGGGGGGGGGGGGGGGGGGGGGGG", // 27: Open field (approach)
	"GGGGGGGGGGGGGGGGGGGGGGGGDDDDDDDDGGGGGGGGGGGGGGGGGGGGGG", // 28
	"GGGGGHHHHGGGGGGGGGGGGGDDDDDDDDDDDGGGGGGGGGGGHHHHGGGGG", // 29: Tall grass flanking
	"GGGHHHHHHHHGGGGGGGGGDDDDDDDDDDDDDDDGGGGGGGHHHHHHHHGGG", // 30
	"GGHHHHHHHHHHGGGGGGDDDDDDDDDDDDDDDDDDDDGGGHHHHHHHHHGGG", // 31
	"GGGHHHHHHHHGGGGGDDDDDDDDDDDDDDDDDDDDDDDDGGHHHHHHHGGGG", // 32
	"GGGGGHHHHGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGHHHGGGGG", // 33
	"GGGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGG", // 34
	"GGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGG", // 35
	"GGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGG", // 36: Player base area
	"GGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGG", // 37
	"GGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGG", // 38
	"GGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGG", // 39
	"GGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGG", // 40
	"GGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGG", // 41
	"GGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGG", // 42
	"GGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGG", // 43
	"GGGGGGGGGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGGGGGG", // 44
];

const terrain: T[][] = MAP_ROWS.map(parseRow);
const cols = terrain[0].length;
const rows = terrain.length;

export const mission12TheStronghold: MissionMapData = {
	missionId: 12,
	name: "The Stronghold",
	cols,
	rows,
	terrain,

	playerStart: { tileX: 25, tileY: 39 },

	entities: [
		// Player base (south) — pre-built, full army
		{
			type: "command-post",
			tileX: 25,
			tileY: 39,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "barracks",
			tileX: 22,
			tileY: 37,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "barracks",
			tileX: 28,
			tileY: 37,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "armory",
			tileX: 25,
			tileY: 36,
			faction: "ura",
			properties: { preBuilt: true },
		},

		// Player starting army
		{ type: "mudfoot", tileX: 22, tileY: 38, faction: "ura" },
		{ type: "mudfoot", tileX: 23, tileY: 38, faction: "ura" },
		{ type: "mudfoot", tileX: 24, tileY: 38, faction: "ura" },
		{ type: "mudfoot", tileX: 26, tileY: 38, faction: "ura" },
		{ type: "mudfoot", tileX: 27, tileY: 38, faction: "ura" },
		{ type: "mudfoot", tileX: 28, tileY: 38, faction: "ura" },
		{ type: "shellcracker", tileX: 21, tileY: 39, faction: "ura" },
		{ type: "shellcracker", tileX: 29, tileY: 39, faction: "ura" },
		{ type: "shellcracker", tileX: 23, tileY: 40, faction: "ura" },
		{ type: "shellcracker", tileX: 27, tileY: 40, faction: "ura" },
		{ type: "mortar-otter", tileX: 24, tileY: 40, faction: "ura" },
		{ type: "mortar-otter", tileX: 26, tileY: 40, faction: "ura" },
		{ type: "sapper", tileX: 25, tileY: 40, faction: "ura" },
		{ type: "sapper", tileX: 25, tileY: 41, faction: "ura" },

		// Sgt. Fang — prisoner in the keep
		{
			type: "sgt-fang",
			tileX: 25,
			tileY: 13,
			faction: "ura",
			properties: { isHero: true, imprisoned: true, tag: "sgt-fang" },
		},

		// Fortress garrison — outer walls
		{
			type: "venom-spire",
			tileX: 10,
			tileY: 3,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{
			type: "venom-spire",
			tileX: 42,
			tileY: 3,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{
			type: "venom-spire",
			tileX: 10,
			tileY: 22,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{
			type: "venom-spire",
			tileX: 42,
			tileY: 22,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},

		// Outer courtyard guards
		{ type: "gator", tileX: 15, tileY: 6, faction: "scale-guard" },
		{ type: "gator", tileX: 37, tileY: 6, faction: "scale-guard" },
		{ type: "gator", tileX: 15, tileY: 21, faction: "scale-guard" },
		{ type: "gator", tileX: 37, tileY: 21, faction: "scale-guard" },
		{ type: "gator", tileX: 25, tileY: 22, faction: "scale-guard" },
		{ type: "gator", tileX: 26, tileY: 22, faction: "scale-guard" },

		// Inner courtyard guards
		{ type: "gator", tileX: 20, tileY: 10, faction: "scale-guard" },
		{ type: "gator", tileX: 32, tileY: 10, faction: "scale-guard" },
		{ type: "viper", tileX: 20, tileY: 16, faction: "scale-guard" },
		{ type: "viper", tileX: 32, tileY: 16, faction: "scale-guard" },
		{ type: "snapper", tileX: 25, tileY: 8, faction: "scale-guard" },
		{ type: "snapper", tileX: 25, tileY: 18, faction: "scale-guard" },

		// Keep guards (elite)
		{ type: "snapper", tileX: 24, tileY: 12, faction: "scale-guard" },
		{ type: "snapper", tileX: 26, tileY: 12, faction: "scale-guard" },
		{ type: "viper", tileX: 24, tileY: 14, faction: "scale-guard" },
		{ type: "viper", tileX: 26, tileY: 14, faction: "scale-guard" },

		// Gate defenders
		{ type: "gator", tileX: 24, tileY: 24, faction: "scale-guard" },
		{ type: "gator", tileX: 27, tileY: 24, faction: "scale-guard" },
		{ type: "viper", tileX: 25, tileY: 25, faction: "scale-guard" },

		// Enemy command
		{
			type: "command-post",
			tileX: 25,
			tileY: 10,
			faction: "scale-guard",
			properties: { preBuilt: true, tag: "sg-stronghold-cp" },
		},
		{
			type: "spawning-pool",
			tileX: 18,
			tileY: 14,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{
			type: "spawning-pool",
			tileX: 32,
			tileY: 14,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},

		// Resources (outside fortress)
		{ type: "resource-fish", tileX: 5, tileY: 35, properties: { amount: 600 } },
		{ type: "resource-fish", tileX: 47, tileY: 35, properties: { amount: 600 } },
		{ type: "resource-timber", tileX: 5, tileY: 30, properties: { amount: 500 } },
		{ type: "resource-timber", tileX: 47, tileY: 30, properties: { amount: 500 } },
		{ type: "resource-salvage", tileX: 25, tileY: 34, properties: { amount: 400 } },
	],

	triggerZones: [
		// Outer gate approach
		{ id: "gate-approach", tileX: 22, tileY: 24, width: 8, height: 4 },
		// Outer courtyard
		{ id: "outer-courtyard", tileX: 8, tileY: 5, width: 36, height: 18 },
		// Inner courtyard
		{ id: "inner-courtyard", tileX: 14, tileY: 8, width: 24, height: 12 },
		// Keep (Sgt. Fang)
		{ id: "keep-zone", tileX: 22, tileY: 11, width: 8, height: 6 },
		// Player staging area
		{ id: "staging-area", tileX: 15, tileY: 32, width: 22, height: 12 },
		// Extraction
		{ id: "extraction", tileX: 20, tileY: 40, width: 12, height: 5 },
	],
};
