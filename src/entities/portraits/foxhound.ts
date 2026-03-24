import type { PortraitDef } from "../types";

/**
 * FOXHOUND — URA radio operator and briefing officer.
 * 64x96 portrait. Radio headset over headphones, blue uniform, alert expression.
 * Delivers mission briefings in early campaign before Gen. Whiskers is rescued.
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
	// Row 6-15: Headset + top of head
	"..........................########..............................",
	"........................##SSSSSSSSss##..........................",
	"......................##SSSSSSSSSSSSSSss##......................",
	"....................##SSSSSSSSSSSSSSSSSSSss##...................",
	"...................#SSSSSSSSSSSSSSSSSSSSSSSs#...................",
	"..................#SSSSSSSSSSSSSSSSSSSSSSSSss#..................",
	"................##SSSSSSSSSSSSSSSSSSSSSSSSSSs##.................",
	"...............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#.................",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#................",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	// Row 16-25: Headset earpieces + forehead
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	"............CCSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSsCC...............",
	"...........CcCSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSScCc...............",
	"...........CcCSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSScCc...............",
	"...........CcCSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSCCc...............",
	"...........CcCSSSSSSSSSSssssssssssSSSSSSSSSSSScCc...............",
	"...........CcCSSSSSSSSSssSSSSSSSSssSSSSSSSSSSSCCc...............",
	"...........CcCSSSSSSSSsSSSSSSSSSSSsSSSSSSSSSSSCCc...............",
	"............CCSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSsCC................",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	// Row 26-35: Eyes, nose
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	".............#SSSSS###SSSSSSSSSSSSs###SSSSSSSSs#................",
	".............#SSSS#.B#SSSSSSSSSSSSs#B.#SSSSSSs#.................",
	".............#SSSS#BB#SSSSSSSSSSSSs#BB#SSSSSSs#.................",
	".............#SSSSS##SSSSSSSSSSSSSss##SSSSSSSs#.................",
	".............#SSSSSSSSSSSSSSssSSSSSSSSSSSSSSSss#................",
	".............#SSSSSSSSSSSSSS##SSSSSSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSSSS#ss#SSSSSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSSSSS##SSSSSSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	// Row 36-45: Mouth, chin, whiskers
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSSS######SSSSSSSSSSSSSss#................",
	".............#SSSSSSSSSSS#ssssss#SSSSSSSSSSSSss#................",
	".............#SSSSSSSSSSSS######SSSSSSSSSSSSSSs#................",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#................",
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
	// Row 51-65: Shoulders, chest, uniform (blue)
	".....................###sBBBBBBBBBBBBs###.......................",
	"..................##BBBBBBBBBBBBBBBBBBBBb##.....................",
	"................#BBBBBBBBBBBBBBBBBBBBBBBBBb#....................",
	"..............#BBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...................",
	"............#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#..................",
	"...........#BBBBBBBBBBBbbbbbbbbBBBBBBBBBBBBBBb#.................",
	"..........#BBBBBBBBBBBBbBBBBBBbBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBbBBBBBBbBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBbBBBBBBbBBBBBBBBBBBBBBBb#................",
	"..........#BBBBBBBBBBBBbbbbbbbbBBBBBBBBBBBBBBBb#................",
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

export const foxhound: PortraitDef = {
	id: "foxhound",
	name: "FOXHOUND",
	dialogueColor: "#3b82f6",
	sprite: {
		size: 64,
		frames: {
			idle: [frame],
		},
	},
};
