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
					"....######......",
					"...#cccccc#.....",
					"...#cSssSSc#....",
					"...#SSssSSS#....",
					"....######......",
					"..S#bBBBBBb#S...",
					"..S#bBbBBBb#S...",
					"..S#bBBBBBb#S...",
					"..S##BBBBBB##...",
					"...#BBBBBBB#....",
					"...#ycccccy#....",
					"...#CCCCCCC#....",
					"...#WWWWWWW#....",
					"...#WWWWWWW#....",
					"..####..####....",
					"................",
				],
			],
			walk: [
				[
					"....######......",
					"...#cccccc#.....",
					"...#cSssSSc#....",
					"...#SSssSSS#....",
					"....######......",
					"..S#bBBBBBb#S...",
					"..S#bBbBBBb#S...",
					"..S#bBBBBBb#S...",
					"..S##BBBBBB##...",
					"...#BBBBBBB#....",
					"...#ycccccy#....",
					"...#CCCCCCC#....",
					"...#WWWWWWW#....",
					"...##WWWWW##....",
					"..##.....####...",
					"................",
				],
				[
					"....######......",
					"...#cccccc#.....",
					"...#cSssSSc#....",
					"...#SSssSSS#....",
					"....######......",
					"..S#bBBBBBb#S...",
					"..S#bBbBBBb#S...",
					"..S#bBBBBBb#S...",
					"..S##BBBBBB##...",
					"...#BBBBBBB#....",
					"...#ycccccy#....",
					"...#CCCCCCC#....",
					"...#WWWWWWW#....",
					"...#WWWWW##.....",
					"..####...###....",
					"................",
				],
			],
		},
		animationRates: { walk: 6 },
	},

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
