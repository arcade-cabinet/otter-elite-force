import type { ResourceDef, SPDSLSprite } from "../types";

// Supply Crate — salvage resource pickup. Neutral crate with wood/metal. 16x16.
// Palette: otter_default

// prettier-ignore
const body: string[][] = [
	[
		"0000000000000000",
		"0000000000000000",
		"0000011111100000",
		"0000166666610000",
		"0001677776761000",
		"0001666666661000",
		"0001677776761000",
		"0001666666661000",
		"0001677776761000",
		"0001666666661000",
		"0000166666610000",
		"0000011111100000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
	],
];

const sprite: SPDSLSprite = {
	palette: "otter_default",
	layers: [{ id: "body", zIndex: 1, grid: body }],
	animations: {
		idle: [{}],
	},
};

export const supplyCrate: ResourceDef = {
	id: "supply_crate",
	name: "Supply Crate",
	resourceType: "salvage",

	sprite,

	yield: { min: 30, max: 80 },
	harvestRate: 5,

	tags: ["resource", "salvage", "crate", "pickup"],
};
