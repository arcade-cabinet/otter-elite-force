import type { PortraitDef } from "../types";

/**
 * Cpl. Splash — young aquatic specialist.
 * 64x96 portrait. Dive goggles pushed up on forehead, teal wetsuit top.
 * Rescued in mission 8. Unlocks Diver scouts.
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
	// Row 6-15: Goggles on forehead + top of head
	"................................................................",
	"..........................########..............................",
	"........................##SSSSSSSSss##..........................",
	"......................##SSSSSSSSSSSSSSss##......................",
	".....................#SSSSSSSSSSSSSSSSSSSs#.....................",
	"....................#CCCCCCCCCCCCCCCCCCCCss#....................",
	"..................#CcTTTTcCCCCCCCCcTTTTcCCss#...................",
	"................#CcTTttTTcCCCCCCcTTttTTcCCSSs#..................",
	"..............#CcCcTTTTcCCCCCCCCCcTTTTcCSSSSs#..................",
	"..............#SSSSCCCCSSSSSSSSSSSSCCCCSSSSSSs#.................",
	// Row 16-25: Forehead + face
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSSssssssssssSSSSSSSSSSSs#................",
	".............#SSSSSSSSSSsSSSSSSSSSSSsSSSSSSSSSs#................",
	".............#SSSSSSSSSsSSSSSSSSSSSSSsSSSSSSSSSs#...............",
	".............#SSSSSSSSsSSSSSSSSSSSSSSSsSSSSSSSs#................",
	".............#SSSSSSSSsSSSSSSSSSSSSSSSsSSSSSSSSs#...............",
	// Row 26-35: Eyes (bright teal), nose
	".............#SSSSSSSSsSSSSSSSSSSSSSSSsSSSSSSSSs#...............",
	".............#SSSSS###SSSSSSSSSSSSSs###SSSSSSSSs#...............",
	".............#SSSS#.T#SSSSSSSSSSSSSs#T.#SSSSSSSs#...............",
	".............#SSSS#TT#SSSSSSSSSSSSSs#TT#SSSSSSSs#...............",
	".............#SSSSS##SSSSSSSSSSSSSSss##SSSSSSSSSs#..............",
	".............#SSSSSSSSSSSSSSSSssSSSSSSSSSSSSSSSss#..............",
	".............#SSSSSSSSSSSSSSS##SSSSSSSSSSSSSSSSss#..............",
	".............#SSSSSSSSSSSSSS#ss#SSSSSSSSSSSSSSSss#..............",
	".............#SSSSSSSSSSSSSSS##SSSSSSSSSSSSSSSSss#..............",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#..............",
	// Row 36-45: Mouth, chin
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#..............",
	".............#SSSSSSSSSSSSS######SSSSSSSSSSSSSSss#..............",
	".............#SSSSSSSSSSSS#ssssss#SSSSSSSSSSSSSss#..............",
	".............#SSSSSSSSSSSSSs####SSSSSSSSSSSSSSSss#..............",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#..............",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#..............",
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
	// Row 51-65: Shoulders — teal wetsuit
	".....................###sTTTTTTTTTTTTTTs###.....................",
	"..................##TTTTTTTTTTTTTTTTTTTTTTt##...................",
	"................#TTTTTTTTTTTTTTTTTTTTTTTTTTTt#..................",
	"..............#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#................",
	"............#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#...............",
	"...........#TTTTTTTTTTTTttttttttTTTTTTTTTTTTTTTTt#..............",
	"..........#TTTTTTTTTTTTTtTTTTTTtTTTTTTTTTTTTTTTTTt#.............",
	"..........#TTTTTTTTTTTTTtTTTTTTtTTTTTTTTTTTTTTTTTt#.............",
	"..........#TTTTTTTTTTTTTtTTTTTTtTTTTTTTTTTTTTTTTTt#.............",
	"..........#TTTTTTTTTTTTTttttttttTTTTTTTTTTTTTTTTTt#.............",
	"..........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#.............",
	"..........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#.............",
	"..........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#.............",
	"..........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#.............",
	"..........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#.............",
	// Row 66-80: Lower wetsuit
	"..........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#.............",
	"..........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#.............",
	"..........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#.............",
	"..........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#.............",
	"..........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#.............",
	"..........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#.............",
	"..........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#.............",
	"..........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#.............",
	"..........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#.............",
	"..........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#.............",
	"...........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#..............",
	"...........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#..............",
	"...........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#..............",
	"...........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#..............",
	"...........#TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#..............",
	// Row 81-95: Fade to background
	"............#tTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#................",
	"..............#tTTTTTTTTTTTTTTTTTTTTTTTTTTTTTt#.................",
	".................#tTTTTTTTTTTTTTTTTTTTTTTTTt#...................",
	"....................##tTTTTTTTTTTTTTTTTTt##.....................",
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

export const cplSplash: PortraitDef = {
	id: "cpl_splash",
	name: "Cpl. Splash",
	dialogueColor: "#0d9488",
	sprite: {
		size: 64,
		frames: {
			idle: [frame],
		},
	},
};
