import type { HeroDef, SPDSLSprite } from "@/entities/types";

// Sgt. Bubbles — URA starting hero. Infantry warrior with side weapon (teal blade 'f').
// Palette: otter_default — brown fur '2'/'3', face 'a'/'b', teal accent 'f'

// prettier-ignore
const body: string[][] = [
	[
		"0000111111000000",
		"0001f2222f100000",
		"0001f3bb3f100000",
		"0000111111000000",
		"0000000000000000",
		"0003000000030000",
		"0003000000030000",
		"0003000000030000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0001666666100000",
		"0001666666100000",
		"0001111011110000",
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
		"0001155555110000",
		"0001544444510000",
		"0001545444510000",
		"0001544444510000",
		"0001144444110000",
		"0000144444100000",
		"0001999999910000",
		"0001888888810000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
	],
];

// prettier-ignore
const weapon: string[][] = [
	// Side weapon — teal blade on right
	[
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000011",
		"0000000000000019",
		"0000000000000019",
		"0000000000000019",
		"0000000000000011",
		"0000000000000000",
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
								"0001f2222f100000",
								"0001f3bb3f100000",
								"0000111111000000",
								"0000000000000000",
								"0003000000030000",
								"0003000000030000",
								"0003000000030000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0001666666100000",
								"0001166661110000",
								"0011000011110000",
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
								"0001f2222f100000",
								"0001f3bb3f100000",
								"0000111111000000",
								"0000000000000000",
								"0003000000030000",
								"0003000000030000",
								"0003000000030000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0001666666100000",
								"0001666611000000",
								"0011110001110000",
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
								"0000000000001111",
								"000000000000199c",
								"0000000000000191",
								"0000000000000110",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
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
					weapon: {
						grid: [
							[
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000110",
								"000000000000199c",
								"0000000000001111",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
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

export const sgtBubbles: HeroDef = {
	id: "sgt_bubbles",
	name: "SGT. BUBBLES",
	faction: "ura",
	category: "infantry",

	sprite,

	hp: 120,
	armor: 3,
	damage: 15,
	range: 1,
	attackCooldown: 0.8,
	speed: 14,
	visionRadius: 8,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "command_post",

	unlockedAt: "mission_1",

	portraitId: "sgt_bubbles",
	unlockMission: "mission_1",
	unlockDescription: "Available from the start. Rambo-style warrior-leader.",

	abilities: [
		{
			id: "rallying_cry",
			name: "Rallying Cry",
			description: "Boosts nearby allies attack speed by 25% for 10 seconds.",
			cooldown: 30,
		},
		{
			id: "combat_roll",
			name: "Combat Roll",
			description: "Dodge incoming attack and reposition quickly.",
			cooldown: 8,
		},
	],

	tags: ["IsUnit", "IsHero", "IsCombat"],
};
