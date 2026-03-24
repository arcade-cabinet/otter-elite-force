import type { BuildingDef } from "../../types";

/**
 * Gun Tower — URA upgraded defensive tower.
 * 12 damage ranged attack. Requires Gun Emplacements research.
 * Taller, heavier stone profile than Watchtower.
 */
export const gunTower: BuildingDef = {
	id: "gun_tower",
	name: "Gun Tower",
	faction: "ura",
	category: "defense",

	sprite: {
		size: 32,
		frames: {
			idle: [
				[
					"................................",
					"............CCCCCCCC............",
					"...........CcCCCCCCCc...........",
					"..........CcCCBBBBCCCc..........",
					"..........CcCCBbbBCCCc..........",
					"..........CcCCBBBBCCCc..........",
					".........CcCCCCCCCCCCCc.........",
					"........#CCCCCCCCCCCCCCc#.......",
					"........#cccccccccccccccc#......",
					"........#ccwwwwwwwwwwwwcc#......",
					"........#ccwwccccccwwwwcc#......",
					"........#ccwwcCCCCcwwwwcc#......",
					"........#ccwwccccccwwwwcc#......",
					"........#ccwwwwwwwwwwwwcc#......",
					"........#ccwwwwwwwwwwwwcc#......",
					"........#ccwwwwwwccccwwcc#......",
					"........#ccwwwwwwcCCcwwcc#......",
					"........#ccwwwwwwccccwwcc#......",
					"........#ccwwwwwwwwwwwwcc#......",
					"........#ccwwwwwwwwwwwwcc#......",
					"........#ccwwwwMMMMwwwwcc#......",
					"........#ccwwwwMMMMwwwwcc#......",
					"........#ccwwwwMMMMwwwwcc#......",
					"........#ccwwwwMMMMwwwwcc#......",
					"........CCCCCCCCCCCCCCCCCc......",
					"........CcccccccccccccccCc......",
					"........CcccccccccccccccCc......",
					"........CCCCCCCCCCCCCCCCCc......",
					"........##################......",
					"........##################......",
					"........##################......",
					"................................",
				],
			],
		},
	},

	hp: 350,
	armor: 0,
	buildTime: 25,

	cost: { timber: 200, salvage: 100 },
	unlockedAt: "mission_11",
	requiresResearch: "gun_emplacements",

	attackDamage: 12,
	attackRange: 8,
	attackCooldown: 1.5,

	tags: ["building", "defense", "ura", "upgraded"],
};
