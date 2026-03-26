// Mission 14: Iron Delta — Amphibious 3-Island Capture
//
// The Iron Delta: widest navigable river system in Copper-Silt Reach, now a
// Scale-Guard naval stronghold. Three fortified island outposts control the
// waterways — Fishbone Island (west), Ironhull Atoll (center-north), and
// Mire Rock (east). Deep channels between islands are patrolled by Scale-Guard
// river forces. Player must seize all three islands to control the delta.
//
// Teaches: combined naval/land operations, forward dock infrastructure,
// multi-objective amphibious assault, water patrol timing.
// Win: Capture all 3 island outposts (destroy each island's Flag Post).
// Lose: Lodge destroyed.
// Bonus: No lodge damage + mass shallows crossing.
// Par time: 15 min (900s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission14IronDelta: MissionDef = {
	id: "mission_14",
	chapter: 4,
	mission: 2,
	name: "Iron Delta",
	subtitle: "Capture three island outposts across the Iron Delta",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "The Iron Delta, Captain. Three islands control the waterways that feed the entire northern Reach. Scale-Guard holds all three.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Fishbone Island to the west, Mire Rock to the east, Ironhull Atoll in the center-north. Each one has a Flag Post — destroy it, the island is ours.",
			},
			{
				speaker: "FOXHOUND",
				text: "This is amphibious warfare, Captain. Raftsmen can ferry troops across. Divers can swim undetected through deep channels. Use the shallows in the center for mass crossings.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Fishbone looks weakest. Start there, build a forward dock, and leapfrog to the next. Control the water, control the delta.",
			},
		],
	},

	terrain: {
		width: 160,
		height: 160,
		regions: [
			// Base layer — water everywhere
			{ terrainId: "deep_water", fill: true },

			// --- Player's southern landing island ---
			{ terrainId: "grass", rect: { x: 40, y: 96, w: 80, h: 24 } },
			{ terrainId: "beach", rect: { x: 40, y: 118, w: 80, h: 4 } },
			{ terrainId: "dirt", rect: { x: 48, y: 100, w: 64, h: 16 } },

			// --- Southern shore (player base mainland) ---
			{ terrainId: "grass", rect: { x: 0, y: 120, w: 160, h: 40 } },
			{ terrainId: "beach", rect: { x: 0, y: 118, w: 40, h: 4 } },
			{ terrainId: "beach", rect: { x: 120, y: 118, w: 40, h: 4 } },
			{ terrainId: "mangrove", rect: { x: 0, y: 124, w: 40, h: 12 } },
			{ terrainId: "mangrove", rect: { x: 124, y: 124, w: 36, h: 12 } },

			// --- Fishbone Island (west) ---
			{ terrainId: "grass", rect: { x: 4, y: 30, w: 48, h: 24 } },
			{ terrainId: "beach", rect: { x: 4, y: 28, w: 48, h: 2 } },
			{ terrainId: "beach", rect: { x: 4, y: 54, w: 48, h: 2 } },
			{ terrainId: "beach", rect: { x: 2, y: 30, w: 2, h: 24 } },
			{ terrainId: "beach", rect: { x: 52, y: 30, w: 2, h: 24 } },
			{ terrainId: "dirt", rect: { x: 12, y: 34, w: 32, h: 16 } },
			{ terrainId: "mangrove", rect: { x: 6, y: 32, w: 8, h: 12 } },

			// --- Ironhull Atoll (center-north, largest) ---
			{ terrainId: "grass", rect: { x: 52, y: 2, w: 64, h: 20 } },
			{ terrainId: "beach", rect: { x: 52, y: 0, w: 64, h: 2 } },
			{ terrainId: "beach", rect: { x: 52, y: 22, w: 64, h: 2 } },
			{ terrainId: "beach", rect: { x: 50, y: 2, w: 2, h: 20 } },
			{ terrainId: "beach", rect: { x: 116, y: 2, w: 2, h: 20 } },
			{ terrainId: "dirt", rect: { x: 60, y: 4, w: 48, h: 16 } },
			{ terrainId: "concrete", rect: { x: 72, y: 6, w: 24, h: 12 } },

			// --- Mire Rock Island (east) ---
			{ terrainId: "grass", rect: { x: 108, y: 30, w: 48, h: 24 } },
			{ terrainId: "beach", rect: { x: 108, y: 28, w: 48, h: 2 } },
			{ terrainId: "beach", rect: { x: 108, y: 54, w: 48, h: 2 } },
			{ terrainId: "beach", rect: { x: 106, y: 30, w: 2, h: 24 } },
			{ terrainId: "beach", rect: { x: 156, y: 30, w: 2, h: 24 } },
			{ terrainId: "dirt", rect: { x: 116, y: 34, w: 32, h: 16 } },
			{ terrainId: "mud", rect: { x: 108, y: 42, w: 16, h: 8 } },

			// --- Shallow fords (wadeable water between islands) ---
			{ terrainId: "shallow_water", rect: { x: 48, y: 52, w: 64, h: 12 } },

			// --- Reef areas (shallow but rocky — slow movement) ---
			{ terrainId: "reef", rect: { x: 4, y: 82, w: 32, h: 12 } },
			{ terrainId: "reef", rect: { x: 124, y: 82, w: 32, h: 12 } },

			// --- Supply docks (southern shore) ---
			{ terrainId: "dirt", rect: { x: 56, y: 140, w: 48, h: 8 } },
			{ terrainId: "concrete", rect: { x: 64, y: 142, w: 32, h: 4 } },
		],
		overrides: [],
	},

	zones: {
		player_base: { x: 48, y: 120, width: 64, height: 20 },
		supply_shore: { x: 0, y: 140, width: 160, height: 20 },
		coast_sw: { x: 0, y: 120, width: 48, height: 20 },
		coast_se: { x: 112, y: 120, width: 48, height: 20 },
		landing_island: { x: 40, y: 96, width: 80, height: 24 },
		reef_west: { x: 0, y: 80, width: 40, height: 16 },
		reef_east: { x: 120, y: 80, width: 40, height: 16 },
		southern_channel: { x: 40, y: 80, width: 80, height: 16 },
		deep_channel_sw: { x: 0, y: 64, width: 48, height: 16 },
		deep_channel_se: { x: 112, y: 64, width: 48, height: 16 },
		shallows: { x: 48, y: 52, width: 64, height: 12 },
		fishbone_island: { x: 0, y: 28, width: 56, height: 28 },
		central_channel: { x: 56, y: 32, width: 48, height: 20 },
		mire_rock_island: { x: 104, y: 28, width: 56, height: 28 },
		channel_west: { x: 32, y: 20, width: 40, height: 12 },
		channel_east: { x: 88, y: 20, width: 40, height: 12 },
		ironhull_atoll: { x: 48, y: 0, width: 72, height: 24 },
		deep_channel_nw: { x: 0, y: 0, width: 48, height: 28 },
	},

	placements: [
		// ─── Player base (southern mainland) ─────────────────────────────
		{ type: "lodge", faction: "ura", x: 80, y: 130 },
		{ type: "command_post", faction: "ura", x: 72, y: 126 },
		{ type: "barracks", faction: "ura", x: 88, y: 126 },
		{ type: "armory", faction: "ura", x: 64, y: 130 },
		{ type: "dock", faction: "ura", x: 80, y: 122 },
		{ type: "burrow", faction: "ura", x: 76, y: 134 },
		{ type: "burrow", faction: "ura", x: 84, y: 134 },
		{ type: "burrow", faction: "ura", x: 92, y: 134 },
		{ type: "shield_generator", faction: "ura", x: 96, y: 130 },

		// ─── Starting workers ────────────────────────────────────────────
		{ type: "river_rat", faction: "ura", x: 70, y: 132 },
		{ type: "river_rat", faction: "ura", x: 74, y: 133 },
		{ type: "river_rat", faction: "ura", x: 78, y: 132 },
		{ type: "river_rat", faction: "ura", x: 82, y: 133 },
		{ type: "river_rat", faction: "ura", x: 86, y: 132 },
		{ type: "river_rat", faction: "ura", x: 90, y: 133 },

		// ─── Starting land army (on landing island) ──────────────────────
		{ type: "mudfoot", faction: "ura", x: 56, y: 104 },
		{ type: "mudfoot", faction: "ura", x: 60, y: 104 },
		{ type: "mudfoot", faction: "ura", x: 64, y: 104 },
		{ type: "mudfoot", faction: "ura", x: 68, y: 104 },
		{ type: "mudfoot", faction: "ura", x: 72, y: 104 },
		{ type: "shellcracker", faction: "ura", x: 80, y: 106 },
		{ type: "shellcracker", faction: "ura", x: 84, y: 106 },
		{ type: "shellcracker", faction: "ura", x: 88, y: 106 },
		{ type: "mortar_otter", faction: "ura", x: 76, y: 108 },
		{ type: "mortar_otter", faction: "ura", x: 82, y: 108 },
		{ type: "sapper", faction: "ura", x: 92, y: 104 },

		// ─── Starting naval units ────────────────────────────────────────
		{ type: "raftsman", faction: "ura", x: 68, y: 116 },
		{ type: "raftsman", faction: "ura", x: 74, y: 116 },
		{ type: "raftsman", faction: "ura", x: 80, y: 116 },
		{ type: "diver", faction: "ura", x: 86, y: 116 },
		{ type: "diver", faction: "ura", x: 90, y: 116 },

		// ─── Resources ───────────────────────────────────────────────────

		// Timber (mangrove shores SW and SE)
		{ type: "mangrove_tree", faction: "neutral", x: 6, y: 126 },
		{ type: "mangrove_tree", faction: "neutral", x: 12, y: 128 },
		{ type: "mangrove_tree", faction: "neutral", x: 18, y: 130 },
		{ type: "mangrove_tree", faction: "neutral", x: 24, y: 126 },
		{ type: "mangrove_tree", faction: "neutral", x: 30, y: 132 },
		{ type: "mangrove_tree", faction: "neutral", x: 128, y: 126 },
		{ type: "mangrove_tree", faction: "neutral", x: 134, y: 128 },
		{ type: "mangrove_tree", faction: "neutral", x: 140, y: 130 },
		{ type: "mangrove_tree", faction: "neutral", x: 146, y: 126 },
		{ type: "mangrove_tree", faction: "neutral", x: 152, y: 132 },
		// Timber on Fishbone Island (small grove)
		{ type: "mangrove_tree", faction: "neutral", x: 8, y: 34 },
		{ type: "mangrove_tree", faction: "neutral", x: 10, y: 38 },
		{ type: "mangrove_tree", faction: "neutral", x: 12, y: 42 },

		// Fish (abundant — delta is rich fishing ground)
		{ type: "fish_spot", faction: "neutral", x: 30, y: 90 },
		{ type: "fish_spot", faction: "neutral", x: 50, y: 88 },
		{ type: "fish_spot", faction: "neutral", x: 70, y: 92 },
		{ type: "fish_spot", faction: "neutral", x: 90, y: 86 },
		{ type: "fish_spot", faction: "neutral", x: 110, y: 90 },
		{ type: "fish_spot", faction: "neutral", x: 130, y: 88 },
		{ type: "fish_spot", faction: "neutral", x: 60, y: 60 },
		{ type: "fish_spot", faction: "neutral", x: 100, y: 58 },

		// Salvage (on enemy islands — reward for capture)
		{ type: "salvage_cache", faction: "neutral", x: 20, y: 40 },
		{ type: "salvage_cache", faction: "neutral", x: 28, y: 44 },
		{ type: "salvage_cache", faction: "neutral", x: 36, y: 38 },
		{ type: "salvage_cache", faction: "neutral", x: 120, y: 40 },
		{ type: "salvage_cache", faction: "neutral", x: 128, y: 44 },
		{ type: "salvage_cache", faction: "neutral", x: 136, y: 38 },
		{ type: "salvage_cache", faction: "neutral", x: 76, y: 8 },
		{ type: "salvage_cache", faction: "neutral", x: 84, y: 12 },
		{ type: "salvage_cache", faction: "neutral", x: 92, y: 8 },

		// ─── Fishbone Island (west — lightly defended) ───────────────────
		{ type: "flag_post", faction: "scale_guard", x: 28, y: 40 },
		{ type: "watchtower", faction: "scale_guard", x: 16, y: 36 },
		{ type: "watchtower", faction: "scale_guard", x: 40, y: 44 },
		{ type: "gator", faction: "scale_guard", x: 20, y: 38 },
		{ type: "gator", faction: "scale_guard", x: 24, y: 42 },
		{ type: "gator", faction: "scale_guard", x: 32, y: 36 },
		{ type: "gator", faction: "scale_guard", x: 36, y: 42 },
		{ type: "skink", faction: "scale_guard", x: 44, y: 38 },
		{ type: "skink", faction: "scale_guard", x: 12, y: 44 },
		// Dock defense
		{ type: "gator", faction: "scale_guard", x: 50, y: 40 },
		{ type: "gator", faction: "scale_guard", x: 50, y: 44 },

		// ─── Mire Rock Island (east — medium defense) ────────────────────
		{ type: "flag_post", faction: "scale_guard", x: 132, y: 40 },
		{ type: "watchtower", faction: "scale_guard", x: 120, y: 34 },
		{ type: "watchtower", faction: "scale_guard", x: 144, y: 34 },
		{ type: "watchtower", faction: "scale_guard", x: 132, y: 48 },
		{ type: "bunker", faction: "scale_guard", x: 124, y: 40 },
		{ type: "gator", faction: "scale_guard", x: 116, y: 38 },
		{ type: "gator", faction: "scale_guard", x: 120, y: 42 },
		{ type: "gator", faction: "scale_guard", x: 128, y: 36 },
		{ type: "gator", faction: "scale_guard", x: 136, y: 42 },
		{ type: "gator", faction: "scale_guard", x: 140, y: 38 },
		{ type: "gator", faction: "scale_guard", x: 148, y: 40 },
		{ type: "viper", faction: "scale_guard", x: 126, y: 46 },
		{ type: "viper", faction: "scale_guard", x: 138, y: 46 },
		{ type: "croc_champion", faction: "scale_guard", x: 132, y: 44 },

		// ─── Ironhull Atoll (center-north — heavily fortified) ───────────
		{ type: "flag_post", faction: "scale_guard", x: 84, y: 10 },
		{ type: "predator_nest", faction: "scale_guard", x: 76, y: 8 },
		{ type: "watchtower", faction: "scale_guard", x: 60, y: 6 },
		{ type: "watchtower", faction: "scale_guard", x: 72, y: 4 },
		{ type: "watchtower", faction: "scale_guard", x: 96, y: 4 },
		{ type: "watchtower", faction: "scale_guard", x: 108, y: 6 },
		{ type: "bunker", faction: "scale_guard", x: 64, y: 12 },
		{ type: "bunker", faction: "scale_guard", x: 100, y: 12 },
		{ type: "venom_spire", faction: "scale_guard", x: 84, y: 18 },
		{ type: "croc_champion", faction: "scale_guard", x: 68, y: 10 },
		{ type: "croc_champion", faction: "scale_guard", x: 80, y: 14 },
		{ type: "croc_champion", faction: "scale_guard", x: 96, y: 10 },
		{ type: "gator", faction: "scale_guard", x: 56, y: 8 },
		{ type: "gator", faction: "scale_guard", x: 60, y: 14 },
		{ type: "gator", faction: "scale_guard", x: 72, y: 16 },
		{ type: "gator", faction: "scale_guard", x: 88, y: 16 },
		{ type: "gator", faction: "scale_guard", x: 100, y: 14 },
		{ type: "gator", faction: "scale_guard", x: 108, y: 10 },
		{ type: "viper", faction: "scale_guard", x: 64, y: 6 },
		{ type: "viper", faction: "scale_guard", x: 104, y: 6 },
		{ type: "snapper", faction: "scale_guard", x: 76, y: 12 },
		{ type: "snapper", faction: "scale_guard", x: 92, y: 12 },

		// ─── Water patrols (roaming between islands) ─────────────────────

		// Western channel patrol
		{
			type: "gator",
			faction: "scale_guard",
			x: 40,
			y: 24,
			patrol: [
				[40, 24],
				[40, 48],
				[28, 60],
				[40, 24],
			],
		},
		{
			type: "gator",
			faction: "scale_guard",
			x: 44,
			y: 26,
			patrol: [
				[44, 26],
				[44, 50],
				[32, 62],
				[44, 26],
			],
		},
		// Eastern channel patrol
		{
			type: "gator",
			faction: "scale_guard",
			x: 116,
			y: 24,
			patrol: [
				[116, 24],
				[116, 48],
				[128, 60],
				[116, 24],
			],
		},
		{
			type: "gator",
			faction: "scale_guard",
			x: 120,
			y: 26,
			patrol: [
				[120, 26],
				[120, 50],
				[132, 62],
				[120, 26],
			],
		},
		// Central channel patrol
		{
			type: "gator",
			faction: "scale_guard",
			x: 72,
			y: 28,
			patrol: [
				[72, 28],
				[88, 28],
				[96, 40],
				[72, 40],
				[72, 28],
			],
		},
		{
			type: "gator",
			faction: "scale_guard",
			x: 76,
			y: 30,
			patrol: [
				[76, 30],
				[92, 30],
				[100, 42],
				[76, 42],
				[76, 30],
			],
		},
		// Southern channel patrol
		{
			type: "skink",
			faction: "scale_guard",
			x: 60,
			y: 84,
			patrol: [
				[60, 84],
				[100, 84],
				[60, 84],
			],
		},
		{
			type: "skink",
			faction: "scale_guard",
			x: 64,
			y: 86,
			patrol: [
				[64, 86],
				[104, 86],
				[64, 86],
			],
		},
	],

	startResources: { fish: 500, timber: 300, salvage: 250 },
	startPopCap: 30,

	objectives: {
		primary: [
			objective("capture-fishbone", "Capture Fishbone Island — destroy the Flag Post"),
			objective("capture-mire-rock", "Capture Mire Rock Island — destroy the Flag Post"),
			objective("capture-ironhull", "Capture Ironhull Atoll — destroy the Flag Post"),
		],
		bonus: [
			objective("bonus-untouchable-base", "Capture all islands with Lodge at full health"),
			objective("bonus-mass-assault", "Cross the shallows with 6+ Mudfoots at once"),
		],
	},

	triggers: [
		// ─── PHASE 1: CONTROL THE WATERWAYS (0:00 - ~5:00) ──────────────

		trigger("phase:waterways:briefing", on.timer(1), [
			act.startPhase("waterways"),
			act.exchange([
				{
					speaker: "Gen. Whiskers",
					text: "The Iron Delta, Captain. Three islands control the waterways that feed the entire northern Reach. Scale-Guard holds all three.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Fishbone Island to the west, Mire Rock to the east, Ironhull Atoll in the center-north. Each one has a Flag Post — destroy it, the island is ours.",
				},
				{
					speaker: "FOXHOUND",
					text: "This is amphibious warfare, Captain. Raftsmen can ferry troops across. Divers can swim undetected through deep channels. Use the shallows in the center for mass crossings.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Fishbone looks weakest. Start there, build a forward dock, and leapfrog to the next. Control the water, control the delta.",
				},
			]),
		]),

		trigger(
			"phase:waterways:patrol-warning",
			on.timer(20),
			act.dialogue(
				"foxhound",
				"Water patrols between the islands. Skinks in the south channel, Gators in the north. Time your crossings between patrol sweeps — or send Divers to eliminate the patrols first.",
			),
		),

		trigger(
			"phase:waterways:dock-hint",
			on.timer(40),
			act.dialogue(
				"foxhound",
				"Build additional docks on captured islands, Captain. Shorter water crossings mean faster reinforcement.",
			),
		),

		// Lodge loss condition
		trigger(
			"phase:waterways:lodge-destroyed",
			on.buildingCount("ura", "lodge", "eq", 0),
			act.failMission("Lodge destroyed"),
		),

		// ─── PHASE 2: FISHBONE SECURED (~5:00 - ~8:00) ──────────────────

		trigger(
			"phase:fishbone:approach",
			on.areaEntered("ura", "fishbone_island"),
			act.dialogue(
				"foxhound",
				"Landfall on Fishbone. Watchtowers have eyes on the eastern beach — hit them from the mangrove side.",
			),
		),

		trigger("phase:fishbone:captured", on.buildingCount("scale_guard", "flag_post", "eq", 2), [
			act.startPhase("fishbone-secured"),
			act.completeObjective("capture-fishbone"),
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Fishbone Island is ours! Establish a forward dock there — you'll need it for the push to Ironhull.",
				},
				{
					speaker: "FOXHOUND",
					text: "Mire Rock garrison is mobilizing. They know we're in the delta now. Expect heavier resistance on the next island.",
				},
			]),
			// Mire Rock reinforces in response
			act.spawn("gator", "scale_guard", 112, 34, 3),
			act.spawn("viper", "scale_guard", 108, 36, 2),
		]),

		trigger(
			"phase:fishbone:dock-built",
			on.buildingCount("ura", "dock", "gte", 2),
			act.dialogue(
				"foxhound",
				"Forward dock on Fishbone operational. Troops can stage here for the next crossing.",
			),
		),

		// ─── PHASE 3: TWO-FRONT ASSAULT (~8:00 - ~12:00) ────────────────

		trigger(
			"phase:assault:mire-rock-approach",
			on.areaEntered("ura", "mire_rock_island"),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Mire Rock. Mud terrain slows movement on the western shore. The bunker on the east side has a Croc Champion inside.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Suppress that bunker with Mortar Otters before you push infantry in.",
				},
			]),
		),

		trigger(
			"phase:assault:mire-rock-captured",
			on.buildingCount("scale_guard", "flag_post", "eq", 1),
			[
				act.startPhase("two-front-assault"),
				act.completeObjective("capture-mire-rock"),
				act.exchange([
					{
						speaker: "Col. Bubbles",
						text: "Mire Rock is down! One island left — Ironhull Atoll.",
					},
					{
						speaker: "FOXHOUND",
						text: "Ironhull is their command island, Captain. Predator Nest, Venom Spire, Croc Champions — the full package. This is the big one.",
					},
					{
						speaker: "Gen. Whiskers",
						text: "Bring everything you've got, Captain. Take that atoll and we own the delta.",
					},
				]),
				// Ironhull reinforces in response
				act.spawn("croc_champion", "scale_guard", 80, 20, 2),
				act.spawn("gator", "scale_guard", 72, 22, 4),
				// Enable delayed reinforcement trigger
				act.enableTrigger("phase:assault:ironhull-reinforcement"),
			],
		),

		// Delayed Ironhull reinforcement — enabled when 2nd island falls
		trigger(
			"phase:assault:ironhull-reinforcement",
			on.timer(540),
			[
				act.spawn("gator", "scale_guard", 60, 10, 3),
				act.spawn("gator", "scale_guard", 100, 10, 3),
				act.dialogue(
					"foxhound",
					"Ironhull is pulling in reserves. The Predator Nest is spawning fresh Gators. Move fast before they dig in deeper.",
				),
			],
			{ enabled: false },
		),

		// ─── PHASE 4: IRONHULL ASSAULT (~12:00+) ────────────────────────

		trigger("phase:ironhull:approach", on.areaEntered("ura", "ironhull_atoll"), [
			act.startPhase("ironhull-assault"),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "On the atoll. They've concentrated everything here — watchtowers at every approach, Venom Spire covering the center, Croc Champions at the flag.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Hit the Venom Spire first — it'll shred your forces if you ignore it. Then push for the Flag Post.",
				},
			]),
		]),

		trigger(
			"phase:ironhull:predator-nest-destroyed",
			on.buildingCount("scale_guard", "predator_nest", "eq", 0),
			act.dialogue(
				"foxhound",
				"Predator Nest is down. No more reinforcements from the atoll. Clean up what's left.",
			),
		),

		trigger(
			"phase:ironhull:captured",
			on.buildingCount("scale_guard", "flag_post", "eq", 0),
			act.completeObjective("capture-ironhull"),
		),

		// ─── VICTORY ─────────────────────────────────────────────────────

		trigger("phase:victory:mission-complete", on.allPrimaryComplete(), [
			act.exchange([
				{
					speaker: "Gen. Whiskers",
					text: "The Iron Delta is ours. Every waterway, every island — OEF controls the heart of the Reach.",
				},
				{
					speaker: "FOXHOUND",
					text: "Scale-Guard naval capacity is shattered. They can't resupply their inland positions anymore.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Intel reports the Serpent King has retreated to his citadel. We know where he is, Captain. Rest your troops — the next mission is the one that matters.",
				},
			]),
			act.victory(),
		]),

		// ─── BONUS OBJECTIVES ────────────────────────────────────────────

		trigger("phase:bonus:untouchable-base", on.healthThreshold("lodge", 100, "above"), [], {
			enabled: false,
		}),

		// Enable lodge health check when all primaries complete
		trigger("phase:bonus:check-lodge-health", on.allPrimaryComplete(), [
			act.enableTrigger("phase:bonus:evaluate-lodge"),
		]),

		trigger(
			"phase:bonus:evaluate-lodge",
			on.healthThreshold("lodge", 100, "above"),
			act.completeObjective("bonus-untouchable-base"),
			{ enabled: false },
		),

		// Mass crossing through the shallows
		trigger(
			"phase:bonus:mass-assault",
			on.areaEntered("ura", "shallows", { unitType: "mudfoot", minUnits: 6 }),
			[
				act.dialogue("foxhound", "Mass crossing through the shallows. Bold move, Captain."),
				act.completeObjective("bonus-mass-assault"),
			],
		),
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
