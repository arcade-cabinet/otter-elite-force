/**
 * Mission 4: Prison Break — Commando / Rescue
 *
 * Sgt. Bubbles and 2 scouts must infiltrate a Scale-Guard compound,
 * rescue Gen. Whiskers, and escape to the extraction point.
 * Teaches: stealth, detection, hero abilities.
 * Win: Rescue Gen. Whiskers, escape to extraction.
 */

import type { Scenario } from "../../types";

export const mission04PrisonBreak: Scenario = {
	id: "mission-04-prison-break",
	chapter: 1,
	mission: 4,
	name: "Prison Break",

	briefing: {
		title: "Operation Prison Break",
		lines: [
			{
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Bubbles, we've located Gen. Whiskers. He's being held in a Scale-Guard detention compound northeast of the river bend.",
			},
			{
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "This is a stealth operation. No base, no reinforcements. Just you and two scouts. The compound is heavily patrolled with detection towers.",
			},
			{
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Use the tall grass and mangroves for concealment. If you trip an alarm, they'll lock down and call reinforcements. Avoid detection if you can.",
			},
			{
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "Infiltrate from the southeast, reach the prison cell, free the General, and get everyone to the extraction point in the northwest. Good luck, Sergeant.",
			},
		],
		objectives: [
			{ description: "Rescue Gen. Whiskers", type: "primary" },
			{
				description: "Escort Gen. Whiskers to extraction",
				type: "primary",
			},
			{
				description: "Complete without triggering the alarm",
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
				position: { x: 25, y: 24 },
				tag: "hero-bubbles",
			},
			{
				unitType: "mudfoot",
				count: 2,
				faction: "ura",
				position: { x: 24, y: 24 },
				tag: "scouts",
			},
		],
		buildings: [],
		populationCap: 4,
	},

	objectives: [
		{
			id: "rescue-whiskers",
			description: "Rescue Gen. Whiskers",
			type: "primary",
			status: "active",
		},
		{
			id: "extract-whiskers",
			description: "Escort Gen. Whiskers to extraction",
			type: "primary",
			status: "pending",
		},
		{
			id: "no-alarm",
			description: "Complete without triggering the alarm",
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
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "You're in position. Use the tall grass along the south for concealment. Detection towers have a radius — watch their coverage.",
				duration: 6,
			},
			once: true,
		},

		// --- Approaching the compound ---
		{
			id: "compound-approach",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 20, y: 16, width: 8, height: 8 },
			},
			action: {
				type: "showDialogue",
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "You're near the perimeter. Two Venom Spires cover the east approach. Look for gaps in the patrol routes.",
				duration: 6,
			},
			once: true,
		},

		// --- Entering the compound ---
		{
			id: "entered-compound",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 5, y: 3, width: 22, height: 14 },
			},
			action: {
				type: "showDialogue",
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "You're inside the perimeter. The prison cell should be in the center. Two guards flanking the entrance.",
				duration: 5,
			},
			once: true,
		},

		// --- Reaching the prison cell (rescue Gen. Whiskers) ---
		{
			id: "reached-cell",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 13, y: 8, width: 5, height: 4 },
			},
			action: [
				{ type: "completeObjective", objectiveId: "rescue-whiskers" },
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "About time, Bubbles. I was starting to think Alliance had written me off. Let's move — I know the compound layout.",
					duration: 6,
				},
				{
					type: "spawnUnits",
					unitType: "gen-whiskers",
					count: 1,
					faction: "ura",
					position: { x: 15, y: 9 },
					tag: "gen-whiskers-freed",
				},
			],
			once: true,
		},

		// --- Activate extraction objective after rescue ---
		{
			id: "activate-extraction",
			condition: {
				type: "objectiveComplete",
				objectiveId: "rescue-whiskers",
			},
			action: {
				type: "showDialogue",
				portrait: "foxhound",
				speaker: "FOXHOUND",
				text: "General is free! Extraction point is northwest — the cleared area at the river bend. Move fast.",
				duration: 5,
			},
			once: true,
		},

		// --- Extraction ---
		{
			id: "extraction-reached",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 0, y: 0, width: 5, height: 4 },
				minUnits: 2,
			},
			action: [
				{ type: "completeObjective", objectiveId: "extract-whiskers" },
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Extraction confirmed. Outstanding work, Sergeant. From now on, I'm running the briefings. FOXHOUND, stand down.",
					duration: 0,
				},
			],
			once: true,
		},

		// --- Alarm trigger (if detected) ---
		// In practice, the stealth/detection system would fire this
		// when a unit enters a detection cone. The scenario engine
		// would receive this as a custom event. Here we use a
		// building-destroyed proxy: if a Venom Spire spots the player,
		// the detection system can flag it via the alarm tag.
		{
			id: "alarm-triggered",
			condition: {
				type: "buildingDestroyed",
				buildingTag: "alarm-flag",
			},
			action: [
				{
					type: "showDialogue",
					portrait: "foxhound",
					speaker: "FOXHOUND",
					text: "They've spotted you! Compound is going into lockdown — expect heavy resistance!",
					duration: 4,
				},
				{
					type: "spawnReinforcements",
					faction: "scale_guard",
					units: [
						{ unitType: "gator", count: 3, position: { x: 12, y: 3 } },
						{ unitType: "gator", count: 2, position: { x: 22, y: 15 } },
						{ unitType: "scout-lizard", count: 2, position: { x: 7, y: 5 } },
					],
				},
			],
			once: true,
		},

		// Bonus fails if alarm fires
		// (tracked by the stealth system externally — this is a placeholder
		// for the integration layer to call engine.failObjective("no-alarm"))

		// --- Hero death = mission fail ---
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

		// --- Whiskers death after rescue = mission fail ---
		{
			id: "whiskers-death",
			condition: {
				type: "healthThreshold",
				entityTag: "gen-whiskers-freed",
				percentage: 1,
				operator: "below",
			},
			action: {
				type: "failMission",
				reason: "Gen. Whiskers has been killed. The mission is a failure.",
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
				text: "Chapter One complete. The first landing was a success. But the war for the Copper-Silt Reach is only beginning.",
				duration: 0,
			},
			once: true,
		},
	],

	unitUnlocks: ["sgt-bubbles", "gen-whiskers"],
	buildingUnlocks: [],
};
