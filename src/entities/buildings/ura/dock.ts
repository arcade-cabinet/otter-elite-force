import type { BuildingDef } from "../../types";

/**
 * Dock — URA naval training facility.
 * Trains Raftsmen, Divers. Must be placed on water edge.
 * Wooden pier structure with blue URA trim.
 */
export const dock: BuildingDef = {
	id: "dock",
	name: "Dock",
	faction: "ura",
	category: "production",

	sprite: {
		size: 32,
		frames: {
			idle: [
				[
					"................................",
					"..........BBBBBBBBBBBb..........",
					".........BBBBBBBBBBBBBb.........",
					".........BbbbbbbbbbbbBb.........",
					".........BBBBBBBBBBBBBb.........",
					"........#wwwwwwwwwwwwww#........",
					"........#wwwwwwwwwwwwww#........",
					"........#wwwwTTTTwwwwww#........",
					"........#wwwwTttTwwwwww#........",
					"........#wwwwTTTTwwwwww#........",
					"........#wwwwwwwwwwwwww#........",
					"........#wwwwwwwwwwwwww#........",
					"........#wwwwwwwwTTTTww#........",
					"........#wwwwwwwwTttTww#........",
					"........#wwwwwwwwTTTTww#........",
					"........#wwwwwwwwwwwwww#........",
					"........#wwwwwwwwwwwwww#........",
					"........#wwwwwwwwwwwwww#........",
					"........#wwwwwwwwwwwwww#........",
					"........#wwww####wwwwww#........",
					"........#wwww#MM#wwwwww#........",
					"........#wwww#MM#wwwwww#........",
					"........#wwww#MM#wwwwww#........",
					"........#wwww#MM#wwwwww#........",
					"........CCCCCCCCCCCCCCCCc.......",
					"........CccccccccccccccCc.......",
					"........CccccccccccccccCc.......",
					"........CCCCCCCCCCCCCCCCc.......",
					"........##################......",
					"........##################......",
					"........##################......",
					"................................",
				],
			],
		},
	},

	hp: 300,
	armor: 0,
	buildTime: 35,

	cost: { timber: 250, salvage: 50 },
	unlockedAt: "mission_7",

	trains: ["raftsman", "diver"],

	tags: ["building", "production", "ura", "naval", "requires_water"],
};
