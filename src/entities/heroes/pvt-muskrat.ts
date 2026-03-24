import type { HeroDef } from "@/entities/types";

export const pvtMuskrat: HeroDef = {
	id: "pvt_muskrat",
	name: "PVT. MUSKRAT",
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
					"....#BBYBB#.....",
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
					"..SS#bBBBBb#SS..",
					"..SS#bBBBBb#SS..",
					"...##bBBBBb##...",
					"....#BBYBB#.....",
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
					"..SS#bBBBBb#SS..",
					"..SS#bBBBBb#SS..",
					"...##bBBBBb##...",
					"....#BBYBB#.....",
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

	hp: 120,
	armor: 2,
	damage: 12,
	damageVsBuildings: 40,
	range: 1,
	attackCooldown: 1.2,
	speed: 11,
	visionRadius: 6,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "armory",

	unlockedAt: "mission_14",

	portraitId: "pvt_muskrat",
	unlockMission: "mission_14",
	unlockDescription: "Hero mission at Gas Depot (8,8)",

	abilities: [
		{
			id: "timed_charge",
			name: "Timed Charge",
			description: "Plant a timed explosive that detonates after 5 seconds for 100 damage",
			cooldown: 30,
		},
	],

	tags: ["IsUnit", "IsHero", "IsCombat", "IsSiege"],
};
