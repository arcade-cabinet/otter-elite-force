import type { SPDSLSprite, UnitDef } from "@/entities/types";

// Snapper — Scale-Guard stationary ranged turret. Wide body, armored shell.
// Palette: croc_default

// prettier-ignore
const body: string[][] = [
	[
		"0000111111110000",
		"0001222222221000",
		"0001222332221000",
		"0001222222221000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0011111111111100",
		"0011111111111100",
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
		"0011555555551100",
		"0015444444445100",
		"0015444444445100",
		"0015444444445100",
		"0011444444441100",
		"0018888888888100",
		"0018888888888100",
		"0018888888888100",
		"0018888888888100",
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
		attack: [
			{
				layerOverrides: {
					uniform: {
						grid: [
							[
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0011555555551100",
								"0015444444445100",
								"0015444444445100",
								"0015444444445199",
								"0011444444441199",
								"0018888888888100",
								"0018888888888100",
								"0018888888888100",
								"0018888888888100",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
							],
						],
					},
				},
			},
			{
				layerOverrides: {
					uniform: {
						grid: [
							[
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0011555555551100",
								"0015444444445199",
								"0015444444445199",
								"0015444444445100",
								"0011444444441100",
								"0018888888888100",
								"0018888888888100",
								"0018888888888100",
								"0018888888888100",
								"0000000000000000",
								"0000000000000000",
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

export const snapper: UnitDef = {
	id: "snapper",
	name: "SNAPPER",
	faction: "scale_guard",
	category: "ranged",

	sprite,

	hp: 80,
	armor: 3,
	damage: 14,
	range: 6,
	attackCooldown: 1.2,
	speed: 0,
	visionRadius: 7,

	cost: { fish: 80, salvage: 40 },
	populationCost: 1,
	trainTime: 25,
	trainedAt: "spawning_pool",

	unlockedAt: "mission_5",

	aiProfile: {
		states: ["idle", "attack"],
		defaultState: "idle",
		aggroRange: 7,
	},

	drops: [{ type: "salvage", min: 8, max: 15, chance: 0.6 }],

	tags: ["IsUnit", "IsCombat", "IsRanged", "IsStationary"],
};
