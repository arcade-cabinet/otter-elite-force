import type { MissionMapData } from "../types";
import { TerrainType as T } from "../types";

/**
 * Mission 4: Prison Break — Commando / Rescue
 * ~30×25 tiles (tight infiltration map per spec §8.1).
 * Sgt. Bubbles + 2 scouts must infiltrate a Scale-Guard compound,
 * rescue Gen. Whiskers, and escape to the extraction point.
 *
 * Layout:
 *   NW: Extraction point (player goal)
 *   Center: Scale-Guard compound (walls, patrols, prison cell)
 *   SE: Player infiltration entry
 *   Tall grass and mangroves provide concealment routes.
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
	//        111111111122222222
	// 23456789012345678901234567890
	"DDDDDDGGGGGGGGGGGGGGGGGGGGGVV", // 0: Extraction point (NW)
	"DDDDDGGGGGGGGGGGGGGGGGGGGGGVV", // 1
	"DDDDGGGGGGGGGGGGGGGGGGGGGGGVV", // 2
	"GGGGGGGGDDDDDDDDDDDDDDGGGGGV", // 3: Compound outer perimeter
	"GGGGGGDDDDDDDDDDDDDDDDDDGGGG", // 4
	"GGGGGDDDDDDDDDDDDDDDDDDDDHGG", // 5: Compound grounds
	"GGGGGDDDDDDDDDDDDDDDDDDDDHGG", // 6
	"GGGGDDDDDDDGDDDDDGDDDDDDDHHG", // 7: Interior walls (G=walls between D=paths)
	"GGGGDDDDDDDGDDDDDGDDDDDDDHGG", // 8
	"GGGGDDDDDDDGDDDDDGDDDDDDDHGG", // 9: Gen. Whiskers cell (center)
	"GGGGDDDDDDDGDDDDDGDDDDDDDHGG", // 10
	"GGGGDDDDDDDDDDDDDDDDDDDDDHHG", // 11
	"GGGGGDDDDDDDDDDDDDDDDDDDDHGG", // 12
	"GGGGGDDDDDDDDDDDDDDDDDDDDHHG", // 13
	"GGGGGGDDDDDDDDDDDDDDDDDDDHGG", // 14
	"GGGGGGGDDDDDDDDDDDDDDDDDDHHG", // 15: Compound southern wall
	"GGGGGGGGDDDDDDDDDDDDDDDDGHHG", // 16
	"GGGGGGGGGGGGGGGGGDDDDDDGGHHHG", // 17: SE approach
	"WWWGGGGGGGGGGGGGGGGDDDDGGHHGG", // 18: River (west) — blocks direct approach
	"WWWWGGHHHGGGGGGGGGGGGDDGGHGGG", // 19
	"WWWWWGHHHHGGGGGGGGGGGGDGGGGGG", // 20: Tall grass infiltration route
	"WWWWWGGHHHGGGGGGGGGGGGGGGGGGG", // 21
	"WWWWWGGGHHGGGGGGGGGVVGGGGGVVV", // 22: Mangrove concealment
	"WWWWWGGGGGGGGGGGGGVVVGGGVVVVV", // 23
	"WWWWWWGGGGGGGGGGGVVVGGVVVVVVV", // 24: Player entry point (SE)
];

const terrain: T[][] = MAP_ROWS.map(parseRow);
const cols = terrain[0].length;
const rows = terrain.length;

export const mission04PrisonBreak: MissionMapData = {
	missionId: 4,
	name: "Prison Break",
	cols,
	rows,
	terrain,

	playerStart: { tileX: 25, tileY: 24 },

	entities: [
		// Player units — hero + 2 scouts (commando team)
		{
			type: "sgt-bubbles",
			tileX: 25,
			tileY: 24,
			faction: "ura",
			properties: { isHero: true },
		},
		{
			type: "mudfoot",
			tileX: 24,
			tileY: 24,
			faction: "ura",
			properties: { tag: "scout-1" },
		},
		{
			type: "mudfoot",
			tileX: 26,
			tileY: 24,
			faction: "ura",
			properties: { tag: "scout-2" },
		},

		// Gen. Whiskers — prisoner
		{
			type: "gen-whiskers",
			tileX: 15,
			tileY: 9,
			faction: "ura",
			properties: {
				isHero: true,
				imprisoned: true,
				tag: "gen-whiskers",
			},
		},

		// Scale-Guard compound guards
		// Gate guards
		{ type: "gator", tileX: 18, tileY: 16, faction: "scale-guard" },
		{ type: "gator", tileX: 20, tileY: 16, faction: "scale-guard" },

		// Patrol route 1 — north perimeter
		{
			type: "scout-lizard",
			tileX: 10,
			tileY: 4,
			faction: "scale-guard",
			properties: {
				patrol: [
					{ x: 10, y: 4 },
					{ x: 22, y: 4 },
				],
			},
		},

		// Patrol route 2 — east perimeter
		{
			type: "scout-lizard",
			tileX: 24,
			tileY: 6,
			faction: "scale-guard",
			properties: {
				patrol: [
					{ x: 24, y: 6 },
					{ x: 24, y: 14 },
				],
			},
		},

		// Patrol route 3 — south approach
		{
			type: "scout-lizard",
			tileX: 15,
			tileY: 15,
			faction: "scale-guard",
			properties: {
				patrol: [
					{ x: 10, y: 15 },
					{ x: 22, y: 15 },
				],
			},
		},

		// Interior guards near the cell
		{ type: "gator", tileX: 13, tileY: 9, faction: "scale-guard" },
		{ type: "gator", tileX: 17, tileY: 9, faction: "scale-guard" },

		// Venom spire (detection tower)
		{
			type: "venom-spire",
			tileX: 12,
			tileY: 6,
			faction: "scale-guard",
			properties: { preBuilt: true, detectionRadius: 6 },
		},
		{
			type: "venom-spire",
			tileX: 22,
			tileY: 6,
			faction: "scale-guard",
			properties: { preBuilt: true, detectionRadius: 6 },
		},
	],

	triggerZones: [
		// Gen. Whiskers cell area
		{
			id: "prison-cell",
			tileX: 13,
			tileY: 8,
			width: 5,
			height: 4,
		},
		// Extraction point
		{
			id: "extraction-zone",
			tileX: 0,
			tileY: 0,
			width: 5,
			height: 4,
		},
		// Compound perimeter (triggers alarm)
		{
			id: "compound-perimeter",
			tileX: 5,
			tileY: 3,
			width: 22,
			height: 14,
		},
		// Southeast approach
		{
			id: "infiltration-approach",
			tileX: 20,
			tileY: 16,
			width: 8,
			height: 8,
		},
	],
};
