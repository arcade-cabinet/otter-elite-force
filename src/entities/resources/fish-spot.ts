import type { ResourceDef } from "../types";

/**
 * Fish Spot — primary food resource.
 * Blue/silver shimmer in water. 16x16.
 */
export const fishSpot: ResourceDef = {
	id: "fish_spot",
	name: "Fishing Spot",
	resourceType: "fish",

	sprite: {
		size: 16,
		frames: {
			idle: [
				[
					"................",
					"....bbBBBBbb....",
					"...bBBBBBBBBb...",
					"..bBBccccccBBb..",
					"..bBcccccccBBb..",
					".bBBccTTTTccBBb.",
					".bBcccTttTcccBb.",
					".bBcccTttTcccBb.",
					".bBcccTttTcccBb.",
					".bBBccTTTTccBBb.",
					"..bBcccccccBBb..",
					"..bBBccccccBBb..",
					"...bBBBBBBBBb...",
					"....bbBBBBbb....",
					"................",
					"................",
				],
			],
		},
		animationRates: { idle: 1 },
	},

	yield: { min: 200, max: 400 },
	harvestRate: 5,

	tags: ["resource", "fish", "water"],
};
