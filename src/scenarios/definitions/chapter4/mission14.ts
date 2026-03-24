/**
 * Mission 14: Gas Depot — Demolition / Hero
 *
 * Pvt. Muskrat hero mission. Tight industrial compound.
 * Plant 4 timed charges on gas tanks, then escape before detonation.
 * Chain explosions add chaos. Stealth approach, explosive exit.
 * Teaches: demolition charges, chain explosions, escape timer.
 * Win: Plant all 4 charges, escape before detonation.
 */

import type { Scenario } from "../../types";

export const mission14GasDepot: Scenario = {
	id: "mission-14-gas-depot",
	chapter: 4,
	mission: 14,
	name: "Gas Depot",

	briefing: {
		title: "Operation Gas Depot",
		lines: [
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Scale-Guard's fuel depot. Four gas tanks feeding their war machine. Pvt. Muskrat, this is your show.",
			},
			{
				portrait: "pvt-muskrat",
				speaker: "Pvt. Muskrat",
				text: "Four tanks, four charges. Plant them, set the timer, and run like hell. The compound is tight — sludge moat on all sides, one bridge in.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Patrols run east-west through the compound. Guards are stationed at each tank. Clear the guards or time your approach between patrol rotations.",
			},
			{
				portrait: "pvt-muskrat",
				speaker: "Pvt. Muskrat",
				text: "Once I plant the last charge, we have 60 seconds to get back across the bridge. These gas tanks will chain-react — the whole compound goes up. Don't be inside when it blows.",
			},
		],
		objectives: [
			{ description: "Plant charge on Tank 1 (NW)", type: "primary" },
			{ description: "Plant charge on Tank 2 (NE)", type: "primary" },
			{ description: "Plant charge on Tank 3 (SW)", type: "primary" },
			{ description: "Plant charge on Tank 4 (SE)", type: "primary" },
			{
				description: "Escape before detonation",
				type: "primary",
			},
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
				unitType: "pvt-muskrat",
				count: 1,
				faction: "ura",
				position: { x: 17, y: 29 },
				tag: "hero-muskrat",
			},
			{
				unitType: "mudfoot",
				count: 2,
				faction: "ura",
				position: { x: 16, y: 29 },
			},
			{
				unitType: "sapper",
				count: 1,
				faction: "ura",
				position: { x: 17, y: 28 },
			},
		],
		buildings: [],
		populationCap: 4,
	},

	objectives: [
		{
			id: "charge-tank-1",
			description: "Plant charge on Tank 1 (NW)",
			type: "primary",
			status: "active",
		},
		{
			id: "charge-tank-2",
			description: "Plant charge on Tank 2 (NE)",
			type: "primary",
			status: "active",
		},
		{
			id: "charge-tank-3",
			description: "Plant charge on Tank 3 (SW)",
			type: "primary",
			status: "active",
		},
		{
			id: "charge-tank-4",
			description: "Plant charge on Tank 4 (SE)",
			type: "primary",
			status: "active",
		},
		{
			id: "escape",
			description: "Escape before detonation",
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
				portrait: "pvt-muskrat",
				speaker: "Pvt. Muskrat",
				text: "Four tanks. One bridge in, one bridge out. Watch the patrol routes and plant charges when the coast is clear. I've got 4 charges — one per tank.",
				duration: 8,
			},
			once: true,
		},

		// --- Entering the compound ---
		{
			id: "entered-compound",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 15, y: 25, width: 5, height: 3 },
			},
			action: {
				type: "showDialogue",
				portrait: "pvt-muskrat",
				speaker: "Pvt. Muskrat",
				text: "We're past the gate. Patrols run east-west on rows 9 and 17. Time your movements between passes.",
				duration: 5,
			},
			once: true,
		},

		// --- Tank 1 charge planted (NW) ---
		{
			id: "tank-1-charged",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 6, y: 3, width: 6, height: 5 },
				unitType: "pvt-muskrat",
			},
			action: [
				{ type: "completeObjective", objectiveId: "charge-tank-1" },
				{
					type: "showDialogue",
					portrait: "pvt-muskrat",
					speaker: "Pvt. Muskrat",
					text: "Charge planted on Tank 1. Three more.",
					duration: 3,
				},
				{ type: "playSFX", sfx: "buildComplete" },
			],
			once: true,
		},

		// --- Tank 2 charge planted (NE) ---
		{
			id: "tank-2-charged",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 22, y: 3, width: 6, height: 5 },
				unitType: "pvt-muskrat",
			},
			action: [
				{ type: "completeObjective", objectiveId: "charge-tank-2" },
				{
					type: "showDialogue",
					portrait: "pvt-muskrat",
					speaker: "Pvt. Muskrat",
					text: "Tank 2 is set. Keep moving.",
					duration: 3,
				},
				{ type: "playSFX", sfx: "buildComplete" },
			],
			once: true,
		},

		// --- Tank 3 charge planted (SW) ---
		{
			id: "tank-3-charged",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 6, y: 19, width: 6, height: 5 },
				unitType: "pvt-muskrat",
			},
			action: [
				{ type: "completeObjective", objectiveId: "charge-tank-3" },
				{
					type: "showDialogue",
					portrait: "pvt-muskrat",
					speaker: "Pvt. Muskrat",
					text: "Tank 3 wired. One left.",
					duration: 3,
				},
				{ type: "playSFX", sfx: "buildComplete" },
			],
			once: true,
		},

		// --- Tank 4 charge planted (SE) — triggers escape timer ---
		{
			id: "tank-4-charged",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 22, y: 19, width: 6, height: 5 },
				unitType: "pvt-muskrat",
			},
			action: [
				{ type: "completeObjective", objectiveId: "charge-tank-4" },
				{
					type: "showDialogue",
					portrait: "pvt-muskrat",
					speaker: "Pvt. Muskrat",
					text: "ALL CHARGES SET! 60 seconds to detonation — RUN! GET TO THE BRIDGE!",
					duration: 4,
				},
				{ type: "playSFX", sfx: "unitAttack" },
			],
			once: true,
		},

		// --- Escape successful ---
		{
			id: "escape-reached",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 14, y: 28, width: 7, height: 2 },
				unitType: "pvt-muskrat",
			},
			action: [
				{ type: "completeObjective", objectiveId: "escape" },
				{
					type: "showDialogue",
					portrait: "pvt-muskrat",
					speaker: "Pvt. Muskrat",
					text: "Clear! Three... two... one...",
					duration: 3,
				},
				{
					type: "camera",
					target: { x: 17, y: 14 },
					duration: 3,
				},
			],
			once: true,
		},

		// --- Alarm reinforcements (compound enters alert after first charge) ---
		{
			id: "alert-reinforcements",
			condition: { type: "timer", time: 300 },
			action: {
				type: "spawnReinforcements",
				faction: "scale-guard",
				units: [
					{
						unitType: "gator",
						count: 3,
						position: { x: 17, y: 25 },
					},
					{
						unitType: "scout-lizard",
						count: 2,
						position: { x: 17, y: 3 },
					},
				],
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
				text: "We've lost someone. No-casualty bonus gone — focus on the charges.",
				duration: 3,
			},
			once: true,
		},

		// --- Muskrat death = fail ---
		{
			id: "muskrat-death",
			condition: {
				type: "healthThreshold",
				entityTag: "hero-muskrat",
				percentage: 1,
				operator: "below",
			},
			action: {
				type: "failMission",
				reason: "Pvt. Muskrat has been killed. The demolition mission has failed.",
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
				text: "The depot is gone. Scale-Guard's fuel supply just went up in smoke. Outstanding demolition work, Muskrat.",
				duration: 0,
			},
			once: true,
		},
	],

	unitUnlocks: ["pvt-muskrat"],
	buildingUnlocks: [],
};
