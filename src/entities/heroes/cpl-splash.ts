import type { HeroDef } from "@/entities/types";

export const cplSplash: HeroDef = {
	id: "cpl_splash",
	name: "CPL. SPLASH",
	faction: "ura",
	category: "scout",

	sprite: {
		size: 16,
		frames: {
			idle: [
				[
					"......####......",
					".....#TssT#.....",
					".....ccsscc.....",
					"......#ss#......",
					".....#bbbb#.....",
					"..SS#bBBBBb#SS..",
					"..SS#bBBBBb#SS..",
					"..SS#bBBBBb#SS..",
					"...##bBBBBb##...",
					"....#BBBBBB#....",
					"....##Ttttt#....",
					".....#TTTT#.....",
					".....#TTTT#.....",
					".....#TTTT#.....",
					"....###..###....",
					"................",
				],
			],
			walk: [
				[
					"......####......",
					".....#TssT#.....",
					".....ccsscc.....",
					"......#ss#......",
					".....#bbbb#.....",
					"..SS#bBBBBb#SS..",
					"..SS#bBBBBb#SS..",
					"..SS#bBBBBb#SS..",
					"...##bBBBBb##...",
					"....#BBBBBB#....",
					"....##Ttttt#....",
					".....#TTTT#.....",
					".....#TTTT#.....",
					".....##TT##.....",
					"....##...###....",
					"................",
				],
				[
					"......####......",
					".....#TssT#.....",
					".....ccsscc.....",
					"......#ss#......",
					".....#bbbb#.....",
					"..SS#bBBBBb#SS..",
					"..SS#bBBBBb#SS..",
					"..SS#bBBBBb#SS..",
					"...##bBBBBb##...",
					"....#BBBBBB#....",
					"....##Ttttt#....",
					".....#TTTT#.....",
					".....#TTTT#.....",
					".....#TT##......",
					"....###..##.....",
					"................",
				],
			],
		},
		animationRates: { walk: 8 },
	},

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
