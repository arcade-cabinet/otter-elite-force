import type { HeroDef, SPDSLSprite } from "@/entities/types";

// Sgt. Fang — URA siege hero. Sturdy build, stone armor belt (8/9), wood boots (6).
// Palette: otter_default — face 'a'/'b', stone '8'

// prettier-ignore
const body: string[][] = [
	[
		"0000001111000000",
		"0000013bb3100000",
		"0000013003100000",
		"0000001bb1000000",
		"0000015555100000",
		"0033154444513300",
		"0033154444513300",
		"0033154444513300",
		"0001154444511000",
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
		"0000118888110000",
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
								"0033154444513300",
								"0033154444513300",
								"0001154444511000",
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
								"0033154444513300",
								"0033154444513300",
								"0001154444511000",
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

export const sgtFang: HeroDef = {
	id: "sgt_fang",
	name: "SGT. FANG",
	faction: "ura",
	category: "siege",

	sprite,

	hp: 150,
	armor: 4,
	damage: 18,
	damageVsBuildings: 35,
	range: 1,
	attackCooldown: 1.4,
	speed: 12,
	visionRadius: 6,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "armory",

	unlockedAt: "mission_12",

	portraitId: "sgt_fang",
	unlockMission: "mission_12",
	unlockDescription: "Rescue at The Stronghold (10,-10)",

	abilities: [
		{
			id: "breach_charge",
			name: "Breach Charge",
			description: "Plant an explosive dealing 80 damage to a building",
			cooldown: 35,
		},
	],

	tags: ["IsUnit", "IsHero", "IsCombat", "IsSiege"],
};
