import type { HeroDef, SPDSLSprite } from "@/entities/types";

// Gen. Whiskers — URA commander. Stone helmet (8/9), face detail, gold medal (c).
// Palette: otter_default — fur '2'/'3', face 'a'/'b', stone '8'/'9', wood '6'/'7'

// prettier-ignore
const body: string[][] = [
	[
		"0000018811000000",
		"0001899988100000",
		"00013a00a1100000",
		"0000013b10070000",
		"0000015555100000",
		"0033154444513300",
		"0033154c44513300",
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
								"0000018811000000",
								"0001899988100000",
								"00013a00a1100000",
								"0000013b10070000",
								"0000015555100000",
								"0033154444513300",
								"0033154c44513300",
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
								"0000018811000000",
								"0001899988100000",
								"00013a00a1100000",
								"0000013b10070000",
								"0000015555100000",
								"0033154444513300",
								"0033154c44513300",
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

export const genWhiskers: HeroDef = {
	id: "gen_whiskers",
	name: "GEN. WHISKERS",
	faction: "ura",
	category: "infantry",

	sprite,

	hp: 200,
	armor: 4,
	damage: 20,
	range: 1,
	attackCooldown: 1.5,
	speed: 10,
	visionRadius: 8,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "command_post",

	unlockedAt: "mission_4",

	portraitId: "gen_whiskers",
	unlockMission: "mission_4",
	unlockDescription: "Rescue at Prison Camp (5,5)",

	abilities: [
		{
			id: "artillery_strike",
			name: "Artillery Strike",
			description: "Call in a ranged bombardment on target area",
			cooldown: 45,
		},
	],

	tags: ["IsUnit", "IsHero", "IsCombat"],
};
