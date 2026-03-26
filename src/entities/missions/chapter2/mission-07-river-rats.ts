// Mission 7: River Rats — Supply Barge Interception
//
// 128x128 river-centric map with three waterway channels.
// Scale-Guard supply barges ferry munitions crates downstream.
// OEF must intercept and capture 5 crates using Raftsmen and Divers.
// Teaches: water-unit tactics, interception, multi-channel control.
// Win: Capture 5 enemy supply crates. Lose: Lodge destroyed.
// Par time: 18 min (1080s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission07RiverRats: MissionDef = {
	id: "mission_7",
	chapter: 2,
	mission: 3,
	name: "River Rats",
	subtitle: "Intercept Scale-Guard supply barges across three river channels",

	briefing: {
		portraitId: "foxhound",
		lines: [
			{
				speaker: "FOXHOUND",
				text: "Captain, Scale-Guard is running supply barges through three river channels in this sector. They're ferrying munitions to a depot downstream.",
			},
			{
				speaker: "Col. Bubbles",
				text: "We need those supplies. Your Raftsmen can intercept barges on the water. Divers can swim under and board from below.",
			},
			{
				speaker: "FOXHOUND",
				text: "Three channels: the South Bend closest to you, the Main Channel in the center, and the North Fork farthest out. Barges run at intervals. Each one carries a supply crate.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Set up interception points along the channels. Raftsmen deploy a raft and position it in the barge's path. Divers are invisible while submerged — faster boarding, but they can only carry one crate at a time.",
			},
			{
				speaker: "FOXHOUND",
				text: "Five crates, Captain. Capture five and their supply line through this sector is broken. Good hunting.",
			},
		],
	},

	terrain: {
		width: 128,
		height: 128,
		regions: [
			{ terrainId: "grass", fill: true },
			// Forward base clearing
			{ terrainId: "dirt", rect: { x: 20, y: 96, w: 88, h: 16 } },
			// Swamp south
			{ terrainId: "mangrove", rect: { x: 0, y: 112, w: 128, h: 16 } },
			{ terrainId: "water", circle: { cx: 24, cy: 120, r: 4 } },
			{ terrainId: "water", circle: { cx: 80, cy: 118, r: 3 } },
			// South bank (jungle west, open ground east)
			{ terrainId: "mangrove", rect: { x: 0, y: 78, w: 60, h: 12 } },
			{ terrainId: "grass", rect: { x: 64, y: 78, w: 64, h: 12 } },
			// South Bend river channel
			{
				terrainId: "water",
				river: {
					points: [
						[0, 72],
						[24, 70],
						[48, 74],
						[72, 70],
						[96, 72],
						[128, 70],
					],
					width: 6,
				},
			},
			// South island (mangrove)
			{ terrainId: "mangrove", rect: { x: 12, y: 58, w: 32, h: 8 } },
			// Sandbar (shallow water / sand)
			{ terrainId: "beach", rect: { x: 76, y: 58, w: 32, h: 8 } },
			{ terrainId: "mud", circle: { cx: 88, cy: 62, r: 4 } },
			// Main Channel river (widest)
			{
				terrainId: "water",
				river: {
					points: [
						[0, 52],
						[20, 50],
						[44, 54],
						[68, 50],
						[92, 52],
						[128, 50],
					],
					width: 8,
				},
			},
			// Mid-island west (jungle with clearing)
			{ terrainId: "mangrove", rect: { x: 12, y: 34, w: 40, h: 12 } },
			{ terrainId: "dirt", rect: { x: 24, y: 38, w: 12, h: 6 } },
			// Mid-island east (cleared, watchtower position)
			{ terrainId: "dirt", rect: { x: 68, y: 36, w: 40, h: 8 } },
			// North Fork river channel
			{
				terrainId: "water",
				river: {
					points: [
						[0, 28],
						[28, 26],
						[56, 30],
						[84, 26],
						[112, 28],
						[128, 26],
					],
					width: 6,
				},
			},
			// North bank (dense jungle)
			{ terrainId: "mangrove", rect: { x: 0, y: 12, w: 128, h: 12 } },
			// SG depot (fortified)
			{ terrainId: "stone", rect: { x: 40, y: 2, w: 48, h: 8 } },
			{ terrainId: "dirt", rect: { x: 4, y: 4, w: 32, h: 6 } },
			{ terrainId: "dirt", rect: { x: 92, y: 4, w: 32, h: 6 } },
		],
		overrides: [],
	},

	zones: {
		forward_base: { x: 16, y: 92, width: 96, height: 24 },
		swamp_south: { x: 0, y: 112, width: 128, height: 16 },
		south_bank: { x: 0, y: 76, width: 128, height: 16 },
		south_bend: { x: 0, y: 68, width: 128, height: 8 },
		south_island: { x: 8, y: 56, width: 40, height: 12 },
		sandbar: { x: 72, y: 56, width: 40, height: 12 },
		main_channel: { x: 0, y: 48, width: 128, height: 8 },
		mid_island_w: { x: 8, y: 32, width: 48, height: 16 },
		mid_island_e: { x: 64, y: 32, width: 48, height: 16 },
		north_fork: { x: 0, y: 24, width: 128, height: 8 },
		north_bank: { x: 0, y: 12, width: 128, height: 12 },
		sg_depot: { x: 0, y: 0, width: 128, height: 12 },
	},

	placements: [
		// === Player (forward_base) ===
		// Lodge (Captain's field HQ)
		{ type: "burrow", faction: "ura", x: 56, y: 100 },
		// Pre-built dock
		{ type: "dock", faction: "ura", x: 64, y: 92 },
		// Starting workers
		{ type: "river_rat", faction: "ura", x: 52, y: 102 },
		{ type: "river_rat", faction: "ura", x: 60, y: 104 },
		{ type: "river_rat", faction: "ura", x: 48, y: 106 },
		// Starting Raftsmen (water transport)
		{ type: "raftsman", faction: "ura", x: 68, y: 96 },
		{ type: "raftsman", faction: "ura", x: 72, y: 98 },
		{ type: "raftsman", faction: "ura", x: 76, y: 96 },
		// Starting Divers (underwater ambush)
		{ type: "diver", faction: "ura", x: 80, y: 100 },
		{ type: "diver", faction: "ura", x: 84, y: 102 },
		// Starting combat (shore defense)
		{ type: "mudfoot", faction: "ura", x: 44, y: 98 },
		{ type: "mudfoot", faction: "ura", x: 40, y: 100 },

		// === Resources ===
		// Timber (south island mangrove)
		{ type: "mangrove_tree", faction: "neutral", x: 16, y: 60 },
		{ type: "mangrove_tree", faction: "neutral", x: 22, y: 58 },
		{ type: "mangrove_tree", faction: "neutral", x: 28, y: 62 },
		{ type: "mangrove_tree", faction: "neutral", x: 34, y: 59 },
		{ type: "mangrove_tree", faction: "neutral", x: 40, y: 61 },
		// Timber (mid-island west)
		{ type: "mangrove_tree", faction: "neutral", x: 16, y: 36 },
		{ type: "mangrove_tree", faction: "neutral", x: 24, y: 38 },
		{ type: "mangrove_tree", faction: "neutral", x: 32, y: 34 },
		{ type: "mangrove_tree", faction: "neutral", x: 44, y: 40 },
		// Fish (south bank)
		{ type: "fish_spot", faction: "neutral", x: 20, y: 80 },
		{ type: "fish_spot", faction: "neutral", x: 48, y: 82 },
		{ type: "fish_spot", faction: "neutral", x: 96, y: 78 },
		// Fish (swamp south — safe gathering)
		{ type: "fish_spot", faction: "neutral", x: 32, y: 116 },
		{ type: "fish_spot", faction: "neutral", x: 100, y: 120 },
		// Salvage (sandbar)
		{ type: "salvage_cache", faction: "neutral", x: 80, y: 60 },
		{ type: "salvage_cache", faction: "neutral", x: 88, y: 58 },
		{ type: "salvage_cache", faction: "neutral", x: 96, y: 62 },

		// === Enemies ===
		// Mid-island east watchtower + guards
		{ type: "watchtower", faction: "scale_guard", x: 80, y: 36 },
		{ type: "gator", faction: "scale_guard", x: 76, y: 38 },
		{ type: "gator", faction: "scale_guard", x: 84, y: 38 },
		{ type: "skink", faction: "scale_guard", x: 88, y: 34 },
		// North bank patrols
		{ type: "gator", faction: "scale_guard", x: 20, y: 16 },
		{ type: "gator", faction: "scale_guard", x: 36, y: 14 },
		{ type: "skink", faction: "scale_guard", x: 56, y: 16 },
		{ type: "gator", faction: "scale_guard", x: 80, y: 14 },
		{ type: "gator", faction: "scale_guard", x: 100, y: 16 },
		{ type: "viper", faction: "scale_guard", x: 112, y: 14 },
		// SG depot (heavily guarded)
		{ type: "flag_post", faction: "scale_guard", x: 64, y: 6 },
		{ type: "watchtower", faction: "scale_guard", x: 44, y: 4 },
		{ type: "watchtower", faction: "scale_guard", x: 84, y: 4 },
		{ type: "gator", faction: "scale_guard", x: 52, y: 4 },
		{ type: "gator", faction: "scale_guard", x: 60, y: 8 },
		{ type: "gator", faction: "scale_guard", x: 68, y: 8 },
		{ type: "gator", faction: "scale_guard", x: 76, y: 4 },
		{ type: "viper", faction: "scale_guard", x: 56, y: 2 },
		{ type: "viper", faction: "scale_guard", x: 72, y: 2 },
		{ type: "croc_champion", faction: "scale_guard", x: 64, y: 4 },
		// South bank patrol (light)
		{ type: "skink", faction: "scale_guard", x: 24, y: 82 },
		{ type: "gator", faction: "scale_guard", x: 92, y: 80 },
	],

	startResources: { fish: 150, timber: 100, salvage: 50 },
	startPopCap: 20,

	objectives: {
		primary: [objective("capture-crates", "Capture 5 enemy supply crates (0/5)")],
		bonus: [objective("bonus-destroy-depot", "Destroy the Scale-Guard depot")],
	},

	triggers: [
		// =====================================================================
		// PHASE 1: RECONNAISSANCE (0:00 - ~3:00)
		// =====================================================================

		// --- Opening briefing ---
		trigger(
			"phase:recon:foxhound-briefing",
			on.timer(8),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Captain, Scale-Guard is running supply barges through three river channels in this sector. They're ferrying munitions to a depot downstream.",
				},
				{
					speaker: "Col. Bubbles",
					text: "We need those supplies. Your Raftsmen can intercept barges on the water. Divers can swim under and board from below.",
				},
				{
					speaker: "FOXHOUND",
					text: "Three channels: the South Bend closest to you, the Main Channel in the center, and the North Fork farthest out. Barges run at intervals. Each one carries a supply crate.",
				},
			]),
		),

		trigger(
			"phase:recon:bubbles-tactics",
			on.timer(25),
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Set up interception points along the channels. Raftsmen can deploy a raft and position it in the barge's path — when the barge gets close, your units board and capture the crate.",
				},
				{
					speaker: "FOXHOUND",
					text: "Divers are invisible while submerged. Position them near a channel and they can ambush a barge from underwater. Faster than a raft, but they can only carry one crate at a time.",
				},
			]),
		),

		trigger(
			"phase:recon:first-barge-warning",
			on.timer(40),
			act.dialogue(
				"foxhound",
				"First barge spotted entering the South Bend from the west. Intercept it, Captain.",
			),
		),

		trigger(
			"phase:recon:south-bank-patrol",
			on.areaEntered("ura", "south_bank"),
			act.dialogue(
				"foxhound",
				"Scale-Guard patrol on the south bank. Light force — a Skink and a Gator. Clear them for safe passage to the channels.",
			),
		),

		// =====================================================================
		// PHASE 2: FIRST INTERCEPTS (~1:00 - ~9:00)
		// =====================================================================

		// --- Barge 1 (1:00) — South Bend, slow, unescorted ---
		trigger("phase:intercepts:barge-1-spawn", on.timer(60), [
			act.spawn("supply_barge", "scale_guard", 0, 72, 1),
			act.dialogue(
				"foxhound",
				"Barge One is in the South Bend. Moving slow — easy target. Get a Raftsman or Diver into position.",
			),
		]),

		// Barge 1 captured — player destroys the barge unit in south_bend
		trigger(
			"phase:intercepts:barge-1-capture",
			on.areaEntered("ura", "south_bend"),
			act.dialogue(
				"sgt_bubbles",
				"First crate secured! Good work. Bring it back to the lodge for credit. Four more to go.",
			),
		),

		// --- Barge 2 (3:00) — Main Channel, medium speed ---
		trigger("phase:intercepts:barge-2-spawn", on.timer(180), [
			act.spawn("supply_barge", "scale_guard", 0, 52, 1),
			act.dialogue(
				"foxhound",
				"Barge Two entering the Main Channel. Faster than the last one — you'll need to be in position already.",
			),
		]),

		trigger(
			"phase:intercepts:barge-2-capture",
			on.areaEntered("ura", "main_channel"),
			act.dialogue("foxhound", "Crate captured. Keep intercepting, Captain."),
		),

		// --- Barge 3 (5:00) — North Fork, medium speed, escorted ---
		trigger("phase:intercepts:barge-3-spawn", on.timer(300), [
			act.spawn("supply_barge", "scale_guard", 0, 28, 1),
			act.spawn("skink", "scale_guard", 4, 26, 2),
			act.dialogue(
				"foxhound",
				"Barge Three on the North Fork — and it's got an escort. Two Skink scouts running the banks alongside it.",
			),
		]),

		trigger(
			"phase:intercepts:barge-3-capture",
			on.areaEntered("ura", "north_fork"),
			act.dialogue("sgt_bubbles", "Another crate! Their supply line is hemorrhaging."),
		),

		// --- Mid-island approach ---
		trigger(
			"phase:intercepts:mid-island-approach",
			on.areaEntered("ura", "mid_island_e"),
			act.dialogue(
				"foxhound",
				"Watchtower on the mid-island. Scale-Guard observation post — take it out for better control of the Main Channel.",
			),
		),

		// --- Escalation at 3 barges destroyed (transition to Phase 3) ---
		trigger("phase:intercepts:crate-threshold-3", on.unitCount("scale_guard", "supply_barge", "lte", 0), [
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Three crates captured. They're going to tighten security on the remaining runs.",
				},
				{
					speaker: "FOXHOUND",
					text: "Confirmed — enemy is adding Gator escorts to the next barges. And they're speeding up.",
				},
			]),
			act.startPhase("contested-waters"),
			act.enableTrigger("phase:contested:briefing"),
		]),

		// =====================================================================
		// PHASE 3: CONTESTED WATERS (~9:00 - ~15:00)
		// =====================================================================

		trigger(
			"phase:contested:briefing",
			on.timer(545),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Scale-Guard is reinforcing the channels. Gator patrols on the banks, escort boats alongside barges. This gets harder from here.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Divers are your best asset now — they can slip past escorts underwater. Raftsmen will need combat support for direct interceptions.",
				},
			]),
			{ enabled: false },
		),

		// --- Barge 4 (9:00) — Main Channel, fast, heavy escort ---
		trigger("phase:contested:barge-4-spawn", on.timer(540), [
			act.spawn("supply_barge", "scale_guard", 0, 52, 1),
			act.spawn("gator", "scale_guard", 4, 48, 2),
			act.spawn("gator", "scale_guard", 4, 54, 2),
			act.dialogue(
				"foxhound",
				"Barge Four — Main Channel, fast with a Gator escort on both banks. They're running hard.",
			),
		]),

		trigger(
			"phase:contested:barge-4-capture",
			on.areaEntered("ura", "main_channel"),
			act.dialogue(
				"sgt_bubbles",
				"Four down, one to go! One more crate and we've gutted their supply run.",
			),
		),

		// --- Barge 5 (11:00) — South Bend, medium, escort ---
		trigger("phase:contested:barge-5-spawn", on.timer(660), [
			act.spawn("supply_barge", "scale_guard", 0, 72, 1),
			act.spawn("skink", "scale_guard", 4, 76, 2),
			act.spawn("gator", "scale_guard", 4, 68, 1),
			act.dialogue(
				"foxhound",
				"Barge Five on the South Bend. Escorted, but slower than the last. Good opportunity.",
			),
		]),

		trigger(
			"phase:contested:barge-5-capture",
			on.areaEntered("ura", "south_bend"),
			act.dialogue(
				"sgt_bubbles",
				"That's five! Outstanding interception work, Captain.",
			),
		),

		// --- Barge 6 (13:00) — North Fork, fast, heavy escort (backup) ---
		trigger("phase:contested:barge-6-spawn", on.timer(780), [
			act.spawn("supply_barge", "scale_guard", 0, 28, 1),
			act.spawn("gator", "scale_guard", 4, 24, 2),
			act.spawn("viper", "scale_guard", 4, 30, 1),
			act.dialogue(
				"foxhound",
				"Bonus barge on the North Fork — heavily escorted and fast. Last chance if you're short on crates.",
			),
		]),

		trigger(
			"phase:contested:barge-6-capture",
			on.areaEntered("ura", "north_fork"),
			act.dialogue("foxhound", "Crate captured from the backup run."),
		),

		// --- Barge 7 (15:00) — Main Channel, final backup ---
		trigger("phase:contested:barge-7-spawn", on.timer(900), [
			act.spawn("supply_barge", "scale_guard", 0, 52, 1),
			act.spawn("gator", "scale_guard", 4, 48, 3),
			act.spawn("croc_champion", "scale_guard", 4, 54, 1),
			act.dialogue(
				"foxhound",
				"Final supply run — Main Channel. Croc Champion escort. This is your last shot, Captain.",
			),
		]),

		trigger(
			"phase:contested:barge-7-capture",
			on.areaEntered("ura", "main_channel"),
			act.dialogue("sgt_bubbles", "Got it! That should be enough."),
		),

		// =====================================================================
		// PHASE 4: MISSION COMPLETE
		// =====================================================================

		// Five crates captured — all supply_barge units destroyed
		// The game tracks supply_barge kills as captured crates. When the player
		// has destroyed enough barges across all phases, complete the objective.
		trigger(
			"phase:complete:five-crates-captured",
			on.unitCount("scale_guard", "supply_barge", "eq", 0),
			act.completeObjective("capture-crates"),
			{ once: true },
		),

		// Victory sequence
		trigger("phase:complete:mission-victory", on.allPrimaryComplete(), [
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Five crates intercepted. Scale-Guard supply line through this sector is broken.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Those munitions will arm our next operation. Excellent river work, Captain.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "The water war is ours. Scale-Guard can build all the barges they want — if our Raftsmen and Divers control the channels, nothing gets through. Well done. HQ out.",
				},
			]),
			act.victory(),
		]),

		// =====================================================================
		// BONUS OBJECTIVE
		// =====================================================================

		trigger(
			"phase:bonus:destroy-sg-depot",
			on.buildingCount("scale_guard", "flag_post", "eq", 0),
			[
				act.completeObjective("bonus-destroy-depot"),
				act.dialogue(
					"foxhound",
					"Scale-Guard depot destroyed. They won't be running supplies through this sector again. Massive salvage haul, Captain.",
				),
			],
		),

		// =====================================================================
		// FAIL CONDITION
		// =====================================================================

		trigger(
			"phase:fail:lodge-destroyed",
			on.buildingCount("ura", "burrow", "eq", 0),
			act.failMission("The lodge has been destroyed. Mission failed."),
		),
	],

	unlocks: {},

	parTime: 1080,

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
