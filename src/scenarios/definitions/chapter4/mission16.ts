/**
 * Mission 16: The Reckoning — Final Boss + Base
 *
 * The Great Siphon: 3-phase boss encounter.
 * Phase 1: Destroy outer defensive perimeter (walls, towers, garrison)
 * Phase 2: Elite Croc Champions counterattack from 3 directions
 * Phase 3: Siphon activates doomsday mode — sludge flood from center.
 *          Race to destroy core before map is consumed.
 * All heroes available. This is the final mission.
 * Win: Destroy The Great Siphon core.
 */

import type { Scenario } from "../../types";

export const mission16TheReckoning: Scenario = {
	id: "mission-16-the-reckoning",
	chapter: 4,
	mission: 16,
	name: "The Reckoning",

	briefing: {
		title: "Operation Reckoning",
		lines: [
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "This is the final mission. The Great Siphon — the source of all the toxic sludge poisoning the Copper-Silt Reach. We end this today.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Three concentric rings of defense. Outer ring has Venom Spires and a heavy garrison. Inner ring is the sludge moat around the Siphon itself. The core is at the center.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "Every hero we've rescued is here: Splash, Fang, Marina, Muskrat. Use them all. Fang breaches walls, Muskrat plants charges, Marina keeps everyone alive, Splash scouts underwater.",
			},
			{
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "When you breach the outer ring, expect Croc Champions — Scale-Guard elites. When you reach the core... the Siphon activates doomsday mode. Sludge floods from the center. Destroy the core before it consumes the map. This is it. For the Reach.",
			},
		],
		objectives: [
			{
				description: "Breach the outer defensive perimeter",
				type: "primary",
			},
			{
				description: "Survive the Croc Champion counterattack",
				type: "primary",
			},
			{
				description: "Destroy The Great Siphon core",
				type: "primary",
			},
			{
				description: "Keep all heroes alive",
				type: "bonus",
			},
		],
	},

	startConditions: {
		resources: { fish: 600, timber: 500, salvage: 400 },
		units: [
			{
				unitType: "sgt-bubbles",
				count: 1,
				faction: "ura",
				position: { x: 32, y: 41 },
				tag: "hero-bubbles",
			},
			{
				unitType: "gen-whiskers",
				count: 1,
				faction: "ura",
				position: { x: 31, y: 42 },
				tag: "hero-whiskers",
			},
			{
				unitType: "cpl-splash",
				count: 1,
				faction: "ura",
				position: { x: 33, y: 42 },
				tag: "hero-splash",
			},
			{
				unitType: "medic-marina",
				count: 1,
				faction: "ura",
				position: { x: 32, y: 43 },
				tag: "hero-marina",
			},
			{
				unitType: "sgt-fang",
				count: 1,
				faction: "ura",
				position: { x: 30, y: 42 },
				tag: "hero-fang",
			},
			{
				unitType: "pvt-muskrat",
				count: 1,
				faction: "ura",
				position: { x: 34, y: 42 },
				tag: "hero-muskrat",
			},
			{
				unitType: "mudfoot",
				count: 6,
				faction: "ura",
				position: { x: 32, y: 41 },
			},
			{
				unitType: "shellcracker",
				count: 2,
				faction: "ura",
				position: { x: 28, y: 42 },
			},
			{
				unitType: "mortar-otter",
				count: 2,
				faction: "ura",
				position: { x: 32, y: 43 },
			},
			{
				unitType: "sapper",
				count: 2,
				faction: "ura",
				position: { x: 32, y: 43 },
			},
		],
		buildings: [
			{
				buildingType: "command-post",
				faction: "ura",
				position: { x: 32, y: 42 },
				tag: "ura-final-cp",
			},
			{
				buildingType: "barracks",
				faction: "ura",
				position: { x: 27, y: 40 },
			},
			{
				buildingType: "barracks",
				faction: "ura",
				position: { x: 37, y: 40 },
			},
			{
				buildingType: "armory",
				faction: "ura",
				position: { x: 32, y: 39 },
			},
			{
				buildingType: "field-hospital",
				faction: "ura",
				position: { x: 32, y: 44 },
			},
		],
		populationCap: 30,
	},

	objectives: [
		{
			id: "breach-perimeter",
			description: "Breach the outer defensive perimeter",
			type: "primary",
			status: "active",
		},
		{
			id: "survive-champions",
			description: "Survive the Croc Champion counterattack",
			type: "primary",
			status: "pending",
		},
		{
			id: "destroy-siphon-core",
			description: "Destroy The Great Siphon core",
			type: "primary",
			status: "pending",
		},
		{
			id: "all-heroes-alive",
			description: "Keep all heroes alive",
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
					text: "This is the final push. Everyone is counting on us. Break through the outer ring, then we deal with whatever comes next. For the Reach!",
					duration: 8,
				},
				{
					type: "camera",
					target: { x: 32, y: 15 },
					duration: 3,
				},
			],
			once: true,
		},

		// --- Approaching outer ring ---
		{
			id: "outer-ring-approach",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 28, y: 26, width: 10, height: 4 },
			},
			action: {
				type: "showDialogue",
				portrait: "sgt-fang",
				speaker: "Sgt. Fang",
				text: "Outer gate ahead. Venom Spires flanking. Let me at those walls — I'll crack them open.",
				duration: 5,
			},
			once: true,
		},

		// === PHASE 1: Breach Perimeter ===
		{
			id: "perimeter-breached",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 8, y: 4, width: 50, height: 26 },
				minUnits: 5,
			},
			action: [
				{
					type: "completeObjective",
					objectiveId: "breach-perimeter",
				},
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Perimeter breached! Brace yourselves — here come the Champions!",
					duration: 4,
				},
			],
			once: true,
		},

		// === PHASE 2: Croc Champions ===
		{
			id: "champion-counterattack",
			condition: {
				type: "objectiveComplete",
				objectiveId: "breach-perimeter",
			},
			action: [
				{
					type: "spawnReinforcements",
					faction: "scale-guard",
					units: [
						{
							unitType: "croc-champion",
							count: 2,
							position: { x: 10, y: 15 },
						},
						{
							unitType: "croc-champion",
							count: 2,
							position: { x: 55, y: 15 },
						},
						{
							unitType: "croc-champion",
							count: 2,
							position: { x: 32, y: 3 },
						},
						{
							unitType: "gator",
							count: 4,
							position: { x: 10, y: 16 },
						},
						{
							unitType: "gator",
							count: 4,
							position: { x: 55, y: 16 },
						},
						{
							unitType: "snapper",
							count: 3,
							position: { x: 32, y: 4 },
						},
					],
				},
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "CROC CHAMPIONS! Three directions! These are their elites — focus fire and use Fang's siege damage!",
					duration: 5,
				},
			],
			once: true,
		},

		// --- Champions defeated (no more croc-champions) ---
		{
			id: "champions-defeated",
			condition: {
				type: "unitCount",
				faction: "scale-guard",
				unitType: "croc-champion",
				operator: "eq",
				count: 0,
			},
			action: [
				{
					type: "completeObjective",
					objectiveId: "survive-champions",
				},
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "Champions are down! Push to the Siphon core!",
					duration: 4,
				},
			],
			once: true,
		},

		// === PHASE 3: Doomsday Mode ===
		{
			id: "doomsday-activation",
			condition: {
				type: "areaEntered",
				faction: "ura",
				area: { x: 27, y: 12, width: 12, height: 8 },
				minUnits: 3,
			},
			action: [
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "The Siphon is activating doomsday mode! Sludge is flooding from the center! DESTROY THE CORE NOW!",
					duration: 5,
				},
				{
					type: "changeWeather",
					weather: "monsoon",
					transitionTime: 5,
				},
				{ type: "playSFX", sfx: "unitAttack" },
			],
			once: true,
		},

		// --- Siphon core destroyed ---
		{
			id: "siphon-destroyed",
			condition: {
				type: "buildingDestroyed",
				buildingTag: "great-siphon",
			},
			action: [
				{
					type: "completeObjective",
					objectiveId: "destroy-siphon-core",
				},
				{
					type: "changeWeather",
					weather: "clear",
					transitionTime: 5,
				},
				{
					type: "showDialogue",
					portrait: "gen-whiskers",
					speaker: "Gen. Whiskers",
					text: "THE GREAT SIPHON IS DESTROYED! The sludge is receding! We did it!",
					duration: 6,
				},
				{ type: "playSFX", sfx: "buildComplete" },
			],
			once: true,
		},

		// --- Doomsday timer (if core not destroyed in 3 min after activation) ---
		{
			id: "doomsday-warning",
			condition: { type: "timer", time: 1200 },
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "The sludge is consuming the map! Minutes left! DESTROY THAT CORE!",
				duration: 3,
			},
			once: true,
		},
		{
			id: "doomsday-fail",
			condition: { type: "timer", time: 1500 },
			action: {
				type: "failMission",
				reason: "The sludge flood has consumed the Copper-Silt Reach. The Great Siphon prevails.",
			},
			once: true,
		},

		// --- Hero death tracking (bonus) ---
		{
			id: "hero-death-bubbles",
			condition: {
				type: "healthThreshold",
				entityTag: "hero-bubbles",
				percentage: 1,
				operator: "below",
			},
			action: {
				type: "failMission",
				reason: "Sgt. Bubbles has fallen. The mission is over.",
			},
			once: true,
		},
		{
			id: "hero-death-whiskers",
			condition: {
				type: "healthThreshold",
				entityTag: "hero-whiskers",
				percentage: 1,
				operator: "below",
			},
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "FOXHOUND",
				text: "Gen. Whiskers is down! Heroes bonus lost — complete the mission!",
				duration: 4,
			},
			once: true,
		},

		// --- Player CP destroyed = fail ---
		{
			id: "player-cp-destroyed",
			condition: {
				type: "buildingDestroyed",
				buildingTag: "ura-final-cp",
			},
			action: {
				type: "failMission",
				reason: "Your Command Post has been destroyed. The final assault has failed.",
			},
			once: true,
		},

		// --- VICTORY — Mission complete ---
		{
			id: "mission-complete",
			condition: { type: "allObjectivesComplete" },
			action: {
				type: "showDialogue",
				portrait: "gen-whiskers",
				speaker: "Gen. Whiskers",
				text: "The Great Siphon is no more. The Copper-Silt Reach is free. The Scale-Guard Militia is broken. Sergeant Bubbles... you've done it. OTTER: ELITE FORCE — mission accomplished.",
				duration: 0,
			},
			once: true,
		},
	],

	unitUnlocks: [],
	buildingUnlocks: [],
};
