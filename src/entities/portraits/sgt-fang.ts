import type { PortraitDef } from "../types";

/**
 * Sgt. Fang — heavy build siege specialist.
 * 64x96 portrait. Scars across face, heavy jaw, intense eyes.
 * Rescued in mission 12. Bonus damage vs buildings.
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
	// Row 6-15: Helmet + top of head (wider build)
	"................................................................",
	"........................####CCCCCC####..........................",
	"......................##CCCCCCCCCCCCCCcc##......................",
	"....................##CCCCCCCCCCCCCCCCCCCCcc##..................",
	"...................#CCCCCCCCCCCCCCCCCCCCCCCCcc#.................",
	"..................#CCCCCCCCCCCCCCCCCCCCCCCCCCcc#................",
	"..................##SSSSSSSSSSSSSSSSSSSSSSSSSSSs##..............",
	"................##SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss##............",
	"..............##SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs##...........",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#...........",
	// Row 16-25: Forehead + scar
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#...........",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#...........",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#...........",
	".............#SSSSSSSSSSSSSSSSSSSSS#SSSSSSSSSSSSSSss#...........",
	".............#SSSSSSSSSSSSSSSSSSSS#SSSSSSSSSSSSSSSss#...........",
	".............#SSSSSSSSSSSSssssssssssSSSSSSSSSSSSSSSs#...........",
	".............#SSSSSSSSSSSsSSSSSSSSSSSsSSSSSSSSSSSSSs#...........",
	".............#SSSSSSSSSSsSSSSSSSSSSSSSsSSSSSSSSSSSss#...........",
	".............#SSSSSSSSSsSSSSSSSSSSSSSSSsSSSSSSSSSSSs#...........",
	".............#SSSSSSSSSsSSSSSSSSSSSSSSSsSSSSSSSSSSSs#...........",
	// Row 26-35: Eyes (intense), nose — scar crosses left eye
	".............#SSSSSSSSSsSSSSSSSSSSSSSSSsSSSSSSSSSSss#...........",
	".............#SSSSS####SSSSSSSSSSSSSs###SSSSSSSSSSSs#...........",
	".............#SSSS#.WW#SSSSSSSSSSSS#s#W.#SSSSSSSSss#............",
	".............#SSSS#WWW#SSSSSSSSSSSSSs#WW#SSSSSSSSss#............",
	".............#SSSSS####SSSSSSSSSSSSss####SSSSSSSSSss#...........",
	".............#SSSSSSSSSSSSSSSSSSsSSSSSSSSSSSSSSSSSss#...........",
	".............#SSSSSSSSSSSSSSSSS##SSSSSSSSSSSSSSSSSss#...........",
	".............#SSSSSSSSSSSSSSSS#ss#SSSSSSSSSSSSSSSSss#...........",
	".............#SSSSSSSSSSSSSSSSSs##SSSSSSSSSSSSSSSSss#...........",
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#...........",
	// Row 36-45: Mouth (grimace), heavy jaw
	".............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#...........",
	".............#SSSSSSSSSSSSS########SSSSSSSSSSSSSSSss#...........",
	".............#SSSSSSSSSSSS#ssssssss#SSSSSSSSSSSSSSss#...........",
	".............#SSSSSSSSSSSSs########SSSSSSSSSSSSSSSss#...........",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#...........",
	"..............#SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSss#...........",
	"...............#ssSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#............",
	"................#ssSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSs#.............",
	"................##ssSSSSSSSSSSSSSSSSSSSSSSSSSSSSs##.............",
	"..................##sSSSSSSSSSSSSSSSSSSSSSSSSSSSs##.............",
	// Row 46-50: Thick neck
	"....................##ssSSSSSSSSSSSSSSSSSSSSSss##...............",
	"......................##ssSSSSSSSSSSSSSSSSSss##.................",
	"........................##sSSSSSSSSSSSSSSSs##...................",
	"........................##sSSSSSSSSSSSSSSSs##...................",
	"........................##sSSSSSSSSSSSSSSSs##...................",
	// Row 51-65: Shoulders — broad, blue uniform
	"....................####sBBBBBBBBBBBBBBBBs####..................",
	"..................##BBBBBBBBBBBBBBBBBBBBBBBBBBb##...............",
	"...............##BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb##.............",
	"............##BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb##...........",
	"..........##BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb##..........",
	".........#BBBBBBBBBBBBBbbbbbbbbBBBBBBBBBBBBBBBBBBBBBBb#.........",
	"........#BBBBBBBBBBBBBBbBBBBBBbBBBBBBBBBBBBBBBBBBBBBBBb#........",
	"........#BBBBBBBBBBBBBBbBBBBBBbBBBBBBBBBBBBBBBBBBBBBBBb#........",
	"........#BBBBBBBBBBBBBBbBBBBBBbBBBBBBBBBBBBBBBBBBBBBBBb#........",
	"........#BBBBBBBBBBBBBBbbbbbbbbBBBBBBBBBBBBBBBBBBBBBBBb#........",
	"........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#........",
	"........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#........",
	"........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#........",
	"........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#........",
	"........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#........",
	// Row 66-80: Lower uniform
	"........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#........",
	"........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#........",
	"........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#........",
	"........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#........",
	"........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#........",
	"........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#........",
	"........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#........",
	"........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#........",
	"........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#........",
	"........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#........",
	".........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#.........",
	".........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#.........",
	".........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#.........",
	".........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#.........",
	".........#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#.........",
	// Row 81-95: Fade to background
	"..........#bBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#...........",
	"............#bBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#............",
	"...............#bBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBb#..............",
	"..................##bBBBBBBBBBBBBBBBBBBBBBBBBb##................",
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

export const sgtFang: PortraitDef = {
	id: "sgt_fang",
	name: "Sgt. Fang",
	dialogueColor: "#78350f",
	sprite: {
		size: 64,
		frames: {
			idle: [frame],
		},
	},
};
