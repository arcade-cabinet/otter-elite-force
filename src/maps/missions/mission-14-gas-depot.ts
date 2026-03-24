import type { MissionMapData } from "../types";
import { TerrainType as T } from "../types";

/**
 * Mission 14: Gas Depot — Demolition / Hero
 * ~35×30 tiles. Pvt. Muskrat hero mission.
 * Tight industrial compound with 4 gas storage tanks to demolish.
 * Timed charges + escape timer. Chain explosions possible.
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
	//        1111111111222222222233333
	// 2345678901234567890123456789012345
	"SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS", // 0: Sludge perimeter (north)
	"SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS", // 1
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 2: Outer wall
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 3
	"SSDDDDDGGGGGGDDDDDDDDGGGGGGDDDDSS",  // 4: Gas Tank 1 (NW)    Gas Tank 2 (NE)
	"SSDDDDDGGGGGGDDDDDDDDGGGGGGDDDDSS",  // 5
	"SSDDDDDGGGGGGDDDDDDDDGGGGGGDDDDSS",  // 6
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 7
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 8
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 9: Central patrol route
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 10
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 11
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 12
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 13
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 14: Central corridor
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 15
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 16
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 17
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 18
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 19
	"SSDDDDDGGGGGGDDDDDDDDGGGGGGDDDDSS",  // 20: Gas Tank 3 (SW)    Gas Tank 4 (SE)
	"SSDDDDDGGGGGGDDDDDDDDGGGGGGDDDDSS",  // 21
	"SSDDDDDGGGGGGDDDDDDDDGGGGGGDDDDSS",  // 22
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 23
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 24
	"SSDDDDDDDDDDDDDDDDDDDDDDDDDDDDDSS", // 25: South wall
	"SSDDDDDDDDDDDDDDDBBDDDDDDDDDDDDSS", // 26: Entry gate (south)
	"SSSSSSSSSSSSSSSSSSBBSSSSSSSSSSSSSSSS", // 27: Bridge over sludge
	"GGHHHGGGGGGGGGGGDDDDGGGGGGGGGGHHHGG", // 28: Approach + tall grass
	"GGHHHGGGGGGGGGGGDDDDGGGGGGGGGGHHHGG", // 29: Entry point (south)
];

const terrain: T[][] = MAP_ROWS.map(parseRow);
const cols = terrain[0].length;
const rows = terrain.length;

export const mission14GasDepot: MissionMapData = {
	missionId: 14,
	name: "Gas Depot",
	cols,
	rows,
	terrain,

	playerStart: { tileX: 17, tileY: 29 },

	entities: [
		// Pvt. Muskrat + escort
		{
			type: "pvt-muskrat",
			tileX: 17,
			tileY: 29,
			faction: "ura",
			properties: { isHero: true, tag: "hero-muskrat" },
		},
		{ type: "mudfoot", tileX: 16, tileY: 29, faction: "ura" },
		{ type: "mudfoot", tileX: 18, tileY: 29, faction: "ura" },
		{ type: "sapper", tileX: 17, tileY: 28, faction: "ura" },

		// Gas tanks (4 demolition targets)
		{
			type: "gas-tank",
			tileX: 8,
			tileY: 5,
			faction: "scale-guard",
			properties: { preBuilt: true, tag: "gas-tank-1", explosive: true },
		},
		{
			type: "gas-tank",
			tileX: 24,
			tileY: 5,
			faction: "scale-guard",
			properties: { preBuilt: true, tag: "gas-tank-2", explosive: true },
		},
		{
			type: "gas-tank",
			tileX: 8,
			tileY: 21,
			faction: "scale-guard",
			properties: { preBuilt: true, tag: "gas-tank-3", explosive: true },
		},
		{
			type: "gas-tank",
			tileX: 24,
			tileY: 21,
			faction: "scale-guard",
			properties: { preBuilt: true, tag: "gas-tank-4", explosive: true },
		},

		// Patrol guards
		{
			type: "gator",
			tileX: 16,
			tileY: 9,
			faction: "scale-guard",
			properties: {
				patrol: [
					{ x: 5, y: 9 },
					{ x: 30, y: 9 },
				],
			},
		},
		{
			type: "gator",
			tileX: 16,
			tileY: 17,
			faction: "scale-guard",
			properties: {
				patrol: [
					{ x: 5, y: 17 },
					{ x: 30, y: 17 },
				],
			},
		},
		{
			type: "scout-lizard",
			tileX: 5,
			tileY: 13,
			faction: "scale-guard",
			properties: {
				patrol: [
					{ x: 5, y: 5 },
					{ x: 5, y: 22 },
				],
			},
		},
		{
			type: "scout-lizard",
			tileX: 30,
			tileY: 13,
			faction: "scale-guard",
			properties: {
				patrol: [
					{ x: 30, y: 5 },
					{ x: 30, y: 22 },
				],
			},
		},

		// Static guards at tanks
		{ type: "gator", tileX: 6, tileY: 4, faction: "scale-guard" },
		{ type: "gator", tileX: 26, tileY: 4, faction: "scale-guard" },
		{ type: "gator", tileX: 6, tileY: 22, faction: "scale-guard" },
		{ type: "gator", tileX: 26, tileY: 22, faction: "scale-guard" },

		// Gate guard
		{ type: "viper", tileX: 17, tileY: 25, faction: "scale-guard" },
		{ type: "gator", tileX: 16, tileY: 25, faction: "scale-guard" },
	],

	triggerZones: [
		{ id: "tank-1-zone", tileX: 6, tileY: 3, width: 6, height: 5 },
		{ id: "tank-2-zone", tileX: 22, tileY: 3, width: 6, height: 5 },
		{ id: "tank-3-zone", tileX: 6, tileY: 19, width: 6, height: 5 },
		{ id: "tank-4-zone", tileX: 22, tileY: 19, width: 6, height: 5 },
		{ id: "entry-gate", tileX: 15, tileY: 25, width: 5, height: 3 },
		{ id: "extraction", tileX: 14, tileY: 28, width: 7, height: 2 },
	],
};
