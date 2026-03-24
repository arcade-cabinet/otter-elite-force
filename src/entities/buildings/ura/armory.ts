import type { BuildingDef } from "../../types";

/**
 * Armory — URA advanced training and research facility.
 * Trains Sappers, Mortar Otters. Houses all research.
 * Stone-roofed reinforced building with blue trim.
 */
export const armory: BuildingDef = {
	id: "armory",
	name: "Armory",
	faction: "ura",
	category: "production",

	sprite: {
		size: 32,
		frames: {
			idle: [
				[
					"................................",
					"..........##CCCCCCCC##..........",
					".........#CCCCCCCCCCCc#.........",
					"........#CCCBBBBBBBBCCc#........",
					".......#CCCBBBBBBBBBBCCc#.......",
					"......#CCCCCCCCCCCCCCCCCc#......",
					".....#CCCCCCCCCCCCCCCCCCCc#.....",
					".....########################...",
					".....#wwwwwwwwwwwwwwwwwwwwww#...",
					".....#wwBBBBwwwwwwwwBBBBwww#....",
					".....#wwBbbBwwwwwwwwBbbBwww#....",
					".....#wwBBBBwwwwwwwwBBBBwww#....",
					".....#wwwwwwwwwwwwwwwwwwwww#....",
					".....#wwwwwwwwwwwwwwwwwwwww#....",
					".....#wwccccwwwwwwwwccccwww#....",
					".....#wwcCCcwwwwwwwwcCCcwww#....",
					".....#wwccccwwwwwwwwccccwww#....",
					".....#wwwwwwwwwwwwwwwwwwwww#....",
					".....#wwwwwwwwwwwwwwwwwwwww#....",
					".....#wwwwwwwww####wwwwwwww#....",
					".....#wwwwwwwww#MM#wwwwwwww#....",
					".....#wwwwwwwww#MM#wwwwwwww#....",
					".....#wwwwwwwww#MM#wwwwwwww#....",
					".....#wwwwwwwww#MM#wwwwwwww#....",
					".....CCCCCCCCCCCCCCCCCCCCCCc....",
					".....CcccccccccccccccccccccCc...",
					".....CcccccccccccccccccccccCc...",
					".....CCCCCCCCCCCCCCCCCCCCCCc....",
					".....##########################.",
					".....##########################.",
					".....##########################.",
					"................................",
				],
			],
		},
	},

	hp: 400,
	armor: 0,
	buildTime: 40,

	cost: { timber: 300, salvage: 100 },
	unlockedAt: "mission_5",

	trains: ["sapper", "mortar_otter"],
	researches: [
		"hardshell_armor",
		"fish_oil_arrows",
		"fortified_walls",
		"gun_emplacements",
		"demolition_training",
		"advanced_rafts",
		"mortar_precision",
		"combat_medics",
		"diving_gear",
	],

	tags: ["building", "production", "ura", "research"],
};
