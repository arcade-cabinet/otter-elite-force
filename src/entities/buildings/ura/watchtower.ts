import type { BuildingDef } from "../../types";

/**
 * Watchtower — URA defensive tower.
 * Detection radius (8 tiles), light ranged defense (6 dmg).
 * Tall narrow profile per art direction.
 */
export const watchtower: BuildingDef = {
	id: "watchtower",
	name: "Watchtower",
	faction: "ura",
	category: "defense",

	sprite: {
		size: 32,
		frames: {
			idle: [
				[
					"................................",
					"..............####..............",
					".............#BBBB#.............",
					"............#BBBBBb#............",
					"............#BBBBBb#............",
					"...........##BBBBBb##...........",
					"..........#cccccccccc#..........",
					"..........#cccccccccc#..........",
					"..........#ccwwwwwwcc#..........",
					"..........#ccwwwwwwcc#..........",
					"..........#ccwwwwwwcc#..........",
					"..........#ccwwccwwcc#..........",
					"..........#ccwwccwwcc#..........",
					"..........#ccwwwwwwcc#..........",
					"..........#ccwwwwwwcc#..........",
					"..........#ccwwwwwwcc#..........",
					"..........#ccwwwwwwcc#..........",
					"..........#ccwwwwwwcc#..........",
					"..........#ccwwwwwwcc#..........",
					"..........#ccwwwwwwcc#..........",
					"..........#ccwwMMwwcc#..........",
					"..........#ccwwMMwwcc#..........",
					"..........#ccwwMMwwcc#..........",
					"..........#ccwwMMwwcc#..........",
					"..........CCCCCCCCCCCc..........",
					"..........CcccccccccCc..........",
					"..........CcccccccccCc..........",
					"..........CCCCCCCCCCCc..........",
					"..........############..........",
					"..........############..........",
					"..........############..........",
					"................................",
				],
			],
		},
	},

	hp: 200,
	armor: 0,
	buildTime: 20,

	cost: { timber: 150 },
	unlockedAt: "mission_1",

	attackDamage: 6,
	attackRange: 8,
	attackCooldown: 2,

	tags: ["building", "defense", "ura", "detection"],
};
