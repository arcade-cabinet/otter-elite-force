/**
 * Mission 6: Monsoon Ambush — Survival / Timed
 *
 * Player has a pre-built base in the center of an open field.
 * 8 waves of Scale-Guard attack from all directions across 3 monsoon cycles.
 * Weather cycles: clear → rain → monsoon → clear, each changing terrain.
 * Teaches: defensive strategy, weather adaptation, Watchtower placement.
 * Win: Survive all 8 waves. Bonus: Command Post above 50% HP.
 */

import type { Scenario } from "../../types";

export const mission06MonsoonAmbush: Scenario = {
	id: "mission-06-monsoon-ambush",
	chapter: 2,
	mission: 6,
	name: "Monsoon Ambush",

	briefing: {
		title: "Operation Monsoon Ambush",
		lines: [
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Intel says Scale-Guard is massing for a full assault on our forward operating base. Monsoon season is rolling in — rain hits in 3 minutes, and it's going to get worse.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Your base is pre-built: Command Post, two Barracks, Armory, four Watchtowers, and sandbag walls. Garrison is already in position. Use what you've got.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Eight waves are coming from all four approach roads. Mud patches will slow everyone during the rain — use that to your advantage. Position Shellcrackers at the chokepoints.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Survive all 8 waves and keep your Command Post standing. If it falls, we lose the Reach. Dig in, Sergeant.",
			},
		],
		objectives: [
			{ description: "Survive all 8 waves", type: "primary" },
			{
				description: "Keep Command Post above 50% HP",
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
				position: { x: 24, y: 18 },
			},
			{
				unitType: "shellcracker",
				count: 4,
				faction: "ura",
				position: { x: 24, y: 20 },
			},
			{
				unitType: "river-rat",
				count: 2,
				faction: "ura",
				position: { x: 23, y: 20 },
			},
		],
		buildings: [
			{
				buildingType: "command-post",
				faction: "ura",
				position: { x: 24, y: 19 },
				tag: "ura-command-post",
			},
			{
				buildingType: "barracks",
				faction: "ura",
				position: { x: 21, y: 17 },
			},
			{
				buildingType: "barracks",
				faction: "ura",
				position: { x: 27, y: 17 },
			},
			{
				buildingType: "armory",
				faction: "ura",
				position: { x: 24, y: 16 },
			},
			{
				buildingType: "watchtower",
				faction: "ura",
				position: { x: 18, y: 15 },
			},
			{
				buildingType: "watchtower",
				faction: "ura",
				position: { x: 30, y: 15 },
			},
			{
				buildingType: "watchtower",
				faction: "ura",
				position: { x: 18, y: 23 },
			},
			{
				buildingType: "watchtower",
				faction: "ura",
				position: { x: 30, y: 23 },
			},
		],
		populationCap: 16,
	},

	weather: "clear",

	objectives: [
		{
			id: "survive-all-waves",
			description: "Survive all 8 waves",
			type: "primary",
			status: "active",
		},
		{
			id: "cp-health-bonus",
			description: "Keep Command Post above 50% HP",
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
				text: "Position your forces at the approach roads. Mud patches slow movement during rain — bait enemies through them. First wave incoming soon.",
				duration: 8,
			},
			once: true,
		},

		// --- Weather cycle 1: Rain at 3 min ---
		{
			id: "weather-rain-1",
			condition: { type: "timer", time: 180 },
			action: [
				{ type: "changeWeather", weather: "rain", transitionTime: 10 },
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Rain starting. Mud patches are slowing ground movement. Use it — position ranged units behind the mud.",
					duration: 5,
				},
			],
			once: true,
		},

		// --- Wave 1 (1:30) — Light probe from NW ---
		{
			id: "wave-1",
			condition: { type: "timer", time: 90 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Wave 1 — scouts from the northwest road!",
					duration: 3,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{
							unitType: "scout-lizard",
							count: 3,
							position: { x: 4, y: 1 },
						},
						{
							unitType: "gator",
							count: 2,
							position: { x: 4, y: 2 },
						},
					],
				},
			],
			once: true,
		},

		// --- Wave 2 (3:30) — SE approach ---
		{
			id: "wave-2",
			condition: { type: "timer", time: 210 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Wave 2 — southeast road. They're using the rain for cover!",
					duration: 3,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{
							unitType: "gator",
							count: 4,
							position: { x: 34, y: 37 },
						},
						{
							unitType: "scout-lizard",
							count: 2,
							position: { x: 35, y: 37 },
						},
					],
				},
			],
			once: true,
		},

		// --- Wave 3 (5:00) — Both north roads ---
		{
			id: "wave-3",
			condition: { type: "timer", time: 300 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Wave 3 — pincer from both north roads!",
					duration: 3,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{
							unitType: "gator",
							count: 3,
							position: { x: 4, y: 1 },
						},
						{
							unitType: "gator",
							count: 3,
							position: { x: 34, y: 1 },
						},
						{
							unitType: "viper",
							count: 2,
							position: { x: 4, y: 2 },
						},
					],
				},
			],
			once: true,
		},

		// --- Weather cycle 2: Monsoon at 6 min ---
		{
			id: "weather-monsoon",
			condition: { type: "timer", time: 360 },
			action: [
				{
					type: "changeWeather",
					weather: "monsoon",
					transitionTime: 15,
				},
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Full monsoon hitting! Visibility dropping, mud everywhere. Hold your positions — this is the worst of it.",
					duration: 5,
				},
			],
			once: true,
		},

		// --- Wave 4 (7:00) — SW heavy push ---
		{
			id: "wave-4",
			condition: { type: "timer", time: 420 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Wave 4 — heavy column from the southwest!",
					duration: 3,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{
							unitType: "gator",
							count: 4,
							position: { x: 4, y: 37 },
						},
						{
							unitType: "snapper",
							count: 2,
							position: { x: 5, y: 37 },
						},
						{
							unitType: "viper",
							count: 2,
							position: { x: 4, y: 38 },
						},
					],
				},
			],
			once: true,
		},

		// --- Wave 5 (9:00) — All four roads ---
		{
			id: "wave-5",
			condition: { type: "timer", time: 540 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Wave 5 — they're coming from everywhere! All roads!",
					duration: 3,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{
							unitType: "gator",
							count: 2,
							position: { x: 4, y: 1 },
						},
						{
							unitType: "gator",
							count: 2,
							position: { x: 34, y: 1 },
						},
						{
							unitType: "gator",
							count: 2,
							position: { x: 4, y: 37 },
						},
						{
							unitType: "gator",
							count: 2,
							position: { x: 34, y: 37 },
						},
					],
				},
			],
			once: true,
		},

		// --- Weather cycle 3: Clear at 10 min ---
		{
			id: "weather-clear",
			condition: { type: "timer", time: 600 },
			action: [
				{ type: "changeWeather", weather: "clear", transitionTime: 10 },
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Monsoon's breaking. Visibility restoring. Three more waves — stay focused.",
					duration: 5,
				},
			],
			once: true,
		},

		// --- Wave 6 (11:00) — Vipers and Snappers ---
		{
			id: "wave-6",
			condition: { type: "timer", time: 660 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Wave 6 — elite units. Vipers and Snappers from the east-west roads.",
					duration: 3,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{
							unitType: "viper",
							count: 3,
							position: { x: 0, y: 13 },
						},
						{
							unitType: "snapper",
							count: 2,
							position: { x: 46, y: 13 },
						},
						{
							unitType: "viper",
							count: 2,
							position: { x: 46, y: 25 },
						},
					],
				},
			],
			once: true,
		},

		// --- Wave 7 (13:00) — Rain returns, massive push ---
		{
			id: "weather-rain-2",
			condition: { type: "timer", time: 770 },
			action: {
				type: "changeWeather",
				weather: "rain",
				transitionTime: 10,
			},
			once: true,
		},
		{
			id: "wave-7",
			condition: { type: "timer", time: 780 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Wave 7 — the rain's back and so is the assault! All quadrants under attack!",
					duration: 3,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{
							unitType: "gator",
							count: 3,
							position: { x: 4, y: 1 },
						},
						{
							unitType: "gator",
							count: 3,
							position: { x: 34, y: 37 },
						},
						{
							unitType: "viper",
							count: 2,
							position: { x: 34, y: 1 },
						},
						{
							unitType: "snapper",
							count: 2,
							position: { x: 4, y: 37 },
						},
					],
				},
			],
			once: true,
		},

		// --- Wave 8 (15:00) — Final wave ---
		{
			id: "wave-8",
			condition: { type: "timer", time: 900 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "FINAL WAVE! Everything they've got — all four roads! Hold that line, Sergeant!",
					duration: 4,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{
							unitType: "gator",
							count: 4,
							position: { x: 4, y: 1 },
						},
						{
							unitType: "gator",
							count: 4,
							position: { x: 34, y: 37 },
						},
						{
							unitType: "viper",
							count: 3,
							position: { x: 34, y: 1 },
						},
						{
							unitType: "snapper",
							count: 3,
							position: { x: 4, y: 37 },
						},
						{
							unitType: "viper",
							count: 2,
							position: { x: 0, y: 13 },
						},
						{
							unitType: "snapper",
							count: 2,
							position: { x: 46, y: 25 },
						},
					],
				},
			],
			once: true,
		},

		// --- All waves cleared (17 min — time for final wave to resolve) ---
		{
			id: "waves-cleared",
			condition: { type: "timer", time: 1020 },
			action: [
				{ type: "completeObjective", objectiveId: "survive-all-waves" },
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "All waves repelled. The base held. Outstanding defense, Sergeant.",
					duration: 5,
				},
				{ type: "changeWeather", weather: "clear", transitionTime: 5 },
			],
			once: true,
		},

		// --- Command Post health check (bonus fail) ---
		{
			id: "cp-health-critical",
			condition: {
				type: "healthThreshold",
				entityTag: "ura-command-post",
				percentage: 50,
				operator: "below",
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Command Post is taking heavy damage! We've lost the health bonus — just keep it standing!",
				duration: 4,
			},
			once: true,
		},

		// --- Command Post destroyed = fail ---
		{
			id: "cp-destroyed",
			condition: {
				type: "buildingDestroyed",
				buildingTag: "ura-command-post",
			},
			action: {
				type: "failMission",
				reason: "Command Post destroyed. The base is lost.",
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
				text: "The monsoon assault failed. Scale-Guard is retreating. This position is ours. Chapter 2 continues.",
				duration: 0,
			},
			once: true,
		},
	],

	unitUnlocks: [],
	buildingUnlocks: [],
};
