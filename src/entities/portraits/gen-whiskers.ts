import type { PortraitDef } from "../types";

/**
 * Gen. Whiskers — grizzled veteran, URA supreme commander.
 * 64x96 portrait. Dark beret, cigar, medals, scarred face.
 * Rescued in mission 4, becomes briefing officer.
 */

// prettier-ignore
const frame: string[] = [
	// Row 0-5: Background
	"................................................................",
	"................................................................",
	"................................................................",
	"................................................................",
	"................................................................",
	"................................................................",
	// Row 6-15: Beret + top of head
	"................................................................",
	".......................#GGGGGGGGGGGGGG#.........................",
	".....................#GGGGGGGGGGGGGGGGG#........................",
	"...................#GGGGGGGGGGGGGGGGGGGg#.......................",
	"..................#GGGGGGGGGGGGGGGGGGGGGg#......................",
	"..................#GGGGGGGGGGGGGGGGGGGGGg#......................",
	"..................##SSSSSSSSSSSSSSSSSSSSss##....................",
	"................##SSSSSSSSSSSSSSSSSSSSSSSSSs##..................",
	"..............##SSSSSSSSSSSSSSSSSSSSSSSSSSSSSs##................",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	// Row 16-25: Forehead, wrinkled
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#...............",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#...............",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#...............",
	".............#SSssSSSsSSSsSSSssSSSsSSSsSSSsSSSSs#...............",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#...............",
	".............#SSSSSSSSSSSssssssssssSSSSSSSSSSSss#...............",
	".............#SSSSSSSSSSsSSSSSSSSSSSsSSSSSSSSSss#...............",
	".............#SSSSSSSSSsSSSSSSSSSSSSSsSSSSSSSSSs#...............",
	".............#SSSSSSSSsSSSSSSSSSSSSSSSsSSSSSSSss#...............",
	".............#SSSSSSSSsSSSSSSSSSSSSSSSsSSSSSSSSs#...............",
	// Row 26-35: Eyes (old, narrow), nose, scars
	".............#SSSSSSSSsSSSSSSSSSSSSSSSsSSSSSSSSs#...............",
	".............#SSSSS####SSSSSSSSSSSs####SSSSSSSSs#...............",
	".............#SSSS#.CC#SSSSSSSSSSSs#CC.#SSSSSSSs#...............",
	".............#SSSS#CCC#SSSSSSSSSSSs#CCC#SSSSSSSs#...............",
	".............#SSSSS####SSSSSSSSSSSss####SSSSSSSs#...............",
	".............#SSSSSSSSSSSSSSSSssSSSSSSSSSSSSSSSs#...............",
	".............#SSSSSSSSSSSSSSSS##SSSSSSSSSSSSSSSs#...............",
	".............#SSSSSSSSSSSSSSS#ss#SSSSSSSSSSSSSSs#...............",
	".............#SSSSSSSSSSSSSSss##SSSSSSSSSSSSSSSs#...............",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#...............",
	// Row 36-45: Mouth with cigar, chin
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#...............",
	".............#SSSSSSSSSSSSS######SSSSSSSSSSSSSSs#...............",
	".............#SSSSSSSSSSSS#ssssss#SSSSSSSSSSSSSs#...............",
	".............#SSSSSSSSSSSSSs####SSSSSSSSSSSSSSSs#...............",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#...............",
	"..............#SSSSSSSSSSSSSSSSSSSSSssWWWWWWwwss#...............",
	"...............#ssSSSSSSSSSSSSSSSSSSSSSSSSSSSs#.................",
	"................#ssSSSSSSSSSSSSSSSSSSSSSSSSSs#..................",
	"................##ssSSSSSSSSSSSSSSSSSSSSSSss##..................",
	"..................##sSSSSSSSSSSSSSSSSSSSSSs##...................",
	// Row 46-50: Neck
	"....................##ssSSSSSSSSSSSSSSSss##.....................",
	"......................##sSSSSSSSSSSSSSs##.......................",
	"........................#sSSSSSSSSSSSs#.........................",
	"........................#sSSSSSSSSSSSs#.........................",
	"........................#sSSSSSSSSSSSs#.........................",
	// Row 51-65: Shoulders — dark green dress uniform with medals
	".....................###sBBBBBBBBBBBBs###.......................",
	"..................##GGGGGGBBBBBBBBGGGGGGg##.....................",
	"................#GGGGGGGGBBBBBBBBGGGGGGGGGg#....................",
	"..............#GGGGGGGGGGBBBBBBBBGGGGGGGGGGGg#..................",
	"............#GGGGGGGGGGGGBBBBBBBBGGGGGGGGGGGGGg#................",
	"...........#GGGGGGGGGGGGGBBBBBBBBGGGGGGGGGGGGGGg#...............",
	"..........#GGGGGGGGGGGGGGBBBBBBBBGGGGGGGGGGGGGGGg#..............",
	"..........#GGGGYyYyGGGGGGBBBBBBBBGGGGGGGGGGGGGGGg#..............",
	"..........#GGGGYyYyGGGGGGBBBBBBBBGGGGGGGGGGGGGGGg#..............",
	"..........#GGGGGGGGGGGGGGBBBBBBBBGGGGGGGGGGGGGGGg#..............",
	"..........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#..............",
	"..........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#..............",
	"..........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#..............",
	"..........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#..............",
	"..........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#..............",
	// Row 66-80: Lower uniform
	"..........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#..............",
	"..........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#..............",
	"..........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#..............",
	"..........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#..............",
	"..........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#..............",
	"..........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#..............",
	"..........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#..............",
	"..........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#..............",
	"..........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#..............",
	"..........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#..............",
	"...........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#...............",
	"...........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#...............",
	"...........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#...............",
	"...........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#...............",
	"...........#GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#...............",
	// Row 81-95: Fade to background
	"............#gGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#.................",
	"..............#gGGGGGGGGGGGGGGGGGGGGGGGGGGGGg#..................",
	".................#gGGGGGGGGGGGGGGGGGGGGGGGg#....................",
	"....................##gGGGGGGGGGGGGGGGGg##......................",
	"................................................................",
	"................................................................",
	"................................................................",
	"................................................................",
	"................................................................",
	"................................................................",
	"................................................................",
	"................................................................",
	"................................................................",
	"................................................................",
	"................................................................",
];

export const genWhiskers: PortraitDef = {
	id: "gen_whiskers",
	name: "Gen. Whiskers",
	dialogueColor: "#22c55e",
	sprite: {
		size: 64,
		frames: {
			idle: [frame],
		},
	},
};
