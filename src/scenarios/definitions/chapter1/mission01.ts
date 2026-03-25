/**
 * Mission 1: Beachhead — Tutorial / Build
 *
 * The URA deploys to the Copper-Silt Reach. Sgt. Bubbles leads the first wave.
 * Player starts with 3 River Rats and nothing built.
 * Teaches: resource gathering, building, training.
 * Win: Build Command Post + Barracks, train 4 Mudfoots.
 */

import type { Scenario } from "../../types";

export const mission01Beachhead: Scenario = {
	id: "mission-01-beachhead",
	chapter: 1,
	mission: 1,
	name: "Beachhead",

	briefing: {
		title: "Operation Beachhead",
		lines: [
			{
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Sgt. Bubbles, this is FOXHOUND. Welcome to the Copper-Silt Reach. Intelligence suggests minimal Scale-Guard presence at this landing site.",
			},
			{
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Your priority is establishing a forward operating base. Gather resources, construct a Command Post and Barracks, then get boots on the ground.",
			},
			{
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "You have three River Rats for labor. Fish from the river, timber from the mangroves, salvage from the wreckage to the northeast. Move it, Sergeant.",
			},
		],
		objectives: [
			{ description: "Build a Command Post", type: "primary" },
			{ description: "Build a Barracks", type: "primary" },
			{ description: "Train 4 Mudfoots", type: "primary" },
			{
				description: "Gather 50 salvage from the northeast cache",
				type: "bonus",
			},
		],
	},

	startConditions: {
		resources: { fish: 100, timber: 50, salvage: 0 },
		units: [
			{
				unitType: "river-rat",
				count: 3,
				faction: "ura",
				position: { x: 10, y: 38 },
			},
		],
		buildings: [],
		populationCap: 4,
	},

	objectives: [
		{
			id: "build-command-post",
			description: "Build a Command Post",
			type: "primary",
			status: "active",
		},
		{
			id: "build-barracks",
			description: "Build a Barracks",
			type: "primary",
			status: "active",
		},
		{
			id: "train-mudfoots",
			description: "Train 4 Mudfoots",
			type: "primary",
			status: "active",
		},
		{
			id: "gather-salvage",
			description: "Gather 50 salvage from the northeast cache",
			type: "bonus",
			status: "active",
		},
	],

	triggers: [
		// --- Tutorial prompts ---
		{
			id: "tutorial-welcome",
			condition: { type: "timer", time: 3 },
			action: {
				type: "showDialogue",
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Select your River Rats and right-click on the timber grove to start gathering. We need lumber for construction.",
				duration: 8,
			},
			once: true,
		},
		{
			id: "tutorial-build-hint",
			condition: { type: "timer", time: 60 },
			action: {
				type: "showDialogue",
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "You've got enough resources to start building. Select a River Rat and open the build menu to place a Command Post.",
				duration: 8,
			},
			once: true,
		},

		// --- Objective completion triggers ---
		{
			id: "command-post-built",
			condition: {
				type: "unitCount",
				faction: "ura",
				unitType: "command-post",
				operator: "gte",
				count: 1,
			},
			action: [
				{ type: "completeObjective", objectiveId: "build-command-post" },
				{
					type: "showDialogue",
					portrait: "foxhound",
					speaker: "FOXHOUND",
					text: "Command Post is up! Now build a Barracks — we need infantry.",
					duration: 5,
				},
			],
			once: true,
		},
		{
			id: "barracks-built",
			condition: {
				type: "unitCount",
				faction: "ura",
				unitType: "barracks",
				operator: "gte",
				count: 1,
			},
			action: [
				{ type: "completeObjective", objectiveId: "build-barracks" },
				{
					type: "showDialogue",
					portrait: "foxhound",
					speaker: "FOXHOUND",
					text: "Barracks operational. Start training Mudfoots — we need four for a patrol squad.",
					duration: 5,
				},
			],
			once: true,
		},
		{
			id: "mudfoots-trained",
			condition: {
				type: "unitCount",
				faction: "ura",
				unitType: "mudfoot",
				operator: "gte",
				count: 4,
			},
			action: { type: "completeObjective", objectiveId: "train-mudfoots" },
			once: true,
		},

		// --- Enemy scout at 5 minutes ---
		{
			id: "enemy-scout-arrival",
			condition: { type: "timer", time: 300 },
			action: [
				{
					type: "showDialogue",
					portrait: "foxhound",
					speaker: "FOXHOUND",
					text: "Heads up — Scale-Guard scouts spotted near your position. Stay sharp, Bubbles.",
					duration: 5,
				},
				{
					type: "spawnUnits",
					unitType: "scout-lizard",
					count: 2,
					faction: "scale_guard",
					position: { x: 25, y: 2 },
					tag: "enemy-scouts",
				},
			],
			once: true,
		},

		// --- Bonus objective: salvage cache ---
		{
			id: "salvage-area-entered",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 38, y: 6, width: 6, height: 6 },
			},
			action: {
				type: "showDialogue",
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Good find! That wreckage has usable salvage. Strip it clean.",
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
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Beachhead secured, Sergeant. The Copper-Silt Reach campaign begins. FOXHOUND out.",
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
