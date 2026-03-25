/**
 * Mission 11: Entrenchment — Heavy Defense
 *
 * Build from scratch. 12 escalating waves from all directions.
 * Teaches: Stone Walls, Gun Towers, Minefields.
 * BASE STATE IS SAVED after mission completion — reused in Mission 13.
 * Win: Survive 12 waves, keep Command Post alive.
 */

import type { Scenario } from "../../types";

export const mission11Entrenchment: Scenario = {
	id: "mission-11-entrenchment",
	chapter: 3,
	mission: 11,
	name: "Entrenchment",

	briefing: {
		title: "Operation Entrenchment",
		lines: [
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "This is the big one, Bubbles. Scale-Guard knows we're here and they're throwing everything at us. Twelve waves. You start with nothing but open ground and your squad.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Build fast. Command Post first, then defenses. New tech available: Stone Walls are tougher than sandbags. Gun Towers hit harder than Watchtowers. Minefields stop charges cold.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Four roads, two from the north, two from the south. East-west roads cross the flanks. Waves will come from multiple directions — you can't cover everything. Choose your chokepoints.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "One more thing: whatever you build here, you'll see again. This base carries forward. Build it well — your future self will thank you.",
			},
		],
		objectives: [
			{ description: "Build a Command Post", type: "primary" },
			{ description: "Survive all 12 waves", type: "primary" },
			{
				description: "Keep Command Post above 75% HP",
				type: "bonus",
			},
		],
	},

	startConditions: {
		resources: { fish: 400, timber: 300, salvage: 200 },
		units: [
			{
				unitType: "river-rat",
				count: 5,
				faction: "ura",
				position: { x: 25, y: 22 },
			},
			{
				unitType: "mudfoot",
				count: 4,
				faction: "ura",
				position: { x: 25, y: 21 },
			},
			{
				unitType: "shellcracker",
				count: 2,
				faction: "ura",
				position: { x: 25, y: 20 },
			},
			{
				unitType: "mortar-otter",
				count: 1,
				faction: "ura",
				position: { x: 25, y: 20 },
			},
		],
		buildings: [],
		populationCap: 24,
	},

	objectives: [
		{
			id: "build-cp",
			description: "Build a Command Post",
			type: "primary",
			status: "active",
		},
		{
			id: "survive-waves",
			description: "Survive all 12 waves",
			type: "primary",
			status: "active",
		},
		{
			id: "cp-health-bonus",
			description: "Keep Command Post above 75% HP",
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
				text: "Get that Command Post down immediately. Then walls, towers, production. First wave hits in 3 minutes. Move it, Sergeant!",
				duration: 8,
			},
			once: true,
		},

		// --- CP built ---
		{
			id: "cp-built",
			condition: {
				type: "unitCount",
				faction: "ura",
				unitType: "command-post",
				operator: "gte",
				count: 1,
			},
			action: [
				{ type: "completeObjective", objectiveId: "build-cp" },
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Command Post up. Now build Stone Walls at the chokepoints and Gun Towers behind them. Minefields on the roads. Every second counts.",
					duration: 6,
				},
			],
			once: true,
		},

		// --- Wave 1 (3:00) ---
		{
			id: "wave-1",
			condition: { type: "timer", time: 180 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Wave 1 — scouts from the northwest!",
					duration: 3,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{ unitType: "scout-lizard", count: 4, position: { x: 3, y: 1 } },
						{ unitType: "gator", count: 2, position: { x: 3, y: 2 } },
					],
				},
			],
			once: true,
		},

		// --- Wave 2 (4:30) ---
		{
			id: "wave-2",
			condition: { type: "timer", time: 270 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Wave 2 — southeast road!",
					duration: 3,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{ unitType: "gator", count: 4, position: { x: 36, y: 43 } },
						{ unitType: "scout-lizard", count: 2, position: { x: 37, y: 43 } },
					],
				},
			],
			once: true,
		},

		// --- Wave 3 (6:00) ---
		{
			id: "wave-3",
			condition: { type: "timer", time: 360 },
			action: {
				type: "spawnReinforcements",
				faction: "scale-guard",
				units: [
					{ unitType: "gator", count: 3, position: { x: 0, y: 9 } },
					{ unitType: "gator", count: 3, position: { x: 50, y: 9 } },
				],
			},
			once: true,
		},

		// --- Wave 4 (7:30) ---
		{
			id: "wave-4",
			condition: { type: "timer", time: 450 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Wave 4 — they're hitting the south roads hard!",
					duration: 3,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{ unitType: "gator", count: 4, position: { x: 3, y: 43 } },
						{ unitType: "viper", count: 2, position: { x: 36, y: 43 } },
						{ unitType: "gator", count: 2, position: { x: 0, y: 37 } },
					],
				},
			],
			once: true,
		},

		// --- Wave 5 (9:00) ---
		{
			id: "wave-5",
			condition: { type: "timer", time: 540 },
			action: {
				type: "spawnReinforcements",
				faction: "scale-guard",
				units: [
					{ unitType: "gator", count: 3, position: { x: 3, y: 1 } },
					{ unitType: "gator", count: 3, position: { x: 36, y: 1 } },
					{ unitType: "viper", count: 2, position: { x: 0, y: 9 } },
				],
			},
			once: true,
		},

		// --- Wave 6 (10:30) ---
		{
			id: "wave-6",
			condition: { type: "timer", time: 630 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Halfway there! Six waves down, six to go. They're getting heavier — reinforce your weakest flank!",
					duration: 4,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{ unitType: "gator", count: 3, position: { x: 50, y: 37 } },
						{ unitType: "snapper", count: 2, position: { x: 50, y: 9 } },
						{ unitType: "viper", count: 2, position: { x: 3, y: 43 } },
					],
				},
			],
			once: true,
		},

		// --- Wave 7 (12:00) ---
		{
			id: "wave-7",
			condition: { type: "timer", time: 720 },
			action: {
				type: "spawnReinforcements",
				faction: "scale-guard",
				units: [
					{ unitType: "gator", count: 4, position: { x: 3, y: 1 } },
					{ unitType: "gator", count: 4, position: { x: 36, y: 43 } },
					{ unitType: "snapper", count: 2, position: { x: 0, y: 9 } },
				],
			},
			once: true,
		},

		// --- Wave 8 (13:30) ---
		{
			id: "wave-8",
			condition: { type: "timer", time: 810 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Wave 8 — Snappers are breaching walls! Get Shellcrackers to the breach points!",
					duration: 3,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{ unitType: "snapper", count: 3, position: { x: 3, y: 1 } },
						{ unitType: "snapper", count: 3, position: { x: 36, y: 43 } },
						{ unitType: "gator", count: 4, position: { x: 50, y: 37 } },
					],
				},
			],
			once: true,
		},

		// --- Wave 9 (15:00) ---
		{
			id: "wave-9",
			condition: { type: "timer", time: 900 },
			action: {
				type: "spawnReinforcements",
				faction: "scale-guard",
				units: [
					{ unitType: "gator", count: 3, position: { x: 0, y: 9 } },
					{ unitType: "gator", count: 3, position: { x: 50, y: 9 } },
					{ unitType: "viper", count: 3, position: { x: 0, y: 37 } },
					{ unitType: "viper", count: 3, position: { x: 50, y: 37 } },
				],
			},
			once: true,
		},

		// --- Wave 10 (16:30) ---
		{
			id: "wave-10",
			condition: { type: "timer", time: 990 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Wave 10! Two more after this! All four roads are active!",
					duration: 3,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{ unitType: "gator", count: 4, position: { x: 3, y: 1 } },
						{ unitType: "gator", count: 4, position: { x: 36, y: 1 } },
						{ unitType: "snapper", count: 2, position: { x: 3, y: 43 } },
						{ unitType: "snapper", count: 2, position: { x: 36, y: 43 } },
					],
				},
			],
			once: true,
		},

		// --- Wave 11 (18:00) ---
		{
			id: "wave-11",
			condition: { type: "timer", time: 1080 },
			action: {
				type: "spawnReinforcements",
				faction: "scale-guard",
				units: [
					{ unitType: "gator", count: 4, position: { x: 0, y: 9 } },
					{ unitType: "viper", count: 3, position: { x: 50, y: 9 } },
					{ unitType: "snapper", count: 3, position: { x: 0, y: 37 } },
					{ unitType: "gator", count: 4, position: { x: 50, y: 37 } },
				],
			},
			once: true,
		},

		// --- Wave 12 (19:30) — FINAL ---
		{
			id: "wave-12",
			condition: { type: "timer", time: 1170 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "FINAL WAVE! Everything they have — all roads! This is it, Sergeant! HOLD!",
					duration: 4,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{ unitType: "gator", count: 5, position: { x: 3, y: 1 } },
						{ unitType: "gator", count: 5, position: { x: 36, y: 1 } },
						{ unitType: "snapper", count: 3, position: { x: 3, y: 43 } },
						{ unitType: "snapper", count: 3, position: { x: 36, y: 43 } },
						{ unitType: "viper", count: 3, position: { x: 0, y: 9 } },
						{ unitType: "viper", count: 3, position: { x: 50, y: 9 } },
					],
				},
			],
			once: true,
		},

		// --- Waves cleared (22 min) ---
		{
			id: "waves-cleared",
			condition: { type: "timer", time: 1320 },
			action: [
				{ type: "completeObjective", objectiveId: "survive-waves" },
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "All 12 waves repelled! The base held. This position is entrenched. Remember it well — you'll be back here.",
					duration: 6,
				},
			],
			once: true,
		},

		// --- CP health bonus check ---
		{
			id: "cp-health-warning",
			condition: {
				type: "healthThreshold",
				entityTag: "ura-command-post",
				percentage: 75,
				operator: "below",
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Command Post health dropping! Health bonus lost — just keep it standing!",
				duration: 4,
			},
			once: true,
		},

		// --- CP destroyed = fail ---
		{
			id: "cp-destroyed",
			condition: {
				type: "buildingDestroyed",
				buildingTag: "ura-command-post",
			},
			action: {
				type: "failMission",
				reason: "Command Post destroyed. The position is lost.",
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
				text: "Entrenched and holding. This base is now a permanent forward operating position. Whatever you built here carries forward, Sergeant. Chapter 3 continues.",
				duration: 0,
			},
			once: true,
		},
	],

	unitUnlocks: [],
	buildingUnlocks: ["stone-wall", "gun-tower", "minefield"],
};
