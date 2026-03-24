/**
 * Mission 9: Dense Canopy — Fog Skirmish
 *
 * Equal pre-built bases on opposite sides of a heavy jungle canopy.
 * Fog of war is critical — recon before strike.
 * Teaches: Mortar Otters, recon→strike loop, Fortified Walls research.
 * Win: Destroy enemy Command Post.
 */

import type { Scenario } from "../../types";

export const mission09DenseCanopy: Scenario = {
	id: "mission-09-dense-canopy",
	chapter: 3,
	mission: 9,
	name: "Dense Canopy",

	briefing: {
		title: "Operation Dense Canopy",
		lines: [
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "We've pushed deep into Scale-Guard territory. Intel says they've established a forward base on the east side of the canopy — mirror image of ours.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "The jungle is thick. Tall grass and mangroves cut visibility to nothing. You won't see them until they're on top of you — and they can't see you either.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "New asset: Mortar Otters. Long-range AoE — they can fire over the canopy blind if you have a scout spotting. Send scouts to locate, then rain mortars on their position.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Destroy their Command Post and this sector is ours. Research Fortified Walls at the Armory — you'll need the extra defense. Go.",
			},
		],
		objectives: [
			{
				description: "Destroy the enemy Command Post",
				type: "primary",
			},
			{
				description: "Research Fortified Walls",
				type: "bonus",
			},
		],
	},

	startConditions: {
		resources: { fish: 300, timber: 250, salvage: 150 },
		units: [
			{
				unitType: "mudfoot",
				count: 6,
				faction: "ura",
				position: { x: 8, y: 19 },
			},
			{
				unitType: "shellcracker",
				count: 2,
				faction: "ura",
				position: { x: 6, y: 19 },
			},
			{
				unitType: "mortar-otter",
				count: 2,
				faction: "ura",
				position: { x: 8, y: 19 },
			},
		],
		buildings: [
			{
				buildingType: "command-post",
				faction: "ura",
				position: { x: 8, y: 19 },
				tag: "ura-cp",
			},
			{
				buildingType: "barracks",
				faction: "ura",
				position: { x: 5, y: 17 },
			},
			{
				buildingType: "armory",
				faction: "ura",
				position: { x: 5, y: 21 },
			},
			{
				buildingType: "watchtower",
				faction: "ura",
				position: { x: 12, y: 15 },
			},
			{
				buildingType: "watchtower",
				faction: "ura",
				position: { x: 12, y: 23 },
			},
		],
		populationCap: 20,
	},

	objectives: [
		{
			id: "destroy-enemy-cp",
			description: "Destroy the enemy Command Post",
			type: "primary",
			status: "active",
		},
		{
			id: "research-fortified-walls",
			description: "Research Fortified Walls",
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
				text: "Send scouts through the tall grass to locate the enemy base. Once you have eyes on target, use Mortar Otters to soften them up before the main push.",
				duration: 8,
			},
			once: true,
		},

		// --- Entering no-man's land ---
		{
			id: "no-mans-land",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 15, y: 14, width: 16, height: 12 },
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "You're in the central canopy. Watch your flanks — the tall grass hides everything. Keep scouts ahead of your main force.",
				duration: 5,
			},
			once: true,
		},

		// --- Approaching enemy base ---
		{
			id: "enemy-base-approach",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 33, y: 14, width: 12, height: 12 },
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Enemy base spotted! Venom Spires covering the perimeter. Mortars can outrange them — set up a firing position and soften those defenses.",
				duration: 6,
			},
			once: true,
		},

		// --- Enemy counterattack at 5 min ---
		{
			id: "enemy-counterattack-1",
			condition: { type: "timer", time: 300 },
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Scale-Guard is probing our position from the north flank. Watch the tall grass!",
					duration: 4,
				},
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{
							unitType: "scout-lizard",
							count: 3,
							position: { x: 30, y: 5 },
						},
						{
							unitType: "gator",
							count: 2,
							position: { x: 30, y: 6 },
						},
					],
				},
			],
			once: true,
		},

		// --- Enemy counterattack at 10 min ---
		{
			id: "enemy-counterattack-2",
			condition: { type: "timer", time: 600 },
			action: {
				type: "spawnReinforcements",
				faction: "scale-guard",
				units: [
					{
						unitType: "gator",
						count: 4,
						position: { x: 30, y: 34 },
					},
					{
						unitType: "viper",
						count: 2,
						position: { x: 30, y: 35 },
					},
				],
			},
			once: true,
		},

		// --- Enemy CP destroyed ---
		{
			id: "enemy-cp-destroyed",
			condition: {
				type: "buildingDestroyed",
				buildingTag: "sg-cp",
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
					text: "Enemy Command Post is down! This sector belongs to us now.",
					duration: 5,
				},
				{ type: "playSFX", sfx: "buildComplete" },
			],
			once: true,
		},

		// --- Player CP destroyed = fail ---
		{
			id: "player-cp-destroyed",
			condition: {
				type: "buildingDestroyed",
				buildingTag: "ura-cp",
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
				text: "Excellent work. The canopy is cleared. Your Mortar Otters proved their worth today. Fortified Walls and Gun Emplacements are now available for research.",
				duration: 0,
			},
			once: true,
		},
	],

	unitUnlocks: ["mortar-otter", "diver"],
	buildingUnlocks: ["field-hospital"],
};
