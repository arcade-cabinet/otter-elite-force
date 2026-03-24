import type { BuildingDef } from "../../types";

/**
 * Stone Wall — URA reinforced barrier.
 * Stronger than sandbag. Requires Fortified Walls research.
 */
export const stoneWall: BuildingDef = {
	id: "stone_wall",
	name: "Stone Wall",
	faction: "ura",
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
					"......CCCCCCCCCCCCCCCCCCCC......",
					"......CcCCcCCcCCcCCcCCcCCc......",
					"......CCCCCCCCCCCCCCCCCCCCc.....",
					"......CcCCcCCcCCcCCcCCcCCcc.....",
					"......CCCCCCCCCCCCCCCCCCCCc.....",
					"......CcCCcCCcCCcCCcCCcCCcc.....",
					"......CCCCCCCCCCCCCCCCCCCCc.....",
					"......CcCCcCCcCCcCCcCCcCCcc.....",
					"......CCCCCCCCCCCCCCCCCCCCc.....",
					"......CcCCcCCcCCcCCcCCcCCcc.....",
					"......CCCCCCCCCCCCCCCCCCCCc.....",
					"......CcCCcCCcCCcCCcCCcCCcc.....",
					"......CCCCCCCCCCCCCCCCCCCCc.....",
					"......CcCCcCCcCCcCCcCCcCCcc.....",
					"......CCCCCCCCCCCCCCCCCCCCc.....",
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

	hp: 400,
	armor: 0,
	buildTime: 10,

	cost: { timber: 100, salvage: 50 },
	unlockedAt: "mission_11",
	requiresResearch: "fortified_walls",

	tags: ["building", "wall", "ura", "barrier", "reinforced"],
};
