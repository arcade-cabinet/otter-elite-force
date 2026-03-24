import type { ResourceDef, SPDSLSprite } from "../types";

// Mangrove Tree — timber resource. Dark green canopy, brown trunk. 16x16.
// Palette: resource_default — green '2'/'3', wood '4'/'5'

// prettier-ignore
const body: string[][] = [
	[
		"0000002222000000",
		"0000022222300000",
		"0000222322230000",
		"0002222322223000",
		"0022232223222300",
		"0022223222222300",
		"0002222222222000",
		"0000222222230000",
		"0000032223000000",
		"0000001441000000",
		"0000001441000000",
		"0000001441000000",
		"0000001451000000",
		"0000001451000000",
		"0000011441100000",
		"0000000000000000",
	],
];

const sprite: SPDSLSprite = {
	palette: "resource_default",
	layers: [{ id: "body", zIndex: 1, grid: body }],
	animations: { idle: [{}] },
};

export const mangroveTree: ResourceDef = {
	id: "mangrove_tree",
	name: "Mangrove Tree",
	resourceType: "timber",

	sprite,

	yield: { min: 100, max: 200 },
	regrowthTime: 120,
	harvestRate: 4,

	tags: ["resource", "timber", "tree"],
};
