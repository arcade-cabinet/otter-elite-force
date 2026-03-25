// Mission 8: The Underwater Cache — Hero + Stealth
//
// Rescue Cpl. Splash, then use her underwater ability to reach a hidden cache.
// Teaches: hero abilities, underwater traversal, stealth extraction.
// Win: Rescue Splash, recover cache, extract north.
// Par time: 6 min (360s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission08UnderwaterCache: MissionDef = {
	id: "mission_8",
	chapter: 2,
	mission: 4,
	name: "The Underwater Cache",
	subtitle: "Rescue Cpl. Splash and recover a submerged munitions cache",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "Bubbles, we've confirmed Cpl. Splash is being held at a Scale-Guard outpost on the southeast shore of Lake Copper. She's alive — barely.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "This is a small-team operation. You, Bubbles, plus three Mudfoots. No base. No reinforcements. Scale-Guard patrols the shoreline.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Here's the real objective: intelligence says there's a pre-war munitions cache submerged in the center of the lake. Only someone with Splash's underwater capability can reach it.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Rescue Splash, clear a path to the shore, then get her into the water. Recover the cache and extract everyone to the northern landing zone.",
			},
		],
	},

	terrain: {
		width: 36,
		height: 32,
		regions: [
			{ terrainId: "grass", fill: true },
			// Large lake in center
			{ terrainId: "water", circle: { cx: 18, cy: 14, r: 8 } },
			// Mud shoreline
			{ terrainId: "mud", circle: { cx: 18, cy: 14, r: 10 } },
			// Refill water on top of mud (mud is the ring, water is inner)
			{ terrainId: "water", circle: { cx: 18, cy: 14, r: 8 } },
			// Concealment mangroves — south infiltration path
			{ terrainId: "mangrove", rect: { x: 10, y: 24, w: 16, h: 6 } },
			// SE outpost clearing (Splash's cell)
			{ terrainId: "dirt", rect: { x: 26, y: 20, w: 8, h: 8 } },
			// Northern extraction zone
			{ terrainId: "beach", rect: { x: 10, y: 0, w: 16, h: 3 } },
		],
		overrides: [],
	},

	zones: {
		infiltration_start: { x: 14, y: 28, width: 8, height: 4 },
		splash_cell: { x: 28, y: 22, width: 5, height: 5 },
		lake_center: { x: 14, y: 11, width: 8, height: 6 },
		extraction_lz: { x: 10, y: 0, width: 16, height: 3 },
		south_approach: { x: 10, y: 24, width: 16, height: 6 },
		shore_east: { x: 26, y: 10, width: 6, height: 8 },
	},

	placements: [
		// Player starting units
		{ type: "sgt_bubbles", faction: "ura", x: 17, y: 29 },
		{ type: "mudfoot", faction: "ura", x: 16, y: 28, count: 3 },

		// Splash's cell guards
		{ type: "gator", faction: "scale_guard", x: 29, y: 23 },
		{ type: "gator", faction: "scale_guard", x: 31, y: 23 },
		{ type: "viper", faction: "scale_guard", x: 30, y: 25 },

		// Lake shore patrols
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 10,
			y: 22,
			patrol: [
				[10, 22],
				[26, 22],
				[10, 22],
			],
		},
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 26,
			y: 8,
			patrol: [
				[26, 8],
				[10, 8],
				[26, 8],
			],
		},

		// Venom Spires covering approaches
		{ type: "venom_spire", faction: "scale_guard", x: 28, y: 18 },
		{ type: "venom_spire", faction: "scale_guard", x: 24, y: 22 },
	],

	startResources: { fish: 0, timber: 0, salvage: 0 },
	startPopCap: 5,

	objectives: {
		primary: [
			objective("rescue-splash", "Rescue Cpl. Splash"),
			objective("recover-cache", "Recover the underwater cache"),
			objective("extract-north", "Extract to northern LZ"),
		],
		bonus: [objective("no-casualties", "Complete without losing any units")],
	},

	triggers: [
		trigger(
			"mission-start",
			on.timer(3),
			act.dialogue(
				"gen_whiskers",
				"You're on the south shore. Splash's cell is to the southeast — use the tall grass for concealment. Scout-Lizards patrol both flanks of the lake.",
			),
		),
		trigger(
			"approach-cell",
			on.areaEntered("ura", "splash_cell"),
			act.dialogue(
				"gen_whiskers",
				"Cell ahead. Three guards — two Gators and a Viper. Take them out quickly before they raise the alarm.",
			),
		),
		trigger("splash-rescued", on.areaEntered("ura", "splash_cell"), [
			act.completeObjective("rescue-splash"),
			act.spawn("cpl_splash", "ura", 30, 24, 1),
			act.dialogue(
				"cpl_splash",
				"Bubbles! Took you long enough. I can still swim — get me to that lake and I'll dive for the cache.",
			),
		]),
		trigger(
			"activate-cache-objective",
			on.objectiveComplete("rescue-splash"),
			act.dialogue(
				"gen_whiskers",
				"Splash is free. Move her to the lake shore. She can enter the water and swim to the cache coordinates in the center.",
			),
		),
		trigger("cache-recovered", on.areaEntered("ura", "lake_center"), [
			act.completeObjective("recover-cache"),
			act.dialogue(
				"cpl_splash",
				"Found it! Pre-war munitions, sealed tight. Bringing it up now. Head for the northern extraction — I'll meet you there.",
			),
		]),
		trigger("activate-extraction", on.objectiveComplete("recover-cache"), [
			act.dialogue(
				"gen_whiskers",
				"Cache recovered! Extraction point is the north shore. Get everyone there.",
			),
			act.spawn("scout_lizard", "scale_guard", 10, 5, 2),
			act.spawn("gator", "scale_guard", 24, 5, 2),
		]),
		trigger(
			"extraction-reached",
			on.areaEntered("ura", "extraction_lz"),
			act.completeObjective("extract-north"),
		),
		trigger("bubbles-death", on.unitCount("ura", "sgt_bubbles", "eq", 0), act.failMission()),
		trigger("splash-death", on.unitCount("ura", "cpl_splash", "eq", 0), act.failMission()),
		trigger("mission-complete", on.allPrimaryComplete(), [
			act.dialogue(
				"cpl_splash",
				"Cache secured, team extracted. Thanks for the rescue, Bubbles. Chapter 2 complete — the Copper-Silt Reach is turning in our favor.",
			),
			act.victory(),
		]),
	],

	unlocks: {
		heroes: ["cpl_splash"],
	},

	parTime: 360,

	difficulty: {
		support: {
			enemyDamageMultiplier: 0.7,
			enemyHpMultiplier: 0.8,
			resourceMultiplier: 1.0,
			xpMultiplier: 1.0,
		},
		tactical: {
			enemyDamageMultiplier: 1.0,
			enemyHpMultiplier: 1.0,
			resourceMultiplier: 1.0,
			xpMultiplier: 1.2,
		},
		elite: {
			enemyDamageMultiplier: 1.5,
			enemyHpMultiplier: 1.3,
			resourceMultiplier: 1.0,
			xpMultiplier: 1.5,
		},
	},
};
