import type { SpriteDef } from "../types";

/**
 * Tall Grass — environmental prop with sway animation.
 * Provides concealment for stealth units. 16x16, 2-frame animation.
 */

export interface PropDef {
	id: string;
	name: string;
	sprite: SpriteDef;
	providesConcealment: boolean;
	damagePerSecond?: number;
	tags: string[];
}

export const tallGrass: PropDef = {
	id: "tall_grass",
	name: "Tall Grass",

	sprite: {
		size: 16,
		frames: {
			idle: [
				[
					"................",
					"................",
					"..g...g...g.....",
					".gGg.gGg.gGg....",
					".gGg.gGg.gGg....",
					".gGGggGGggGGg...",
					".gGGGgGGGgGGg...",
					".gGGGgGGGgGGg...",
					".gGGGGGGGGGGg...",
					".gGGGGGGGGGGg...",
					"..gGGGGGGGGg....",
					"..gGGGGGGGGg....",
					"...gGGGGGGg.....",
					"....gggggg......",
					"................",
					"................",
				],
			],
			sway: [
				[
					"................",
					"................",
					"..g...g...g.....",
					".gGg.gGg.gGg....",
					".gGg.gGg.gGg....",
					".gGGggGGggGGg...",
					".gGGGgGGGgGGg...",
					".gGGGgGGGgGGg...",
					".gGGGGGGGGGGg...",
					".gGGGGGGGGGGg...",
					"..gGGGGGGGGg....",
					"..gGGGGGGGGg....",
					"...gGGGGGGg.....",
					"....gggggg......",
					"................",
					"................",
				],
				[
					"................",
					"................",
					"...g...g...g....",
					"..gGg.gGg.gGg...",
					"..gGg.gGg.gGg...",
					"..gGGggGGggGGg..",
					"..gGGGgGGGgGGg..",
					"..gGGGgGGGgGGg..",
					"..gGGGGGGGGGGg..",
					"..gGGGGGGGGGGg..",
					"...gGGGGGGGGg...",
					"...gGGGGGGGGg...",
					"....gGGGGGGg....",
					".....gggggg.....",
					"................",
					"................",
				],
			],
		},
		animationRates: { idle: 1, sway: 2 },
	},

	providesConcealment: true,

	tags: ["prop", "vegetation", "concealment"],
};
