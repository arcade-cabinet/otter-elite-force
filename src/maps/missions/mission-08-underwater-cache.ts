import type { MissionMapData } from "../types";
import { TerrainType as T } from "../types";

/**
 * Mission 8: The Underwater Cache — Hero + Stealth
 * ~35×30 tiles. Coastal / underwater mission. Cpl. Splash hero mission.
 * A large body of water dominates the map. The underwater cache is in the
 * center of the lake. Cpl. Splash must be rescued from a coastal cell,
 * then uses underwater traversal to reach the cache.
 * Scale-Guard patrols the shoreline and bridges.
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
	//        111111111122222222223333
	// 23456789012345678901234567890123456
	"VVVVGGGGGGGGGDDDDDDDDDGGGGGGGVVVVV", // 0: North — extraction point area
	"VVVGGGGGGGGDDDDDDDDDDDDDGGGGGGGVVV", // 1
	"VVGGGGGGGDDDDDDDDDDDDDDDDGGGGGGVVV", // 2
	"VGGGGGGGDDDDDDDDDDDDDDDDDDDGGGGVVV", // 3
	"GGGGGGGDDDDDDDDDDDDDDDDDDDDDDGGGGG", // 4
	"GGGGGGDDDDDGGGGGGGGGGGGGDDDDDDDGGGG", // 5
	"GGGGGDDDDGGGGGWWWWWWWGGGGGDDDDDGGGG", // 6: Lake begins
	"GGGGDDDDGGGWWWWWWWWWWWWWGGGDDDDGGGG", // 7
	"GGGDDDDGGWWWWWWWWWWWWWWWWWGGDDDDDGG", // 8
	"GGGDDDGGWWWWWWWWWWWWWWWWWWWGGDDDDGG", // 9
	"GGDDDDGWWWWWWWWWWWWWWWWWWWWWGDDDDGG", // 10
	"GGDDDDGWWWWWWWWWWWWWWWWWWWWWGDDDDGG", // 11
	"GGDDDDWWWWWWWWWWWWWWWWWWWWWWWDDDDDG", // 12: Underwater cache (center)
	"GGDDDDWWWWWWWWWWWWWWWWWWWWWWWDDDDDG", // 13
	"GGDDDDWWWWWWWWWWWWWWWWWWWWWWWDDDDDG", // 14
	"GGDDDDGWWWWWWWWWWWWWWWWWWWWWGDDDDGG", // 15
	"GGDDDDGWWWWWWWWWWWWWWWWWWWWWGDDDDGG", // 16
	"GGGDDDGGWWWWWWWWWWWWWWWWWWWGGDDDDGG", // 17
	"GGGDDDDGGWWWWWWWWWWWWWWWWWGGDDDDDGG", // 18
	"GGGGDDDDGGGWWWWWWWWWWWWWGGGDDDDGGGG", // 19
	"GGGGGDDDDGGGGGWWWWWWWGGGGGDDDDGGGGG", // 20: Lake ends
	"GGGGGGDDDDDGGGGGGGGGGGGGDDDDDDGGGGG", // 21
	"GGHHGGGDDDDDDDDDDDDDDDDDDDDDGGHHGG", // 22: Tall grass concealment
	"GHHHHGGDDDDDDDDDDDDDDDDDDDDDDGHHHG", // 23
	"HHHHHHGDDDDDDDDDDDDDDDDDDDDDDHHHHH", // 24: Cpl. Splash cell area (SE)
	"GHHHHGGDDDDDDDDDDDDDDDDDDDDDDGHHHG", // 25
	"GGHHGGGDDDDDDDDDDDDDDDDDDDDDGGHHGG", // 26
	"GGGGGGGGGDDDDDDDDDDDDDDDDDDGGGGGGG", // 27
	"GGMMMGGGGGDDDDDDDDDDDDDDDDGGGGMMMG", // 28: Player entry (south)
	"GMMMMMMGGGGGGDDDDDDDDDDDDGGGMMMMMGG", // 29
];

const terrain: T[][] = MAP_ROWS.map(parseRow);
const cols = terrain[0].length;
const rows = terrain.length;

export const mission08UnderwaterCache: MissionMapData = {
	missionId: 8,
	name: "The Underwater Cache",
	cols,
	rows,
	terrain,

	playerStart: { tileX: 17, tileY: 29 },

	entities: [
		// Player hero unit
		{
			type: "sgt-bubbles",
			tileX: 17,
			tileY: 29,
			faction: "ura",
			properties: { isHero: true, tag: "hero-bubbles" },
		},
		// Small escort
		{ type: "mudfoot", tileX: 16, tileY: 29, faction: "ura" },
		{ type: "mudfoot", tileX: 18, tileY: 29, faction: "ura" },
		{ type: "mudfoot", tileX: 17, tileY: 28, faction: "ura" },

		// Cpl. Splash — prisoner at SE shore
		{
			type: "cpl-splash",
			tileX: 30,
			tileY: 24,
			faction: "ura",
			properties: {
				isHero: true,
				imprisoned: true,
				tag: "cpl-splash",
			},
		},

		// Underwater cache (center of lake — only accessible by swimmer)
		{
			type: "underwater-cache",
			tileX: 17,
			tileY: 13,
			properties: { tag: "underwater-cache" },
		},

		// Scale-Guard guards near Cpl. Splash cell
		{ type: "gator", tileX: 28, tileY: 23, faction: "scale-guard" },
		{ type: "gator", tileX: 31, tileY: 25, faction: "scale-guard" },
		{ type: "viper", tileX: 29, tileY: 26, faction: "scale-guard" },

		// Shoreline patrols
		{
			type: "scout-lizard",
			tileX: 5,
			tileY: 10,
			faction: "scale-guard",
			properties: {
				patrol: [
					{ x: 5, y: 8 },
					{ x: 5, y: 18 },
				],
			},
		},
		{
			type: "scout-lizard",
			tileX: 30,
			tileY: 10,
			faction: "scale-guard",
			properties: {
				patrol: [
					{ x: 30, y: 8 },
					{ x: 30, y: 18 },
				],
			},
		},
		{
			type: "gator",
			tileX: 17,
			tileY: 5,
			faction: "scale-guard",
			properties: {
				patrol: [
					{ x: 10, y: 5 },
					{ x: 24, y: 5 },
				],
			},
		},

		// Venom spires on shoreline
		{
			type: "venom-spire",
			tileX: 8,
			tileY: 6,
			faction: "scale-guard",
			properties: { preBuilt: true, detectionRadius: 5 },
		},
		{
			type: "venom-spire",
			tileX: 26,
			tileY: 6,
			faction: "scale-guard",
			properties: { preBuilt: true, detectionRadius: 5 },
		},
	],

	triggerZones: [
		// Cpl. Splash cell
		{
			id: "splash-cell",
			tileX: 28,
			tileY: 22,
			width: 5,
			height: 5,
		},
		// Underwater cache zone (center of lake)
		{
			id: "cache-zone",
			tileX: 14,
			tileY: 11,
			width: 7,
			height: 5,
		},
		// Extraction point (north)
		{
			id: "extraction-zone",
			tileX: 10,
			tileY: 0,
			width: 14,
			height: 4,
		},
		// Shoreline approach (south)
		{
			id: "south-approach",
			tileX: 10,
			tileY: 26,
			width: 14,
			height: 4,
		},
	],
};
