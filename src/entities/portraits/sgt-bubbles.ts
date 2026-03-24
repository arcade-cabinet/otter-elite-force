import type { PortraitDef } from "../types";

/**
 * Sgt. Bubbles — Rambo-style warrior-leader of the URA.
 * 64x96 portrait. Teal-tinted otter, red bandana, battle-worn expression.
 * Available from mission 1. The player's main hero.
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
	// Row 6-15: Red bandana + top of head
	"................................................................",
	"..........................RRRRRRRRRR............................",
	"........................RRrrrrrrrrRRRR..........................",
	"......................RRrrRRRRRRRRrrRRRR........................",
	".....................RRrrRRRRRRRRRRrrRRR........................",
	"....................RRrrRRRRRRRRRRRRrrRR........................",
	"..................##SSSSSSSSSSSSSSSSSSss##......................",
	"................##SSSSSSSSSSSSSSSSSSSSSSSs##....................",
	"..............##SSSSSSSSSSSSSSSSSSSSSSSSSSSs##..................",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#.................",
	// Row 16-25: Forehead + face
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#................",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSSssssssssssSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSsSSSSSSSSSSSsSSSSSSSSSs#................",
	".............#SSSSSSSSSsSSSSSSSSSSSSSsSSSSSSSss#................",
	".............#SSSSSSSSsSSSSSSSSSSSSSSSsSSSSSSSs#................",
	".............#SSSSSSSSsSSSSSSSSSSSSSSSsSSSSSSss#................",
	// Row 26-35: Eyes (3x3 with glint), nose
	".............#SSSSSSSSsSSSSSSSSSSSSSSSsSSSSSSss#................",
	".............#SSSSS###SSSSSSSSSSSSSs###SSSSSSSs#................",
	".............#SSSS#.T#SSSSSSSSSSSSSs#T.#SSSSSSs#................",
	".............#SSSS#TT#SSSSSSSSSSSSSs#TT#SSSSSSs#................",
	".............#SSSSS##SSSSSSSSSSSSSSss##SSSSSSss#................",
	".............#SSSSSSSSSSSSSSSssSSSSSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSSSSSS##SSSSSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSSSSS#ss#SSSSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSSSSSS##SSSSSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	// Row 36-45: Mouth, chin, whiskers
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	".............#SSSSSssSSSS######SSSSSssSSSSSSSss#................",
	".............#SSSSSSsSSSs#ssssss#SSSsSSSSSSSSSs#................",
	".............#SSSSSSSSSSSs######SSSSSSSSSSSSSss#................",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
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
	// Row 51-65: Shoulders, chest — teal otter uniform accent
	".....................###sBBBBBBBBBBBBs###.......................",
	"..................##BBBBBBBBBBBBBBBBBBBBb##.....................",
	"................#BBBBBBBBBBBBBBBBBBBBBBBBBb#....................",
	"..............#BBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...................",
	"............#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#..................",
	"...........#BBBBBBBBBBBTTTTTTTTBBBBBBBBBBBBBBb#.................",
	"..........#BBBBBBBBBBBBTtttttttBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBTTTTTTTTBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	// Row 66-80: Lower uniform
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#................",
	"...........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#.................",
	"...........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#.................",
	"...........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#.................",
	"...........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#.................",
	"...........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#.................",
	// Row 81-95: Fade to background
	"............#bBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...................",
	"..............#bBBBBBBBBBBBBBBBBBBBBBBBBBBb#....................",
	".................#bBBBBBBBBBBBBBBBBBBBBBb#......................",
	"....................##bBBBBBBBBBBBBBBb##........................",
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

export const sgtBubbles: PortraitDef = {
	id: "sgt_bubbles",
	name: "Sgt. Bubbles",
	dialogueColor: "#5eead4",
	sprite: {
		size: 64,
		frames: {
			idle: [frame],
		},
	},
};
