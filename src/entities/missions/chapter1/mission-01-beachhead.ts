// Mission 1-1: BEACHHEAD — Tutorial / Campaign Opener
//
// The URA deploys to the southern coast of the Copper-Silt Reach.
// Sandy beach transitions to jungle. River with damaged bridge bisects the map.
// Enemy outpost in the north.
//
// Phases:
//   1. LANDFALL      — gather 150 timber
//   2. BASE BUILDING — build Command Post + Barracks
//   3. THE CROSSING  — train Mudfoots, repair bridge, cross river
//   4. CLEAR OUTPOST — destroy the enemy Flag Post
//
// Win:  Complete all primary objectives (establish base, repair bridge, clear outpost)
// Lose: Lodge destroyed
// Par time: 15 min (900s)

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

// ---------------------------------------------------------------------------
// Helper: generate bridge tile overrides spanning a column range
// ---------------------------------------------------------------------------
function bridgeTiles(
	x: number,
	yStart: number,
	yEnd: number,
): { x: number; y: number; terrainId: string }[] {
	const tiles: { x: number; y: number; terrainId: string }[] = [];
	for (let y = yStart; y <= yEnd; y++) {
		tiles.push({ x, y, terrainId: "bridge" });
		tiles.push({ x: x + 1, y, terrainId: "bridge" });
	}
	return tiles;
}

