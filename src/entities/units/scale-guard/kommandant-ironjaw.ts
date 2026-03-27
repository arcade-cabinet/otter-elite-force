import type { SPDSLSprite, UnitDef } from "@/entities/types";

// Kommandant Ironjaw — Scale-Guard supreme commander / boss unit.
// Final boss of Mission 15 (Serpent's Lair). Massive armored crocodile.
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
const crown: string[][] = [
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
		{ id: "crown", zIndex: 3, grid: crown },
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

export const kommandantIronjaw: UnitDef = {
	id: "kommandant_ironjaw",
	name: "KOMMANDANT IRONJAW",
	faction: "scale_guard",
	category: "infantry",

	sprite,

	hp: 5000,
	armor: 8,
	damage: 40,
	range: 2,
	attackCooldown: 1.5,
	speed: 3,
	visionRadius: 10,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "spawning_pool",

	unlockedAt: "mission_15",

	aiProfile: {
		states: ["idle", "patrol", "chase", "attack", "berserk"],
		defaultState: "idle",
		aggroRange: 12,
		specialBehavior: "boss",
	},

	drops: [
		{ type: "salvage", min: 100, max: 200, chance: 1.0 },
		{ type: "fish", min: 50, max: 100, chance: 1.0 },
	],

	tags: ["IsUnit", "IsCombat", "IsElite", "IsBoss"],
};
