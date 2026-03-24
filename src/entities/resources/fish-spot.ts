import type { ResourceDef, SPDSLSprite } from "../types";

// Fish Spot — primary food resource. Blue/teal shimmer in water. 16x16.
// Palette: otter_default
// Legacy char map: B->4, b->5, c->9, T->f, t->g

// prettier-ignore
const body: string[][] = [
	[
		"0000000000000000",
		"0000554444550000",
		"0005444444445000",
		"0054499999944500",
		"0054999999944500",
		"0544999999994450",
		"0549999999999450",
		"0549999999999450",
		"0549999999999450",
		"0544999999994450",
		"0054999999944500",
		"0054499999944500",
		"0005444444445000",
		"0000554444550000",
		"0000000000000000",
		"0000000000000000",
	],
];

// prettier-ignore
const shimmer: string[][] = [
	[
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"000000ffffo00000",
		"000009fggf990000",
		"000009fggf990000",
		"000009fggf990000",
		"000000ffffo00000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
		"0000000000000000",
	],
];

const sprite: SPDSLSprite = {
	palette: "otter_default",
	layers: [
		{ id: "body", zIndex: 1, grid: body },
		{ id: "shimmer", zIndex: 2, grid: shimmer },
	],
	animations: {
		idle: [{}],
	},
};

export const fishSpot: ResourceDef = {
	id: "fish_spot",
	name: "Fishing Spot",
	resourceType: "fish",

	sprite,

	yield: { min: 200, max: 400 },
	harvestRate: 5,

	tags: ["resource", "fish", "water"],
};
