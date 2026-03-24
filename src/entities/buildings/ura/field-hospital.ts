import type { BuildingDef } from "../../types";

/**
 * Field Hospital — URA healing structure.
 * Heals nearby units (+2 HP/s in 3-tile radius).
 * White/teal cross on blue roof.
 */
export const fieldHospital: BuildingDef = {
	id: "field_hospital",
	name: "Field Hospital",
	faction: "ura",
	category: "special",

	sprite: {
		size: 32,
		frames: {
			idle: [
				[
					"................................",
					"...........#BBBBBBBBb#..........",
					"..........#BBBBttBBBBb#.........",
					".........#BBBBttttBBBBb#........",
					"........#BBBBBttBBBBBBb#........",
					".......#BBBBBBBBBBBBBBBb#.......",
					"......#BBBBBBBBBBBBBBBBBb#......",
					"......########################..",
					"......#wwwwwwwwwwwwwwwwwwww#....",
					"......#wwwwwwwwwwwwwwwwwwww#....",
					"......#wwccccwwwwwwwwccccww#....",
					"......#wwcttcwwwwwwwwcttcww#....",
					"......#wwccccwwwwwwwwccccww#....",
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

	hp: 250,
	armor: 0,
	buildTime: 30,

	cost: { timber: 200, salvage: 100 },
	unlockedAt: "mission_10",

	healRate: 2,
	healRadius: 3,

	tags: ["building", "special", "ura", "healing"],
};
