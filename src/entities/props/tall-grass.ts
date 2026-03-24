import type { SPDSLSprite } from "../types";

/**
 * Tall Grass — environmental prop with sway animation.
 * Provides concealment for stealth units. 16x16, 2-frame sway.
 */

export interface PropDef {
	id: string;
	name: string;
	sprite: SPDSLSprite;
	providesConcealment: boolean;
	damagePerSecond?: number;
	tags: string[];
}

// Palette: otter_default
// Legacy char map: G->f (teal), g->g (light teal)

// prettier-ignore
const foliage: string[][] = [
	[
		"0000000000000000",
		"0000000000000000",
		"00g000g000g00000",
		"0gfg0gfg0gfg0000",
		"0gfg0gfg0gfg0000",
		"0gffggffggffg000",
		"0gfffgfffgffg000",
		"0gfffgfffgffg000",
		"0gffffffffffffg0",
		"0gffffffffffffg0",
		"00gffffffffffg00",
		"00gffffffffffg00",
		"000gffffffffg000",
		"0000gggggg000000",
		"0000000000000000",
		"0000000000000000",
	],
];

const sprite: SPDSLSprite = {
	palette: "otter_default",
	layers: [{ id: "foliage", zIndex: 1, grid: foliage }],
	animations: {
		idle: [{}],
		sway: [
			{},
			{
				layerOverrides: {
					foliage: {
						// prettier-ignore
						grid: [
							[
								"0000000000000000",
								"0000000000000000",
								"000g000g000g0000",
								"00gfg0gfg0gfg000",
								"00gfg0gfg0gfg000",
								"00gffggffggffg00",
								"00gfffgfffgffg00",
								"00gfffgfffgffg00",
								"00gffffffffffffg",
								"00gffffffffffffg",
								"000gffffffffffg0",
								"000gffffffffffg0",
								"0000gffffffffg00",
								"00000gggggg00000",
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
