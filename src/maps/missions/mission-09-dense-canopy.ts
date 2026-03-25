import type { MissionMapData } from "../types";
import { TerrainType as T } from "../types";

/**
 * Mission 9: Dense Canopy — Fog Skirmish
 * ~50×40 tiles. Heavy jungle canopy with limited visibility.
 * Equal pre-built bases on west (player) and east (enemy).
 * Central no-man's land with tall grass and mangrove cover.
 * Fog of war is critical — recon before strike.
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
	//        1111111111222222222233333333334444444444
	// 234567890123456789012345678901234567890123456789
	"VVVVVVVGGGGGGGGGGGHHHHHHHHHHGGGGGGGGGGGVVVVVVVVV", // 0: North edge — dense mangrove
	"VVVVVGGGGGGGGGGGHHHHHHHHHHHHHGGGGGGGGGGGVVVVVVVVV", // 1
	"VVVVGGGGDDDDGGGHHHHHHHHHHHHHHHGGGDDDDGGGGVVVVVVV", // 2
	"VVVGGGDDDDDDGGHHHVVVHHHHHVVVHHHGGDDDDDDGGGVVVVV", // 3: Mangrove clusters in canopy
	"VVGGGDDDDDDDDGHHHVVVVHHHVVVVHHHGDDDDDDDDGGGVVVV", // 4
	"VGGGGDDDDDDDDGGHHHVVVVVVVVVHHHGGDDDDDDDDGGGGVVV", // 5
	"GGGGGDDDDDDDDGGGHHHHHHHHHHHHHGGGDDDDDDDDGGGGGGG", // 6
	"GGGGDDDDDDDDDDGGGHHHHHHHHHHHGGGDDDDDDDDDDGGGGGG", // 7
	"GGGDDDDDDDDDDDDGGGHHHHHHHHHGGGDDDDDDDDDDDDGGGGG", // 8
	"GGGDDDDDDDDDDDDDDGGGHHHHHGGGDDDDDDDDDDDDDDGGGGG", // 9
	"GGDDDDDDDDDDDDDDDDDGGGHGGGDDDDDDDDDDDDDDDDDGGGG", // 10
	"GGDDDDDDDDDDDDDDDDDDGGGGGDDDDDDDDDDDDDDDDDDGGGG", // 11
	"GGDDDDDDDDDDDDDDDDDDDDGDDDDDDDDDDDDDDDDDDDDGGGG", // 12
	"GDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGG", // 13
	"GDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGG", // 14
	"GDDDDDDDDDDDGGHHHHHHHHHHHHHHHHHGGDDDDDDDDDDDDGGG", // 15: Central tall grass belt
	"GDDDDDDDDDDDGHHHHHHHHHHHHHHHHHHHGDDDDDDDDDDDDGGG", // 16
	"GDDDDDDDDDDDGHHHHHHMMMMMMMHHHHHHHGDDDDDDDDDDDGGG", // 17: Mud in center
	"GDDDDDDDDDDGGHHHHHMMMMMMMMMMHHHHHGGDDDDDDDDDDGGG", // 18
	"GDDDDDDDDDDGGHHHHMMMWWWWWMMMHHHHHHGDDDDDDDDDGGGG", // 19: Central stream
	"GDDDDDDDDDDGGHHHHMMMWWWWWMMMHHHHHHGDDDDDDDDDGGGG", // 20
	"GDDDDDDDDDDGGHHHHHMMMMMMMMMMHHHHHGGDDDDDDDDDDGGG", // 21
	"GDDDDDDDDDDDGHHHHHHMMMMMMMHHHHHHHGDDDDDDDDDDDGGG", // 22
	"GDDDDDDDDDDDGHHHHHHHHHHHHHHHHHHHGDDDDDDDDDDDDGGG", // 23
	"GDDDDDDDDDDDGGHHHHHHHHHHHHHHHHHGGDDDDDDDDDDDDGGG", // 24
	"GDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGG", // 25
	"GDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGGG", // 26
	"GGDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDGGG", // 27
	"GGDDDDDDDDDDDDDDDDDDGGGGGDDDDDDDDDDDDDDDDDDGGGG", // 28
	"GGDDDDDDDDDDDDDDDDDGGGHGGGDDDDDDDDDDDDDDDDDGGGG", // 29
	"GGGDDDDDDDDDDDDDDGGGHHHHHGGGDDDDDDDDDDDDDDGGGGG", // 30
	"GGGDDDDDDDDDDDDGGGHHHHHHHHHGGGDDDDDDDDDDDDGGGGG", // 31
	"GGGGDDDDDDDDDDGGGHHHHHHHHHHHGGGDDDDDDDDDDGGGGGG", // 32
	"GGGGGDDDDDDDDGGHHHHHHHHHHHHHHHGGDDDDDDDDGGGGGGG", // 33
	"GGGGGGDDDDDDGGHHHVVVHHHHHVVVHHHGGDDDDDDGGGGGGGG", // 34: Southern mangrove clusters
	"VVGGGGGDDDDGGHHHVVVVHHHHHVVVVHHHGGDDDDGGGGGVVVV", // 35
	"VVVGGGGDDDDGGHHHHVVVVVVVVVVHHHHHGGDDDDGGGGVVVVV", // 36
	"VVVVGGGGDDDDGGHHHHHHHHHHHHHHHHHGGDDDDGGGGVVVVVV", // 37
	"VVVVVGGGGGGGGGGGHHHHHHHHHHHHHGGGGGGGGGGGVVVVVVVV", // 38
	"VVVVVVVGGGGGGGGGGGHHHHHHHHHHGGGGGGGGGGGVVVVVVVVV", // 39: South edge
];

const terrain: T[][] = MAP_ROWS.map(parseRow);
const cols = terrain[0].length;
const rows = terrain.length;

export const mission09DenseCanopy: MissionMapData = {
	missionId: 9,
	name: "Dense Canopy",
	cols,
	rows,
	terrain,

	playerStart: { tileX: 8, tileY: 19 },

	entities: [
		// Player base (west) — pre-built
		{
			type: "command-post",
			tileX: 8,
			tileY: 19,
			faction: "ura",
			properties: { preBuilt: true, tag: "ura-cp" },
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
			type: "watchtower",
			tileX: 12,
			tileY: 15,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "watchtower",
			tileX: 12,
			tileY: 23,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "burrow",
			tileX: 8,
			tileY: 16,
			faction: "ura",
			properties: { preBuilt: true },
		},
		{
			type: "burrow",
			tileX: 8,
			tileY: 22,
			faction: "ura",
			properties: { preBuilt: true },
		},

		// Player starting units
		{ type: "mudfoot", tileX: 7, tileY: 18, faction: "ura" },
		{ type: "mudfoot", tileX: 8, tileY: 18, faction: "ura" },
		{ type: "mudfoot", tileX: 9, tileY: 18, faction: "ura" },
		{ type: "mudfoot", tileX: 7, tileY: 20, faction: "ura" },
		{ type: "mudfoot", tileX: 8, tileY: 20, faction: "ura" },
		{ type: "mudfoot", tileX: 9, tileY: 20, faction: "ura" },
		{ type: "shellcracker", tileX: 6, tileY: 19, faction: "ura" },
		{ type: "shellcracker", tileX: 10, tileY: 19, faction: "ura" },
		{ type: "mortar-otter", tileX: 7, tileY: 19, faction: "ura" },
		{ type: "mortar-otter", tileX: 9, tileY: 19, faction: "ura" },

		// Enemy base (east) — pre-built, mirrored
		{
			type: "command-post",
			tileX: 38,
			tileY: 19,
			faction: "scale-guard",
			properties: { preBuilt: true, tag: "sg-cp" },
		},
		{
			type: "spawning-pool",
			tileX: 41,
			tileY: 17,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{
			type: "sludge-pit",
			tileX: 41,
			tileY: 21,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{
			type: "venom-spire",
			tileX: 34,
			tileY: 15,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},
		{
			type: "venom-spire",
			tileX: 34,
			tileY: 23,
			faction: "scale-guard",
			properties: { preBuilt: true },
		},

		// Enemy starting units
		{ type: "gator", tileX: 37, tileY: 18, faction: "scale-guard" },
		{ type: "gator", tileX: 38, tileY: 18, faction: "scale-guard" },
		{ type: "gator", tileX: 39, tileY: 18, faction: "scale-guard" },
		{ type: "gator", tileX: 37, tileY: 20, faction: "scale-guard" },
		{ type: "gator", tileX: 38, tileY: 20, faction: "scale-guard" },
		{ type: "gator", tileX: 39, tileY: 20, faction: "scale-guard" },
		{ type: "viper", tileX: 36, tileY: 19, faction: "scale-guard" },
		{ type: "viper", tileX: 40, tileY: 19, faction: "scale-guard" },
		{ type: "scout-lizard", tileX: 35, tileY: 17, faction: "scale-guard" },
		{ type: "scout-lizard", tileX: 35, tileY: 21, faction: "scale-guard" },

		// Resources
		{ type: "resource-fish", tileX: 3, tileY: 10, properties: { amount: 500 } },
		{ type: "resource-fish", tileX: 3, tileY: 28, properties: { amount: 500 } },
		{ type: "resource-timber", tileX: 10, tileY: 5, properties: { amount: 400 } },
		{ type: "resource-timber", tileX: 10, tileY: 34, properties: { amount: 400 } },
		{ type: "resource-salvage", tileX: 23, tileY: 10, properties: { amount: 300 } },
		{ type: "resource-salvage", tileX: 23, tileY: 28, properties: { amount: 300 } },
	],

	triggerZones: [
		// Player base area
		{ id: "player-base", tileX: 3, tileY: 14, width: 12, height: 12 },
		// Enemy base area
		{ id: "enemy-base", tileX: 33, tileY: 14, width: 12, height: 12 },
		// Central no-man's land
		{ id: "no-mans-land", tileX: 15, tileY: 14, width: 16, height: 12 },
		// North flank
		{ id: "north-flank", tileX: 15, tileY: 0, width: 16, height: 10 },
		// South flank
		{ id: "south-flank", tileX: 15, tileY: 30, width: 16, height: 10 },
	],
};
