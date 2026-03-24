import type { ResourceDef, SPDSLSprite } from "../types";

// Mangrove Tree — timber resource. Teal-green canopy, brown trunk. 16x16.
// Palette: otter_default
// Legacy char map: G->f (teal), g->g (light teal), W->6 (wood dark), w->7 (wood light), #->1

// prettier-ignore
const canopy: string[][] = [
	[
		"000000ffff000000",
		"00000fffffg00000",
		"0000fffgfffg0000",
		"000ffffgffffg000",
		"00fffgfffgfffg00",
		"00ffffgfffffgg00",
		"000fffffffffg000",
		"0000fffffffg0000",
		"00000gfffg000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
	],
];

// prettier-ignore
const trunk: string[][] = [
	[
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000001661000000",
		"0000001661000000",
		"0000001661000000",
		"0000001671000000",
		"0000001671000000",
		"0000011661100000",
		"0000000000000000",
	],
];

const sprite: SPDSLSprite = {
	palette: "otter_default",
	layers: [
		{ id: "trunk", zIndex: 1, grid: trunk },
		{ id: "canopy", zIndex: 2, grid: canopy },
	],
	animations: {
		idle: [{}],
	},
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
