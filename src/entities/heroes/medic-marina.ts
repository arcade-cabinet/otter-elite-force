import type { HeroDef } from "@/entities/types";

export const medicMarina: HeroDef = {
	id: "medic_marina",
	name: "MEDIC MARINA",
	faction: "ura",
	category: "support",

	sprite: {
		size: 16,
		frames: {
			idle: [
				[
					"......####......",
					".....#SssS#.....",
					".....#S..S#.....",
					"......#ss#......",
					".....#bbbb#.....",
					"..SS#bBBBBb#SS..",
					"..SS#bBtBBb#SS..",
					"..SS#btttBb#SS..",
					"...##bBtBBb##...",
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
					"......####......",
					".....#SssS#.....",
					".....#S..S#.....",
					"......#ss#......",
					".....#bbbb#.....",
					"..SS#bBBBBb#SS..",
					"..SS#bBtBBb#SS..",
					"..SS#btttBb#SS..",
					"...##bBtBBb##...",
					"....#BBBBBB#....",
					"....##cccc##....",
					".....#CCCC#.....",
					".....#WWWW#.....",
					".....##WW##.....",
					"....##...###....",
					"................",
				],
				[
					"......####......",
					".....#SssS#.....",
					".....#S..S#.....",
					"......#ss#......",
					".....#bbbb#.....",
					"..SS#bBBBBb#SS..",
					"..SS#bBtBBb#SS..",
					"..SS#btttBb#SS..",
					"...##bBtBBb##...",
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
		animationRates: { walk: 8 },
	},

	hp: 80,
	armor: 1,
	damage: 5,
	range: 1,
	attackCooldown: 1.5,
	speed: 16,
	visionRadius: 6,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "field_hospital",

	unlockedAt: "mission_10",

	portraitId: "medic_marina",
	unlockMission: "mission_10",
	unlockDescription: "Rescue at Healer's Grove (-15,20)",

	abilities: [
		{
			id: "field_triage",
			name: "Field Triage",
			description: "Heal all friendly units within 4 tiles for 30 HP over 5 seconds",
			cooldown: 20,
		},
	],

	tags: ["IsUnit", "IsHero", "IsSupport"],
};
