import type { UnitDef, SPDSLSprite } from "@/entities/types";

// Scout Lizard — Scale-Guard fast scout. Light green skin, red uniform, no weapon.
// Palette: croc_default

// prettier-ignore
const body: string[][] = [
	[
		"0000001111000000",
		"0000013223100000",
		"0000013223100000",
		"0000001111000000",
		"0000000000000000",
		"0002000000020000",
		"0002000000020000",
		"0002000000020000",
		"0000000000000000",
		"0000000000000000",
		"0000013333100000",
		"0000013333100000",
		"0000012222100000",
		"0000012222100000",
		"0000111001110000",
		"0000000000000000",
	],
];

// prettier-ignore
const uniform: string[][] = [
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
		"0000000000000000",
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
		{ id: "uniform", zIndex: 2, grid: uniform },
	],
	animations: {
		idle: [{}],
		walk: [
			{
				layerOverrides: {
					body: {
						grid: [
							[
								"0000001111000000",
								"0000013223100000",
								"0000013223100000",
								"0000001111000000",
								"0000000000000000",
								"0002000000020000",
								"0002000000020000",
								"0002000000020000",
								"0000000000000000",
								"0000000000000000",
								"0000013333100000",
								"0000013333100000",
								"0000012222100000",
								"0000011221100000",
								"0000110001110000",
								"0000000000000000",
							],
						],
					},
				},
			},
			{
				layerOverrides: {
					body: {
						grid: [
							[
								"0000001111000000",
								"0000013223100000",
								"0000013223100000",
								"0000001111000000",
								"0000000000000000",
								"0002000000020000",
								"0002000000020000",
								"0002000000020000",
								"0000000000000000",
								"0000000000000000",
								"0000013333100000",
								"0000013333100000",
								"0000012222100000",
								"0000012211000000",
								"0000111001100000",
								"0000000000000000",
							],
						],
					},
				},
			},
		],
	},
	procedural: {
		hitFlash: true,
		teamColorLayers: ["uniform"],
	},
};

export const scoutLizard: UnitDef = {
	id: "scout_lizard",
	name: "SCOUT LIZARD",
	faction: "scale_guard",
	category: "scout",

	sprite,

	hp: 25,
	armor: 0,
	damage: 3,
	range: 1,
	attackCooldown: 1.0,
	speed: 14,
	visionRadius: 10,

	cost: { fish: 40, salvage: 10 },
	populationCost: 1,
	trainTime: 12,
	trainedAt: "spawning_pool",

	unlockedAt: "mission_2",

	aiProfile: {
		states: ["idle", "patrol", "scout", "flee", "signal"],
		defaultState: "patrol",
		aggroRange: 10,
		fleeThreshold: 0.5,
		specialBehavior: "signal",
	},

	drops: [{ type: "salvage", min: 1, max: 3, chance: 0.2 }],

	tags: ["IsUnit", "IsScout"],
};
