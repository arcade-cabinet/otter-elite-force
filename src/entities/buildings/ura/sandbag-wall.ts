import type { BuildingDef } from "../../types";

/**
 * Sandbag Wall — URA basic barrier.
 * Blocks pathing. Cheap and fast to build.
 */
export const sandbagWall: BuildingDef = {
	id: "sandbag_wall",
	name: "Sandbag Wall",
	faction: "ura",
	category: "wall",

	sprite: {
		size: 32,
		frames: {
			idle: [
				[
					"................................",
					"................................",
					"................................",
					"................................",
					"................................",
					"................................",
					"................................",
					"................................",
					"................................",
					"................................",
					"................................",
					"......wwwwwwwwwwwwwwwwwwww......",
					"......wWWWWWWWWWWWWWWWWWWw......",
					"......wWWwwWWwwWWwwWWwwWWw......",
					"......wWWwwWWwwWWwwWWwwWWw......",
					"......wWWWWWWWWWWWWWWWWWWw......",
					"......wWWWWWWWWWWWWWWWWWWw......",
					"......wWWwwWWwwWWwwWWwwWWw......",
					"......wWWwwWWwwWWwwWWwwWWw......",
					"......wWWWWWWWWWWWWWWWWWWw......",
					"......wWWWWWWWWWWWWWWWWWWw......",
					"......wWWwwWWwwWWwwWWwwWWw......",
					"......wWWwwWWwwWWwwWWwwWWw......",
					"......wWWWWWWWWWWWWWWWWWWw......",
					"......wwwwwwwwwwwwwwwwwwww......",
					"......########################..",
					"......########################..",
					"......########################..",
					"......########################..",
					"......########################..",
					"................................",
					"................................",
				],
			],
		},
	},

	hp: 150,
	armor: 0,
	buildTime: 5,

	cost: { timber: 50 },
	unlockedAt: "mission_1",

	tags: ["building", "wall", "ura", "barrier"],
};
