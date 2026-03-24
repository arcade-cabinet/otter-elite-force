/**
 * Mission 7: River Rats — Capture the Flag
 *
 * A wide river divides the map east-west.
 * Player base on the west, enemy base on the east.
 * Two bridges connect the halves. Must capture 5 enemy supply crates
 * from the east side and return them to the player's base zone.
 * Teaches: Raftsmen, water traversal, Dock building.
 * Win: Return all 5 supply crates. Bonus: Build a Dock.
 */

import type { Scenario } from "../../types";

export const mission07RiverRats: Scenario = {
	id: "mission-07-river-rats",
	chapter: 2,
	mission: 7,
	name: "River Rats",

	briefing: {
		title: "Operation River Rats",
		lines: [
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Scale-Guard has stockpiled supplies on the east bank. Five crates of munitions, rations, and salvage — and we need all of them.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "A wide river cuts the valley in two. Two bridges — north and south — are the only crossing points. Both will be contested.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "New capability: Raftsmen can cross water without bridges. Build a Dock at the riverbank and you can ferry units across anywhere. This changes the game, Sergeant.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Grab those crates and get them back to our base zone on the west side. Each crate must be carried by a unit into the delivery zone. Move out.",
			},
		],
		objectives: [
			{
				description: "Return 5 supply crates to the base",
				type: "primary",
			},
			{ description: "Build a Dock", type: "bonus" },
		],
	},

	startConditions: {
		resources: { fish: 250, timber: 200, salvage: 100 },
		units: [
			{
				unitType: "mudfoot",
				count: 6,
				faction: "ura",
				position: { x: 10, y: 19 },
			},
			{
				unitType: "shellcracker",
				count: 2,
				faction: "ura",
				position: { x: 7, y: 19 },
			},
			{
				unitType: "river-rat",
				count: 3,
				faction: "ura",
				position: { x: 12, y: 20 },
			},
		],
		buildings: [
			{
				buildingType: "command-post",
				faction: "ura",
				position: { x: 8, y: 19 },
			},
			{
				buildingType: "barracks",
				faction: "ura",
				position: { x: 5, y: 17 },
			},
			{
				buildingType: "armory",
				faction: "ura",
				position: { x: 5, y: 21 },
			},
			{
				buildingType: "burrow",
				faction: "ura",
				position: { x: 10, y: 17 },
			},
			{
				buildingType: "burrow",
				faction: "ura",
				position: { x: 10, y: 21 },
			},
		],
		populationCap: 20,
	},

	objectives: [
		{
			id: "return-crates",
			description: "Return 5 supply crates to the base",
			type: "primary",
			status: "active",
		},
		{
			id: "build-dock",
			description: "Build a Dock",
			type: "bonus",
			status: "active",
		},
	],

	triggers: [
		// --- Mission start ---
		{
			id: "mission-start",
			condition: { type: "timer", time: 3 },
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Five crates scattered across the east bank. Each one needs to be picked up and physically carried back to our base delivery zone. North and south bridges are your main crossing points.",
				duration: 8,
			},
			once: true,
		},

		// --- Dock hint ---
		{
			id: "dock-hint",
			condition: { type: "timer", time: 120 },
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Consider building a Dock at the riverbank. Raftsmen can cross the water directly — no bridge needed. It'll give you more approach angles.",
				duration: 6,
			},
			once: true,
		},

		// --- Dock built (bonus) ---
		{
			id: "dock-built",
			condition: {
				type: "unitCount",
				faction: "ura",
				unitType: "dock",
				operator: "gte",
				count: 1,
			},
			action: [
				{ type: "completeObjective", objectiveId: "build-dock" },
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Dock constructed. You can now train Raftsmen to cross the river freely. Smart move.",
					duration: 5,
				},
			],
			once: true,
		},

		// --- North bridge approach ---
		{
			id: "north-bridge-approach",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 22, y: 8, width: 6, height: 4 },
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "North bridge ahead. Expect resistance on the other side. The mangrove islands provide cover if you need to pull back.",
				duration: 5,
			},
			once: true,
		},

		// --- South bridge approach ---
		{
			id: "south-bridge-approach",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 22, y: 27, width: 6, height: 4 },
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "South bridge crossing. Tall grass on the far side — could be an ambush. Push through carefully.",
				duration: 5,
			},
			once: true,
		},

		// --- Entering enemy territory ---
		{
			id: "east-territory-entered",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 35, y: 0, width: 20, height: 40 },
			},
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "You're across the river and in enemy territory. Crates are scattered around — find them and carry them back. Watch for patrols.",
					duration: 6,
				},
				{ type: "playSFX", sfx: "unitSelect" },
			],
			once: true,
		},

		// --- Enemy reinforcements at 5 min ---
		{
			id: "enemy-reinforcements-1",
			condition: { type: "timer", time: 300 },
			action: {
				type: "spawnReinforcements",
				faction: "scale-guard",
				units: [
					{
						unitType: "gator",
						count: 3,
						position: { x: 44, y: 19 },
					},
					{
						unitType: "scout-lizard",
						count: 2,
						position: { x: 44, y: 20 },
					},
				],
			},
			once: true,
		},

		// --- Enemy reinforcements at 10 min ---
		{
			id: "enemy-reinforcements-2",
			condition: { type: "timer", time: 600 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "More Scale-Guard reinforcements arriving on the east side. They're defending those crates aggressively.",
					duration: 4,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{
							unitType: "gator",
							count: 4,
							position: { x: 44, y: 10 },
						},
						{
							unitType: "viper",
							count: 2,
							position: { x: 44, y: 28 },
						},
						{
							unitType: "snapper",
							count: 2,
							position: { x: 44, y: 19 },
						},
					],
				},
			],
			once: true,
		},

		// --- Crate delivery tracking ---
		// The crate delivery mechanic uses areaEntered with the base delivery zone.
		// Each crate pickup/delivery is tracked by the game logic layer.
		// The scenario engine checks unit count of delivered crates.
		{
			id: "first-crate-delivered",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 4, y: 16, width: 10, height: 8 },
				unitType: "supply-crate-carrier",
				minUnits: 1,
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "First crate delivered! Four more to go. Keep the supply line running.",
				duration: 4,
			},
			once: true,
		},

		// --- Crate progress at 3 delivered ---
		{
			id: "three-crates-delivered",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 4, y: 16, width: 10, height: 8 },
				unitType: "supply-crate-carrier",
				minUnits: 3,
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Three crates secured! Two left — push through, Sergeant.",
				duration: 4,
			},
			once: true,
		},

		// --- All 5 crates delivered ---
		{
			id: "all-crates-delivered",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 4, y: 16, width: 10, height: 8 },
				unitType: "supply-crate-carrier",
				minUnits: 5,
			},
			action: { type: "completeObjective", objectiveId: "return-crates" },
			once: true,
		},

		// --- Mission complete ---
		{
			id: "mission-complete",
			condition: { type: "allObjectivesComplete" },
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "All five crates recovered. Scale-Guard's supply chain is broken on this front. The Raftsmen and Docks will serve us well in future operations.",
				duration: 0,
			},
			once: true,
		},
	],

	unitUnlocks: ["raftsman"],
	buildingUnlocks: ["dock"],
};
