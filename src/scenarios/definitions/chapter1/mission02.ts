/**
 * Mission 2: The Causeway — Escort / Defend
 *
 * A supply convoy must be escorted along a jungle causeway to the player's
 * pre-built outpost. Scale-Guard ambushes at three chokepoints along the road.
 * Teaches: combat, defense, escort mechanics.
 * Win: Escort convoy to base (at least 1 of 3 wagons must survive).
 */

import type { Scenario } from "../../types";

export const mission02Causeway: Scenario = {
	id: "mission-02-causeway",
	chapter: 1,
	mission: 2,
	name: "The Causeway",

	briefing: {
		title: "Operation Causeway",
		lines: [
			{
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Bubbles, we have a supply convoy en route from the western staging area. Three wagons carrying critical munitions and construction materials.",
			},
			{
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Problem is, the only road through the jungle is the Old Causeway — and Scale-Guard knows it. Expect ambushes at the river crossings.",
			},
			{
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Your outpost garrison has four Mudfoots and two River Rats. Position your troops along the road. The convoy cannot defend itself.",
			},
			{
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "At least one wagon must reach the outpost. Losing all three means we starve. Don't let that happen.",
			},
		],
		objectives: [
			{
				description: "Escort the supply convoy to the outpost (1/3 wagons minimum)",
				type: "primary",
			},
			{
				description: "All 3 wagons survive",
				type: "bonus",
			},
		],
	},

	startConditions: {
		resources: { fish: 200, timber: 150, salvage: 50 },
		units: [
			{
				unitType: "mudfoot",
				count: 4,
				faction: "ura",
				position: { x: 39, y: 14 },
			},
			{
				unitType: "river-rat",
				count: 2,
				faction: "ura",
				position: { x: 40, y: 15 },
			},
		],
		buildings: [
			{
				buildingType: "command-post",
				faction: "ura",
				position: { x: 41, y: 13 },
			},
			{
				buildingType: "barracks",
				faction: "ura",
				position: { x: 41, y: 16 },
			},
			{
				buildingType: "watchtower",
				faction: "ura",
				position: { x: 38, y: 12 },
			},
			{
				buildingType: "watchtower",
				faction: "ura",
				position: { x: 38, y: 17 },
			},
		],
		populationCap: 10,
	},

	objectives: [
		{
			id: "escort-convoy",
			description: "Escort the supply convoy to the outpost (1/3 wagons minimum)",
			type: "primary",
			status: "active",
		},
		{
			id: "all-wagons-survive",
			description: "All 3 wagons survive",
			type: "bonus",
			status: "active",
		},
	],

	triggers: [
		// --- Convoy spawn ---
		{
			id: "convoy-spawn",
			condition: { type: "timer", time: 10 },
			action: [
				{
					type: "showDialogue",
					portrait: "foxhound",
					speaker: "FOXHOUND",
					text: "Convoy entering the causeway from the west. Three wagons. Keep them alive, Sergeant.",
					duration: 6,
				},
				{
					type: "spawnUnits",
					unitType: "supply-wagon",
					count: 3,
					faction: "ura",
					position: { x: 0, y: 14 },
					tag: "convoy",
				},
				{
					type: "camera",
					target: { x: 0, y: 14 },
					duration: 2,
				},
			],
			once: true,
		},

		// --- Ambush 1: West river crossing ---
		{
			id: "ambush-1",
			condition: {
				type: "areaEntered",
				faction: "ura",
				unitType: "supply-wagon",
				area: { x: 0, y: 10, width: 10, height: 10 },
			},
			action: [
				{
					type: "showDialogue",
					portrait: "foxhound",
					speaker: "FOXHOUND",
					text: "Contact! Scale-Guard emerging from the treeline at the first crossing!",
					duration: 4,
				},
				{
					type: "spawnReinforcements",
					faction: "scale_guard",
					units: [
						{ unitType: "gator", count: 2, position: { x: 3, y: 8 } },
						{ unitType: "viper", count: 1, position: { x: 5, y: 20 } },
					],
				},
				{ type: "playSFX", sfx: "unitAttack" },
			],
			once: true,
		},

		// --- Ambush 2: Center jungle ---
		{
			id: "ambush-2",
			condition: {
				type: "areaEntered",
				faction: "ura",
				unitType: "supply-wagon",
				area: { x: 14, y: 10, width: 10, height: 10 },
			},
			action: [
				{
					type: "showDialogue",
					portrait: "foxhound",
					speaker: "FOXHOUND",
					text: "Second ambush — they're hitting from the tall grass! Watch the flanks!",
					duration: 4,
				},
				{
					type: "spawnReinforcements",
					faction: "scale_guard",
					units: [
						{ unitType: "gator", count: 2, position: { x: 18, y: 3 } },
						{ unitType: "viper", count: 2, position: { x: 19, y: 22 } },
					],
				},
			],
			once: true,
		},

		// --- Ambush 3: East river crossing ---
		{
			id: "ambush-3",
			condition: {
				type: "areaEntered",
				faction: "ura",
				unitType: "supply-wagon",
				area: { x: 28, y: 10, width: 10, height: 10 },
			},
			action: [
				{
					type: "showDialogue",
					portrait: "foxhound",
					speaker: "FOXHOUND",
					text: "Final crossing. Heavy resistance! Push through!",
					duration: 4,
				},
				{
					type: "spawnReinforcements",
					faction: "scale_guard",
					units: [
						{ unitType: "gator", count: 3, position: { x: 30, y: 8 } },
						{ unitType: "viper", count: 1, position: { x: 32, y: 24 } },
					],
				},
			],
			once: true,
		},

		// --- Convoy arrival at outpost ---
		{
			id: "convoy-arrived",
			condition: {
				type: "areaEntered",
				faction: "ura",
				unitType: "supply-wagon",
				area: { x: 36, y: 12, width: 8, height: 8 },
				minUnits: 1,
			},
			action: { type: "completeObjective", objectiveId: "escort-convoy" },
			once: true,
		},

		// --- Bonus: all 3 wagons arrive ---
		{
			id: "all-wagons-arrived",
			condition: {
				type: "areaEntered",
				faction: "ura",
				unitType: "supply-wagon",
				area: { x: 36, y: 12, width: 8, height: 8 },
				minUnits: 3,
			},
			action: [
				{ type: "completeObjective", objectiveId: "all-wagons-survive" },
				{
					type: "showDialogue",
					portrait: "foxhound",
					speaker: "FOXHOUND",
					text: "All three wagons accounted for. Outstanding work, Sergeant. Full resupply.",
					duration: 5,
				},
			],
			once: true,
		},

		// --- All wagons destroyed = mission fail ---
		{
			id: "convoy-destroyed",
			condition: {
				type: "unitCount",
				faction: "ura",
				unitType: "supply-wagon",
				operator: "eq",
				count: 0,
			},
			action: {
				type: "failMission",
				reason: "The entire supply convoy has been destroyed. The outpost cannot be sustained.",
			},
			once: true,
			// Only enable after convoy has spawned
			enabled: false,
		},

		// Enable convoy-destroyed check after convoy spawns
		{
			id: "enable-convoy-check",
			condition: { type: "timer", time: 15 },
			action: {
				type: "showDialogue",
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Convoy is moving. Protect those wagons.",
				duration: 3,
			},
			once: true,
		},

		// --- Mission complete ---
		{
			id: "mission-complete",
			condition: { type: "allObjectivesComplete" },
			action: {
				type: "showDialogue",
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Causeway secured. Supplies are in. The Reach just got a lot more interesting for Scale-Guard. FOXHOUND out.",
				duration: 0,
			},
			once: true,
		},
	],

	unitUnlocks: ["river-rat", "mudfoot"],
	buildingUnlocks: [
		"command-post",
		"barracks",
		"watchtower",
		"fish-trap",
		"burrow",
		"sandbag-wall",
	],
};
