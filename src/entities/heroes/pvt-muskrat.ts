import type { HeroDef, SPDSLSprite } from "@/entities/types";

// Pvt. Muskrat — URA siege hero. Gold explosive belt (c), stone armor.
// Palette: otter_default — face 'a'/'b', gold 'c'

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
		"0000144c44410000",
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
								"0033154444513300",
								"0033154444513300",
								"0001154444511000",
								"0000144c44410000",
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
								"0000144c44410000",
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

export const pvtMuskrat: HeroDef = {
	id: "pvt_muskrat",
	name: "PVT. MUSKRAT",
	faction: "ura",
	category: "siege",

	sprite,

	hp: 120,
	armor: 2,
	damage: 12,
	damageVsBuildings: 40,
	range: 1,
	attackCooldown: 1.2,
	speed: 11,
	visionRadius: 6,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "armory",

	unlockedAt: "mission_14",

	portraitId: "pvt_muskrat",
	unlockMission: "mission_14",
	unlockDescription: "Hero mission at Gas Depot (8,8)",

	abilities: [
		{
			id: "timed_charge",
			name: "Timed Charge",
			description: "Plant a timed explosive that detonates after 5 seconds for 100 damage",
			cooldown: 30,
		},
	],

	tags: ["IsUnit", "IsHero", "IsCombat", "IsSiege"],
};
