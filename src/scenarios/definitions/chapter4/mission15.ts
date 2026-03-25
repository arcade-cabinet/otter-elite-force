/**
 * Mission 15: Sacred Sludge — All-out War
 *
 * Largest map in the game. Full army vs full army.
 * Sludge flood timer creates urgency — toxic terrain spreads from
 * the north at 1 tile/10s. Destroy the enemy main base before
 * the sludge reaches your base.
 * Win: Destroy enemy Command Post before sludge reaches player base.
 */

import type { Scenario } from "../../types";

export const mission15SacredSludge: Scenario = {
	id: "mission-15-sacred-sludge",
	chapter: 4,
	mission: 15,
	name: "Sacred Sludge",

	briefing: {
		title: "Operation Sacred Sludge",
		lines: [
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "This is it, Bubbles. The penultimate battle. Scale-Guard's main field army is dug in across the river. Their base is in the north — heavily fortified.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "But there's a bigger problem. They've activated the sludge flood from the north. Toxic terrain is spreading south at a constant rate. If it reaches our base, we're finished.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Two bridges cross the river — west and east. Both will be contested. This is a race against the sludge. Build fast, cross fast, destroy their Command Post before it's too late.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Every unit, every building, every technique you've learned — use it all. This is all-out war.",
			},
		],
		objectives: [
			{
				description: "Destroy the enemy Command Post",
				type: "primary",
			},
			{
				description: "Survive — don't let sludge reach your Command Post",
				type: "primary",
			},
			{
				description: "Destroy both Spawning Pools",
				type: "bonus",
			},
		],
	},

	startConditions: {
		resources: { fish: 500, timber: 400, salvage: 300 },
		units: [
			{
				unitType: "mudfoot",
				count: 6,
				faction: "ura",
				position: { x: 35, y: 43 },
			},
			{
				unitType: "shellcracker",
				count: 2,
				faction: "ura",
				position: { x: 31, y: 44 },
			},
			{
				unitType: "mortar-otter",
				count: 2,
				faction: "ura",
				position: { x: 35, y: 45 },
			},
			{
				unitType: "sapper",
				count: 1,
				faction: "ura",
				position: { x: 35, y: 45 },
			},
		],
		buildings: [
			{
				buildingType: "command-post",
				faction: "ura",
				position: { x: 35, y: 44 },
				tag: "ura-main-cp",
			},
			{
				buildingType: "barracks",
				faction: "ura",
				position: { x: 30, y: 42 },
			},
			{
				buildingType: "barracks",
				faction: "ura",
				position: { x: 40, y: 42 },
			},
			{
				buildingType: "armory",
				faction: "ura",
				position: { x: 35, y: 41 },
			},
			{
				buildingType: "field-hospital",
				faction: "ura",
				position: { x: 35, y: 46 },
			},
		],
		populationCap: 28,
	},

	objectives: [
		{
			id: "destroy-enemy-cp",
			description: "Destroy the enemy Command Post",
			type: "primary",
			status: "active",
		},
		{
			id: "survive-sludge",
			description: "Survive — don't let sludge reach your Command Post",
			type: "primary",
			status: "active",
		},
		{
			id: "destroy-spawning-pools",
			description: "Destroy both Spawning Pools",
			type: "bonus",
			status: "active",
		},
	],

	triggers: [
		// --- Mission start ---
		{
			id: "mission-start",
			condition: { type: "timer", time: 3 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "The sludge is already spreading from the north. You have maybe 25 minutes before it reaches your position. Build up fast and cross that river!",
					duration: 8,
				},
				{
					type: "camera",
					target: { x: 35, y: 1 },
					duration: 3,
				},
			],
			once: true,
		},

		// --- Sludge progress warnings ---
		{
			id: "sludge-quarter",
			condition: { type: "timer", time: 360 },
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Sludge has consumed a quarter of the map. Clock's ticking, Sergeant.",
				duration: 4,
			},
			once: true,
		},
		{
			id: "sludge-half",
			condition: { type: "timer", time: 720 },
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Sludge at the halfway point. If you haven't crossed the river, you need to move NOW.",
				duration: 4,
			},
			once: true,
		},
		{
			id: "sludge-three-quarters",
			condition: { type: "timer", time: 1080 },
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Sludge is three quarters across! Your base is in danger! Destroy that Command Post!",
				duration: 4,
			},
			once: true,
		},

		// --- River crossing ---
		{
			id: "west-bridge-approach",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 18, y: 25, width: 6, height: 4 },
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "West bridge. Push through — expect heavy resistance on the other side.",
				duration: 4,
			},
			once: true,
		},

		// --- Enemy reinforcements ---
		{
			id: "enemy-reinforcements-1",
			condition: { type: "timer", time: 300 },
			action: {
				type: "spawnReinforcements",
				faction: "scale-guard",
				units: [
					{
						unitType: "gator",
						count: 4,
						position: { x: 35, y: 15 },
					},
					{
						unitType: "viper",
						count: 2,
						position: { x: 30, y: 15 },
					},
				],
			},
			once: true,
		},
		{
			id: "enemy-reinforcements-2",
			condition: { type: "timer", time: 600 },
			action: {
				type: "spawnReinforcements",
				faction: "scale-guard",
				units: [
					{
						unitType: "gator",
						count: 4,
						position: { x: 25, y: 12 },
					},
					{
						unitType: "snapper",
						count: 3,
						position: { x: 45, y: 12 },
					},
					{
						unitType: "viper",
						count: 2,
						position: { x: 35, y: 8 },
					},
				],
			},
			once: true,
		},
		{
			id: "enemy-reinforcements-3",
			condition: { type: "timer", time: 900 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Scale-Guard is throwing their reserves at you! This is their last stand!",
					duration: 3,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{
							unitType: "snapper",
							count: 4,
							position: { x: 35, y: 6 },
						},
						{
							unitType: "viper",
							count: 3,
							position: { x: 25, y: 10 },
						},
						{
							unitType: "gator",
							count: 4,
							position: { x: 45, y: 10 },
						},
					],
				},
			],
			once: true,
		},

		// --- Enemy CP destroyed ---
		{
			id: "enemy-cp-destroyed",
			condition: {
				type: "buildingDestroyed",
				buildingTag: "sg-main-cp",
			},
			action: [
				{
					type: "completeObjective",
					objectiveId: "destroy-enemy-cp",
				},
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "ENEMY COMMAND POST DESTROYED! Their field army is finished!",
					duration: 5,
				},
				{ type: "playSFX", sfx: "buildComplete" },
			],
			once: true,
		},

		// --- Sludge reaches player base = fail (25 min) ---
		{
			id: "sludge-reaches-base",
			condition: { type: "timer", time: 1500 },
			action: {
				type: "failMission",
				reason: "The sludge flood has consumed your base. The Copper-Silt Reach is lost.",
			},
			once: true,
		},

		// --- Player CP destroyed = fail ---
		{
			id: "player-cp-destroyed",
			condition: {
				type: "buildingDestroyed",
				buildingTag: "ura-main-cp",
			},
			action: {
				type: "failMission",
				reason: "Your Command Post has been destroyed. Mission failed.",
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
				text: "Their army is broken. But the sludge source remains — The Great Siphon. One final mission, Sergeant. The Reckoning.",
				duration: 0,
			},
			once: true,
		},
	],

	unitUnlocks: [],
	buildingUnlocks: [],
};
