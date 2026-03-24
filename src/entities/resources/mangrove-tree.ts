import type { ResourceDef } from "../types";

/**
 * Mangrove Tree — timber resource.
 * Dark green canopy over brown trunk. 16x16.
 * Finite resource, regrows slowly.
 */
export const mangroveTree: ResourceDef = {
	id: "mangrove_tree",
	name: "Mangrove Tree",
	resourceType: "timber",

	sprite: {
		size: 16,
		frames: {
			idle: [
				[
					"......GGGG......",
					".....GGGGGg.....",
					"....GGGgGGGg....",
					"...GGGGgGGGGg...",
					"..GGGgGGGgGGGg..",
					"..GGGGgGGGGGGg..",
					"...GGGGGGGGGg...",
					"....GGGGGGGg....",
					".....gGGGg......",
					"......#WW#......",
					"......#WW#......",
					"......#WW#......",
					"......#Ww#......",
					"......#Ww#......",
					".....##WW##.....",
					"................",
				],
			],
		},
		animationRates: { idle: 1 },
	},

	yield: { min: 100, max: 200 },
	regrowthTime: 120,
	harvestRate: 4,

	tags: ["resource", "timber", "tree"],
};
