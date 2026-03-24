import type { HeroDef } from "@/entities/types";

export const sgtFang: HeroDef = {
	id: "sgt_fang",
	name: "SGT. FANG",
	faction: "ura",
	category: "siege",

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
					"..SS#bBBBBb#SS..",
					"..SS#bBBBBb#SS..",
					"...##bBBBBb##...",
					"....#BBBBBB#....",
					"....##CCCC##....",
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
					"..SS#bBBBBb#SS..",
					"..SS#bBBBBb#SS..",
					"...##bBBBBb##...",
					"....#BBBBBB#....",
					"....##CCCC##....",
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
					"..SS#bBBBBb#SS..",
					"..SS#bBBBBb#SS..",
					"...##bBBBBb##...",
					"....#BBBBBB#....",
					"....##CCCC##....",
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

	hp: 150,
	armor: 4,
	damage: 18,
	damageVsBuildings: 35,
	range: 1,
	attackCooldown: 1.4,
	speed: 12,
	visionRadius: 6,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "armory",

	unlockedAt: "mission_12",

	portraitId: "sgt_fang",
	unlockMission: "mission_12",
	unlockDescription: "Rescue at The Stronghold (10,-10)",

	abilities: [
		{
			id: "breach_charge",
			name: "Breach Charge",
			description: "Plant an explosive dealing 80 damage to a building",
			cooldown: 35,
		},
	],

	tags: ["IsUnit", "IsHero", "IsCombat", "IsSiege"],
};
