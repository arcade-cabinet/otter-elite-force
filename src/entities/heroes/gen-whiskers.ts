import type { HeroDef } from "@/entities/types";

export const genWhiskers: HeroDef = {
	id: "gen_whiskers",
	name: "GEN. WHISKERS",
	faction: "ura",
	category: "infantry",

	sprite: {
		size: 16,
		frames: {
			idle: [
				[
					".....#CC##......",
					"....#CssCC#.....",
					"....#S..S##.....",
					".....#ss#.ww....",
					".....#bbbb#.....",
					"..SS#bBBBBb#SS..",
					"..SS#bBYBBb#SS..",
					"..SS#bBBBBb#SS..",
					"...##bBBBBb##...",
					"....#BBBBBB#....",
					"....##cccc##....",
					".....#CCCC#.....",
					".....#WWWW#.....",
					".....#WWWW#.....",
					"....###..###....",
					"................",
				],
			],
			walk: [
				[
					".....#CC##......",
					"....#CssCC#.....",
					"....#S..S##.....",
					".....#ss#.ww....",
					".....#bbbb#.....",
					"..SS#bBBBBb#SS..",
					"..SS#bBYBBb#SS..",
					"..SS#bBBBBb#SS..",
					"...##bBBBBb##...",
					"....#BBBBBB#....",
					"....##cccc##....",
					".....#CCCC#.....",
					".....#WWWW#.....",
					".....##WW##.....",
					"....##...###....",
					"................",
				],
				[
					".....#CC##......",
					"....#CssCC#.....",
					"....#S..S##.....",
					".....#ss#.ww....",
					".....#bbbb#.....",
					"..SS#bBBBBb#SS..",
					"..SS#bBYBBb#SS..",
					"..SS#bBBBBb#SS..",
					"...##bBBBBb##...",
					"....#BBBBBB#....",
					"....##cccc##....",
					".....#CCCC#.....",
					".....#WWWW#.....",
					".....#WW##......",
					"....###..##.....",
					"................",
				],
			],
		},
		animationRates: { walk: 6 },
	},

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
