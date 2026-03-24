import type { BuildingDef } from "../../types";

/**
 * Scale Wall — Scale-Guard barrier.
 * Red-tinted stone wall.
 */
export const scaleWall: BuildingDef = {
	id: "scale_wall",
	name: "Scale Wall",
	faction: "scale_guard",
	category: "wall",

	sprite: {
		size: 32,
		frames: {
			idle: [
				[
					"................................",
					"................................",
					"................................",
					"................................",
					"................................",
					"................................",
					"................................",
					"................................",
					"................................",
					"......RRRRRRRRRRRRRRRRRRRR......",
					"......RrRRrRRrRRrRRrRRrRRr......",
					"......RRRRRRRRRRRRRRRRRRRRr.....",
					"......RrRRrRRrRRrRRrRRrRRrr.....",
					"......RRRRRRRRRRRRRRRRRRRRr.....",
					"......RrRRrRRrRRrRRrRRrRRrr.....",
					"......RRRRRRRRRRRRRRRRRRRRr.....",
					"......RrRRrRRrRRrRRrRRrRRrr.....",
					"......RRRRRRRRRRRRRRRRRRRRr.....",
					"......RrRRrRRrRRrRRrRRrRRrr.....",
					"......RRRRRRRRRRRRRRRRRRRRr.....",
					"......RrRRrRRrRRrRRrRRrRRrr.....",
					"......RRRRRRRRRRRRRRRRRRRRr.....",
					"......RrRRrRRrRRrRRrRRrRRrr.....",
					"......RRRRRRRRRRRRRRRRRRRRr.....",
					"......########################..",
					"......########################..",
					"......########################..",
					"......########################..",
					"......########################..",
					"................................",
					"................................",
					"................................",
				],
			],
		},
	},

	hp: 300,
	armor: 0,
	buildTime: 0,

	cost: {},
	unlockedAt: "mission_1",

	tags: ["building", "wall", "scale_guard", "barrier"],
};
