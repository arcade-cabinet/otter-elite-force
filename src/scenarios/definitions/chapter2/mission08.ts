/**
 * Mission 8: The Underwater Cache — Hero + Stealth
 *
 * Sgt. Bubbles and a small escort must rescue Cpl. Splash from a
 * Scale-Guard coastal cell, then Splash uses underwater traversal to
 * reach a hidden cache in the center of a large lake.
 * Teaches: hero abilities, underwater traversal, stealth extraction.
 * Win: Rescue Cpl. Splash, recover the underwater cache, extract north.
 */

import type { Scenario } from "../../types";

export const mission08UnderwaterCache: Scenario = {
	id: "mission-08-underwater-cache",
	chapter: 2,
	mission: 8,
	name: "The Underwater Cache",

	briefing: {
		title: "Operation Underwater Cache",
		lines: [
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Bubbles, we've confirmed Cpl. Splash is being held at a Scale-Guard outpost on the southeast shore of Lake Copper. She's alive — barely.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "This is a small-team operation. You, Bubbles, plus three Mudfoots. No base. No reinforcements. Scale-Guard patrols the shoreline and they've got Venom Spires covering the approaches.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Here's the real objective: intelligence says there's a pre-war munitions cache submerged in the center of the lake. Only someone with Splash's underwater capability can reach it.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Rescue Splash, clear a path to the shore, then get her into the water. Recover the cache and extract everyone to the northern landing zone. Use the tall grass for concealment.",
			},
		],
		objectives: [
			{ description: "Rescue Cpl. Splash", type: "primary" },
			{ description: "Recover the underwater cache", type: "primary" },
			{ description: "Extract to northern LZ", type: "primary" },
			{
				description: "Complete without losing any units",
				type: "bonus",
			},
		],
	},

	startConditions: {
		resources: { fish: 0, timber: 0, salvage: 0 },
		units: [
			{
				unitType: "sgt-bubbles",
				count: 1,
				faction: "ura",
				position: { x: 17, y: 29 },
				tag: "hero-bubbles",
			},
			{
				unitType: "mudfoot",
				count: 3,
				faction: "ura",
				position: { x: 17, y: 28 },
			},
		],
		buildings: [],
		populationCap: 5,
	},

	objectives: [
		{
			id: "rescue-splash",
			description: "Rescue Cpl. Splash",
			type: "primary",
			status: "active",
		},
		{
			id: "recover-cache",
			description: "Recover the underwater cache",
			type: "primary",
			status: "pending",
		},
		{
			id: "extract-north",
			description: "Extract to northern LZ",
			type: "primary",
			status: "pending",
		},
		{
			id: "no-casualties",
			description: "Complete without losing any units",
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
				text: "You're on the south shore. Splash's cell is to the southeast — use the tall grass for concealment. Scout-Lizards patrol both flanks of the lake.",
				duration: 8,
			},
			once: true,
		},

		// --- Approaching Splash's cell ---
		{
			id: "approach-cell",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 28, y: 22, width: 5, height: 5 },
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Cell ahead. Three guards — two Gators and a Viper. Take them out quickly before they raise the alarm.",
				duration: 5,
			},
			once: true,
		},

		// --- Rescuing Cpl. Splash ---
		{
			id: "splash-rescued",
			condition: {
				type: "unitCount",
				faction: "scale-guard",
				operator: "eq",
				count: 0,
				unitType: "gator",
			},
			action: [
				{ type: "completeObjective", objectiveId: "rescue-splash" },
				{
					type: "spawnUnits",
					unitType: "cpl-splash",
					count: 1,
					faction: "ura",
					position: { x: 30, y: 24 },
					tag: "cpl-splash",
				},
				{
					type: "showDialogue",
					portrait: "cpl-splash",
					speaker: "Cpl. Splash",
					text: "Bubbles! Took you long enough. I can still swim — get me to that lake and I'll dive for the cache. Just keep those lizards off the shoreline.",
					duration: 7,
				},
			],
			once: true,
		},

		// --- Cache objective activates ---
		{
			id: "activate-cache-objective",
			condition: {
				type: "objectiveComplete",
				objectiveId: "rescue-splash",
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Splash is free. Move her to the lake shore. She can enter the water and swim to the cache coordinates in the center.",
				duration: 5,
			},
			once: true,
		},

		// --- Splash enters lake (approaching cache) ---
		{
			id: "splash-enters-lake",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 14, y: 11, width: 7, height: 5 },
				unitType: "cpl-splash",
			},
			action: [
				{ type: "completeObjective", objectiveId: "recover-cache" },
				{
					type: "showDialogue",
					portrait: "cpl-splash",
					speaker: "Cpl. Splash",
					text: "Found it! Pre-war munitions, sealed tight. Bringing it up now. Head for the northern extraction — I'll meet you there.",
					duration: 6,
				},
				{
					type: "camera",
					target: { x: 17, y: 13 },
					duration: 2,
				},
			],
			once: true,
		},

		// --- Extraction objective activates ---
		{
			id: "activate-extraction",
			condition: {
				type: "objectiveComplete",
				objectiveId: "recover-cache",
			},
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Cache recovered! Extraction point is the cleared area on the north shore. Get everyone there — Splash included.",
					duration: 5,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{
							unitType: "scout-lizard",
							count: 2,
							position: { x: 10, y: 5 },
						},
						{
							unitType: "gator",
							count: 2,
							position: { x: 24, y: 5 },
						},
					],
					dialogue: {
						portrait: "gen-whiskers",
						speaker: "Gen. Whiskers",
						text: "Scale-Guard reinforcements arriving at the north shore! Clear a path to the LZ!",
					},
				},
			],
			once: true,
		},

		// --- Extraction ---
		{
			id: "extraction-reached",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 10, y: 0, width: 14, height: 4 },
				minUnits: 2,
			},
			action: { type: "completeObjective", objectiveId: "extract-north" },
			once: true,
		},

		// --- Shoreline patrol alert ---
		{
			id: "shoreline-alert",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 10, y: 26, width: 14, height: 4 },
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "South approach zone. Stay low in the tall grass — shoreline patrols are active.",
				duration: 4,
			},
			once: true,
		},

		// --- Unit lost (bonus fails) ---
		{
			id: "unit-lost",
			condition: {
				type: "unitCount",
				faction: "ura",
				operator: "lte",
				count: 3,
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "We've lost a team member. No-casualty bonus is gone — focus on the mission.",
				duration: 4,
			},
			once: true,
		},

		// --- Hero death = fail ---
		{
			id: "bubbles-death",
			condition: {
				type: "healthThreshold",
				entityTag: "hero-bubbles",
				percentage: 1,
				operator: "below",
			},
			action: {
				type: "failMission",
				reason: "Sgt. Bubbles has fallen. Mission failed.",
			},
			once: true,
		},

		// --- Splash death after rescue = fail ---
		{
			id: "splash-death",
			condition: {
				type: "healthThreshold",
				entityTag: "cpl-splash",
				percentage: 1,
				operator: "below",
			},
			action: {
				type: "failMission",
				reason: "Cpl. Splash has been killed. Mission failed.",
			},
			once: true,
		},

		// --- Mission complete ---
		{
			id: "mission-complete",
			condition: { type: "allObjectivesComplete" },
			action: {
				type: "showDialogue",
				portrait: "cpl-splash",
				speaker: "Cpl. Splash",
				text: "Cache secured, team extracted. Thanks for the rescue, Bubbles. I owe you one. Chapter 2 complete — the Copper-Silt Reach is turning in our favor.",
				duration: 0,
			},
			once: true,
		},
	],

	unitUnlocks: ["cpl-splash"],
	buildingUnlocks: [],
};
