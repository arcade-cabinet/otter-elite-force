// Mission 11: Tidal Fortress — Siege / Timed
//
// Scale-Guard fortress on an island. Tides rise and fall, opening/closing
// land bridges. Player must time assaults with low tide.
// Teaches: tidal mechanics, siege timing, coordinated multi-prong attacks.
// Win: Destroy the Scale-Guard Command Post. Bonus: Destroy all 3 Venom Spires.
// Par time: 12 min (720s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission11TidalFortress: MissionDef = {
	id: "mission_11",
	chapter: 3,
	mission: 3,
	name: "Entrenchment",
	subtitle: "Storm the island fortress during low tide windows",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "Scale-Guard's regional command is on Stonebreak Island — a natural fortress. Tidal flats surround it, and the only approach is during low tide when the land bridges are exposed.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Tides cycle every four minutes. Low tide lasts about two minutes — that's your window to cross. When the water rises, anyone on the flats is going to drown.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Three Venom Spires cover the approaches. Knock them out to open lanes for your main force. Their Command Post is in the center — that's the primary target.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Build up on the south shore and time your pushes. You'll need at least two tide cycles to crack this one. Patience wins this fight.",
			},
		],
	},

	terrain: {
		width: 48,
		height: 48,
		regions: [
			{ terrainId: "water", fill: true },
			// South mainland (player base)
			{ terrainId: "grass", rect: { x: 0, y: 32, w: 48, h: 16 } },
			{ terrainId: "dirt", rect: { x: 14, y: 36, w: 20, h: 10 } },
			// Fortress island (center-north)
			{ terrainId: "dirt", circle: { cx: 24, cy: 14, r: 10 } },
			// Tidal flats (exposed at low tide) — three approaches
			{ terrainId: "beach", rect: { x: 10, y: 24, w: 6, h: 10 } },
			{ terrainId: "beach", rect: { x: 21, y: 22, w: 6, h: 12 } },
			{ terrainId: "beach", rect: { x: 32, y: 24, w: 6, h: 10 } },
			// Beach fringe around island
			{ terrainId: "beach", circle: { cx: 24, cy: 14, r: 12 } },
			// Re-apply fortress island on top
			{ terrainId: "dirt", circle: { cx: 24, cy: 14, r: 10 } },
			// Mud shoreline on south
			{ terrainId: "mud", rect: { x: 0, y: 30, w: 48, h: 2 } },
		],
		overrides: [],
	},

	zones: {
		ura_base: { x: 14, y: 36, width: 20, height: 10 },
		fortress_center: { x: 18, y: 8, width: 12, height: 12 },
		west_bridge: { x: 10, y: 24, width: 6, height: 10 },
		center_bridge: { x: 21, y: 22, width: 6, height: 12 },
		east_bridge: { x: 32, y: 24, width: 6, height: 10 },
		spire_west: { x: 16, y: 10, width: 4, height: 4 },
		spire_north: { x: 22, y: 5, width: 4, height: 4 },
		spire_east: { x: 28, y: 10, width: 4, height: 4 },
	},

	placements: [
		// Player starting units
		{ type: "mudfoot", faction: "ura", zone: "ura_base", count: 6 },
		{ type: "shellcracker", faction: "ura", zone: "ura_base", count: 4 },
		{ type: "sapper", faction: "ura", zone: "ura_base", count: 2 },
		{ type: "river_rat", faction: "ura", zone: "ura_base", count: 3 },

		// Pre-built player base
		{ type: "command_post", faction: "ura", x: 24, y: 40 },
		{ type: "barracks", faction: "ura", x: 20, y: 38 },
		{ type: "armory", faction: "ura", x: 28, y: 38 },

		// Fortress defenses
		{ type: "command_post", faction: "scale_guard", x: 24, y: 14 },
		{ type: "venom_spire", faction: "scale_guard", x: 17, y: 12 },
		{ type: "venom_spire", faction: "scale_guard", x: 23, y: 6 },
		{ type: "venom_spire", faction: "scale_guard", x: 30, y: 12 },

		// Fortress garrison
		{ type: "gator", faction: "scale_guard", zone: "fortress_center", count: 6 },
		{ type: "viper", faction: "scale_guard", x: 20, y: 10, count: 2 },
		{ type: "viper", faction: "scale_guard", x: 28, y: 10, count: 2 },
		{ type: "snapper", faction: "scale_guard", x: 24, y: 12, count: 2 },

		// Beach patrols
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 14,
			y: 20,
			patrol: [
				[14, 20],
				[34, 20],
				[14, 20],
			],
		},

		// Resources
		{ type: "fish_spot", faction: "neutral", x: 6, y: 38 },
		{ type: "fish_spot", faction: "neutral", x: 42, y: 38 },
		{ type: "salvage_cache", faction: "neutral", x: 24, y: 44 },
	],

	startResources: { fish: 350, timber: 250, salvage: 150 },
	startPopCap: 25,

	weather: {
		pattern: [
			{ type: "clear", startTime: 0, duration: 120 },
			{ type: "rain", startTime: 120, duration: 120 },
			{ type: "clear", startTime: 240, duration: 120 },
			{ type: "rain", startTime: 360, duration: 120 },
			{ type: "clear", startTime: 480, duration: 120 },
			{ type: "storm", startTime: 600, duration: 120 },
		],
	},

	objectives: {
		primary: [objective("destroy-enemy-cp", "Destroy the Scale-Guard Command Post")],
		bonus: [objective("destroy-all-spires", "Destroy all 3 Venom Spires")],
	},

	triggers: [
		trigger(
			"mission-start",
			on.timer(3),
			act.dialogue(
				"gen_whiskers",
				"Tide is out for the first two minutes. The land bridges are passable — use this window to scout their defenses. Don't commit your main force yet.",
			),
		),
		trigger(
			"tide-rising-1",
			on.timer(120),
			act.dialogue("gen_whiskers", "Tide is rising! Pull back from the flats or your units will be caught in the water."),
		),
		trigger(
			"tide-low-2",
			on.timer(240),
			act.dialogue("gen_whiskers", "Low tide again. Two minutes to push across. Make this one count."),
		),
		trigger(
			"tide-rising-2",
			on.timer(360),
			act.dialogue("gen_whiskers", "Water's coming back in. Get off the flats!"),
		),
		trigger(
			"tide-low-3",
			on.timer(480),
			act.dialogue(
				"gen_whiskers",
				"Third low tide. If you haven't breached the fortress yet, this is your window. All in, Sergeant.",
			),
		),
		trigger("fortress-breached", on.areaEntered("ura", "fortress_center"), [
			act.dialogue("gen_whiskers", "You're inside the fortress! Push for their Command Post. Expect heavy resistance."),
			act.spawn("gator", "scale_guard", 24, 8, 3),
			act.spawn("viper", "scale_guard", 22, 16, 2),
		]),
		trigger("spire-bonus-check", on.buildingCount("scale_guard", "venom_spire", "eq", 0), [
			act.completeObjective("destroy-all-spires"),
			act.dialogue("gen_whiskers", "All Venom Spires neutralized. Approaches are clear."),
		]),
		trigger(
			"cp-destroyed",
			on.buildingCount("scale_guard", "command_post", "eq", 0),
			act.completeObjective("destroy-enemy-cp"),
		),
		trigger("mission-complete", on.allPrimaryComplete(), [
			act.dialogue(
				"gen_whiskers",
				"Stonebreak Fortress has fallen. Scale-Guard's regional command is shattered. The Blackmarsh campaign is nearly won.",
			),
			act.victory(),
		]),
	],

	unlocks: {},

	parTime: 900,

	difficulty: {
		support: {
			enemyDamageMultiplier: 0.8,
			enemyHpMultiplier: 0.8,
			resourceMultiplier: 1.5,
			xpMultiplier: 1.0,
		},
		tactical: {
			enemyDamageMultiplier: 1.0,
			enemyHpMultiplier: 1.0,
			resourceMultiplier: 1.0,
			xpMultiplier: 1.2,
		},
		elite: {
			enemyDamageMultiplier: 1.4,
			enemyHpMultiplier: 1.4,
			resourceMultiplier: 0.75,
			xpMultiplier: 1.5,
		},
	},
};
