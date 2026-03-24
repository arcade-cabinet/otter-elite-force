import type { PropDef } from "./tall-grass";

/**
 * Toxic Sludge — environmental hazard prop.
 * Purple/dark bubbling area that deals damage. 16x16.
 */
export const toxicSludge: PropDef = {
	id: "toxic_sludge",
	name: "Toxic Sludge",

	sprite: {
		size: 16,
		frames: {
			idle: [
				[
					"................",
					"....PPPPpp......",
					"...PPPPPPPp.....",
					"..PPPppppPPp....",
					"..PPpMMMMpPPp...",
					".PPPpMMMMpPPPp..",
					".PPppMMMMppPPp..",
					".PPppMppMppPPp..",
					".PPppMppMppPPp..",
					".PPppMMMMppPPp..",
					".PPPpMMMMpPPPp..",
					"..PPpMMMMpPPp...",
					"..PPPppppPPp....",
					"...PPPPPPPp.....",
					"....PPPPpp......",
					"................",
				],
			],
		},
		animationRates: { idle: 1 },
	},

	providesConcealment: false,
	damagePerSecond: 3,

	tags: ["prop", "hazard", "poison", "scale_guard"],
};
