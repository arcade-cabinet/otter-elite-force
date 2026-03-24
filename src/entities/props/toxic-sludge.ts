import type { PropDef } from "./tall-grass";
import type { SPDSLSprite } from "../types";

// Toxic Sludge — environmental hazard. Purple/dark bubbling area. 16x16.
// Palette: resource_default — purple 'e'/'f', interior 'g'

// prettier-ignore
const body: string[][] = [
	[
		"0000000000000000",
		"0000eeeeff000000",
		"000eeeeeeef00000",
		"00eeefffffee0000",
		"00eefggggfeef000",
		"0eeefggggfeeef00",
		"0eeffggggffeef00",
		"0eeffgffgffeef00",
		"0eeffgffgffeef00",
		"0eeffggggffeef00",
		"0eeefggggfeeef00",
		"00eefggggfeef000",
		"00eeefffffee0000",
		"000eeeeeeef00000",
		"0000eeeeff000000",
		"0000000000000000",
	],
];

const sprite: SPDSLSprite = {
	palette: "resource_default",
	layers: [{ id: "body", zIndex: 1, grid: body }],
	animations: { idle: [{}] },
};

export const toxicSludge: PropDef = {
	id: "toxic_sludge",
	name: "Toxic Sludge",

	sprite,

	providesConcealment: false,
	damagePerSecond: 3,

	tags: ["prop", "hazard", "poison", "scale_guard"],
};
