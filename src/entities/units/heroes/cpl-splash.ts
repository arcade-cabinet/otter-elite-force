import type { HeroDef, SPDSLSprite } from "@/entities/types";

// Cpl. Splash — URA scout hero. Teal wetsuit (f/g), small knife weapon.
// Palette: otter_default — brown fur '2'/'3', face 'a'/'b', teal gear 'f'/'g'

// prettier-ignore
const body: string[][] = [
	[
		"0000001111000000",
		"0000012222100000",
		"0000012332100000",
		"0000001111000000",
		"0000000000000000",
		"0003000000030000",
		"0003000000030000",
		"0003000000030000",
		"0000000000000000",
		"0000000000000000",
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
	// Teal wetsuit — uses 'f'/'g' (teal gear) NOT body
	[
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000015555100000",
		"0000154444510000",
		"0000154444510000",
		"0000154444510000",
		"0000114444110000",
		"0000014444100000",
		"0000010ff0100000",
		"0000010ff0100000",
		"0000010ff0100000",
		"0000010gg0100000",
		"0000000000000000",
		"0000000000000000",
	],
];

// prettier-ignore
const weapon: string[][] = [
	// Small combat knife on right side
	[
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000110",
		"000000000000019c",
		"0000000000000110",
		"0000000000000000",
		"0000000000000000",
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
								"0000001111000000",
								"0000012222100000",
								"0000012332100000",
								"0000001111000000",
								"0000000000000000",
								"0003000000030000",
								"0003000000030000",
								"0003000000030000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000011gg1100000",
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
								"0000012222100000",
								"0000012332100000",
								"0000001111000000",
								"0000000000000000",
								"0003000000030000",
								"0003000000030000",
								"0003000000030000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000000000000000",
								"0000010gg1100000",
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
								"0000000000001100",
								"00000000000019cc",
								"0000000000001100",
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
	visionRadius: 10,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "command_post",

	unlockedAt: "mission_8",

	canSwim: true,
	canSubmerge: true,

	portraitId: "cpl_splash",
	unlockMission: "mission_8",
	unlockDescription: "Rescue at Underwater Cache (-10, 15). Unlocks Diver scouts.",

	abilities: [
		{
			id: "deep_dive",
			name: "Deep Dive",
			description: "Become invisible and untargetable for 8 seconds while submerged.",
			cooldown: 25,
		},
		{
			id: "sonar_ping",
			name: "Sonar Ping",
			description: "Reveal all hidden and submerged units within 8 tiles.",
			cooldown: 20,
		},
	],

	tags: ["IsUnit", "IsHero", "IsCombat", "IsScout"],
};
