/**
 * Mission 10: The Healer's Grove — Liberation
 *
 * 5 occupied villages scattered across jungle terrain.
 * Player starts with a small base in the southwest.
 * Medic Marina is held at the central village (village 3).
 * Teaches: territory control, village liberation, Field Hospital.
 * Win: Liberate all 5 villages, rescue Medic Marina.
 */

import type { Scenario } from "../../types";

export const mission10HealersGrove: Scenario = {
	id: "mission-10-healers-grove",
	chapter: 3,
	mission: 10,
	name: "The Healer's Grove",

	briefing: {
		title: "Operation Healer's Grove",
		lines: [
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Five villages in this sector are under Scale-Guard occupation. The locals are friendly — liberate them and they'll provide resources and intelligence.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Priority target: the central village at the grove. Our contact Medic Marina is being held there. She's a field medic — once freed, she unlocks the Field Hospital for your base.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Clear the Scale-Guard garrison from each village to liberate it. The garrison varies — some villages are lightly held, the central one is heavily fortified.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "You have a small base in the southwest. Expand as needed, but liberation is the priority. Free all five villages and get Marina out.",
			},
		],
		objectives: [
			{ description: "Liberate Village 1 (northwest)", type: "primary" },
			{ description: "Liberate Village 2 (northeast)", type: "primary" },
			{
				description: "Liberate Village 3 and rescue Medic Marina",
				type: "primary",
			},
			{ description: "Liberate Village 4 (southwest)", type: "primary" },
			{ description: "Liberate Village 5 (southeast)", type: "primary" },
			{
				description: "Build a Field Hospital",
				type: "bonus",
			},
		],
	},

	startConditions: {
		resources: { fish: 250, timber: 200, salvage: 100 },
		units: [
			{
				unitType: "mudfoot",
				count: 4,
				faction: "ura",
				position: { x: 10, y: 42 },
			},
			{
				unitType: "shellcracker",
				count: 2,
				faction: "ura",
				position: { x: 8, y: 42 },
			},
			{
				unitType: "mortar-otter",
				count: 1,
				faction: "ura",
				position: { x: 10, y: 43 },
			},
		],
		buildings: [
			{
				buildingType: "command-post",
				faction: "ura",
				position: { x: 10, y: 42 },
			},
			{
				buildingType: "barracks",
				faction: "ura",
				position: { x: 7, y: 40 },
			},
			{
				buildingType: "armory",
				faction: "ura",
				position: { x: 13, y: 40 },
			},
		],
		populationCap: 20,
	},

	objectives: [
		{
			id: "liberate-village-1",
			description: "Liberate Village 1 (northwest)",
			type: "primary",
			status: "active",
		},
		{
			id: "liberate-village-2",
			description: "Liberate Village 2 (northeast)",
			type: "primary",
			status: "active",
		},
		{
			id: "liberate-village-3",
			description: "Liberate Village 3 and rescue Medic Marina",
			type: "primary",
			status: "active",
		},
		{
			id: "liberate-village-4",
			description: "Liberate Village 4 (southwest)",
			type: "primary",
			status: "active",
		},
		{
			id: "liberate-village-5",
			description: "Liberate Village 5 (southeast)",
			type: "primary",
			status: "active",
		},
		{
			id: "build-field-hospital",
			description: "Build a Field Hospital",
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
				text: "Five villages, five garrisons. Start with the closest ones and work your way to the center. Marina is the priority, but you need to clear a path first.",
				duration: 8,
			},
			once: true,
		},

		// --- Village 1 liberated (NW) ---
		{
			id: "village-1-liberated",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 5, y: 3, width: 8, height: 6 },
				minUnits: 2,
			},
			action: [
				{
					type: "completeObjective",
					objectiveId: "liberate-village-1",
				},
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Village 1 liberated! The locals are grateful — they've shared timber supplies. Four more to go.",
					duration: 5,
				},
			],
			once: true,
		},

		// --- Village 2 liberated (NE) ---
		{
			id: "village-2-liberated",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 39, y: 8, width: 8, height: 6 },
				minUnits: 2,
			},
			action: [
				{
					type: "completeObjective",
					objectiveId: "liberate-village-2",
				},
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Village 2 is free. The northeast flank is secure.",
					duration: 4,
				},
			],
			once: true,
		},

		// --- Village 3 (center — Medic Marina) ---
		{
			id: "village-3-approach",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 22, y: 18, width: 8, height: 8 },
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "That's the central village. Heavy garrison — Gators and Vipers. Marina is inside. Clear them out carefully.",
				duration: 5,
			},
			once: true,
		},
		{
			id: "village-3-liberated",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 22, y: 18, width: 8, height: 8 },
				minUnits: 3,
			},
			action: [
				{
					type: "completeObjective",
					objectiveId: "liberate-village-3",
				},
				{
					type: "spawnUnits",
					unitType: "medic-marina",
					count: 1,
					faction: "ura",
					position: { x: 25, y: 21 },
					tag: "medic-marina",
				},
				{
					type: "showDialogue",
					portrait: "medic-marina",
					speaker: "Medic Marina",
					text: "Thank the river spirits. I've been treating wounded villagers with bark and leaves. Get me to a proper base and I'll set up a Field Hospital — your troops need real medical care.",
					duration: 7,
				},
			],
			once: true,
		},

		// --- Village 4 liberated (SW) ---
		{
			id: "village-4-liberated",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 9, y: 28, width: 8, height: 6 },
				minUnits: 2,
			},
			action: [
				{
					type: "completeObjective",
					objectiveId: "liberate-village-4",
				},
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Village 4 secured. The southern approach is clear.",
					duration: 4,
				},
			],
			once: true,
		},

		// --- Village 5 liberated (SE) ---
		{
			id: "village-5-liberated",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 37, y: 31, width: 8, height: 6 },
				minUnits: 2,
			},
			action: [
				{
					type: "completeObjective",
					objectiveId: "liberate-village-5",
				},
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Last village liberated! The entire sector is under URA control.",
					duration: 5,
				},
			],
			once: true,
		},

		// --- Field Hospital built (bonus) ---
		{
			id: "field-hospital-built",
			condition: {
				type: "unitCount",
				faction: "ura",
				unitType: "field-hospital",
				operator: "gte",
				count: 1,
			},
			action: [
				{
					type: "completeObjective",
					objectiveId: "build-field-hospital",
				},
				{
					type: "showDialogue",
					portrait: "medic-marina",
					speaker: "Medic Marina",
					text: "Field Hospital operational. Nearby units will regenerate health automatically. This changes everything.",
					duration: 5,
				},
			],
			once: true,
		},

		// --- Scale-Guard counterattack at 8 min ---
		{
			id: "counterattack",
			condition: { type: "timer", time: 480 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Scale-Guard is sending a reaction force from the north! Defend the liberated villages!",
					duration: 4,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{
							unitType: "gator",
							count: 4,
							position: { x: 25, y: 0 },
						},
						{
							unitType: "viper",
							count: 2,
							position: { x: 20, y: 0 },
						},
						{
							unitType: "snapper",
							count: 2,
							position: { x: 30, y: 0 },
						},
					],
				},
			],
			once: true,
		},

		// --- Marina death = fail ---
		{
			id: "marina-death",
			condition: {
				type: "healthThreshold",
				entityTag: "medic-marina",
				percentage: 1,
				operator: "below",
			},
			action: {
				type: "failMission",
				reason: "Medic Marina has been killed. Mission failed.",
			},
			once: true,
		},

		// --- Mission complete ---
		{
			id: "mission-complete",
			condition: { type: "allObjectivesComplete" },
			action: {
				type: "showDialogue",
				portrait: "medic-marina",
				speaker: "Medic Marina",
				text: "All five villages liberated. The Healer's Grove is free. These people will remember what you did here, Sergeant.",
				duration: 0,
			},
			once: true,
		},
	],

	unitUnlocks: ["medic-marina"],
	buildingUnlocks: ["field-hospital"],
};