export const mission01Beachhead: MissionDef = {
	id: "mission_1",
	chapter: 1,
	mission: 1,
	name: "Beachhead",
	subtitle: "Establish a forward operating base on the Copper-Silt Reach",

	// -----------------------------------------------------------------------
	// Briefing
	// -----------------------------------------------------------------------
	briefing: {
		portraitId: "foxhound",
		lines: [
			{
				speaker: "FOXHOUND",
				text: "HQ, this is FOXHOUND. Captain is on the ground at the Copper-Silt Reach. Southern coast — sandy beach, jungle inland, river bisecting the area north-south.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Good. Captain, you have four River Rats on the beach and a field lodge for drop-off. Priority one: timber from the mangrove grove to the northwest. We need materials before we can build anything.",
			},
			{
				speaker: "FOXHOUND",
				text: "Intel shows a damaged bridge over the river to the north. Only crossing point. Scale-Guard outpost beyond it — small garrison, Flag Post as their command structure.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Gather resources, build a Command Post and Barracks, train infantry, repair that bridge, and eliminate the outpost. That secures this beachhead for the campaign.",
			},
			{
				speaker: "Col. Bubbles",
				text: "There's also wreckage to the east — salvage cache. Strip it if you get the chance, but don't overextend. You have your orders, Captain. HQ out.",
			},
		],
	},

	// -----------------------------------------------------------------------
	// Terrain — 128x96 tiles (4096x3072 px)
	// -----------------------------------------------------------------------
	terrain: {
		width: 128,
		height: 96,
		regions: [
			// Base layer — lush jungle grass
			{ terrainId: "grass", fill: true },

			// Beach (southern coast)
			{ terrainId: "beach", rect: { x: 0, y: 76, w: 128, h: 20 } },

			// River (east-west, sinuous)
			{
				terrainId: "water",
				river: {
					points: [
						[0, 40],
						[20, 38],
						[40, 36],
						[64, 38],
						[80, 40],
						[100, 38],
						[128, 40],
					],
					width: 6,
				},
			},

			// Mud banks flanking river
			{ terrainId: "mud", rect: { x: 0, y: 32, w: 128, h: 4 } },
			{ terrainId: "mud", rect: { x: 0, y: 44, w: 128, h: 4 } },
			{ terrainId: "mud", circle: { cx: 20, cy: 36, r: 4 } },
			{ terrainId: "mud", circle: { cx: 100, cy: 42, r: 3 } },

			// Mangrove groves
			{ terrainId: "mangrove", rect: { x: 8, y: 52, w: 48, h: 12 } },
			{ terrainId: "mangrove", rect: { x: 8, y: 4, w: 48, h: 16 } },
			{ terrainId: "mangrove", circle: { cx: 100, cy: 24, r: 8 } },

			// Dirt clearing for player base
			{ terrainId: "dirt", rect: { x: 24, y: 64, w: 40, h: 12 } },
			// Dirt path leading to bridge
			{ terrainId: "dirt", rect: { x: 56, y: 46, w: 6, h: 18 } },

			// Salvage wreckage area
			{ terrainId: "dirt", rect: { x: 84, y: 56, w: 20, h: 8 } },

			// Enemy outpost clearing
			{ terrainId: "dirt", rect: { x: 68, y: 6, w: 40, h: 12 } },
		],
		overrides: [
			// Bridge (2 tiles wide, spanning river from y=34 to y=42)
			...bridgeTiles(58, 34, 42),
		],
	},

	// -----------------------------------------------------------------------
	// Zones (tile coordinates)
	// -----------------------------------------------------------------------
	zones: {
		landing_zone: { x: 16, y: 76, width: 96, height: 20 },
		dirt_clearing: { x: 24, y: 64, width: 40, height: 12 },
		jungle_south: { x: 8, y: 52, width: 48, height: 12 },
		salvage_field: { x: 80, y: 52, width: 40, height: 16 },
		mud_banks: { x: 0, y: 44, width: 128, height: 8 },
		river: { x: 0, y: 36, width: 128, height: 8 },
		bridge_crossing: { x: 56, y: 34, width: 16, height: 12 },
		jungle_north: { x: 8, y: 20, width: 112, height: 14 },
		enemy_outpost: { x: 64, y: 4, width: 48, height: 16 },
		jungle_nw: { x: 8, y: 4, width: 48, height: 16 },
	},

	// -----------------------------------------------------------------------
	// Placements
	// -----------------------------------------------------------------------
	placements: [
		// --- Player (landing_zone) ---
		// Lodge (Captain's field HQ)
		{ type: "burrow", faction: "ura", x: 40, y: 80 },
		// Starting workers
		{ type: "river_rat", faction: "ura", x: 36, y: 82 },
		{ type: "river_rat", faction: "ura", x: 42, y: 83 },
		{ type: "river_rat", faction: "ura", x: 38, y: 85 },
		{ type: "river_rat", faction: "ura", x: 44, y: 81 },

		// --- Resources ---
		// Timber (mangrove grove south)
		{ type: "mangrove_tree", faction: "neutral", x: 12, y: 54 },
		{ type: "mangrove_tree", faction: "neutral", x: 18, y: 56 },
		{ type: "mangrove_tree", faction: "neutral", x: 24, y: 55 },
		{ type: "mangrove_tree", faction: "neutral", x: 30, y: 58 },
		{ type: "mangrove_tree", faction: "neutral", x: 15, y: 60 },
		{ type: "mangrove_tree", faction: "neutral", x: 22, y: 62 },
		{ type: "mangrove_tree", faction: "neutral", x: 36, y: 57 },
		{ type: "mangrove_tree", faction: "neutral", x: 42, y: 59 },

		// Fish (river bank)
		{ type: "fish_spot", faction: "neutral", x: 30, y: 44 },
		{ type: "fish_spot", faction: "neutral", x: 50, y: 46 },
		{ type: "fish_spot", faction: "neutral", x: 75, y: 44 },

		// Salvage (wreckage field)
		{ type: "salvage_cache", faction: "neutral", x: 88, y: 58 },
		{ type: "salvage_cache", faction: "neutral", x: 94, y: 60 },
		{ type: "salvage_cache", faction: "neutral", x: 90, y: 56 },

		// --- Enemies (static outpost garrison, Phase 4) ---
		{ type: "flag_post", faction: "scale_guard", x: 80, y: 10 },
		{ type: "gator", faction: "scale_guard", x: 76, y: 8 },
		{ type: "gator", faction: "scale_guard", x: 82, y: 8 },
		{ type: "gator", faction: "scale_guard", x: 78, y: 12 },
		{ type: "gator", faction: "scale_guard", x: 84, y: 12 },
		{ type: "gator", faction: "scale_guard", x: 80, y: 14 },
		{ type: "gator", faction: "scale_guard", x: 86, y: 10 },
		{ type: "skink", faction: "scale_guard", x: 74, y: 6 },
		{ type: "viper", faction: "scale_guard", x: 88, y: 6 },
	],

	// -----------------------------------------------------------------------
	// Starting state
	// -----------------------------------------------------------------------
	startResources: { fish: 100, timber: 50, salvage: 0 },
	startPopCap: 10,

	// -----------------------------------------------------------------------
	// Objectives
	// -----------------------------------------------------------------------
	objectives: {
		primary: [
			objective("gather-timber", "Gather 150 timber from the mangrove grove"),
			objective("build-command-post", "Build a Command Post"),
			objective("build-barracks", "Build a Barracks"),
			objective("train-mudfoots", "Train 3 Mudfoots"),
			objective("repair-bridge", "Repair the bridge"),
			objective("cross-river", "Cross the river"),
			objective("destroy-outpost", "Destroy the enemy Flag Post"),
		],
		bonus: [objective("bonus-salvage", "Collect 50 salvage from the wreckage field")],
	},

	// -----------------------------------------------------------------------
	// Triggers — organized by phase
	// -----------------------------------------------------------------------
	triggers: [
		// =================================================================
		// PHASE 1: LANDFALL (active from mission start)
		// =================================================================

		// [0:15] FOXHOUND welcome
		trigger(
			"phase:landfall:foxhound-welcome",
			on.timer(15),
			act.dialogue(
				"foxhound",
				"Captain, you're on the ground. Mangrove grove to the northwest — timber for construction. Get your workers moving.",
			),
		),

		// [0:45] Col. Bubbles resource priority
		trigger(
			"phase:landfall:bubbles-resources",
			on.timer(45),
			act.dialogue(
				"col_bubbles",
				"Priority one: establish resource flow. Harvest timber, haul it back to the lodge. We need materials before we can build anything.",
			),
		),

		// Timber gathered -> complete objective, advance to Phase 2
		trigger(
			"phase:landfall:timber-gathered",
			on.resourceThreshold("timber", "gte", 150),
			[
				act.completeObjective("gather-timber"),
				act.dialogue(
					"foxhound",
					"Resource stockpile building nicely, Captain.",
				),
				act.startPhase("base-building"),
			],
		),

		// =================================================================
		// PHASE 2: BASE BUILDING (enabled by startPhase("base-building"))
		// =================================================================

		// Phase 2 briefing exchange
		trigger(
			"phase:base-building:briefing",
			on.timer(0),
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Good work, Captain. You've got materials. Build a Command Post for logistics — that's your upgrade path. Then a Barracks for infantry.",
				},
				{
					speaker: "FOXHOUND",
					text: "Command Post also unlocks Watchtowers and Fish Traps. You'll want both.",
				},
			]),
			{ enabled: false },
		),

		// Command Post built
		trigger(
			"phase:base-building:command-post-built",
			on.buildingCount("ura", "command_post", "gte", 1),
			[
				act.completeObjective("build-command-post"),
				act.dialogue(
					"col_bubbles",
					"Command Post operational. Now get that Barracks up — we need boots on the ground.",
				),
			],
			{ enabled: false },
		),

		// Barracks built
		trigger(
			"phase:base-building:barracks-built",
			on.buildingCount("ura", "barracks", "gte", 1),
			[
				act.completeObjective("build-barracks"),
				act.dialogue(
					"col_bubbles",
					"Barracks online. Train some Mudfoots, Captain. We're going to need them.",
				),
			],
			{ enabled: false },
		),

		// [5:00] Scout patrol spawn near river
		trigger(
			"phase:base-building:scout-patrol",
			on.timer(300),
			[
				act.spawn("skink", "scale_guard", 52, 30, 2),
				act.dialogue(
					"foxhound",
					"Movement near the river, Captain. Scale-Guard scouts. They're not aggressive yet — but they know this area.",
				),
			],
			{ enabled: false },
		),

		// Both buildings done -> enable Phase 3 briefing
		trigger(
			"phase:base-building:both-buildings-done",
			on.buildingCount("ura", "barracks", "gte", 1),
			act.enableTrigger("phase:base-building:check-command-post"),
			{ enabled: false },
		),

		// Two-step gate: barracks triggers check for command post
		trigger(
			"phase:base-building:check-command-post",
			on.buildingCount("ura", "command_post", "gte", 1),
			act.startPhase("crossing"),
			{ enabled: false },
		),

		// =================================================================
		// PHASE 3: THE CROSSING (enabled by startPhase("crossing"))
		// =================================================================

		// Phase 3 briefing exchange
		trigger(
			"phase:crossing:briefing",
			on.timer(0),
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Captain, we need to push north. The bridge crossing is our only path — it's damaged but repairable.",
				},
				{
					speaker: "FOXHOUND",
					text: "Send a worker to the bridge. They can patch it. But expect Scale-Guard resistance once you start work.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Train up some Mudfoots first. You'll want fighters before you start hammering.",
				},
			]),
			{ enabled: false },
		),

		// 3 Mudfoots trained
		trigger(
			"phase:crossing:mudfoots-trained",
			on.unitCount("ura", "mudfoot", "gte", 3),
			[
				act.completeObjective("train-mudfoots"),
				act.dialogue(
					"col_bubbles",
					"Squad's ready. Move on that bridge, Captain.",
				),
			],
			{ enabled: false },
		),

		// Worker enters bridge zone -> repair starts, defenders spawn
		trigger(
			"phase:crossing:bridge-repair-start",
			on.areaEntered("ura", "bridge_crossing", { unitType: "river_rat" }),
			[
				act.dialogue(
					"foxhound",
					"Bridge repair underway. This will draw attention, Captain.",
				),
				act.spawn("gator", "scale_guard", 60, 28, 4),
				act.spawn("skink", "scale_guard", 64, 26, 2),
				act.dialogue(
					"col_bubbles",
					"Contacts north of the bridge! Defend the workers!",
				),
				act.enableTrigger("phase:crossing:bridge-repaired"),
			],
			{ enabled: false },
		),

		// Bridge repaired — 30s timer after bridge-repair-start enables this
		trigger(
			"phase:crossing:bridge-repaired",
			on.timer(30),
			[
				act.completeObjective("repair-bridge"),
				act.dialogue(
					"foxhound",
					"Bridge is passable. Send your forces across.",
				),
			],
			{ enabled: false },
		),

		// URA unit crosses river into jungle_north
		trigger(
			"phase:crossing:river-crossed",
			on.areaEntered("ura", "jungle_north"),
			[
				act.completeObjective("cross-river"),
				act.startPhase("outpost"),
			],
			{ enabled: false },
		),

		// =================================================================
		// PHASE 4: CLEAR THE OUTPOST (enabled by startPhase("outpost"))
		// =================================================================

		// Phase 4 briefing exchange
		trigger(
			"phase:outpost:briefing",
			on.timer(0),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Enemy outpost ahead, northeast. Flag Post is their command structure — destroy it and they'll scatter.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Take it out, Captain. That outpost is the last obstacle to securing this beachhead.",
				},
			]),
			{ enabled: false },
		),

		// Unit enters outpost area
		trigger(
			"phase:outpost:approach",
			on.areaEntered("ura", "enemy_outpost"),
			act.dialogue(
				"foxhound",
				"You're in their perimeter. Multiple hostiles. Watch the flanks.",
			),
			{ enabled: false },
		),

		// Flag Post destroyed
		trigger(
			"phase:outpost:destroyed",
			on.buildingCount("scale_guard", "flag_post", "eq", 0),
			act.completeObjective("destroy-outpost"),
			{ enabled: false },
		),

		// =================================================================
		// MISSION COMPLETE (always active — waits for all primary objectives)
		// =================================================================
		trigger("mission-complete", on.allPrimaryComplete(), [
			act.exchange([
				{
					speaker: "Gen. Whiskers",
					text: "Outstanding work, Captain. Beachhead is secured. The Copper-Silt Reach campaign has begun.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Reinforcements and supplies inbound. Rest your troops — the next push won't be this easy. HQ out.",
				},
			]),
			act.victory(),
		]),

		// =================================================================
		// BONUS: Salvage discovery (always active)
		// =================================================================
		trigger(
			"salvage-discovery",
			on.areaEntered("ura", "salvage_field"),
			act.dialogue(
				"foxhound",
				"Wreckage to the east, Captain. Usable salvage in there.",
			),
		),

		trigger(
			"salvage-collected",
			on.resourceThreshold("salvage", "gte", 50),
			act.completeObjective("bonus-salvage"),
		),

		// =================================================================
		// LOSS CONDITION: Lodge destroyed
		// =================================================================
		trigger(
			"lodge-destroyed",
			on.buildingDestroyed("burrow"),
			act.failMission("Lodge destroyed — mission failed"),
		),
	],

	// -----------------------------------------------------------------------
	// Unlocks
	// -----------------------------------------------------------------------
	unlocks: {
		units: ["river_rat", "mudfoot"],
		buildings: [
			"command_post",
			"barracks",
			"watchtower",
			"fish_trap",
			"burrow",
			"sandbag_wall",
		],
	},

	// -----------------------------------------------------------------------
	// Par time: 15 minutes
	// -----------------------------------------------------------------------
	parTime: 900,

	// -----------------------------------------------------------------------
	// Difficulty scaling
	// -----------------------------------------------------------------------
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
