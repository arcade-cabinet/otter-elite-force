import type { SPDSLSprite } from "../types";
import type { PropDef } from "./tall-grass";

// Toxic Sludge — environmental hazard. Purple-ish/dark bubbling area. 16x16.
// Palette: otter_default
// Legacy char map: P->8 (stone dark, purple substitute), p->9 (stone light), M->e (dark interior)

// prettier-ignore
const body: string[][] = [
	[
		"0000000000000000",
		"0000888899000000",
		"0008888888900000",
		"0088899999880000",
		"0088999ee9988000",
		"0888899ee9988900",
		"088999eeee998800",
		"0889999ee9988000",
		"0889999ee9988000",
		"088999eeee998800",
		"0888899ee9988900",
		"0088999ee9988000",
		"0088899999880000",
		"0008888888900000",
		"0000888899000000",
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

export const toxicSludge: PropDef = {
	id: "toxic_sludge",
	name: "Toxic Sludge",

	sprite,

	providesConcealment: false,
	damagePerSecond: 3,

	tags: ["prop", "hazard", "poison", "scale_guard"],
};
