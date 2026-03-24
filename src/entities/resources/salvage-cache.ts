import type { ResourceDef } from "../types";

/**
 * Salvage Cache — salvage resource.
 * Gold/brown wreckage pile. 16x16.
 */
export const salvageCache: ResourceDef = {
	id: "salvage_cache",
	name: "Salvage Cache",
	resourceType: "salvage",

	sprite: {
		size: 16,
		frames: {
			idle: [
				[
					"................",
					"................",
					"......YYYy......",
					".....YYYYYy.....",
					"....YYyyCCYy....",
					"...YYyyCCCCYy...",
					"..YYyyCCccCCYy..",
					"..YYyyCcccCCYy..",
					"..YYyyCcccCCYy..",
					"..YYyyCCccCCYy..",
					"...YYyyCCCCYy...",
					"....YYyyCCYy....",
					".....YYYYYy.....",
					"......YYYy......",
					"................",
					"................",
				],
			],
		},
		animationRates: { idle: 1 },
	},

	yield: { min: 50, max: 150 },
	harvestRate: 3,

	tags: ["resource", "salvage", "wreckage"],
};
