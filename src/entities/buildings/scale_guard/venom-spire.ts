import type { BuildingDef } from "../../types";

/**
 * Venom Spire — Scale-Guard defensive tower.
 * 10 damage, range 7. Tall red/purple spire.
 */
export const venomSpire: BuildingDef = {
	id: "venom_spire",
	name: "Venom Spire",
	faction: "scale_guard",
	category: "defense",

	sprite: {
		size: 32,
		frames: {
			idle: [
				[
					"................................",
					"...............PP...............",
					"..............PppP..............",
					".............PppppP.............",
					"............PpRRRRpP............",
					"...........PpRRRRRRpP...........",
					"..........PpRRRRRRRRpP..........",
					"..........#RRRRRRRRRR#..........",
					"..........#cccccccccc#..........",
					"..........#ccPPPPPPcc#..........",
					"..........#ccPppppPcc#..........",
					"..........#ccPppppPcc#..........",
					"..........#ccPPPPPPcc#..........",
					"..........#cccccccccc#..........",
					"..........#cccccccccc#..........",
					"..........#ccPPPPPPcc#..........",
					"..........#ccPppppPcc#..........",
					"..........#ccPppppPcc#..........",
					"..........#ccPPPPPPcc#..........",
					"..........#cccccccccc#..........",
					"..........#ccccMMcccc#..........",
					"..........#ccccMMcccc#..........",
					"..........#ccccMMcccc#..........",
					"..........#ccccMMcccc#..........",
					"..........CCCCCCCCCCCc..........",
					"..........CcccccccccCc..........",
					"..........CcccccccccCc..........",
					"..........CCCCCCCCCCCc..........",
					"..........############..........",
					"..........############..........",
					"..........############..........",
					"................................",
				],
			],
		},
	},

	hp: 250,
	armor: 0,
	buildTime: 0,

	cost: {},
	unlockedAt: "mission_1",

	attackDamage: 10,
	attackRange: 7,
	attackCooldown: 2,

	tags: ["building", "defense", "scale_guard", "poison"],
};
