/**
 * Mission 3: Firebase Delta — King of the Hill
 *
 * Three capture points in a triangle. Player starts with a small base
 * at the south. Scale-Guard controls the north.
 * Teaches: multi-front warfare, Shellcrackers.
 * Win: Hold all 3 points simultaneously for 2 minutes.
 */

import type { Scenario } from "../../types";

export const mission03FirebaseDelta: Scenario = {
	id: "mission-03-firebase-delta",
	chapter: 1,
	mission: 3,
	name: "Firebase Delta",

	briefing: {
		title: "Operation Firebase Delta",
		lines: [
			{
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Bubbles, Firebase Delta is a triangle of three strategic hilltops controlling the river crossings. Scale-Guard holds all three.",
			},
			{
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Intel designates them Point Alpha — northwest hilltop, Point Bravo — northeast hilltop, and Point Charlie — the southern ridge. You need all three.",
			},
			{
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "We're deploying Shellcrackers with this operation — ranged infantry. Use them to soften defenses before your Mudfoots close in.",
			},
			{
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Capture all three points and hold them simultaneously for two minutes. Scale-Guard will throw everything they have at you to take them back.",
			},
		],
		objectives: [
			{
				description: "Capture and hold all 3 points for 2 minutes",
				type: "primary",
			},
			{
				description: "Destroy the Scale-Guard Spawning Pool",
				type: "bonus",
			},
		],
	},

	startConditions: {
		resources: { fish: 300, timber: 200, salvage: 100 },
		units: [
			{
				unitType: "mudfoot",
				count: 4,
				faction: "ura",
				position: { x: 14, y: 36 },
			},
			{
				unitType: "shellcracker",
				count: 2,
				faction: "ura",
				position: { x: 15, y: 35 },
			},
			{
				unitType: "river-rat",
				count: 2,
				faction: "ura",
				position: { x: 17, y: 38 },
			},
		],
		buildings: [
			{
				buildingType: "command-post",
				faction: "ura",
				position: { x: 15, y: 37 },
			},
			{
				buildingType: "barracks",
				faction: "ura",
				position: { x: 12, y: 37 },
			},
			{
				buildingType: "burrow",
				faction: "ura",
				position: { x: 18, y: 37 },
			},
		],
		populationCap: 18,
	},

	objectives: [
		{
			id: "hold-all-points",
			description: "Capture and hold all 3 points for 2 minutes",
			type: "primary",
			status: "active",
		},
		{
			id: "destroy-spawning-pool",
			description: "Destroy the Scale-Guard Spawning Pool",
			type: "bonus",
			status: "active",
		},
	],

	triggers: [
		// --- Capture point notifications ---
		{
			id: "point-alpha-captured",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 3, y: 6, width: 5, height: 5 },
				minUnits: 2,
			},
			action: {
				type: "showDialogue",
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Point Alpha secured. Two to go.",
				duration: 4,
			},
			once: true,
		},
		{
			id: "point-bravo-captured",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 31, y: 6, width: 5, height: 5 },
				minUnits: 2,
			},
			action: {
				type: "showDialogue",
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Point Bravo is ours. Keep pushing.",
				duration: 4,
			},
			once: true,
		},
		{
			id: "point-charlie-captured",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 16, y: 28, width: 5, height: 5 },
				minUnits: 2,
			},
			action: {
				type: "showDialogue",
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Point Charlie captured. If you hold all three, the clock starts. Two minutes, Bubbles.",
				duration: 5,
			},
			once: true,
		},

		// --- Counterattack waves ---
		{
			id: "counterattack-wave-1",
			condition: { type: "timer", time: 180 },
			action: [
				{
					type: "showDialogue",
					portrait: "foxhound",
					speaker: "FOXHOUND",
					text: "Scale-Guard counterattack incoming from the north! Reinforce your positions!",
					duration: 4,
				},
				{
					type: "spawnReinforcements",
					faction: "scale_guard",
					units: [
						{ unitType: "gator", count: 3, position: { x: 10, y: 1 } },
						{ unitType: "viper", count: 2, position: { x: 25, y: 1 } },
					],
				},
			],
			once: true,
		},
		{
			id: "counterattack-wave-2",
			condition: { type: "timer", time: 300 },
			action: {
				type: "spawnReinforcements",
				faction: "scale_guard",
				units: [
					{ unitType: "gator", count: 4, position: { x: 5, y: 0 } },
					{ unitType: "gator", count: 4, position: { x: 30, y: 0 } },
					{ unitType: "viper", count: 2, position: { x: 18, y: 2 } },
				],
			},
			once: true,
		},
		{
			id: "counterattack-wave-3",
			condition: { type: "timer", time: 420 },
			action: [
				{
					type: "showDialogue",
					portrait: "foxhound",
					speaker: "FOXHOUND",
					text: "Heavy reinforcements! They're throwing everything at the points. Dig in!",
					duration: 4,
				},
				{
					type: "spawnReinforcements",
					faction: "scale_guard",
					units: [
						{ unitType: "gator", count: 3, position: { x: 3, y: 2 } },
						{ unitType: "gator", count: 3, position: { x: 33, y: 2 } },
						{ unitType: "viper", count: 3, position: { x: 18, y: 0 } },
						{ unitType: "scout-lizard", count: 2, position: { x: 15, y: 1 } },
					],
				},
			],
			once: true,
		},

		// --- Hold timer complete (objective complete) ---
		// In practice, the hold-timer logic would be tracked by a dedicated system
		// that checks all 3 zones simultaneously. This trigger serves as the
		// completion hook once that system signals success.
		{
			id: "hold-complete",
			condition: {
				type: "objectiveComplete",
				objectiveId: "hold-all-points",
			},
			action: {
				type: "showDialogue",
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Two minutes! Firebase Delta is ours. Scale-Guard is falling back. Outstanding work.",
				duration: 0,
			},
			once: true,
		},

		// --- Bonus: destroy spawning pool ---
		{
			id: "spawning-pool-destroyed",
			condition: {
				type: "buildingDestroyed",
				buildingTag: "spawning-pool",
			},
			action: [
				{ type: "completeObjective", objectiveId: "destroy-spawning-pool" },
				{
					type: "showDialogue",
					portrait: "foxhound",
					speaker: "FOXHOUND",
					text: "Their spawning pool is down! That'll slow the counterattacks.",
					duration: 4,
				},
			],
			once: true,
		},

		// --- Command post destroyed = mission fail ---
		{
			id: "command-post-destroyed",
			condition: {
				type: "buildingDestroyed",
				buildingTag: "ura-command-post",
			},
			action: {
				type: "failMission",
				reason: "Command Post destroyed. Firebase Delta is lost.",
			},
			once: true,
		},
	],

	unitUnlocks: ["shellcracker"],
	buildingUnlocks: [
		"command-post",
		"barracks",
		"watchtower",
		"fish-trap",
		"burrow",
		"sandbag-wall",
	],
};
