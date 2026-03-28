import type { SPDSLSprite, UnitDef } from "@/entities/types";

// The Broodmother — giant monitor lizard, final chapter boss.
// Used in Mission 13/15. Massive boss with 3 phases, summons hatchlings, regenerates.
// Palette: croc_default (reuses crocodile atlas at runtime — largest variant)

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
const crest: string[][] = [
	[
		"00a01aa1aa10a000",
		"000a0aaaa0a00000",
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
		{ id: "crest", zIndex: 3, grid: crest },
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

export const broodmother: UnitDef = {
	id: "broodmother",
	name: "THE BROODMOTHER",
	faction: "scale_guard",
	category: "infantry",

	sprite,

	hp: 400,
	armor: 6,
	damage: 25,
	range: 2,
	attackCooldown: 2.0,
	speed: 4,
	visionRadius: 10,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "spawning_pool",

	unlockedAt: "mission_13",

	aiProfile: {
		states: ["idle", "patrol", "chase", "attack", "berserk"],
		defaultState: "idle",
		aggroRange: 12,
		specialBehavior: "boss",
	},

	drops: [
		{ type: "salvage", min: 60, max: 100, chance: 1.0 },
		{ type: "fish", min: 30, max: 60, chance: 1.0 },
	],

	tags: ["IsUnit", "IsCombat", "IsElite", "IsBoss", "summon_hatchlings", "regeneration"],
};
