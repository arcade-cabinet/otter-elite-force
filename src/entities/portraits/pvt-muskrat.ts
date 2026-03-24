import type { PortraitDef } from "../types";

/**
 * Pvt. Muskrat — demolition expert.
 * 64x96 portrait. Explosive insignia on cap, determined expression.
 * Hero mission at mission 14. Plants timed charges.
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
	// Row 6-15: Cap with explosive insignia + top of head
	"................................................................",
	"..........................########..............................",
	"........................##CCCCCCCCCC##..........................",
	"......................##CCCCCCCCCCCCCCcc##......................",
	".....................#CCCCCCYYYYCCCCCCCCcc#.....................",
	"....................#CCCCCCYOooOYCCCCCCCCCcc#...................",
	"..................##SSSSSSSSSSSSSSSSSSSSSSSSss##................",
	"................##SSSSSSSSSSSSSSSSSSSSSSSSSSSSss##..............",
	"..............##SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss##............",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#............",
	// Row 16-25: Forehead + face
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#............",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#............",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#............",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#............",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#............",
	".............#SSSSSSSSSSSSSSssssssssSSSSSSSSSSSSSss#............",
	".............#SSSSSSSSSSSSsSSSSSSSSSsSSSSSSSSSSSSSs#............",
	".............#SSSSSSSSSSSsSSSSSSSSSSSsSSSSSSSSSSSss#............",
	".............#SSSSSSSSSSsSSSSSSSSSSSSSsSSSSSSSSSSss#............",
	".............#SSSSSSSSSSsSSSSSSSSSSSSSsSSSSSSSSSSss#............",
	// Row 26-35: Eyes (determined), nose
	".............#SSSSSSSSSSsSSSSSSSSSSSSSsSSSSSSSSSSss#............",
	".............#SSSSSS###SSSSSSSSSSSSSs###SSSSSSSSSss#............",
	".............#SSSSS#.W#SSSSSSSSSSSSSs#W.#SSSSSSSss#.............",
	".............#SSSSS#WW#SSSSSSSSSSSSSs#WW#SSSSSSSss#.............",
	".............#SSSSSS##SSSSSSSSSSSSSSSs##SSSSSSSSSSs#............",
	".............#SSSSSSSSSSSSSSSSssSSSSSSSSSSSSSSSSSss#............",
	".............#SSSSSSSSSSSSSSS##SSSSSSSSSSSSSSSSSSss#............",
	".............#SSSSSSSSSSSSSS#ss#SSSSSSSSSSSSSSSSSss#............",
	".............#SSSSSSSSSSSSSSS##SSSSSSSSSSSSSSSSSSss#............",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#............",
	// Row 36-45: Mouth (set jaw), chin
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#............",
	".............#SSSSSSSSSSSSS######SSSSSSSSSSSSSSSSSs#............",
	".............#SSSSSSSSSSSS#ssssss#SSSSSSSSSSSSSSSSs#............",
	".............#SSSSSSSSSSSSs######SSSSSSSSSSSSSSSSSs#............",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#............",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#............",
	"...............#ssSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#.............",
	"................#ssSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#..............",
	"................##ssSSSSSSSSSSSSSSSSSSSSSSSSSSss##..............",
	"..................##sSSSSSSSSSSSSSSSSSSSSSSSSSs##...............",
	// Row 46-50: Neck
	"....................##ssSSSSSSSSSSSSSSSSSSSss##.................",
	"......................##sSSSSSSSSSSSSSSSSSs##...................",
	"........................#sSSSSSSSSSSSSSSSs#.....................",
	"........................#sSSSSSSSSSSSSSSSs#.....................",
	"........................#sSSSSSSSSSSSSSSSs#.....................",
	// Row 51-65: Shoulders — blue uniform with explosive patches
	".....................###sBBBBBBBBBBBBBBBBs###...................",
	"..................##BBBBBBBBBBBBBBBBBBBBBBBBb##.................",
	"................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	"..............#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#..............",
	"............#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#.............",
	"...........#BBBBBBBBBBBBbbbbbbbbBBBBBBBBBBBBBBBBBBb#............",
	"..........#BBBBBBBBBBBBBbBBBBBBbBBBBBBBBBBBBBBBBBBBb#...........",
	"..........#BBBBBBBBBBBBBbBBBBBBbBBBBBBBBBBBBBBBBBBBb#...........",
	"..........#BBBBBBBBBBBBBbBBBBBBbBBBBBBBBBBBBBBBBBBBb#...........",
	"..........#BBBBBBBBBBBBBbbbbbbbbBBBBBBBBBBBBBBBBBBBb#...........",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...........",
	"..........#BBBBOOBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...........",
	"..........#BBBOooOBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...........",
	"..........#BBBBOOBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...........",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...........",
	// Row 66-80: Lower uniform
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...........",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...........",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...........",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...........",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...........",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...........",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...........",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...........",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...........",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...........",
	"...........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#............",
	"...........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#............",
	"...........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#............",
	"...........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#............",
	"...........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#............",
	// Row 81-95: Fade to background
	"............#bBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#..............",
	"..............#bBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	".................#bBBBBBBBBBBBBBBBBBBBBBBBBBb#..................",
	"....................##bBBBBBBBBBBBBBBBBBBb##....................",
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

export const pvtMuskrat: PortraitDef = {
	id: "pvt_muskrat",
	name: "Pvt. Muskrat",
	dialogueColor: "#fb923c",
	sprite: {
		size: 64,
		frames: {
			idle: [frame],
		},
	},
};
