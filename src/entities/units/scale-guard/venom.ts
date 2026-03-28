import type { SPDSLSprite, UnitDef } from "@/entities/types";

// Venom — king cobra assassin, poison specialist.
// Used in Mission 15 (as Serpent King's lieutenant). Fast ranged attacker with stealth.
// Palette: croc_default (uses cobra atlas at runtime via atlasAdapter)

// prettier-ignore
const body: string[][] = [
	[
		"0000001111000000",
		"0000012222100000",
		"0000012332100000",
		"0000001111000000",
		"0000000000000000",
		"0002000000020000",
		"0002000000020000",
		"0002000000020000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000016666100000",
		"0000016666100000",
		"0000111001110000",
		"0000000000000000",
	],
];

// prettier-ignore
const hood: string[][] = [
	[
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000015555100000",
		"0000154444510000",
		"0000154444510000",
		"0000154444510000",
		"0000114444110000",
		"0000014444100000",
		"0000017777100000",
		"0000017777100000",
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
		"0000000000000000",
		"0000000000000001",
		"000000000000001c",
		"00000000000001cc",
		"000000000000001c",
		"0000000000000010",
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
		{ id: "hood", zIndex: 2, grid: hood },
		{ id: "weapon", zIndex: 3, grid: weapon },
	],
	animations: {
		idle: [{}],
		walk: [{}],
		attack: [{}],
	},
	procedural: {
		hitFlash: true,
		teamColorLayers: ["hood"],
	},
};

export const venom: UnitDef = {
	id: "venom",
	name: "VENOM",
	faction: "scale_guard",
	category: "ranged",

	sprite,

	hp: 150,
	armor: 1,
	damage: 12,
	range: 4,
	attackCooldown: 1.2,
	speed: 9,
	visionRadius: 10,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "spawning_pool",

	unlockedAt: "mission_15",

	canCrouch: true,
	detectionRadius: 3,

	aiProfile: {
		states: ["idle", "patrol", "chase", "attack", "flee"],
		defaultState: "patrol",
		aggroRange: 10,
		fleeThreshold: 0.3,
		specialBehavior: "boss",
	},

	drops: [
		{ type: "salvage", min: 20, max: 35, chance: 1.0 },
		{ type: "fish", min: 10, max: 20, chance: 0.6 },
	],

	tags: ["IsUnit", "IsCombat", "IsElite", "IsBoss", "IsRanged", "poison_aura", "stealth"],
};
