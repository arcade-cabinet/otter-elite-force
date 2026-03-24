import type { BuildingDef } from "../../types";

/**
 * Burrow — URA population cap building.
 * +6 population cap. Small earthen structure.
 */
export const burrow: BuildingDef = {
	id: "burrow",
	name: "Burrow",
	faction: "ura",
	category: "economy",

	sprite: {
		size: 32,
		frames: {
			idle: [
				[
					"................................",
					"................................",
					"................................",
					"................................",
					"................................",
					"................................",
					"..........####GGGg####..........",
					".........#GGGGGGGgGGGG#.........",
					"........#GGGggGGGgGgGGG#........",
					".......#GGGggGGGGGGGgGGG#.......",
					"......#GGGGGGGGGGGGGGGgGG#......",
					"......########################..",
					"......#wwwwwwwwwwwwwwwwwwww#....",
					"......#wwwwwwwwwwwwwwwwwwww#....",
					"......#wwwwwwwwwwwwwwwwwwww#....",
					"......#wwwwwwwwwwwwwwwwwwww#....",
					"......#wwwwwwwwwwwwwwwwwwww#....",
					"......#wwwwwwwwwwwwwwwwwwww#....",
					"......#wwwwwwww####wwwwwwww#....",
					"......#wwwwwwww#MM#wwwwwwww#....",
					"......#wwwwwwww#MM#wwwwwwww#....",
					"......#wwwwwwww#MM#wwwwwwww#....",
					"......#wwwwwwww#MM#wwwwwwww#....",
					"......########################..",
					"......CCCCCCCCCCCCCCCCCCCCcc....",
					"......CcccccccccccccccccccCc....",
					"......CcccccccccccccccccccCc....",
					"......CCCCCCCCCCCCCCCCCCCCcc....",
					"......########################..",
					"......########################..",
					"......########################..",
					"................................",
				],
			],
		},
	},

	hp: 100,
	armor: 0,
	buildTime: 10,

	cost: { timber: 80 },
	unlockedAt: "mission_1",

	populationCapacity: 6,

	tags: ["building", "economy", "ura", "population"],
};
