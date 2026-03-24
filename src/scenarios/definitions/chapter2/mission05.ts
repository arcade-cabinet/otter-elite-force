/**
 * Mission 5: Siphon Valley — Base Build + Destroy
 *
 * Player starts at the south with full base-building capability.
 * Three siphons are spread across the map: west, center-north, east.
 * Toxic sludge radiates from each active siphon.
 * Teaches: full base economy, offensive operations, Sapper + Armory unlock.
 * Win: Destroy all 3 siphons.
 */

import type { Scenario } from "../../types";

export const mission05SiphonValley: Scenario = {
	id: "mission-05-siphon-valley",
	chapter: 2,
	mission: 5,
	name: "Siphon Valley",

	briefing: {
		title: "Operation Siphon Valley",
		lines: [
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Listen up. Scale-Guard has deployed three siphon installations along the river valley. They're pumping toxic sludge into the waterways — killing everything downstream.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "You'll establish a forward base at the southern end of the valley. Full resource access — fish, timber, and salvage. Build up, then push north.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Three targets: Siphon West at the river bend, Siphon Central north of the bridges, and Siphon East near the mangrove coast. Each one is guarded.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "New gear from the Armory: Sappers are combat engineers with demolition charges. They'll crack those siphon casings. Get it done, Sergeant.",
			},
		],
		objectives: [
			{ description: "Destroy Siphon West", type: "primary" },
			{ description: "Destroy Siphon Central", type: "primary" },
			{ description: "Destroy Siphon East", type: "primary" },
			{
				description: "Destroy all 3 siphons within 20 minutes",
				type: "bonus",
			},
		],
	},

	startConditions: {
		resources: { fish: 200, timber: 150, salvage: 50 },
		units: [
			{
				unitType: "river-rat",
				count: 4,
				faction: "ura",
				position: { x: 27, y: 42 },
			},
			{
				unitType: "mudfoot",
				count: 4,
				faction: "ura",
				position: { x: 27, y: 41 },
			},
			{
				unitType: "shellcracker",
				count: 2,
				faction: "ura",
				position: { x: 27, y: 40 },
			},
		],
		buildings: [],
		populationCap: 20,
	},

	objectives: [
		{
			id: "destroy-siphon-west",
			description: "Destroy Siphon West",
			type: "primary",
			status: "active",
		},
		{
			id: "destroy-siphon-central",
			description: "Destroy Siphon Central",
			type: "primary",
			status: "active",
		},
		{
			id: "destroy-siphon-east",
			description: "Destroy Siphon East",
			type: "primary",
			status: "active",
		},
		{
			id: "speed-bonus",
			description: "Destroy all 3 siphons within 20 minutes",
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
				text: "Establish your base first. There's timber in the mangrove groves and fish in the river. Build an Armory to train Sappers — you'll need their charges.",
				duration: 8,
			},
			once: true,
		},

		// --- Build prompt at 2 minutes ---
		{
			id: "build-reminder",
			condition: { type: "timer", time: 120 },
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Get that Command Post up and start expanding. The siphons aren't going to destroy themselves.",
				duration: 5,
			},
			once: true,
		},

		// --- Siphon 1 (West) destroyed ---
		{
			id: "siphon-west-destroyed",
			condition: {
				type: "buildingDestroyed",
				buildingTag: "siphon-1",
			},
			action: [
				{ type: "completeObjective", objectiveId: "destroy-siphon-west" },
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Siphon West is down! The western waterway is clearing. Two more to go.",
					duration: 5,
				},
				{ type: "playSFX", sfx: "buildComplete" },
			],
			once: true,
		},

		// --- Siphon 2 (Central) destroyed ---
		{
			id: "siphon-central-destroyed",
			condition: {
				type: "buildingDestroyed",
				buildingTag: "siphon-2",
			},
			action: [
				{
					type: "completeObjective",
					objectiveId: "destroy-siphon-central",
				},
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Central siphon neutralized. That was the most fortified position — well done.",
					duration: 5,
				},
				{ type: "playSFX", sfx: "buildComplete" },
			],
			once: true,
		},

		// --- Siphon 3 (East) destroyed ---
		{
			id: "siphon-east-destroyed",
			condition: {
				type: "buildingDestroyed",
				buildingTag: "siphon-3",
			},
			action: [
				{ type: "completeObjective", objectiveId: "destroy-siphon-east" },
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Siphon East is gone. The river's running clean again.",
					duration: 5,
				},
				{ type: "playSFX", sfx: "buildComplete" },
			],
			once: true,
		},

		// --- Approaching first siphon ---
		{
			id: "approach-siphon-west",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 0, y: 10, width: 8, height: 8 },
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Siphon ahead. Watch for Gators and Snappers guarding the perimeter. Sappers should move in after you clear the guards.",
				duration: 6,
			},
			once: true,
		},

		// --- River crossing ---
		{
			id: "river-crossing-warning",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 10, y: 22, width: 6, height: 6 },
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Bridge crossing ahead. Siphon drones patrol this stretch — keep your forces tight and push through fast.",
				duration: 5,
			},
			once: true,
		},

		// --- Counterattack at 8 minutes ---
		{
			id: "counterattack-1",
			condition: { type: "timer", time: 480 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Incoming! Scale-Guard is sending a response force from the north. Defend your base!",
					duration: 4,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{ unitType: "gator", count: 4, position: { x: 27, y: 2 } },
						{
							unitType: "scout-lizard",
							count: 2,
							position: { x: 20, y: 2 },
						},
					],
				},
			],
			once: true,
		},

		// --- Second counterattack at 14 minutes ---
		{
			id: "counterattack-2",
			condition: { type: "timer", time: 840 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Another wave from Scale-Guard. They're throwing everything at you — hold the line.",
					duration: 4,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{ unitType: "gator", count: 3, position: { x: 5, y: 15 } },
						{ unitType: "viper", count: 2, position: { x: 50, y: 15 } },
						{
							unitType: "snapper",
							count: 2,
							position: { x: 27, y: 2 },
						},
					],
				},
			],
			once: true,
		},

		// --- Speed bonus fails at 20 min ---
		{
			id: "speed-bonus-timeout",
			condition: { type: "timer", time: 1200 },
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "We've passed the 20-minute mark. Speed bonus is off the table, but we still need those siphons down.",
				duration: 5,
			},
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
				text: "All three siphons are destroyed. The Copper-Silt Reach is breathing again. Outstanding work — you've earned the Armory and Sapper access for future operations.",
				duration: 0,
			},
			once: true,
		},
	],

	unitUnlocks: ["sapper"],
	buildingUnlocks: ["armory"],
};
