import type { ResourceDef, SPDSLSprite } from "../types";

// Salvage Cache — salvage resource. Gold/stone wreckage pile. 16x16.
// Palette: otter_default
// Legacy char map: Y->c (gold), y->d (gold light), C->8 (stone dark), c->9 (stone light)

// prettier-ignore
const body: string[][] = [
	[
		"0000000000000000",
		"0000000000000000",
		"000000cccd000000",
		"00000cccccdd0000",
		"0000ccdd88cd0000",
		"000ccdd8888cd000",
		"00ccdd89988ccd00",
		"00ccdd89998ccd00",
		"00ccdd89998ccd00",
		"00ccdd89988ccd00",
		"000ccdd8888cd000",
		"0000ccdd88cd0000",
		"00000cccccd00000",
		"000000cccd000000",
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

export const salvageCache: ResourceDef = {
	id: "salvage_cache",
	name: "Salvage Cache",
	resourceType: "salvage",

	sprite,

	yield: { min: 50, max: 150 },
	harvestRate: 3,

	tags: ["resource", "salvage", "wreckage"],
};
