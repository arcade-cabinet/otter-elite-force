import type { HeroDef, SPDSLSprite } from "@/entities/types";

// Medic Marina — URA support hero. Teal cross on uniform (legacy 't'), stone belt.
// Palette: otter_default — face 'a'/'b', teal cross 'g' (light teal)

// prettier-ignore
const body: string[][] = [
	[
		"0000001111000000",
		"0000013bb3100000",
		"0000013003100000",
		"0000001bb1000000",
		"0000015555100000",
		"0033154444513300",
		"0033154g44513300",
		"003315gggg4513300",
		"0001154g44511000",
		"0000144444410000",
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
		"0000119999110000",
		"0000018888100000",
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
								"0000013bb3100000",
								"0000013003100000",
								"0000001bb1000000",
								"0000015555100000",
								"0033154444513300",
								"0033154g44513300",
								"003315gggg4513300",
								"0001154g44511000",
								"0000144444410000",
								"0000000000000000",
								"0000000000000000",
								"0000016666100000",
								"0000011661110000",
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
								"0000013bb3100000",
								"0000013003100000",
								"0000001bb1000000",
								"0000015555100000",
								"0033154444513300",
								"0033154g44513300",
								"003315gggg4513300",
								"0001154g44511000",
								"0000144444410000",
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
	damage: 5,
	range: 1,
	attackCooldown: 1.5,
	speed: 16,
	visionRadius: 6,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "field_hospital",

	unlockedAt: "mission_10",

	portraitId: "medic_marina",
	unlockMission: "mission_10",
	unlockDescription: "Rescue at Healer's Grove (-15,20)",

	abilities: [
		{
			id: "field_triage",
			name: "Field Triage",
			description: "Heal all friendly units within 4 tiles for 30 HP over 5 seconds",
			cooldown: 20,
		},
	],

	tags: ["IsUnit", "IsHero", "IsSupport"],
};
