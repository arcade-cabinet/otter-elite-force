import type { PortraitDef } from "../types";

/**
 * Medic Marina — URA field medic.
 * 64x96 portrait. White medical coat over blue uniform, red cross armband.
 * Rescued in mission 10. Heals nearby units. Unlocks Field Hospital upgrade.
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
	// Row 6-15: Cap + top of head
	"................................................................",
	"..........................########..............................",
	"........................##cccccccccc##..........................",
	"......................##cccccccccccccccc##......................",
	".....................#ccccccRRcccccccccccc#.....................",
	"....................#cccccRrrRccccccccccccc#....................",
	"..................##SSSSSSSSSSSSSSSSSSSSSSSs##..................",
	"................##SSSSSSSSSSSSSSSSSSSSSSSSSSSs##................",
	"..............##SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss##..............",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#..............",
	// Row 16-25: Forehead + face (softer features)
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#.............",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#.............",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#.............",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#.............",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#.............",
	".............#SSSSSSSSSSSSssssssssssSSSSSSSSSSSSSs#.............",
	".............#SSSSSSSSSSSsSSSSSSSSSSSsSSSSSSSSSSSs#.............",
	".............#SSSSSSSSSSsSSSSSSSSSSSSSsSSSSSSSSSss#.............",
	".............#SSSSSSSSSsSSSSSSSSSSSSSSSsSSSSSSSSss#.............",
	".............#SSSSSSSSSsSSSSSSSSSSSSSSSsSSSSSSSSss#.............",
	// Row 26-35: Eyes (kind, gentle), nose
	".............#SSSSSSSSSsSSSSSSSSSSSSSSSsSSSSSSSSss#.............",
	".............#SSSSS###SSSSSSSSSSSSSSs###SSSSSSSSss#.............",
	".............#SSSS#.B#SSSSSSSSSSSSSSs#B.#SSSSSSSs#..............",
	".............#SSSS#BB#SSSSSSSSSSSSSSs#BB#SSSSSSSs#..............",
	".............#SSSSS##SSSSSSSSSSSSSSSss##SSSSSSSSss#.............",
	".............#SSSSSSSSSSSSSSSSSssSSSSSSSSSSSSSSSss#.............",
	".............#SSSSSSSSSSSSSSSS##SSSSSSSSSSSSSSSSss#.............",
	".............#SSSSSSSSSSSSSSS#ss#SSSSSSSSSSSSSSSss#.............",
	".............#SSSSSSSSSSSSSSSS##SSSSSSSSSSSSSSSSss#.............",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#.............",
	// Row 36-45: Mouth (gentle smile), chin
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#.............",
	".............#SSSSSSSSSSSSSS####SSSSSSSSSSSSSSSSSs#.............",
	".............#SSSSSSSSSSSSSssssssSSSSSSSSSSSSSSSss#.............",
	".............#SSSSSSSSSSSSSSs####SSSSSSSSSSSSSSSss#.............",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#.............",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#.............",
	"...............#ssSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#...............",
	"................#ssSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	"................##ssSSSSSSSSSSSSSSSSSSSSSSSSss##................",
	"..................##sSSSSSSSSSSSSSSSSSSSSSSSs##.................",
	// Row 46-50: Neck
	"....................##ssSSSSSSSSSSSSSSSSSss##...................",
	"......................##sSSSSSSSSSSSSSSSs##.....................",
	"........................#sSSSSSSSSSSSSSs#.......................",
	"........................#sSSSSSSSSSSSSSs#.......................",
	"........................#sSSSSSSSSSSSSSs#.......................",
	// Row 51-65: Shoulders — white coat over blue, red cross armband
	".....................###sBBBBBBBBBBBBBBs###.....................",
	"..................##cccccccccccccccccccccccc##..................",
	"................#cccccccccccccccccccccccccccccc#................",
	"..............#cccccccccccccccccccccccccccccccccc#..............",
	"............#cccccccccccccccccccccccccccccccccccccc#............",
	"...........#cccccccRRRRcccccccccccccccccccccccccccc#............",
	"..........#ccccccRRrrrrRRcccccccccccccccccccccccccccc#..........",
	"..........#ccccccRRrrrrRRcccccccccccccccccccccccccccc#..........",
	"..........#ccccccRRRRRRRRcccccccccccccccccccccccccccc#..........",
	"..........#cccccccRRRRRRccccccccccccccccccBBBBBccccc#...........",
	"..........#ccccccccccccccccccccccccccccccBBbbbBBcccc#...........",
	"..........#ccccccccccccccccccccccccccccccBBBBBBBcccc#...........",
	"..........#cccccccccccccccccccccccccccccccccccccccccc#..........",
	"..........#cccccccccccccccccccccccccccccccccccccccccc#..........",
	"..........#cccccccccccccccccccccccccccccccccccccccccc#..........",
	// Row 66-80: Lower coat
	"..........#cccccccccccccccccccccccccccccccccccccccccc#..........",
	"..........#cccccccccccccccccccccccccccccccccccccccccc#..........",
	"..........#cccccccccccccccccccccccccccccccccccccccccc#..........",
	"..........#cccccccccccccccccccccccccccccccccccccccccc#..........",
	"..........#cccccccccccccccccccccccccccccccccccccccccc#..........",
	"..........#cccccccccccccccccccccccccccccccccccccccccc#..........",
	"..........#cccccccccccccccccccccccccccccccccccccccccc#..........",
	"..........#cccccccccccccccccccccccccccccccccccccccccc#..........",
	"..........#cccccccccccccccccccccccccccccccccccccccccc#..........",
	"..........#cccccccccccccccccccccccccccccccccccccccccc#..........",
	"...........#cccccccccccccccccccccccccccccccccccccccc#...........",
	"...........#cccccccccccccccccccccccccccccccccccccccc#...........",
	"...........#cccccccccccccccccccccccccccccccccccccccc#...........",
	"...........#cccccccccccccccccccccccccccccccccccccccc#...........",
	"...........#cccccccccccccccccccccccccccccccccccccccc#...........",
	// Row 81-95: Fade to background
	"............#ccccccccccccccccccccccccccccccccccccc#.............",
	"..............#ccccccccccccccccccccccccccccccccc#...............",
	".................#ccccccccccccccccccccccccccc#..................",
	"....................##ccccccccccccccccccc##.....................",
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

export const medicMarina: PortraitDef = {
	id: "medic_marina",
	name: "Medic Marina",
	dialogueColor: "#ef4444",
	sprite: {
		size: 64,
		frames: {
			idle: [frame],
		},
	},
};
