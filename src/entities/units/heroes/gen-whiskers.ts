import type { HeroDef, SPDSLSprite } from "@/entities/types";

// Gen. Whiskers — URA commander hero. Wide build, stone armor (C/c→8/9), gold trim (Y→c).
// Palette: otter_default — brown fur '2'/'3', face 'a'/'b'

// prettier-ignore
const body: string[][] = [
	[
		"0000111111000000",
		"0001999999100000",
		"00019abba9100000",
		"000133bb333100000",
		"0000111111000000",
		"0030000000003000",
		"0030000000003000",
		"0030000000003000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0001666666610000",
		"0001666666610000",
		"0011110011110000",
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
		"0000155555510000",
		"0001544444510000",
		"0001545444510000",
		"0001544444510000",
		"0001144444411000",
		"0000144444410000",
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
	// Gold belt + rank insignia
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
		"0001c99999c10000",
		"0001888888810000",
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
								"0000111111000000",
								"0001999999100000",
								"00019abba9100000",
								"000133bb333100000",
								"0000111111000000",
								"0030000000003000",
								"0030000000003000",
								"0030000000003000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0001666666610000",
								"0001166661110000",
								"0011000001111000",
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
								"0000111111000000",
								"0001999999100000",
								"00019abba9100000",
								"000133bb333100000",
								"0000111111000000",
								"0030000000003000",
								"0030000000003000",
								"0030000000003000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0001666666610000",
								"0001666661100000",
								"0011110001110000",
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
	damage: 18,
	range: 1,
	attackCooldown: 1.2,
	speed: 10,
	visionRadius: 8,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "command_post",

	unlockedAt: "mission_4",

	portraitId: "gen_whiskers",
	unlockMission: "mission_4",
	unlockDescription: "Rescue at Prison Camp (5,5). Becomes briefing officer.",

	abilities: [
		{
			id: "inspiring_presence",
			name: "Inspiring Presence",
			description: "All allied units within 5 tiles gain +2 armor for 15 seconds.",
			cooldown: 45,
		},
		{
			id: "strategic_retreat",
			name: "Strategic Retreat",
			description: "All nearby allied units gain 50% speed boost for 5 seconds.",
			cooldown: 60,
		},
	],

	tags: ["IsUnit", "IsHero", "IsCombat"],
};
