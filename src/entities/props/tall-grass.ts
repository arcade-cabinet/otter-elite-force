import type { SPDSLSprite } from "../types";

// Tall Grass — environmental prop with sway animation.
// Provides concealment for stealth units. 16x16, 2-frame sway.
// Palette: resource_default — green '2'/'3'

export interface PropDef {
	id: string;
	name: string;
	sprite: SPDSLSprite;
	providesConcealment: boolean;
	damagePerSecond?: number;
	tags: string[];
}

// prettier-ignore
const body: string[][] = [
	[
		"0000000000000000",
		"0000000000000000",
		"0030003000300000",
		"0323032303230000",
		"0323032303230000",
		"0322332233223000",
		"0322232223223000",
		"0322232223223000",
		"0322222222223000",
		"0322222222223000",
		"0032222222230000",
		"0032222222230000",
		"0003222222300000",
		"0000333333000000",
		"0000000000000000",
		"0000000000000000",
	],
];

const sprite: SPDSLSprite = {
	palette: "resource_default",
	layers: [{ id: "body", zIndex: 1, grid: body }],
	animations: {
		idle: [{}],
		sway: [
			{},
			{
				layerOverrides: {
					body: {
						grid: [
							[
								"0000000000000000",
								"0000000000000000",
								"0003000300030000",
								"0032303230323000",
								"0032303230323000",
								"0032233223322300",
								"0032223222322300",
								"0032223222322300",
								"0032222222222300",
								"0032222222222300",
								"0003222222223000",
								"0003222222223000",
								"0000322222230000",
								"0000033333300000",
								"0000000000000000",
								"0000000000000000",
							],
						],
					},
				},
			},
		],
	},
};

export const tallGrass: PropDef = {
	id: "tall_grass",
	name: "Tall Grass",

	sprite,

	providesConcealment: true,

	tags: ["prop", "vegetation", "concealment"],
};
