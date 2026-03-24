import type { HeroDef, SPDSLSprite } from "@/entities/types";

// Pvt. Muskrat — URA siege hero. Demolitions expert, gold explosives (c/d).
// Palette: otter_default — brown fur '2'/'3', face 'a'/'b'

// prettier-ignore
const body: string[][] = [
	[
		"0000001111000000",
		"0000019999100000",
		"000001abb3100000",
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
	[
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000015555100000",
		"0003154444513000",
		"0003154444513000",
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

// prettier-ignore
const weapon: string[][] = [
	// Explosive charges at sides
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
		"0000000000000000",
		"0000000000000000",
		"01c0000000001c00",
		"1d1c000000c1d100",
		"01c0000000001c00",
		"0000000000000000",
	],
];

const sprite: SPDSLSprite = {
	palette: "otter_default",
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
								"0000019999100000",
								"000001abb3100000",
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
								"0000019999100000",
								"000001abb3100000",
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
		attack: [
			{
				layerOverrides: {
					weapon: {
						grid: [
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
								"0000000000000000",
								"0000000000000000",
								"0000016666100000",
								"00000166661001c0",
								"0000111001111d10",
								"00000000000001c0",
							],
						],
					},
				},
			},
			{
				layerOverrides: {
					weapon: {
						grid: [
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
								"0000000000000000",
								"0000000000000000",
								"0000016666100000",
								"000001666610010c",
								"000011100111c1d1",
								"000000000000010c",
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
	damage: 14,
	damageVsBuildings: 40,
	range: 1,
	attackCooldown: 1.5,
	speed: 11,
	visionRadius: 6,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "command_post",

	unlockedAt: "mission_14",

	portraitId: "pvt_muskrat",
	unlockMission: "mission_14",
	unlockDescription: "Hero mission at Gas Depot (8, 8). Demolition expert.",

	abilities: [
		{
			id: "timed_charge",
			name: "Timed Charge",
			description: "Plant explosive that detonates after 5 seconds for 60 AoE damage.",
			cooldown: 15,
		},
		{
			id: "chain_reaction",
			name: "Chain Reaction",
			description: "Next explosive triggers chain explosions on nearby destructibles.",
			cooldown: 45,
		},
	],

	tags: ["IsUnit", "IsHero", "IsCombat", "IsSiege"],
};
