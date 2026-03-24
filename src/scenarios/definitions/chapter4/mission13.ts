/**
 * Mission 13: Supply Lines — Logistics / Multi-base
 *
 * Three base locations connected by supply roads.
 * South base is the "returning base" from Mission 11 (Entrenchment).
 * Establish two additional bases and maintain supply caravans.
 * Teaches: multi-base management, supply caravans, logistics.
 * Win: Establish all 3 bases and hold supply lines for 5 minutes.
 */

import type { Scenario } from "../../types";

export const mission13SupplyLines: Scenario = {
	id: "mission-13-supply-lines",
	chapter: 4,
	mission: 13,
	name: "Supply Lines",

	briefing: {
		title: "Operation Supply Lines",
		lines: [
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Welcome back to your entrenched position, Sergeant. Whatever you built in Mission 11 — it's still here. Every wall, every tower. Your forward operating base.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "We need to establish a logistics network for the final push. Two additional base sites have been identified — one to the west, one northeast. Build Secondary Command Posts at both.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Once all three bases are operational, supply caravans will run between them automatically. But the roads are vulnerable — Scale-Guard ambush parties are operating in the area.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Establish the network and keep the supply lines running for 5 minutes. Protect those caravans. The final campaign depends on this logistics chain.",
			},
		],
		objectives: [
			{
				description: "Build Secondary Command Post at west site",
				type: "primary",
			},
			{
				description: "Build Secondary Command Post at NE site",
				type: "primary",
			},
			{
				description: "Maintain supply lines for 5 minutes",
				type: "primary",
			},
			{
				description: "Don't lose any supply caravans",
				type: "bonus",
			},
		],
	},

	startConditions: {
		resources: { fish: 400, timber: 300, salvage: 200 },
		units: [
			{
				unitType: "mudfoot",
				count: 5,
				faction: "ura",
				position: { x: 27, y: 42 },
			},
			{
				unitType: "shellcracker",
				count: 2,
				faction: "ura",
				position: { x: 25, y: 42 },
			},
			{
				unitType: "river-rat",
				count: 2,
				faction: "ura",
				position: { x: 27, y: 44 },
			},
		],
		buildings: [
			{
				buildingType: "command-post",
				faction: "ura",
				position: { x: 27, y: 42 },
				tag: "south-cp",
			},
			{
				buildingType: "barracks",
				faction: "ura",
				position: { x: 24, y: 40 },
			},
			{
				buildingType: "armory",
				faction: "ura",
				position: { x: 30, y: 40 },
			},
		],
		populationCap: 24,
	},

	objectives: [
		{
			id: "build-west-cp",
			description: "Build Secondary Command Post at west site",
			type: "primary",
			status: "active",
		},
		{
			id: "build-ne-cp",
			description: "Build Secondary Command Post at NE site",
			type: "primary",
			status: "active",
		},
		{
			id: "hold-supply-lines",
			description: "Maintain supply lines for 5 minutes",
			type: "primary",
			status: "pending",
		},
		{
			id: "no-caravan-losses",
			description: "Don't lose any supply caravans",
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
				text: "Your entrenched base is intact. Send scouts to the west and northeast base sites. Build Secondary Command Posts at both locations to activate the supply network.",
				duration: 8,
			},
			once: true,
		},

		// --- West base site reached ---
		{
			id: "west-site-found",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 4, y: 16, width: 12, height: 8 },
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "West base site located. Build a Secondary Command Post here. Resources are available nearby — fish to the south, timber to the north.",
				duration: 5,
			},
			once: true,
		},

		// --- NE base site reached ---
		{
			id: "ne-site-found",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 35, y: 1, width: 12, height: 8 },
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Northeast base site confirmed. Establish a Secondary Command Post. Watch for patrols on the northern road.",
				duration: 5,
			},
			once: true,
		},

		// --- West CP built ---
		{
			id: "west-cp-built",
			condition: {
				type: "unitCount",
				faction: "ura",
				unitType: "secondary-command-post",
				operator: "gte",
				count: 1,
			},
			action: [
				{ type: "completeObjective", objectiveId: "build-west-cp" },
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "West base operational! One more to go.",
					duration: 4,
				},
			],
			once: true,
		},

		// --- NE CP built ---
		{
			id: "ne-cp-built",
			condition: {
				type: "unitCount",
				faction: "ura",
				unitType: "secondary-command-post",
				operator: "gte",
				count: 2,
			},
			action: [
				{ type: "completeObjective", objectiveId: "build-ne-cp" },
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "All three bases active! Supply caravans are rolling. Keep the roads clear for 5 minutes!",
					duration: 5,
				},
			],
			once: true,
		},

		// --- Ambush wave 1 (2 min after both bases) ---
		{
			id: "ambush-1",
			condition: { type: "timer", time: 480 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Ambush on the southern road! Protect the caravan!",
					duration: 3,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{
							unitType: "gator",
							count: 4,
							position: { x: 10, y: 32 },
						},
						{
							unitType: "scout-lizard",
							count: 2,
							position: { x: 12, y: 32 },
						},
					],
				},
			],
			once: true,
		},

		// --- Ambush wave 2 ---
		{
			id: "ambush-2",
			condition: { type: "timer", time: 600 },
			action: {
				type: "spawnReinforcements",
				faction: "scale-guard",
				units: [
					{
						unitType: "gator",
						count: 3,
						position: { x: 35, y: 12 },
					},
					{
						unitType: "viper",
						count: 2,
						position: { x: 37, y: 12 },
					},
				],
			},
			once: true,
		},

		// --- Ambush wave 3 ---
		{
			id: "ambush-3",
			condition: { type: "timer", time: 720 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Another attack! They're targeting the road junction!",
					duration: 3,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{
							unitType: "gator",
							count: 4,
							position: { x: 25, y: 15 },
						},
						{
							unitType: "snapper",
							count: 2,
							position: { x: 20, y: 20 },
						},
						{
							unitType: "viper",
							count: 2,
							position: { x: 30, y: 25 },
						},
					],
				},
			],
			once: true,
		},

		// --- Supply lines held (5 min after both bases = ~15 min total) ---
		{
			id: "supply-lines-held",
			condition: { type: "timer", time: 900 },
			action: [
				{
					type: "completeObjective",
					objectiveId: "hold-supply-lines",
				},
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Supply network is established and running! The logistics chain is secure.",
					duration: 5,
				},
			],
			once: true,
		},

		// --- South CP destroyed = fail ---
		{
			id: "south-cp-destroyed",
			condition: {
				type: "buildingDestroyed",
				buildingTag: "south-cp",
			},
			action: {
				type: "failMission",
				reason: "Main Command Post destroyed. Supply network collapsed.",
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
				text: "Supply lines secure. Three bases feeding the war effort. We're ready for the final push, Sergeant. The Great Siphon awaits.",
				duration: 0,
			},
			once: true,
		},
	],

	unitUnlocks: [],
	buildingUnlocks: ["secondary-command-post"],
};
