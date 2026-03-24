import type { BuildingDef } from "../../types";

/**
 * Sludge Pit — Scale-Guard town hall equivalent.
 * Red faction color roof, toxic sludge pool aesthetic.
 */
export const sludgePit: BuildingDef = {
	id: "sludge_pit",
	name: "Sludge Pit",
	faction: "scale_guard",
	category: "production",

	sprite: {
		size: 32,
		frames: {
			idle: [
				[
					"................................",
					"..............####..............",
					"............##RRRR##............",
					"..........##RRRRRRRRr##.........",
					".........#RRRRRRRRRRRRr#........",
					"........#RRRRRRRRRRRRRRr#.......",
					".......#RRRRRRRRRRRRRRRRr#......",
					"......#RRRRRRRRRRRRRRRRRRr#.....",
					"......########################..",
					"......#PPPPPPPPPPPPPPPPPPPp#....",
					"......#PpppppppppppppppppPPp#...",
					"......#PpccccppppppppccccpPp#...",
					"......#PpcRRcppppppppcrRcpPp#...",
					"......#PpccccppppppppccccpPp#...",
					"......#PpppppppppppppppppPPp#...",
					"......#PpppppppppppppppppPPp#...",
					"......#PpppppppppppppppppPPp#...",
					"......#PpccccppppppppccccpPp#...",
					"......#PpcRRcppppppppcrRcpPp#...",
					"......#PpccccppppppppccccpPp#...",
					"......#Pppppppppp##pppppppPp#...",
					"......#Pppppppppp#M#ppppppPp#...",
					"......#Pppppppppp#M#ppppppPp#...",
					"......#Pppppppppp#M#ppppppPp#...",
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

	hp: 500,
	armor: 0,
	buildTime: 0,

	cost: {},
	unlockedAt: "mission_1",

	trains: ["skink"],

	tags: ["building", "production", "scale_guard", "depot"],
};
