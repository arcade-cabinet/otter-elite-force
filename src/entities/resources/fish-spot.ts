import type { ResourceDef, SPDSLSprite } from "../types";

// Fish Spot — primary food resource. Blue/teal shimmer in water. 16x16.
// Palette: resource_default — blue 'a'/'b', stone '6'/'7', teal 'c'/'d'

// prettier-ignore
const body: string[][] = [
	[
		"0000000000000000",
		"0000bbaaaabb0000",
		"000baaaaaaaab000",
		"00baa7777776aab00",
		"00ba77777776aab00",
		"0baa77cccc77aab0",
		"0ba777cddc777ab0",
		"0ba777cddc777ab0",
		"0ba777cddc777ab0",
		"0baa77cccc77aab0",
		"00ba77777776aab00",
		"00baa7777776aab00",
		"000baaaaaaaab000",
		"0000bbaaaabb0000",
		"0000000000000000",
		"0000000000000000",
	],
];

const sprite: SPDSLSprite = {
	palette: "resource_default",
	layers: [{ id: "body", zIndex: 1, grid: body }],
	animations: { idle: [{}] },
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
