import type { ResourceDef, SPDSLSprite } from "../types";

// Intel Marker — collectible intel resource. Gold marker on map. 16x16.
// Palette: otter_default

// prettier-ignore
const body: string[][] = [
	[
		"0000000000000000",
		"0000000000000000",
		"0000000110000000",
		"0000001cc1000000",
		"0000001cc1000000",
		"000001cccc100000",
		"000001cccc100000",
		"00001cddddc10000",
		"00001cddddc10000",
		"000001cccc100000",
		"0000001cc1000000",
		"0000000110000000",
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

export const intelMarker: ResourceDef = {
	id: "intel_marker",
	name: "Intel Marker",
	resourceType: "salvage",

	sprite,

	yield: { min: 0, max: 0 },
	harvestRate: 1,

	tags: ["resource", "intel", "collectible", "objective"],
};
