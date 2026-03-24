import type { BuildingDef, SPDSLSprite } from "../../types";

// Sludge Pit — Scale-Guard HQ. Red roof, purple interior, red windows.
// Palette: resource_default — red 'h'/'i', purple 'e'/'f', stone '6'/'7', interior 'g'

// prettier-ignore
const structure: string[][] = [
	[
		"00000000000000000000000000000000",
		"00000000000000111100000000000000",
		"000000000000011hhhh1100000000000",
		"000000000011hhhhhhhhhi110000000",
		"00000000011hhhhhhhhhhhi1100000000",
		"0000000011hhhhhhhhhhhhhi11000000",
		"000000011hhhhhhhhhhhhhhhi1100000",
		"0000001hhhhhhhhhhhhhhhhhhi100000",
		"00000011111111111111111111110000",
		"00000017eeeeeeeeeeeeeeeeee710000",
		"00000017effffffffffffffffffee7100",
		"00000017ef77770ffffffff77770fe710",
		"000000e7ef7hh70ffffffff7ih70fe710",
		"00000017ef77770ffffffff77770fe710",
		"00000017effffffffffffffffffee7100",
		"00000017effffffffffffffffffee7100",
		"00000017effffffffffffffffffee7100",
		"00000017ef77770ffffffff77770fe710",
		"000000e7ef7hh70ffffffff7ih70fe710",
		"00000017ef77770ffffffff77770fe710",
		"000000e7efffffff11fffffffee71000",
		"000000e7efffffff1g1ffffffee71000",
		"000000e7efffffff1g1ffffffee71000",
		"000000e7efffffff1g1ffffffee71000",
		"000000666666666666666666666670000",
		"000000677777777777777777777670000",
		"000000677777777777777777777670000",
		"000000666666666666666666666670000",
		"00000011111111111111111111110000",
		"00000011111111111111111111110000",
		"00000011111111111111111111110000",
		"00000000000000000000000000000000",
	],
];

const sprite: SPDSLSprite = {
	palette: "resource_default",
	layers: [{ id: "structure", zIndex: 1, grid: structure }],
	animations: { idle: [{}] },
};

export const sludgePit: BuildingDef = {
	id: "sludge_pit",
	name: "Sludge Pit",
	faction: "scale_guard",
	category: "production",

	sprite,

	hp: 500,
	armor: 0,
	buildTime: 0,

	cost: {},
	unlockedAt: "mission_1",

	trains: ["skink"],

	tags: ["building", "production", "scale_guard", "depot"],
};
