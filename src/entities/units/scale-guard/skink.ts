import type { UnitDef } from "@/entities/types";

export const skink: UnitDef = {
	id: "skink",
	name: "SKINK",
	faction: "scale_guard",
	category: "worker",

	sprite: {
		size: 16,
		frames: {
			idle: [
				[
					"......####......",
					".....#GGGG#.....",
					".....#GggG#.....",
					"......####......",
					".....#rrrr#.....",
					"....#rRRRRr#....",
					"....#rRRRRr#..##",
					"....#rRRRRr#.#W#",
					".....#RRRR##.#W#",
					".....#RRRR#..#W#",
					".....#wwww#..##.",
					".....#wwww#.....",
					".....#GGGG#.....",
					".....#GGGG#.....",
					"....###..###....",
					"................",
				],
			],
			walk: [
				[
					"......####......",
					".....#GGGG#.....",
					".....#GggG#.....",
					"......####......",
					".....#rrrr#.....",
					"....#rRRRRr#....",
					"....#rRRRRr#..##",
					"....#rRRRRr#.#W#",
					".....#RRRR##.#W#",
					".....#RRRR#..#W#",
					".....#wwww#..##.",
					".....#wwww#.....",
					".....#GGGG#.....",
					".....##GG##.....",
					"....##...###....",
					"................",
				],
				[
					"......####......",
					".....#GGGG#.....",
					".....#GggG#.....",
					"......####......",
					".....#rrrr#.....",
					"....#rRRRRr#....",
					"....#rRRRRr#..##",
					"....#rRRRRr#.#W#",
					".....#RRRR##.#W#",
					".....#RRRR#..#W#",
					".....#wwww#..##.",
					".....#wwww#.....",
					".....#GGGG#.....",
					".....#GG##......",
					"....###..##.....",
					"................",
				],
			],
		},
		animationRates: { walk: 6 },
	},

	hp: 30,
	armor: 0,
	damage: 4,
	range: 1,
	attackCooldown: 1.5,
	speed: 10,
	visionRadius: 6,

	cost: { fish: 40 },
	populationCost: 1,
	trainTime: 15,
	trainedAt: "sludge_pit",

	unlockedAt: "mission_1",

	gatherCapacity: 10,
	gatherRate: 1,
	buildRate: 1,

	aiProfile: {
		states: ["idle", "gather", "build", "flee"],
		defaultState: "idle",
		aggroRange: 3,
		fleeThreshold: 0.3,
	},

	drops: [{ type: "salvage", min: 2, max: 5, chance: 0.3 }],

	tags: ["IsUnit", "IsWorker"],
};
