import type { BuildingDef } from "../../types";

/**
 * Spawning Pool — Scale-Guard barracks equivalent.
 * Trains all combat units. Red stone with organic detailing.
 */
export const spawningPool: BuildingDef = {
	id: "spawning_pool",
	name: "Spawning Pool",
	faction: "scale_guard",
	category: "production",

	sprite: {
		size: 32,
		frames: {
			idle: [
				[
					"................................",
					"..........####RRRR####..........",
					".........#RRRRRRRRRRRRr#........",
					"........#RRRrrRRRRrrRRRRr#......",
					".......#RRRRRRRRRRRRRRRRRr#.....",
					"......#RRRRRRRRRRRRRRRRRRRr#....",
					"......########################..",
					"......#cccccccccccccccccccccc#..",
					"......#ccPPPPPPPPPPPPPPPPPcc#...",
					"......#ccPpppppppppppppppPcc#...",
					"......#ccPpOOOOppppOOOOppPcc#...",
					"......#ccPpOooOppppoooOppPcc#...",
					"......#ccPpOOOOppppOOOOppPcc#...",
					"......#ccPpppppppppppppppPcc#...",
					"......#ccPpppppppppppppppPcc#...",
					"......#ccPpppppppppppppppPcc#...",
					"......#ccPpOOOOppppOOOOppPcc#...",
					"......#ccPpOooOppppoooOppPcc#...",
					"......#ccPpOOOOppppOOOOppPcc#...",
					"......#ccPppppppp##ppppppPcc#...",
					"......#ccPppppppp#M#pppppPcc#...",
					"......#ccPppppppp#M#pppppPcc#...",
					"......#ccPppppppp#M#pppppPcc#...",
					"......#ccPPPPPPPPPPPPPPPPPcc#...",
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

	hp: 350,
	armor: 0,
	buildTime: 0,

	cost: {},
	unlockedAt: "mission_1",

	trains: ["gator", "viper", "snapper", "scout_lizard", "croc_champion", "siphon_drone"],

	tags: ["building", "production", "scale_guard"],
};
