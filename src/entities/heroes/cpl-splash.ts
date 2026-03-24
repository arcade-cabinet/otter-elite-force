import type { HeroDef, SPDSLSprite } from "@/entities/types";

// Cpl. Splash — URA aquatic scout hero. Teal wetsuit (f/g), face detail.
// Palette: otter_default — fur '2'/'3', face 'a'/'b', teal 'f'/'g'

// prettier-ignore
const body: string[][] = [
	[
		"0000001111000000",
		"0000010fb3100000",
		"0000099bb99000000",
		"0000001bb1000000",
		"0000015555100000",
		"0033154444513300",
		"0033154444513300",
		"0033154444513300",
		"0001154444511000",
		"0000144444410000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000111001110000",
		"0000000000000000",
	],
];

// prettier-ignore
const uniform: string[][] = [
	// Teal wetsuit lower body
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
		"0000011fggg10000",
		"0000010fff0100000",
		"0000010fff0100000",
		"0000010fff0100000",
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
								"0000010fb3100000",
								"0000099bb99000000",
								"0000001bb1000000",
								"0000015555100000",
								"0033154444513300",
								"0033154444513300",
								"0033154444513300",
								"0001154444511000",
								"0000144444410000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000011ff1100000",
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
								"0000010fb3100000",
								"0000099bb99000000",
								"0000001bb1000000",
								"0000015555100000",
								"0033154444513300",
								"0033154444513300",
								"0033154444513300",
								"0001154444511000",
								"0000144444410000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000010ff1100000",
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

export const cplSplash: HeroDef = {
	id: "cpl_splash",
	name: "CPL. SPLASH",
	faction: "ura",
	category: "scout",

	sprite,

	hp: 80,
	armor: 1,
	damage: 10,
	range: 1,
	attackCooldown: 0.8,
	speed: 18,
	visionRadius: 8,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "dock",

	unlockedAt: "mission_8",

	canSwim: true,
	canSubmerge: true,

	portraitId: "cpl_splash",
	unlockMission: "mission_8",
	unlockDescription: "Rescue at Underwater Cache (-10,15)",

	abilities: [
		{
			id: "deep_dive",
			name: "Deep Dive",
			description: "Become invisible underwater for 15 seconds",
			cooldown: 25,
		},
	],

	tags: ["IsUnit", "IsHero", "IsCombat", "CanSwim", "CanSubmerge"],
};
