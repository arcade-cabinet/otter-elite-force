import type { BuildingDef } from "../../types";

/**
 * Siphon — Scale-Guard resource drain / objective building.
 * Drains nearby water / poisons terrain.
 */
export const siphon: BuildingDef = {
	id: "siphon",
	name: "Siphon",
	faction: "scale_guard",
	category: "special",

	sprite: {
		size: 32,
		frames: {
			idle: [
				[
					"................................",
					"................................",
					"................................",
					"..........####RRRR##............",
					".........#RRRRRRRRRRr#..........",
					"........#RRRRRRRRRRRRr#.........",
					"........########################",
					"........#PPPPPPPPPPPPPPPPPPpp#..",
					"........#PpppppppppppppppppPp#..",
					"........#PpOOOOOOOOOOOOOOPPp#...",
					"........#PpOooooooooooooOPPp#...",
					"........#PpOoTTTTTTTTToOPPp#....",
					"........#PpOoTtttttttToOPPp#....",
					"........#PpOoTTTTTTTTToOPPp#....",
					"........#PpOooooooooooooOPPp#...",
					"........#PpOOOOOOOOOOOOOOPPp#...",
					"........#PpppppppppppppppppPp#..",
					"........#PpppppppppppppppppPp#..",
					"........#Ppppppppp##ppppppPPp#..",
					"........#Ppppppppp#M#pppppPp#...",
					"........#Ppppppppp#M#pppppPp#...",
					"........#PPPPPPPPPPPPPPPPPPpp#..",
					"........########################",
					"........CCCCCCCCCCCCCCCCCCCCcc..",
					"........CccccccccccccccccccCcc..",
					"........CccccccccccccccccccCcc..",
					"........CCCCCCCCCCCCCCCCCCCCcc..",
					"........########################",
					"........########################",
					"........########################",
					"................................",
					"................................",
				],
			],
		},
	},

	hp: 300,
	armor: 0,
	buildTime: 0,

	cost: {},
	unlockedAt: "mission_5",

	tags: ["building", "special", "scale_guard", "objective"],
};
