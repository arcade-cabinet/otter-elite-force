import type { SPDSLSprite, UnitDef } from "@/entities/types";

// Siphon Drone — Scale-Guard support. Purple head/gear, red uniform.
// Palette: croc_default — 'c'/'d' purple

// prettier-ignore
const body: string[][] = [
	[
		"0000001111000000",
		"000001cccc100000",
		"000001cddc100000",
		"0000001111000000",
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
		"0000110000110000",
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
		"0000014444100000",
		"0000014444100000",
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
	// Siphon pack (purple gear below torso)
	[
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
		"0000011cc1100000",
		"000cddddddc00000",
		"000ccccccccc0000",
		"0001111111110000",
		"0000000000000000",
		"0000000000000000",
	],
];

const sprite: SPDSLSprite = {
	palette: "croc_default",
	layers: [
		{ id: "body", zIndex: 1, grid: body },
		{ id: "uniform", zIndex: 2, grid: uniform },
		{ id: "weapon", zIndex: 3, grid: weapon },
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
								"000001cccc100000",
								"000001cddc100000",
								"0000001111000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0001111111110000",
								"0001100000110000",
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
								"000001cccc100000",
								"000001cddc100000",
								"0000001111000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0001111111110000",
								"0000110000110000",
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

export const siphonDrone: UnitDef = {
	id: "siphon_drone",
	name: "SIPHON DRONE",
	faction: "scale_guard",
	category: "support",

	sprite,

	hp: 40,
	armor: 1,
	damage: 0,
	range: 3,
	attackCooldown: 1.0,
	speed: 7,
	visionRadius: 5,

	cost: { fish: 50, salvage: 30 },
	populationCost: 1,
	trainTime: 20,
	trainedAt: "spawning_pool",

	unlockedAt: "mission_5",

	aiProfile: {
		states: ["idle", "patrol", "drain", "flee"],
		defaultState: "patrol",
		aggroRange: 5,
		fleeThreshold: 0.3,
		specialBehavior: "drain",
	},

	drops: [{ type: "salvage", min: 5, max: 10, chance: 0.5 }],

	tags: ["IsUnit", "IsDrainer"],
};
