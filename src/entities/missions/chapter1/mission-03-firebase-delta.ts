// Mission 3: Firebase Delta — King of the Hill
//
// Three capture points in a triangle. Player starts with a small base at
// the south. Scale-Guard controls the north. Introduces Shellcrackers.
// Teaches: multi-front warfare, ranged units.
// Win: Hold all 3 capture points simultaneously for 2 minutes.
// Par time: 10 min (600s).

import type { MissionDef } from "../../types";

export const mission03FirebaseDelta: MissionDef = {
	id: "mission-03-firebase-delta",
	chapter: 1,
	mission: 3,
	name: "Firebase Delta",
	subtitle: "Seize and hold three strategic hilltops",

	briefing: {
		portraitId: "foxhound",
		lines: [
			{
				speaker: "FOXHOUND",
				text: "Bubbles, Firebase Delta is a triangle of three strategic hilltops controlling the river crossings. Scale-Guard holds all three.",
			},
			{
				speaker: "FOXHOUND",
				text: "Intel designates them Point Alpha — northwest hilltop, Point Bravo — northeast hilltop, and Point Charlie — the southern ridge. You need all three.",
			},
			{
				speaker: "FOXHOUND",
				text: "We're deploying Shellcrackers with this operation — ranged infantry. Use them to soften defenses before your Mudfoots close in.",
			},
			{
				speaker: "FOXHOUND",
				text: "Capture all three points and hold them simultaneously for two minutes. Scale-Guard will throw everything they have at you to take them back.",
			},
		],
	},

	terrain: {
		width: 40,
		height: 44,
		regions: [
			// Base layer
			{ terrainId: "grass", fill: true },
			// Dense jungle across the north (Scale-Guard territory)
			{ terrainId: "mangrove", rect: { x: 0, y: 0, w: 40, h: 6 } },
			// Central river running east-west
			{
				terrainId: "water",
				river: {
					points: [
						[0, 22],
						[15, 20],
						[25, 24],
						[40, 22],
					],
					width: 2,
				},
			},
			// Mud banks along river
			{ terrainId: "mud", rect: { x: 0, y: 18, w: 40, h: 2 } },
			{ terrainId: "mud", rect: { x: 0, y: 25, w: 40, h: 2 } },
			// Hilltop clearings for capture points
			// Alpha (northwest)
			{ terrainId: "dirt", rect: { x: 3, y: 8, w: 6, h: 6 } },
			// Bravo (northeast)
			{ terrainId: "dirt", rect: { x: 31, y: 8, w: 6, h: 6 } },
			// Charlie (south-center)
			{ terrainId: "dirt", rect: { x: 17, y: 28, w: 6, h: 6 } },
			// Player base area (south)
			{ terrainId: "dirt", rect: { x: 12, y: 36, w: 16, h: 8 } },
			// Scale-Guard spawning area (far north)
			{ terrainId: "dirt", rect: { x: 15, y: 0, w: 10, h: 4 } },
		],
		overrides: [
			// Bridge west (access to Alpha)
			{ x: 10, y: 20, terrainId: "bridge" },
			{ x: 10, y: 21, terrainId: "bridge" },
			{ x: 10, y: 22, terrainId: "bridge" },
			{ x: 10, y: 23, terrainId: "bridge" },
			// Bridge east (access to Bravo)
			{ x: 30, y: 21, terrainId: "bridge" },
			{ x: 30, y: 22, terrainId: "bridge" },
			{ x: 30, y: 23, terrainId: "bridge" },
			{ x: 30, y: 24, terrainId: "bridge" },
			// Central bridge (connects south to Charlie)
			{ x: 20, y: 21, terrainId: "bridge" },
			{ x: 20, y: 22, terrainId: "bridge" },
			{ x: 20, y: 23, terrainId: "bridge" },
		],
	},

	zones: {
		ura_base: { x: 12, y: 36, width: 16, height: 8 },
		point_alpha: { x: 3, y: 8, width: 6, height: 6 },
		point_bravo: { x: 31, y: 8, width: 6, height: 6 },
		point_charlie: { x: 17, y: 28, width: 6, height: 6 },
		sg_spawn_north: { x: 15, y: 0, width: 10, height: 4 },
		sg_spawn_west: { x: 0, y: 2, width: 5, height: 4 },
		sg_spawn_east: { x: 35, y: 2, width: 5, height: 4 },
		spawning_pool_area: { x: 17, y: 1, width: 6, height: 3 },
	},

	placements: [
		// Player starting units
		{ type: "mudfoot", faction: "ura", zone: "ura_base", count: 4 },
		{ type: "shellcracker", faction: "ura", zone: "ura_base", count: 2 },
		{ type: "river_rat", faction: "ura", zone: "ura_base", count: 2 },

		// Pre-built player base
		{ type: "command_post", faction: "ura", x: 18, y: 38 },
		{ type: "barracks", faction: "ura", x: 15, y: 38 },
		{ type: "burrow", faction: "ura", x: 21, y: 38 },

		// Capture point defenders
		{ type: "gator", faction: "scale_guard", zone: "point_alpha", count: 2 },
		{ type: "viper", faction: "scale_guard", zone: "point_alpha", count: 1 },
		{ type: "gator", faction: "scale_guard", zone: "point_bravo", count: 2 },
		{ type: "viper", faction: "scale_guard", zone: "point_bravo", count: 1 },
		{ type: "gator", faction: "scale_guard", zone: "point_charlie", count: 2 },

		// Scale-Guard spawning pool (bonus objective target)
		{ type: "spawning_pool", faction: "scale_guard", x: 19, y: 2 },

		// Resources near player base
		{ type: "fish_spot", faction: "neutral", x: 10, y: 34 },
		{ type: "fish_spot", faction: "neutral", x: 26, y: 34 },
		{ type: "mangrove_tree", faction: "neutral", x: 6, y: 36, count: 8 },
		{ type: "salvage_cache", faction: "neutral", x: 28, y: 36 },
	],

	startResources: { fish: 300, timber: 200, salvage: 100 },
	startPopCap: 18,

	objectives: {
		primary: [
			{
				id: "hold-all-points",
				description: "Capture and hold all 3 points for 2 minutes",
				type: "survive",
				timeLimit: 120,
			},
		],
		bonus: [
			{
				id: "destroy-spawning-pool",
				description: "Destroy the Scale-Guard Spawning Pool",
				type: "destroy",
				target: "spawning_pool",
				count: 1,
			},
		],
	},

	triggers: [
		// Opening hint
		{
			id: "opening-hint",
			condition: "timer:5",
			action:
				"dialogue:foxhound:Shellcrackers have range advantage. Position them on high ground and let Mudfoots lead the charge.",
			once: true,
		},
		// Capture point notifications
		{
			id: "alpha-captured",
			condition: "area_entered:ura:point_alpha",
			action: "dialogue:foxhound:Point Alpha secured. Two to go.",
			once: true,
		},
		{
			id: "bravo-captured",
			condition: "area_entered:ura:point_bravo",
			action: "dialogue:foxhound:Point Bravo is ours. Keep pushing.",
			once: true,
		},
		{
			id: "charlie-captured",
			condition: "area_entered:ura:point_charlie",
			action:
				"dialogue:foxhound:Point Charlie captured. Hold all three and the clock starts. Two minutes, Bubbles.",
			once: true,
		},
		// Counterattack wave 1 (3 minutes)
		{
			id: "counterattack-1",
			condition: "timer:180",
			action:
				"dialogue:foxhound:Scale-Guard counterattack incoming from the north! Reinforce your positions!|spawn:gator:scale_guard:10:1:3|spawn:viper:scale_guard:25:1:2",
			once: true,
		},
		// Counterattack wave 2 (5 minutes)
		{
			id: "counterattack-2",
			condition: "timer:300",
			action:
				"spawn:gator:scale_guard:5:0:4|spawn:gator:scale_guard:30:0:4|spawn:viper:scale_guard:18:2:2",
			once: true,
		},
		// Counterattack wave 3 (7 minutes) — the heaviest
		{
			id: "counterattack-3",
			condition: "timer:420",
			action:
				"dialogue:foxhound:Heavy reinforcements! They're throwing everything at the points. Dig in!|spawn:gator:scale_guard:3:2:3|spawn:gator:scale_guard:33:2:3|spawn:viper:scale_guard:18:0:3|spawn:scout_lizard:scale_guard:15:1:2",
			once: true,
		},
		// Spawning pool destroyed (bonus)
		{
			id: "spawning-pool-destroyed",
			condition: "building_count:scale_guard:spawning_pool:eq:0",
			action:
				"complete_objective:destroy-spawning-pool|dialogue:foxhound:Their spawning pool is down! That'll slow the counterattacks.",
			once: true,
		},
		// Command post destroyed = defeat
		{
			id: "cp-destroyed",
			condition: "building_count:ura:command_post:eq:0",
			action: "defeat",
			once: true,
		},
		// Mission complete
		{
			id: "mission-complete",
			condition: "all_primary_complete",
			action:
				"dialogue:foxhound:Two minutes! Firebase Delta is ours. Scale-Guard is falling back. Outstanding work.|victory",
			once: true,
		},
	],

	unlocks: {
		units: ["shellcracker"],
		buildings: ["command_post", "barracks", "watchtower", "fish_trap", "burrow", "sandbag_wall"],
	},

	parTime: 600,

	difficulty: {
		support: {
			enemyDamageMultiplier: 0.8,
			enemyHpMultiplier: 0.8,
			resourceMultiplier: 1.5,
			xpMultiplier: 1.0,
		},
		tactical: {
			enemyDamageMultiplier: 1.0,
			enemyHpMultiplier: 1.0,
			resourceMultiplier: 1.0,
			xpMultiplier: 1.2,
		},
		elite: {
			enemyDamageMultiplier: 1.3,
			enemyHpMultiplier: 1.3,
			resourceMultiplier: 0.75,
			xpMultiplier: 1.5,
		},
	},
};
