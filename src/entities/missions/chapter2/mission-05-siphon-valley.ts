// Mission 5: Siphon Valley — Base Build + Destroy
//
// Player starts with full base-building. Three siphons spread across the map.
// Toxic sludge radiates from each active siphon.
// Teaches: full base economy, Sappers, Armory unlock.
// Win: Destroy all 3 siphons.
// Par time: 12 min (720s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission05SiphonValley: MissionDef = {
	id: "mission_5",
	chapter: 2,
	mission: 1,
	name: "Siphon Valley",
	subtitle: "Destroy three toxic siphon installations",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "Listen up. Scale-Guard has deployed three siphon installations along the river valley. They're pumping toxic sludge into the waterways — killing everything downstream.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "You'll establish a forward base at the southern end of the valley. Full resource access — fish, timber, and salvage. Build up, then push north.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Three targets: Siphon West at the river bend, Siphon Central north of the bridges, and Siphon East near the mangrove coast. Each one is guarded.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "New gear from the Armory: Sappers are combat engineers with demolition charges. They'll crack those siphon casings. Get it done, Sergeant.",
			},
		],
	},

	terrain: {
		width: 56,
		height: 48,
		regions: [
			{ terrainId: "grass", fill: true },
			// River running north-south through center
			{
				terrainId: "water",
				river: {
					points: [
						[28, 0],
						[26, 16],
						[30, 32],
						[28, 48],
					],
					width: 3,
				},
			},
			// Toxic sludge zones around each siphon
			{ terrainId: "toxic_sludge", circle: { cx: 8, cy: 12, r: 5 } },
			{ terrainId: "toxic_sludge", circle: { cx: 28, cy: 8, r: 5 } },
			{ terrainId: "toxic_sludge", circle: { cx: 48, cy: 14, r: 5 } },
			// Mud banks along river
			{ terrainId: "mud", rect: { x: 22, y: 0, w: 2, h: 48 } },
			{ terrainId: "mud", rect: { x: 32, y: 0, w: 2, h: 48 } },
			// Mangrove groves (timber)
			{ terrainId: "mangrove", rect: { x: 0, y: 30, w: 12, h: 10 } },
			{ terrainId: "mangrove", rect: { x: 44, y: 28, w: 12, h: 10 } },
			// Player base clearing (south)
			{ terrainId: "dirt", rect: { x: 22, y: 38, w: 12, h: 10 } },
		],
		overrides: [
			// Bridge west
			{ x: 14, y: 14, terrainId: "bridge" },
			{ x: 14, y: 15, terrainId: "bridge" },
			{ x: 14, y: 16, terrainId: "bridge" },
			// Bridge east
			{ x: 42, y: 18, terrainId: "bridge" },
			{ x: 42, y: 19, terrainId: "bridge" },
			{ x: 42, y: 20, terrainId: "bridge" },
			// Central bridge
			{ x: 28, y: 24, terrainId: "bridge" },
			{ x: 28, y: 25, terrainId: "bridge" },
			{ x: 28, y: 26, terrainId: "bridge" },
		],
	},

	zones: {
		ura_base: { x: 22, y: 38, width: 12, height: 10 },
		siphon_west: { x: 4, y: 8, width: 8, height: 8 },
		siphon_central: { x: 24, y: 4, width: 8, height: 8 },
		siphon_east: { x: 44, y: 10, width: 8, height: 8 },
		river_crossing: { x: 24, y: 22, width: 8, height: 6 },
		timber_west: { x: 0, y: 30, width: 12, height: 10 },
		timber_east: { x: 44, y: 28, width: 12, height: 10 },
	},

	placements: [
		// Player starting units
		{ type: "river_rat", faction: "ura", zone: "ura_base", count: 4 },
		{ type: "mudfoot", faction: "ura", zone: "ura_base", count: 4 },
		{ type: "shellcracker", faction: "ura", zone: "ura_base", count: 2 },

		// Resources
		{ type: "fish_spot", faction: "neutral", x: 26, y: 36 },
		{ type: "fish_spot", faction: "neutral", x: 30, y: 36 },
		{ type: "mangrove_tree", faction: "neutral", zone: "timber_west", count: 12 },
		{ type: "mangrove_tree", faction: "neutral", zone: "timber_east", count: 12 },
		{ type: "salvage_cache", faction: "neutral", x: 20, y: 40 },
		{ type: "salvage_cache", faction: "neutral", x: 36, y: 40 },

		// Siphon installations
		{ type: "siphon", faction: "scale_guard", x: 8, y: 12 },
		{ type: "siphon", faction: "scale_guard", x: 28, y: 8 },
		{ type: "siphon", faction: "scale_guard", x: 48, y: 14 },

		// Siphon defenders
		{ type: "gator", faction: "scale_guard", zone: "siphon_west", count: 3 },
		{ type: "snapper", faction: "scale_guard", x: 6, y: 10 },
		{ type: "gator", faction: "scale_guard", zone: "siphon_central", count: 4 },
		{ type: "viper", faction: "scale_guard", x: 26, y: 6, count: 2 },
		{ type: "snapper", faction: "scale_guard", x: 30, y: 6 },
		{ type: "gator", faction: "scale_guard", zone: "siphon_east", count: 3 },
		{ type: "viper", faction: "scale_guard", x: 50, y: 12, count: 2 },

		// Siphon drones patrolling
		{
			type: "siphon_drone",
			faction: "scale_guard",
			x: 20,
			y: 20,
			patrol: [
				[20, 20],
				[36, 20],
				[20, 20],
			],
		},
	],

	startResources: { fish: 200, timber: 150, salvage: 50 },
	startPopCap: 20,

	objectives: {
		primary: [
			objective("destroy-siphon-west", "Destroy Siphon West"),
			objective("destroy-siphon-central", "Destroy Siphon Central"),
			objective("destroy-siphon-east", "Destroy Siphon East"),
		],
		bonus: [objective("speed-bonus", "Destroy all 3 siphons within 20 minutes")],
	},

	triggers: [
		trigger(
			"mission-start",
			on.timer(3),
			act.dialogue(
				"gen_whiskers",
				"Establish your base first. There's timber in the mangroves and fish in the river. Build an Armory to train Sappers — you'll need their charges.",
			),
		),
		trigger(
			"build-reminder",
			on.timer(120),
			act.dialogue("gen_whiskers", "Get that Command Post up and start expanding. The siphons aren't going to destroy themselves."),
		),
		trigger(
			"approach-siphon-west",
			on.areaEntered("ura", "siphon_west"),
			act.dialogue(
				"gen_whiskers",
				"Siphon ahead. Watch for Gators and Snappers guarding the perimeter. Sappers should move in after you clear the guards.",
			),
		),
		trigger("siphon-west-destroyed", on.buildingCount("scale_guard", "siphon", "lte", 2), [
			act.completeObjective("destroy-siphon-west"),
			act.dialogue("gen_whiskers", "Siphon West is down! The western waterway is clearing. Two more to go."),
		]),
		trigger("siphon-central-destroyed", on.buildingCount("scale_guard", "siphon", "lte", 1), [
			act.completeObjective("destroy-siphon-central"),
			act.dialogue("gen_whiskers", "Central siphon neutralized. That was the most fortified position — well done."),
		]),
		trigger("siphon-east-destroyed", on.buildingCount("scale_guard", "siphon", "eq", 0), [
			act.completeObjective("destroy-siphon-east"),
			act.dialogue("gen_whiskers", "Siphon East is gone. The river's running clean again."),
		]),
		trigger(
			"river-crossing-warning",
			on.areaEntered("ura", "river_crossing"),
			act.dialogue(
				"gen_whiskers",
				"Bridge crossing ahead. Siphon drones patrol this stretch — keep your forces tight and push through fast.",
			),
		),
		trigger("counterattack-1", on.timer(480), [
			act.dialogue("gen_whiskers", "Incoming! Scale-Guard is sending a response force from the north. Defend your base!"),
			act.spawn("gator", "scale_guard", 27, 2, 4),
			act.spawn("scout_lizard", "scale_guard", 20, 2, 2),
		]),
		trigger("counterattack-2", on.timer(840), [
			act.dialogue("gen_whiskers", "Another wave from Scale-Guard. They're throwing everything at you — hold the line."),
			act.spawn("gator", "scale_guard", 5, 15, 3),
			act.spawn("viper", "scale_guard", 50, 15, 2),
			act.spawn("snapper", "scale_guard", 27, 2, 2),
		]),
		trigger("mission-complete", on.allPrimaryComplete(), [
			act.dialogue(
				"gen_whiskers",
				"All three siphons are destroyed. The Copper-Silt Reach is breathing again. Outstanding work — Sappers and the Armory are now permanent assets.",
			),
			act.victory(),
		]),
	],

	unlocks: {
		units: ["sapper"],
		buildings: ["armory"],
	},

	parTime: 720,

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
