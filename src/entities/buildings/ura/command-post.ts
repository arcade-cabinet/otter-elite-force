import type { BuildingDef } from "../../types";

/**
 * Command Post — URA headquarters.
 * Workers, resource depot. One per base.
 * Wide triangular blue roof, centered door, two window rows.
 */
export const commandPost: BuildingDef = {
	id: "command_post",
	name: "Command Post",
	faction: "ura",
	category: "production",

	sprite: {
		size: 32,
		frames: {
			idle: [
				[
					"................................",
					"..............####..............",
					"............##BBBB##............",
					"..........##BBBBBBBb##..........",
					".........#BBBBBBBBBBBb#.........",
					"........#BBBBBBBBBBBBBb#........",
					".......#BBBBBBBBBBBBBBBb#.......",
					"......#BBBBBBBBBBBBBBBBBb#......",
					".....########################...",
					"....#wwwwwwwwwwwwwwwwwwwwwww#...",
					"....#wwwwwwwwwwwwwwwwwwwwwww#...",
					"....#wwccccwwwwwwwwwwwccccww#...",
					"....#wwcCCcwwwwwwwwwwwcCCcww#...",
					"....#wwccccwwwwwwwwwwwccccww#...",
					"....#wwwwwwwwwwwwwwwwwwwwwww#...",
					"....#wwwwwwwwwwwwwwwwwwwwwww#...",
					"....#wwwwwwwwwwwwwwwwwwwwwww#...",
					"....#wwccccwwwwwwwwwwwccccww#...",
					"....#wwcCCcwwwwwwwwwwwcCCcww#...",
					"....#wwccccwwwwwwwwwwwccccww#...",
					"....#wwwwwwwwww####wwwwwwwww#...",
					"....#wwwwwwwwww#MM#wwwwwwwww#...",
					"....#wwwwwwwwww#MM#wwwwwwwww#...",
					"....#wwwwwwwwww#MM#wwwwwwwww#...",
					"....CCCCCCCCCCCCCCCCCCCCCCCCc...",
					"....CcccccccccccccccccccccccCc..",
					"....CcccccccccccccccccccccccCc..",
					"....CCCCCCCCCCCCCCCCCCCCCCCCc...",
					"....############################",
					"....############################",
					"....############################",
					"................................",
				],
			],
		},
	},

	hp: 600,
	armor: 0,
	buildTime: 60,

	cost: { timber: 400, salvage: 200 },
	unlockedAt: "mission_1",

	trains: ["river_rat"],

	tags: ["building", "production", "ura", "depot"],
};
