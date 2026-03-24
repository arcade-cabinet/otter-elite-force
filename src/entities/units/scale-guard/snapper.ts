import type { UnitDef } from "@/entities/types";

export const snapper: UnitDef = {
	id: "snapper",
	name: "SNAPPER",
	faction: "scale_guard",
	category: "ranged",

	sprite: {
		size: 16,
		frames: {
			idle: [
				[
					"....########....",
					"...#GGGGGGGG#...",
					"...#GGGggGGG#...",
					"...#GGGGGGGG#...",
					"..##rrrrrrrr##..",
					"..#rRRRRRRRRr#..",
					"..#rRRRRRRRRr#..",
					"..#rRRRRRRRRr#..",
					"..##RRRRRRRR##..",
					"..#CCCCCCCCCC#..",
					"..#CCCCCCCCCC#..",
					"..#CCCCCCCCCC#..",
					"..#CCCCCCCCCC#..",
					"..############..",
					"..############..",
					"................",
				],
			],
			attack: [
				[
					"....########....",
					"...#GGGGGGGG#...",
					"...#GGGggGGG#...",
					"...#GGGGGGGG#...",
					"..##rrrrrrrr##..",
					"..#rRRRRRRRRr#..",
					"..#rRRRRRRRRr#..",
					"..#rRRRRRRRRr#cc",
					"..##RRRRRRRR##cc",
					"..#CCCCCCCCCC#..",
					"..#CCCCCCCCCC#..",
					"..#CCCCCCCCCC#..",
					"..#CCCCCCCCCC#..",
					"..############..",
					"..############..",
					"................",
				],
				[
					"....########....",
					"...#GGGGGGGG#...",
					"...#GGGggGGG#...",
					"...#GGGGGGGG#...",
					"..##rrrrrrrr##..",
					"..#rRRRRRRRRr#cc",
					"..#rRRRRRRRRr#cc",
					"..#rRRRRRRRRr#..",
					"..##RRRRRRRR##..",
					"..#CCCCCCCCCC#..",
					"..#CCCCCCCCCC#..",
					"..#CCCCCCCCCC#..",
					"..#CCCCCCCCCC#..",
					"..############..",
					"..############..",
					"................",
				],
			],
		},
		animationRates: { attack: 6 },
	},

	hp: 80,
	armor: 3,
	damage: 14,
	range: 6,
	attackCooldown: 1.2,
	speed: 0,
	visionRadius: 7,

	cost: { fish: 80, salvage: 40 },
	populationCost: 1,
	trainTime: 25,
	trainedAt: "spawning_pool",

	unlockedAt: "mission_5",

	aiProfile: {
		states: ["idle", "attack"],
		defaultState: "idle",
		aggroRange: 7,
	},

	drops: [{ type: "salvage", min: 8, max: 15, chance: 0.6 }],

	tags: ["IsUnit", "IsCombat", "IsRanged", "IsStationary"],
};
