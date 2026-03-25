/**
 * Mission 12: The Stronghold — Siege Assault
 *
 * Full army with pre-built base assaults a multi-layered Scale-Guard fortress.
 * Three wall layers: outer walls, inner courtyard, innermost keep.
 * Sgt. Fang is held in the keep — rescue and extract him.
 * Teaches: siege tactics, combined arms, wall breaching.
 * Win: Breach the fortress, rescue Sgt. Fang, destroy enemy Command Post.
 */

import type { Scenario } from "../../types";

export const mission12TheStronghold: Scenario = {
	id: "mission-12-the-stronghold",
	chapter: 3,
	mission: 12,
	name: "The Stronghold",

	briefing: {
		title: "Operation Stronghold",
		lines: [
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "This is the most fortified Scale-Guard position in the sector. Three layers of walls. Venom Spires on every corner. Sgt. Fang is in the innermost keep.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "A toxic sludge moat surrounds the entire fortress. The only way in is through the main gate at the south. It's bridged, but expect heavy resistance at every chokepoint.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Use Sappers to breach the walls. Mortar Otters to soften defenses from range. Shellcrackers lead the push. This is a full combined-arms assault.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Sgt. Fang is a siege specialist — once you free him, he'll be able to damage buildings with bonus effectiveness. Breach the keep, free Fang, destroy their Command Post. End this.",
			},
		],
		objectives: [
			{
				description: "Breach the outer gate",
				type: "primary",
			},
			{
				description: "Rescue Sgt. Fang from the keep",
				type: "primary",
			},
			{
				description: "Destroy the enemy Command Post",
				type: "primary",
			},
			{
				description: "Complete within 20 minutes",
				type: "bonus",
			},
		],
	},

	startConditions: {
		resources: { fish: 400, timber: 300, salvage: 200 },
		units: [
			{
				unitType: "mudfoot",
				count: 6,
				faction: "ura",
				position: { x: 25, y: 38 },
			},
			{
				unitType: "shellcracker",
				count: 4,
				faction: "ura",
				position: { x: 25, y: 39 },
			},
			{
				unitType: "mortar-otter",
				count: 2,
				faction: "ura",
				position: { x: 25, y: 40 },
			},
			{
				unitType: "sapper",
				count: 2,
				faction: "ura",
				position: { x: 25, y: 40 },
			},
		],
		buildings: [
			{
				buildingType: "command-post",
				faction: "ura",
				position: { x: 25, y: 39 },
			},
			{
				buildingType: "barracks",
				faction: "ura",
				position: { x: 22, y: 37 },
			},
			{
				buildingType: "barracks",
				faction: "ura",
				position: { x: 28, y: 37 },
			},
			{
				buildingType: "armory",
				faction: "ura",
				position: { x: 25, y: 36 },
			},
		],
		populationCap: 24,
	},

	objectives: [
		{
			id: "breach-gate",
			description: "Breach the outer gate",
			type: "primary",
			status: "active",
		},
		{
			id: "rescue-fang",
			description: "Rescue Sgt. Fang from the keep",
			type: "primary",
			status: "pending",
		},
		{
			id: "destroy-sg-cp",
			description: "Destroy the enemy Command Post",
			type: "primary",
			status: "active",
		},
		{
			id: "speed-bonus",
			description: "Complete within 20 minutes",
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
				text: "Form up at the staging area. Mortars in the rear, Sappers ready to breach. Push through the gate and don't stop until you reach the keep.",
				duration: 8,
			},
			once: true,
		},

		// --- Approaching the gate ---
		{
			id: "gate-approach",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 22, y: 24, width: 8, height: 4 },
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Main gate ahead. Sludge moat on both sides — the bridge is the only way through. Expect defenders at the crossing.",
				duration: 5,
			},
			once: true,
		},

		// --- Breached outer gate ---
		{
			id: "outer-gate-breached",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 8, y: 5, width: 36, height: 18 },
				minUnits: 3,
			},
			action: [
				{ type: "completeObjective", objectiveId: "breach-gate" },
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "We're inside the outer walls! Push to the inner courtyard — the keep is ahead!",
					duration: 4,
				},
			],
			once: true,
		},

		// --- Inner courtyard entered ---
		{
			id: "inner-courtyard",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 14, y: 8, width: 24, height: 12 },
				minUnits: 2,
			},
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Inner courtyard! Spawning pools are active — take them out before they flood us with reinforcements!",
					duration: 5,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{
							unitType: "gator",
							count: 3,
							position: { x: 20, y: 14 },
						},
						{
							unitType: "gator",
							count: 3,
							position: { x: 32, y: 14 },
						},
					],
				},
			],
			once: true,
		},

		// --- Reaching the keep ---
		{
			id: "keep-reached",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 22, y: 11, width: 8, height: 6 },
				minUnits: 2,
			},
			action: [
				{ type: "completeObjective", objectiveId: "rescue-fang" },
				{
					type: "spawnUnits",
					unitType: "sgt-fang",
					count: 1,
					faction: "ura",
					position: { x: 25, y: 13 },
					tag: "sgt-fang",
				},
				{
					type: "showDialogue",
					portrait: "sgt-fang",
					speaker: "Sgt. Fang",
					text: "About time someone showed up. Give me something heavy — I'll tear this whole fortress down myself. Point me at their Command Post.",
					duration: 6,
				},
			],
			once: true,
		},

		// --- Fortress counterattack after rescue ---
		{
			id: "fortress-counterattack",
			condition: {
				type: "objectiveComplete",
				objectiveId: "rescue-fang",
			},
			action: {
				type: "spawnReinforcements",
				faction: "scale-guard",
				units: [
					{
						unitType: "snapper",
						count: 3,
						position: { x: 15, y: 6 },
					},
					{
						unitType: "snapper",
						count: 3,
						position: { x: 37, y: 6 },
					},
					{
						unitType: "viper",
						count: 2,
						position: { x: 25, y: 3 },
					},
				],
				dialogue: {
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "They're counterattacking from the north wall! Hold your ground and push to the CP!",
				},
			},
			once: true,
		},

		// --- Enemy CP destroyed ---
		{
			id: "sg-cp-destroyed",
			condition: {
				type: "buildingDestroyed",
				buildingTag: "sg-stronghold-cp",
			},
			action: [
				{ type: "completeObjective", objectiveId: "destroy-sg-cp" },
				{
					type: "showDialogue",
					portrait: "sgt-fang",
					speaker: "Sgt. Fang",
					text: "Command Post is rubble. That's how you do a siege.",
					duration: 5,
				},
				{ type: "playSFX", sfx: "buildComplete" },
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
				text: "Twenty minutes. Speed bonus gone — finish the job.",
				duration: 3,
			},
			once: true,
		},

		// --- Fang death = fail ---
		{
			id: "fang-death",
			condition: {
				type: "healthThreshold",
				entityTag: "sgt-fang",
				percentage: 1,
				operator: "below",
			},
			action: {
				type: "failMission",
				reason: "Sgt. Fang has been killed. Mission failed.",
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
				text: "The Stronghold has fallen. Sgt. Fang is back in the fight. Chapter 3 complete — the Heart of Darkness is broken. Now we go for the throat: The Great Siphon.",
				duration: 0,
			},
			once: true,
		},
	],

	unitUnlocks: ["sgt-fang"],
	buildingUnlocks: [],
};
