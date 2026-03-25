// Mission 6: Monsoon Ambush — Survival / Timed
//
// Pre-built base. 8 waves of Scale-Guard across 3 monsoon cycles.
// Teaches: defensive strategy, weather adaptation, rally points.
// Win: Survive all 8 waves.
// Par time: 20 min (1200s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission06MonsoonAmbush: MissionDef = {
	id: "mission_6",
	chapter: 2,
	mission: 2,
	name: "Monsoon Ambush",
	subtitle: "Defend your base through 8 waves and 3 monsoon cycles",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "Big push coming. Scale-Guard is massing for a full assault on our forward base. And monsoon season just decided to show up.",
			},
			{
				speaker: "Sgt. Bubbles",
				text: "How bad?",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Eight waves from all four approach roads. The mud is going to slow everyone — ranged accuracy drops, movement bogs down. Use the terrain, not just your walls.",
			},
			{
				speaker: "Sgt. Bubbles",
				text: "What's my garrison?",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Pre-built base: Command Post, two Barracks, Armory, four towers, sandbag perimeter. You've got troops in position. No time to build more — they're already moving.",
			},
			{
				speaker: "Sgt. Bubbles",
				text: "Shellcrackers at the chokepoints. Mudfoots behind the walls. We hold or we lose the Reach.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "That's the spirit. Dig in, Sergeant.",
			},
		],
	},

	terrain: {
		width: 48,
		height: 40,
		regions: [
			{ terrainId: "grass", fill: true },
			// Mud patches at approach roads (slows during rain)
			{ terrainId: "mud", rect: { x: 0, y: 16, w: 8, h: 8 } },
			{ terrainId: "mud", rect: { x: 40, y: 16, w: 8, h: 8 } },
			{ terrainId: "mud", rect: { x: 18, y: 0, w: 12, h: 6 } },
			{ terrainId: "mud", rect: { x: 18, y: 34, w: 12, h: 6 } },
			// Base clearing in center
			{ terrainId: "dirt", rect: { x: 16, y: 14, w: 16, h: 12 } },
			// Approach road corridors
			{ terrainId: "dirt", rect: { x: 0, y: 18, w: 48, h: 4 } },
			{ terrainId: "dirt", rect: { x: 22, y: 0, w: 4, h: 40 } },
		],
		overrides: [],
	},

	zones: {
		base_center: { x: 16, y: 14, width: 16, height: 12 },
		nw_approach: { x: 0, y: 0, width: 6, height: 4 },
		ne_approach: { x: 42, y: 0, width: 6, height: 4 },
		sw_approach: { x: 0, y: 36, width: 6, height: 4 },
		se_approach: { x: 42, y: 36, width: 6, height: 4 },
		west_road: { x: 0, y: 16, width: 8, height: 8 },
		east_road: { x: 40, y: 16, width: 8, height: 8 },
	},

	placements: [
		// Player garrison
		{ type: "mudfoot", faction: "ura", zone: "base_center", count: 4 },
		{ type: "shellcracker", faction: "ura", zone: "base_center", count: 4 },
		{ type: "river_rat", faction: "ura", zone: "base_center", count: 2 },

		// Pre-built base
		{ type: "command_post", faction: "ura", x: 24, y: 19 },
		{ type: "barracks", faction: "ura", x: 21, y: 17 },
		{ type: "barracks", faction: "ura", x: 27, y: 17 },
		{ type: "armory", faction: "ura", x: 24, y: 16 },
		{ type: "watchtower", faction: "ura", x: 18, y: 15 },
		{ type: "watchtower", faction: "ura", x: 30, y: 15 },
		{ type: "watchtower", faction: "ura", x: 18, y: 23 },
		{ type: "watchtower", faction: "ura", x: 30, y: 23 },

		// Resources near base
		{ type: "fish_spot", faction: "neutral", x: 20, y: 28 },
		{ type: "fish_spot", faction: "neutral", x: 28, y: 12 },
	],

	startResources: { fish: 300, timber: 200, salvage: 100 },
	startPopCap: 16,

	weather: {
		pattern: [
			{ type: "clear", startTime: 0, duration: 180 },
			{ type: "rain", startTime: 180, duration: 180 },
			{ type: "storm", startTime: 360, duration: 240 },
			{ type: "clear", startTime: 600, duration: 180 },
			{ type: "rain", startTime: 780, duration: 120 },
			{ type: "clear", startTime: 900, duration: 120 },
		],
	},

	objectives: {
		primary: [objective("survive-all-waves", "Survive all 8 waves")],
		bonus: [objective("cp-health-bonus", "Keep Command Post above 50% HP")],
	},

	triggers: [
		trigger(
			"mission-start",
			on.timer(3),
			act.dialogue(
				"gen_whiskers",
				"Position your forces at the approach roads. Mud patches slow movement during rain — bait enemies through them. First wave incoming soon.",
			),
		),
		trigger("wave-1", on.timer(90), [
			act.dialogue("gen_whiskers", "Wave 1 — scouts from the northwest road!"),
			act.spawn("scout_lizard", "scale_guard", 4, 1, 3),
			act.spawn("gator", "scale_guard", 4, 2, 2),
		]),
		trigger("wave-2", on.timer(210), [
			act.dialogue("gen_whiskers", "Wave 2 — southeast road. They're using the rain for cover!"),
			act.spawn("gator", "scale_guard", 44, 37, 4),
			act.spawn("scout_lizard", "scale_guard", 45, 37, 2),
		]),
		trigger("wave-3", on.timer(300), [
			act.dialogue("gen_whiskers", "Wave 3 — pincer from both north roads!"),
			act.spawn("gator", "scale_guard", 4, 1, 3),
			act.spawn("gator", "scale_guard", 44, 1, 3),
			act.spawn("viper", "scale_guard", 4, 2, 2),
		]),
		trigger("wave-4", on.timer(420), [
			act.dialogue("gen_whiskers", "Wave 4 — heavy column from the southwest!"),
			act.spawn("gator", "scale_guard", 4, 37, 4),
			act.spawn("snapper", "scale_guard", 5, 37, 2),
			act.spawn("viper", "scale_guard", 4, 38, 2),
		]),
		trigger("wave-5", on.timer(540), [
			act.dialogue("gen_whiskers", "Wave 5 — they're coming from everywhere! All roads!"),
			act.spawn("gator", "scale_guard", 4, 1, 2),
			act.spawn("gator", "scale_guard", 44, 1, 2),
			act.spawn("gator", "scale_guard", 4, 37, 2),
			act.spawn("gator", "scale_guard", 44, 37, 2),
		]),
		trigger("wave-6", on.timer(660), [
			act.dialogue("gen_whiskers", "Wave 6 — elite units. Vipers and Snappers from the flanks."),
			act.spawn("viper", "scale_guard", 0, 18, 3),
			act.spawn("snapper", "scale_guard", 46, 18, 2),
			act.spawn("viper", "scale_guard", 46, 25, 2),
		]),
		trigger("wave-7", on.timer(780), [
			act.dialogue("gen_whiskers", "Wave 7 — the rain's back and so is the assault!"),
			act.spawn("gator", "scale_guard", 4, 1, 3),
			act.spawn("gator", "scale_guard", 44, 37, 3),
			act.spawn("viper", "scale_guard", 44, 1, 2),
			act.spawn("snapper", "scale_guard", 4, 37, 2),
		]),
		trigger("wave-8", on.timer(900), [
			act.dialogue(
				"gen_whiskers",
				"FINAL WAVE! Everything they've got — all four roads! Hold that line, Sergeant!",
			),
			act.spawn("gator", "scale_guard", 4, 1, 4),
			act.spawn("gator", "scale_guard", 44, 37, 4),
			act.spawn("viper", "scale_guard", 44, 1, 3),
			act.spawn("snapper", "scale_guard", 4, 37, 3),
			act.spawn("viper", "scale_guard", 0, 18, 2),
			act.spawn("snapper", "scale_guard", 46, 25, 2),
		]),
		trigger("waves-cleared", on.timer(1020), [
			act.completeObjective("survive-all-waves"),
			act.dialogue(
				"gen_whiskers",
				"All waves repelled. The base held. Outstanding defense, Sergeant.",
			),
		]),
		trigger("cp-destroyed", on.buildingCount("ura", "command_post", "eq", 0), act.failMission()),
		trigger("mission-complete", on.allPrimaryComplete(), [
			act.dialogue(
				"gen_whiskers",
				"The monsoon assault failed. Scale-Guard is retreating. This position is ours.",
			),
			act.victory(),
		]),
	],

	unlocks: {},

	parTime: 1200,

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
			enemyDamageMultiplier: 1.3,
			enemyHpMultiplier: 1.3,
			resourceMultiplier: 0.75,
			xpMultiplier: 1.5,
		},
	},
};
