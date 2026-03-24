import type { ResourceDef, SPDSLSprite } from "../types";

// Salvage Cache — salvage resource. Gold/stone wreckage pile. 16x16.
// Palette: resource_default — gold '8'/'9', stone '6'/'7'

// prettier-ignore
const body: string[][] = [
	[
		"0000000000000000",
		"0000000000000000",
		"0000008889000000",
		"0000088888900000",
		"0000889966890000",
		"0008896666890000",
		"0089966776689000",
		"0089967777689000",
		"0089967777689000",
		"0089966776689000",
		"0008896666890000",
		"0000889966890000",
		"0000088888900000",
		"0000008889000000",
		"0000000000000000",
		"0000000000000000",
	],
];

const sprite: SPDSLSprite = {
	palette: "resource_default",
	layers: [{ id: "body", zIndex: 1, grid: body }],
	animations: { idle: [{}] },
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
