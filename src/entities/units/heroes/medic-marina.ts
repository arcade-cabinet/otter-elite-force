import type { HeroDef, SPDSLSprite } from "@/entities/types";

// Medic Marina — URA support hero. White apron with red cross ('h' = red).
// Palette: otter_default — face 'a'/'b', red cross 'h'

// prettier-ignore
const body: string[][] = [
	[
		"0000001111000000",
		"0000013333100000",
		"0000013bb3100000",
		"0000001111000000",
		"0000000000000000",
		"0003000000030000",
		"0003000000030000",
		"0003000000030000",
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
const uniform: string[][] = [
	// White apron with red cross
	[
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000015555100000",
		"0003154hh4513000",
		"0003154hh4513000",
		"0003154444513000",
		"0000114444110000",
		"0000014444100000",
		"0000019999100000",
		"0000019999100000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
	],
];

const sprite: SPDSLSprite = {
	palette: "otter_default",
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
								"0000013333100000",
								"0000013bb3100000",
								"0000001111000000",
								"0000000000000000",
								"0003000000030000",
								"0003000000030000",
								"0003000000030000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000016666100000",
								"0000011661100000",
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
								"0000013333100000",
								"0000013bb3100000",
								"0000001111000000",
								"0000000000000000",
								"0003000000030000",
								"0003000000030000",
								"0003000000030000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000016666100000",
								"0000016611000000",
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

export const medicMarina: HeroDef = {
	id: "medic_marina",
	name: "MEDIC MARINA",
	faction: "ura",
	category: "support",

	sprite,

	hp: 80,
	armor: 1,
	damage: 3,
	range: 1,
	attackCooldown: 2.0,
	speed: 16,
	visionRadius: 7,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "command_post",

	unlockedAt: "mission_10",

	portraitId: "medic_marina",
	unlockMission: "mission_10",
	unlockDescription: "Rescue at Healer's Grove (-15, 20). Unlocks Field Hospital upgrade.",

	abilities: [
		{
			id: "triage",
			name: "Triage",
			description: "Heal target unit for 40 HP instantly.",
			cooldown: 12,
		},
		{
			id: "medic_aura",
			name: "Medic Aura",
			description: "All units within 3 tiles regenerate 2 HP/s for 10 seconds.",
			cooldown: 30,
		},
	],

	tags: ["IsUnit", "IsHero", "IsSupport"],
};
