// Mission 4: Prison Break — Commando / Rescue
//
// Sgt. Bubbles and 2 scouts must infiltrate a Scale-Guard compound,
// rescue Gen. Whiskers, and escape to the extraction point.
// Teaches: stealth, detection, hero abilities.
// Win: Rescue Gen. Whiskers, escape to extraction.
// Par time: 5 min (300s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission04PrisonBreak: MissionDef = {
	id: "mission_4",
	chapter: 1,
	mission: 4,
	name: "Prison Break",
	subtitle: "Infiltrate a Scale-Guard compound and rescue Gen. Whiskers",

	briefing: {
		portraitId: "foxhound",
		lines: [
			{
				speaker: "FOXHOUND",
				text: "We found him. Gen. Whiskers is alive — held in a Scale-Guard detention compound northeast of the river bend. Warden Fangrot's operation.",
			},
			{
				speaker: "Sgt. Bubbles",
				text: "Force composition?",
			},
			{
				speaker: "FOXHOUND",
				text: "This isn't that kind of mission. Stealth only. Just you and two scouts. The compound has detection towers and regular patrols. If they see you, Fangrot locks it down.",
			},
			{
				speaker: "Sgt. Bubbles",
				text: "Cover?",
			},
			{
				speaker: "FOXHOUND",
				text: "Tall grass and mangroves along the southeast approach. Stay in the green, avoid the open ground. Reach the prison cell, free the General, then extract northwest.",
			},
			{
				speaker: "Sgt. Bubbles",
				text: "And if I trip the alarm?",
			},
			{
				speaker: "FOXHOUND",
				text: "Reinforcements flood the compound. The mission gets much harder. But not impossible — the General is worth the fight either way. Good luck, Sergeant.",
			},
		],
	},

	terrain: {
		width: 32,
		height: 28,
		regions: [
			// Base layer — dark jungle floor
			{ terrainId: "grass", fill: true },
			// Dense concealment mangroves — south infiltration path
			{ terrainId: "mangrove", rect: { x: 16, y: 20, w: 16, h: 8 } },
			// Western concealment corridor
			{ terrainId: "mangrove", rect: { x: 0, y: 12, w: 6, h: 10 } },
			// Compound clearing in the center-north
			{ terrainId: "dirt", rect: { x: 6, y: 3, w: 22, h: 14 } },
			// Prison cell area (center of compound)
			{ terrainId: "dirt", rect: { x: 13, y: 8, w: 6, h: 4 } },
			// Extraction point — cleared area northwest
			{ terrainId: "beach", rect: { x: 0, y: 0, w: 6, h: 4 } },
			// River along the north edge (extraction route)
			{
				terrainId: "water",
				river: {
					points: [
						[0, 5],
						[8, 4],
						[16, 6],
						[24, 3],
						[32, 5],
					],
					width: 2,
				},
			},
			// Mud around compound walls
			{ terrainId: "mud", rect: { x: 5, y: 2, w: 24, h: 1 } },
			{ terrainId: "mud", rect: { x: 5, y: 17, w: 24, h: 1 } },
		],
		overrides: [
			// Compound walls (represented as bridge/dirt tiles for visual contrast)
			// South entrance
			{ x: 15, y: 17, terrainId: "bridge" },
			{ x: 16, y: 17, terrainId: "bridge" },
			// North exit
			{ x: 15, y: 2, terrainId: "bridge" },
			{ x: 16, y: 2, terrainId: "bridge" },
			// Extraction bridge
			{ x: 5, y: 4, terrainId: "bridge" },
			{ x: 5, y: 5, terrainId: "bridge" },
		],
	},

	zones: {
		infiltration_start: { x: 25, y: 24, width: 6, height: 4 },
		compound_perimeter: { x: 6, y: 3, width: 22, height: 14 },
		prison_cell: { x: 13, y: 8, width: 6, height: 4 },
		extraction_point: { x: 0, y: 0, width: 6, height: 4 },
		south_approach: { x: 12, y: 16, width: 8, height: 6 },
		east_patrol_route: { x: 22, y: 4, width: 6, height: 12 },
		west_patrol_route: { x: 6, y: 4, width: 6, height: 12 },
		alarm_reinforcement_spawn: { x: 28, y: 2, width: 4, height: 4 },
	},

	placements: [
		// Player starting units — Sgt. Bubbles + 2 scouts
		{ type: "sgt_bubbles", faction: "ura", x: 27, y: 25 },
		{ type: "mudfoot", faction: "ura", x: 26, y: 25, count: 2 },

		// Compound guards — patrolling
		{
			type: "gator",
			faction: "scale_guard",
			x: 10,
			y: 10,
			patrol: [
				[10, 10],
				[10, 5],
				[10, 10],
			],
		},
		{
			type: "gator",
			faction: "scale_guard",
			x: 22,
			y: 10,
			patrol: [
				[22, 10],
				[22, 5],
				[22, 10],
			],
		},
		// Prison cell guards
		{ type: "gator", faction: "scale_guard", x: 13, y: 9 },
		{ type: "gator", faction: "scale_guard", x: 18, y: 9 },
		// Perimeter scouts
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 16,
			y: 16,
			patrol: [
				[12, 16],
				[20, 16],
				[12, 16],
			],
		},
		{
			type: "viper",
			faction: "scale_guard",
			x: 8,
			y: 6,
			patrol: [
				[8, 6],
				[8, 12],
				[8, 6],
			],
		},
		{
			type: "viper",
			faction: "scale_guard",
			x: 24,
			y: 6,
			patrol: [
				[24, 6],
				[24, 12],
				[24, 6],
			],
		},

		// Detection towers (Venom Spires)
		{ type: "venom_spire", faction: "scale_guard", x: 12, y: 4 },
		{ type: "venom_spire", faction: "scale_guard", x: 20, y: 4 },
		{ type: "venom_spire", faction: "scale_guard", x: 16, y: 14 },
	],

	startResources: { fish: 0, timber: 0, salvage: 0 },
	startPopCap: 4,

	objectives: {
		primary: [
			objective("rescue-whiskers", "Rescue Gen. Whiskers"),
			objective("extract-whiskers", "Escort Gen. Whiskers to extraction"),
		],
		bonus: [objective("no-alarm", "Complete without triggering the alarm")],
	},

	triggers: [
		trigger(
			"mission-start",
			on.timer(3),
			act.dialogue(
				"foxhound",
				"You're in position. Use the tall grass along the south for concealment. Detection towers have a radius — watch their coverage.",
			),
		),
		trigger(
			"compound-approach",
			on.areaEntered("ura", "south_approach"),
			act.dialogue(
				"foxhound",
				"You're near the perimeter. Two Venom Spires cover the east approach. Look for gaps in the patrol routes.",
			),
		),
		trigger(
			"entered-compound",
			on.areaEntered("ura", "compound_perimeter"),
			act.dialogue(
				"foxhound",
				"You're inside the perimeter. The prison cell should be in the center. Two guards flanking the entrance.",
			),
		),
		trigger("reached-cell", on.areaEntered("ura", "prison_cell"), [
			act.completeObjective("rescue-whiskers"),
			act.exchange([
				{ speaker: "Gen. Whiskers", text: "About time. I was starting to think command had written me off." },
				{ speaker: "Sgt. Bubbles", text: "Not a chance, General. Can you walk?" },
				{ speaker: "Gen. Whiskers", text: "I can fight. Fangrot keeps the keys on his belt and the exit logs on his desk. I know every corridor in this compound." },
				{ speaker: "Sgt. Bubbles", text: "Then lead the way. Extraction point is northwest." },
			]),
			act.spawn("gen_whiskers", "ura", 15, 9, 1),
		]),
		trigger(
			"extraction-hint",
			on.objectiveComplete("rescue-whiskers"),
			act.dialogue(
				"foxhound",
				"General is free! Extraction point is northwest — the cleared area at the river bend. Move fast.",
			),
		),
		trigger("extraction-reached", on.areaEntered("ura", "extraction_point"), [
			act.completeObjective("extract-whiskers"),
			act.exchange([
				{ speaker: "FOXHOUND", text: "Extraction confirmed. All units accounted for." },
				{ speaker: "Gen. Whiskers", text: "Outstanding work, Sergeant. I owe you one." },
				{ speaker: "Sgt. Bubbles", text: "You owe me a briefing, General." },
				{ speaker: "Gen. Whiskers", text: "You'll get one. From now on, I'm running the operations. FOXHOUND — stand down to relay duty." },
			]),
		]),
		trigger("alarm-triggered", on.timer(180), [
			act.dialogue(
				"foxhound",
				"They've spotted you! Compound is going into lockdown — expect heavy resistance!",
			),
			act.spawn("gator", "scale_guard", 28, 3, 3),
			act.spawn("gator", "scale_guard", 22, 15, 2),
			act.spawn("scout_lizard", "scale_guard", 7, 5, 2),
		]),
		trigger("bubbles-death", on.unitCount("ura", "sgt_bubbles", "eq", 0), act.failMission()),
		trigger("whiskers-death", on.unitCount("ura", "gen_whiskers", "eq", 0), act.failMission()),
		trigger("mission-complete", on.allPrimaryComplete(), [
			act.dialogue(
				"gen_whiskers",
				"Chapter One complete. The first landing was a success. But the war for the Copper-Silt Reach is only beginning.",
			),
			act.victory(),
		]),
	],

	unlocks: {
		heroes: ["sgt_bubbles", "gen_whiskers"],
	},

	parTime: 300,

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
