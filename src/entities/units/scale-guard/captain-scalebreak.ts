import type { SPDSLSprite, UnitDef } from "@/entities/types";

// Captain Scalebreak — albino gator, Scale-Guard field captain.
// Used in Mission 6 (Monsoon Ambush). Cunning tactician with command aura.
// Palette: croc_default (reuses crocodile atlas at runtime via atlasAdapter)

// prettier-ignore
const body: string[][] = [
	[
		"0000111111110000",
		"0001222222221000",
		"0012233333221000",
		"0012222222221000",
		"0000000000000000",
		"0330000000003310",
		"0300000000000300",
		"0300000000000300",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0001666666610000",
		"0001666666610000",
		"0011110011110000",
		"0000000000000000",
	],
];

// prettier-ignore
const armor: string[][] = [
	[
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0011555555110000",
		"0015444444510000",
		"0015444444510000",
		"0015444444510000",
		"0011444444110000",
		"0001444444100000",
		"0001888888100000",
		"0001899998100000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
	],
];

// prettier-ignore
const insignia: string[][] = [
	[
		"0000000000000000",
		"0000099990000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
	],
];

// prettier-ignore
const weapon: string[][] = [
	[
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000001100",
		"0000000000001910",
		"0000000000001910",
		"0000000000001910",
		"0000000000001910",
		"0000000000001100",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
	],
];

const sprite: SPDSLSprite = {
	palette: "croc_default",
	layers: [
		{ id: "body", zIndex: 1, grid: body },
		{ id: "armor", zIndex: 2, grid: armor },
		{ id: "insignia", zIndex: 3, grid: insignia },
		{ id: "weapon", zIndex: 4, grid: weapon },
	],
	animations: {
		idle: [{}],
		walk: [{}],
		attack: [{}],
	},
	procedural: {
		hitFlash: true,
		teamColorLayers: ["armor"],
	},
};

export const captainScalebreak: UnitDef = {
	id: "captain_scalebreak",
	name: "CAPTAIN SCALEBREAK",
	faction: "scale_guard",
	category: "infantry",

	sprite,

	hp: 300,
	armor: 5,
	damage: 18,
	range: 2,
	attackCooldown: 1.5,
	speed: 6,
	visionRadius: 9,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "spawning_pool",

	unlockedAt: "mission_6",

	aiProfile: {
		states: ["idle", "patrol", "chase", "attack", "berserk"],
		defaultState: "patrol",
		aggroRange: 10,
		specialBehavior: "boss",
	},

	drops: [
		{ type: "salvage", min: 30, max: 50, chance: 1.0 },
		{ type: "fish", min: 15, max: 30, chance: 0.8 },
	],

	tags: ["IsUnit", "IsCombat", "IsElite", "IsBoss", "command_aura"],
};
