import type { SPDSLSprite, UnitDef } from "@/entities/types";

// Warden Fangrot — bloated caiman, prison warden.
// Used in Mission 4 (Prison Break). Fortified boss with shield bash.
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
		"0011999999110000",
		"0019888888910000",
		"0019888888910000",
		"0019888888910000",
		"0011888888110000",
		"0001888888100000",
		"0001555555100000",
		"0001599995100000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
	],
];

// prettier-ignore
const shield: string[][] = [
	[
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"1100000000000000",
		"1910000000000000",
		"1910000000000000",
		"1910000000000000",
		"1910000000000000",
		"1100000000000000",
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
		{ id: "shield", zIndex: 3, grid: shield },
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

export const wardenFangrot: UnitDef = {
	id: "warden_fangrot",
	name: "WARDEN FANGROT",
	faction: "scale_guard",
	category: "infantry",

	sprite,

	hp: 250,
	armor: 4,
	damage: 15,
	range: 2,
	attackCooldown: 1.8,
	speed: 5,
	visionRadius: 8,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "spawning_pool",

	unlockedAt: "mission_4",

	aiProfile: {
		states: ["idle", "patrol", "chase", "attack"],
		defaultState: "patrol",
		aggroRange: 8,
		specialBehavior: "boss",
	},

	drops: [
		{ type: "salvage", min: 25, max: 40, chance: 1.0 },
		{ type: "fish", min: 10, max: 25, chance: 0.8 },
	],

	tags: ["IsUnit", "IsCombat", "IsElite", "IsBoss", "shield_bash", "fortified"],
};
