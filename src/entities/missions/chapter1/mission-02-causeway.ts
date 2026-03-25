// Mission 2: The Causeway — Escort / Defend
//
// A supply convoy must be escorted along a jungle causeway to the player's
// pre-built outpost. Scale-Guard ambushes at three chokepoints along the road.
// Teaches: combat, defense, escort mechanics.
// Win: Escort convoy to base (at least 1 of 3 wagons must survive).
// Par time: 6 min (360s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission02Causeway: MissionDef = {
	id: "mission_2",
	chapter: 1,
	mission: 2,
	name: "The Causeway",
	subtitle: "Escort a supply convoy through hostile jungle",

	briefing: {
		portraitId: "foxhound",
		lines: [
			{
				speaker: "FOXHOUND",
				text: "Bubbles, supply convoy inbound from the western staging area. Three wagons — munitions and construction materials. Without them we can't hold the beachhead.",
			},
			{
				speaker: "Sgt. Bubbles",
				text: "Route?",
			},
			{
				speaker: "FOXHOUND",
				text: "The Old Causeway. Only road through the jungle. Scale-Guard knows it — intercepted chatter mentions Captain Scalebreak setting ambushes at the river crossings.",
			},
			{
				speaker: "Sgt. Bubbles",
				text: "How many troops do I have?",
			},
			{
				speaker: "FOXHOUND",
				text: "Four Mudfoots and two River Rats. Position them along the road before the convoy arrives. The wagons cannot defend themselves.",
			},
			{
				speaker: "Sgt. Bubbles",
				text: "And if we lose all three?",
			},
			{
				speaker: "FOXHOUND",
				text: "Then we starve. At least one must reach the outpost. Move fast, Sergeant.",
			},
		],
	},

	terrain: {
		width: 48,
		height: 30,
		regions: [
			// Base layer
			{ terrainId: "grass", fill: true },
			// Dense jungle flanking the causeway — north
			{ terrainId: "mangrove", rect: { x: 0, y: 0, w: 48, h: 8 } },
			// Dense jungle flanking the causeway — south
			{ terrainId: "mangrove", rect: { x: 0, y: 22, w: 48, h: 8 } },
			// The causeway road (dirt) running east-west through the center
			{ terrainId: "dirt", rect: { x: 0, y: 12, w: 48, h: 6 } },
			// Three river crossings cutting across the road
			{
				terrainId: "water",
				river: {
					points: [
						[8, 0],
						[8, 30],
					],
					width: 2,
				},
			},
			{
				terrainId: "water",
				river: {
					points: [
						[22, 0],
						[22, 30],
					],
					width: 2,
				},
			},
			{
				terrainId: "water",
				river: {
					points: [
						[34, 0],
						[34, 30],
					],
					width: 2,
				},
			},
			// Mud banks along rivers
			{ terrainId: "mud", rect: { x: 6, y: 10, w: 2, h: 2 } },
			{ terrainId: "mud", rect: { x: 6, y: 18, w: 2, h: 2 } },
			{ terrainId: "mud", rect: { x: 20, y: 10, w: 2, h: 2 } },
			{ terrainId: "mud", rect: { x: 20, y: 18, w: 2, h: 2 } },
			{ terrainId: "mud", rect: { x: 32, y: 10, w: 2, h: 2 } },
			{ terrainId: "mud", rect: { x: 32, y: 18, w: 2, h: 2 } },
			// Outpost clearing on the east side
			{ terrainId: "dirt", rect: { x: 38, y: 10, w: 10, h: 10 } },
		],
		overrides: [
			// Bridges at river crossings (on the road)
			{ x: 8, y: 12, terrainId: "bridge" },
			{ x: 8, y: 13, terrainId: "bridge" },
			{ x: 8, y: 14, terrainId: "bridge" },
			{ x: 8, y: 15, terrainId: "bridge" },
			{ x: 8, y: 16, terrainId: "bridge" },
			{ x: 8, y: 17, terrainId: "bridge" },
			{ x: 22, y: 12, terrainId: "bridge" },
			{ x: 22, y: 13, terrainId: "bridge" },
			{ x: 22, y: 14, terrainId: "bridge" },
			{ x: 22, y: 15, terrainId: "bridge" },
			{ x: 22, y: 16, terrainId: "bridge" },
			{ x: 22, y: 17, terrainId: "bridge" },
			{ x: 34, y: 12, terrainId: "bridge" },
			{ x: 34, y: 13, terrainId: "bridge" },
			{ x: 34, y: 14, terrainId: "bridge" },
			{ x: 34, y: 15, terrainId: "bridge" },
			{ x: 34, y: 16, terrainId: "bridge" },
			{ x: 34, y: 17, terrainId: "bridge" },
		],
	},

	zones: {
		convoy_spawn: { x: 0, y: 12, width: 3, height: 6 },
		outpost: { x: 38, y: 10, width: 10, height: 10 },
		ambush_1: { x: 4, y: 10, width: 10, height: 10 },
		ambush_2: { x: 17, y: 10, width: 10, height: 10 },
		ambush_3: { x: 30, y: 10, width: 10, height: 10 },
		ambush_spawn_north_1: { x: 3, y: 4, width: 4, height: 4 },
		ambush_spawn_south_1: { x: 5, y: 22, width: 4, height: 4 },
		ambush_spawn_north_2: { x: 18, y: 2, width: 4, height: 4 },
		ambush_spawn_south_2: { x: 19, y: 22, width: 4, height: 4 },
		ambush_spawn_north_3: { x: 30, y: 4, width: 4, height: 4 },
		ambush_spawn_south_3: { x: 32, y: 22, width: 4, height: 4 },
	},

	placements: [
		// Player garrison at the outpost
		{ type: "mudfoot", faction: "ura", zone: "outpost", count: 4 },
		{ type: "river_rat", faction: "ura", zone: "outpost", count: 2 },

		// Pre-built outpost buildings
		{ type: "command_post", faction: "ura", x: 41, y: 13 },
		{ type: "barracks", faction: "ura", x: 41, y: 16 },
		{ type: "watchtower", faction: "ura", x: 38, y: 12 },
		{ type: "watchtower", faction: "ura", x: 38, y: 17 },

		// Resources near outpost
		{ type: "fish_spot", faction: "neutral", x: 44, y: 10 },
		{ type: "mangrove_tree", faction: "neutral", x: 42, y: 22, count: 6 },

		// Static enemy patrols along the road (pre-placed)
		{
			type: "viper",
			faction: "scale_guard",
			x: 12,
			y: 14,
			patrol: [
				[12, 14],
				[16, 14],
				[12, 14],
			],
		},
		{
			type: "gator",
			faction: "scale_guard",
			x: 26,
			y: 15,
			patrol: [
				[26, 15],
				[30, 15],
				[26, 15],
			],
		},
	],

	startResources: { fish: 200, timber: 150, salvage: 50 },
	startPopCap: 10,

	objectives: {
		primary: [
			objective("escort-convoy", "Escort the supply convoy to the outpost (1/3 wagons minimum)"),
		],
		bonus: [objective("all-wagons-survive", "All 3 wagons survive")],
	},

	triggers: [
		trigger("convoy-spawn", on.timer(10), [
			act.dialogue(
				"foxhound",
				"Convoy entering the causeway from the west. Three wagons. Keep them alive, Sergeant.",
			),
			act.spawn("supply_wagon", "ura", 1, 14, 3),
		]),
		trigger("arm-defeat", on.timer(15), act.enableTrigger("convoy-destroyed")),
		trigger("ambush-1", on.areaEntered("ura", "ambush_1"), [
			act.dialogue(
				"foxhound",
				"Contact! Scale-Guard emerging from the treeline at the first crossing!",
			),
			act.spawn("gator", "scale_guard", 4, 6, 2),
			act.spawn("viper", "scale_guard", 5, 22, 1),
		]),
		trigger("ambush-2", on.areaEntered("ura", "ambush_2"), [
			act.dialogue(
				"foxhound",
				"Second ambush — they're hitting from the tall grass! Watch the flanks!",
			),
			act.spawn("gator", "scale_guard", 18, 3, 2),
			act.spawn("viper", "scale_guard", 19, 24, 2),
		]),
		trigger("ambush-3", on.areaEntered("ura", "ambush_3"), [
			act.dialogue("foxhound", "Final crossing. Heavy resistance! Push through!"),
			act.spawn("gator", "scale_guard", 30, 6, 3),
			act.spawn("viper", "scale_guard", 32, 24, 1),
		]),
		trigger("convoy-arrived", on.areaEntered("ura", "outpost"), [
			act.completeObjective("escort-convoy"),
			act.dialogue("foxhound", "Supplies are in! Outstanding work, Sergeant."),
		]),
		trigger("all-wagons-arrived", on.unitCount("ura", "supply_wagon", "gte", 3), [
			act.completeObjective("all-wagons-survive"),
			act.dialogue("foxhound", "All three wagons accounted for. Full resupply."),
		]),
		trigger("convoy-destroyed", on.unitCount("ura", "supply_wagon", "eq", 0), act.failMission(), {
			enabled: false,
		}),
		trigger("mission-complete", on.allPrimaryComplete(), [
			act.dialogue(
				"foxhound",
				"Causeway secured. The Reach just got a lot more interesting for Scale-Guard. FOXHOUND out.",
			),
			act.victory(),
		]),
	],

	unlocks: {
		units: ["river_rat", "mudfoot"],
		buildings: ["command_post", "barracks", "watchtower", "fish_trap", "burrow", "sandbag_wall"],
	},

	parTime: 360,

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
