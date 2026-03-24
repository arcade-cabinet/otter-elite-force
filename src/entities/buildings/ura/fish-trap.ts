import type { BuildingDef } from "../../types";

/**
 * Fish Trap — URA passive economy building.
 * Generates +3 fish every 10 seconds.
 * Low wooden structure near water.
 */
export const fishTrap: BuildingDef = {
	id: "fish_trap",
	name: "Fish Trap",
	faction: "ura",
	category: "economy",

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
					"..........wwwwwwwwwwww..........",
					".........wWWWWWWWWWWWWw.........",
					"........wWWWWWWWWWWWWWWw........",
					".......wWwwwwwwwwwwwwwWWw.......",
					".......wWwwwwwwwwwwwwwWWw.......",
					".......wWwwTTTTTTTTwwwWWw.......",
					".......wWwwTtttttTTwwwWWw.......",
					".......wWwwTTTTTTTTwwwWWw.......",
					".......wWwwwwwwwwwwwwwWWw.......",
					".......wWwwwwwwwwwwwwwWWw.......",
					".......wWwwTTTTTTTTwwwWWw.......",
					".......wWwwTtttttTTwwwWWw.......",
					".......wWwwTTTTTTTTwwwWWw.......",
					".......wWwwwwwwwwwwwwwWWw.......",
					".......wWwwwwwwwwwwwwwWWw.......",
					"........wWWWWWWWWWWWWWWw........",
					".........wWWWWWWWWWWWWw.........",
					"..........wwwwwwwwwwww..........",
					"................................",
					"......CCCCCCCCCCCCCCCCCCcc......",
					"......CcccccccccccccccccCc......",
					"......CcccccccccccccccccCc......",
					"......CCCCCCCCCCCCCCCCCCcc......",
					"......########################..",
					"......########################..",
					"......########################..",
					"................................",
				],
			],
		},
	},

	hp: 80,
	armor: 0,
	buildTime: 15,

	cost: { timber: 100 },
	unlockedAt: "mission_1",

	passiveIncome: {
		type: "fish",
		amount: 3,
		interval: 10,
	},

	tags: ["building", "economy", "ura", "passive_income"],
};
