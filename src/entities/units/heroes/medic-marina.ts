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
					".....#SSSS#.....",
					".....#SssS#.....",
					"......####......",
					".....#bbbb#.....",
					"...S#bBrrBb#S...",
					"...S#bBrrBb#S...",
					"...S#bBBBBb#S...",
					"....##BBBB##....",
					".....#BBBB#.....",
					".....#wwww#.....",
					".....#wwww#.....",
					".....#WWWW#.....",
					".....#WWWW#.....",
					"....###..###....",
					"................",
				],
			],
			walk: [
				[
					"......####......",
					".....#SSSS#.....",
					".....#SssS#.....",
					"......####......",
					".....#bbbb#.....",
					"...S#bBrrBb#S...",
					"...S#bBrrBb#S...",
					"...S#bBBBBb#S...",
					"....##BBBB##....",
					".....#BBBB#.....",
					".....#wwww#.....",
					".....#wwww#.....",
					".....#WWWW#.....",
					".....##WW##.....",
					"....##...###....",
					"................",
				],
				[
					"......####......",
					".....#SSSS#.....",
					".....#SssS#.....",
					"......####......",
					".....#bbbb#.....",
					"...S#bBrrBb#S...",
					"...S#bBrrBb#S...",
					"...S#bBBBBb#S...",
					"....##BBBB##....",
					".....#BBBB#.....",
					".....#wwww#.....",
					".....#wwww#.....",
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
	damage: 3,
	range: 1,
	attackCooldown: 2.0,
	speed: 16,
	visionRadius: 7,

	cost: {},
	populationCost: 0,
	trainTime: 0,
	trainedAt: "command_post",

	unlockedAt: "mission_10",

	portraitId: "medic_marina",
	unlockMission: "mission_10",
	unlockDescription: "Rescue at Healer's Grove (-15, 20). Unlocks Field Hospital upgrade.",

	abilities: [
		{
			id: "triage",
			name: "Triage",
			description: "Heal target unit for 40 HP instantly.",
			cooldown: 12,
		},
		{
			id: "medic_aura",
			name: "Medic Aura",
			description: "All units within 3 tiles regenerate 2 HP/s for 10 seconds.",
			cooldown: 30,
		},
	],

	tags: ["IsUnit", "IsHero", "IsSupport"],
};
