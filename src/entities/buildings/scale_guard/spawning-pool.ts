import type { BuildingDef, SPDSLSprite } from "../../types";

// Spawning Pool — Scale-Guard barracks. Red roof, purple/orange organic interior.
// Palette: resource_default — red 'h'/'i', purple 'e'/'f', orange 'l'/'m', interior 'g'

// prettier-ignore
const structure: string[][] = [
	[
		"00000000000000000000000000000000",
		"00000000001111hhhh1111000000000",
		"0000000001hhhhhhhhhhhhhi1000000",
		"00000000hhhiihhhhhiihhhhhi10000",
		"0000000hhhhhhhhhhhhhhhhhhhi10000",
		"000000hhhhhhhhhhhhhhhhhhhhhi1000",
		"00000011111111111111111111110000",
		"0000001777777777777777777771000",
		"00000017eeeeeeeeeeeeeeeee7710000",
		"00000017efffffffffffffffffee710000",
		"000000e7efllllfffffllllffe710000",
		"000000e7eflmmmfffmmmlfffe710000",
		"000000e7efllllfffffllllffe710000",
		"00000017efffffffffffffffffee710000",
		"00000017efffffffffffffffffee710000",
		"00000017efffffffffffffffffee710000",
		"000000e7efllllfffffllllffe710000",
		"000000e7eflmmmfffmmmlfffe710000",
		"000000e7efllllfffffllllffe710000",
		"00000017efffffff11ffffffee710000",
		"00000017efffffff1g1fffffee710000",
		"00000017efffffff1g1fffffee710000",
		"00000017efffffff1g1fffffee710000",
		"00000017eeeeeeeeeeeeeeeee7710000",
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

export const spawningPool: BuildingDef = {
	id: "spawning_pool",
	name: "Spawning Pool",
	faction: "scale_guard",
	category: "production",

	sprite,

	hp: 350,
	armor: 0,
	buildTime: 0,

	cost: {},
	unlockedAt: "mission_1",

	trains: ["gator", "viper", "snapper", "scout_lizard", "croc_champion", "siphon_drone"],

	tags: ["building", "production", "scale_guard"],
};
