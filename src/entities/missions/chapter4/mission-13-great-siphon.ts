// Mission 13: The Great Siphon — Full-Scale Assault
//
// Scale-Guard central command complex at the heart of Copper-Silt Reach.
// 160x128 map. Three concentric defensive lines protect the Great Siphon —
// a three-section pumping mega-structure that drains the northern river system.
// Player must breach all three lines and destroy all three siphon sections.
// Teaches: large-scale army management, multi-front assault, phased offensives.
// Win: Destroy the Great Siphon (3 sections). Bonus: Collect 500+ salvage.
// Par time: 12 min (720s).

import type { MissionDef, TileOverride } from "../../types";
import { act, objective, on, trigger } from "../dsl";

// ─── Bridge Helper ───

/** Generate a vertical bridge column (walkable tiles over toxic water). */
function bridgeTiles(x: number, yStart: number, yEnd: number): TileOverride[] {
	const tiles: TileOverride[] = [];
	for (let y = yStart; y <= yEnd; y++) {
		tiles.push({ x, y, terrainId: "bridge" });
	}
	return tiles;
}

export const mission13GreatSiphon: MissionDef = {
	id: "mission_13",
	chapter: 4,
	mission: 1,
	name: "The Great Siphon",
	subtitle: "Assault Scale-Guard headquarters and destroy the Great Siphon",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "This is it, Captain. The Great Siphon — the heart of Scale-Guard's occupation machine. That monstrosity drains every river in the northern Reach.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Three defensive lines between us and the target. Sandbags, bunkers, trenches. They've had months to dig in.",
			},
			{
				speaker: "FOXHOUND",
				text: "The siphon itself is a triple-section pumping station. You'll need to destroy all three sections. Each one is heavily armored — sustained fire required.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "New tech from the workshop, Captain — Shield Generators. Build one at your base. It'll absorb incoming artillery while you push forward.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Hit them hard, hit them fast. The longer we sit out here, the more reinforcements they call in. Move out.",
			},
		],
	},

	terrain: {
		width: 160,
		height: 128,
		regions: [
			{ terrainId: "grass", fill: true },
			// Scarred earth — stripped by Scale-Guard industry (top 75%)
			{ terrainId: "dirt", rect: { x: 0, y: 0, w: 160, h: 96 } },
			// Player base area — surviving jungle (bottom 25%)
			{ terrainId: "grass", rect: { x: 0, y: 96, w: 160, h: 32 } },
			// Mangrove remnants (west resource grove)
			{ terrainId: "mangrove", rect: { x: 0, y: 96, w: 48, h: 16 } },
			// Scarred mangrove patches in no-man's land
			{
				terrainId: "mangrove",
				rect: { x: 0, y: 56, w: 24, h: 16 },
			},
			{
				terrainId: "mangrove",
				rect: { x: 136, y: 56, w: 24, h: 16 },
			},
			// Toxic runoff channel (major — runs across map at y ~52)
			{
				terrainId: "toxic_water",
				river: {
					points: [
						[0, 52],
						[40, 50],
						[80, 54],
						[120, 50],
						[160, 52],
					],
					width: 3,
				},
			},
			// Toxic runoff channel (minor — around siphon core)
			{
				terrainId: "toxic_water",
				river: {
					points: [
						[60, 20],
						[80, 18],
						[100, 22],
						[120, 18],
					],
					width: 2,
				},
			},
			// Mud around toxic channels
			{ terrainId: "mud", rect: { x: 0, y: 48, w: 160, h: 4 } },
			{ terrainId: "mud", rect: { x: 0, y: 54, w: 160, h: 4 } },
			// Concrete fortification zones
			{
				terrainId: "concrete",
				rect: { x: 0, y: 72, w: 160, h: 8 },
			},
			{
				terrainId: "concrete",
				rect: { x: 48, y: 48, w: 64, h: 8 },
			},
			{
				terrainId: "concrete",
				rect: { x: 48, y: 16, w: 64, h: 16 },
			},
			// Siphon core — industrial metal platform
			{ terrainId: "metal", rect: { x: 56, y: 4, w: 48, h: 12 } },
			// Crater field in no-man's land
			{ terrainId: "mud", circle: { cx: 64, cy: 64, r: 6 } },
			{ terrainId: "mud", circle: { cx: 80, cy: 60, r: 4 } },
			{ terrainId: "mud", circle: { cx: 96, cy: 66, r: 5 } },
			// Approach road (dirt causeway through center)
			{ terrainId: "dirt", rect: { x: 72, y: 80, w: 16, h: 48 } },
			// Salvage field east
			{
				terrainId: "dirt",
				rect: { x: 120, y: 100, w: 32, h: 8 },
			},
		],
		overrides: [
			// Bridges over toxic channels (3 crossing points)
			...bridgeTiles(36, 50, 54), // west crossing
			...bridgeTiles(80, 50, 54), // center crossing
			...bridgeTiles(124, 50, 54), // east crossing
		],
	},

	zones: {
		player_base: { x: 48, y: 96, width: 64, height: 16 },
		forward_base_w: { x: 0, y: 96, width: 48, height: 16 },
		forward_base_e: { x: 112, y: 96, width: 48, height: 16 },
		supply_depot: { x: 32, y: 112, width: 96, height: 16 },
		staging_west: { x: 0, y: 80, width: 48, height: 16 },
		approach_road: { x: 48, y: 80, width: 64, height: 16 },
		staging_east: { x: 112, y: 80, width: 48, height: 16 },
		bunker_line_1: { x: 0, y: 72, width: 160, height: 8 },
		scarred_jungle_w: { x: 0, y: 56, width: 48, height: 16 },
		no_mans_land: { x: 48, y: 56, width: 64, height: 16 },
		scarred_jungle_e: { x: 112, y: 56, width: 48, height: 16 },
		bunker_line_2: { x: 0, y: 48, width: 160, height: 8 },
		trench_west: { x: 0, y: 32, width: 48, height: 16 },
		kill_zone: { x: 48, y: 32, width: 64, height: 16 },
		trench_east: { x: 112, y: 32, width: 48, height: 16 },
		bunker_line_3: { x: 0, y: 16, width: 48, height: 16 },
		siphon_core: { x: 48, y: 16, width: 64, height: 16 },
		artillery_battery: { x: 112, y: 16, width: 48, height: 16 },
		enemy_reserves: { x: 0, y: 0, width: 48, height: 16 },
		great_siphon_compound: {
			x: 48,
			y: 0,
			width: 112,
			height: 16,
		},
	},

	placements: [
		// ─── Player Base ───

		// Lodge (Captain's field HQ)
		{ type: "lodge", faction: "ura", x: 80, y: 104 },
		// Command Post (pre-built for Chapter 4)
		{ type: "command_post", faction: "ura", x: 72, y: 100 },
		// Barracks (pre-built)
		{ type: "barracks", faction: "ura", x: 88, y: 100 },
		// Armory (pre-built)
		{ type: "armory", faction: "ura", x: 64, y: 104 },
		// Burrows (3 for pop cap)
		{ type: "burrow", faction: "ura", x: 76, y: 108 },
		{ type: "burrow", faction: "ura", x: 84, y: 108 },
		{ type: "burrow", faction: "ura", x: 92, y: 108 },

		// Starting workers
		{ type: "river_rat", faction: "ura", x: 70, y: 106 },
		{ type: "river_rat", faction: "ura", x: 74, y: 107 },
		{ type: "river_rat", faction: "ura", x: 78, y: 106 },
		{ type: "river_rat", faction: "ura", x: 82, y: 107 },
		{ type: "river_rat", faction: "ura", x: 86, y: 106 },

		// Starting army
		{ type: "mudfoot", faction: "ura", x: 72, y: 96 },
		{ type: "mudfoot", faction: "ura", x: 76, y: 96 },
		{ type: "mudfoot", faction: "ura", x: 80, y: 96 },
		{ type: "mudfoot", faction: "ura", x: 84, y: 96 },
		{ type: "shellcracker", faction: "ura", x: 74, y: 98 },
		{ type: "shellcracker", faction: "ura", x: 78, y: 98 },
		{ type: "shellcracker", faction: "ura", x: 82, y: 98 },
		{ type: "mortar_otter", faction: "ura", x: 80, y: 100 },
		{ type: "mortar_otter", faction: "ura", x: 76, y: 100 },
		{ type: "sapper", faction: "ura", x: 88, y: 98 },
		{ type: "sapper", faction: "ura", x: 90, y: 98 },

		// ─── Resources ───

		// Timber (western mangrove remnants)
		{ type: "mangrove_tree", faction: "neutral", x: 8, y: 100 },
		{ type: "mangrove_tree", faction: "neutral", x: 14, y: 102 },
		{ type: "mangrove_tree", faction: "neutral", x: 20, y: 98 },
		{ type: "mangrove_tree", faction: "neutral", x: 26, y: 104 },
		{ type: "mangrove_tree", faction: "neutral", x: 10, y: 106 },
		{ type: "mangrove_tree", faction: "neutral", x: 18, y: 108 },
		{ type: "mangrove_tree", faction: "neutral", x: 32, y: 100 },
		{ type: "mangrove_tree", faction: "neutral", x: 38, y: 103 },
		{ type: "mangrove_tree", faction: "neutral", x: 42, y: 99 },
		{ type: "mangrove_tree", faction: "neutral", x: 16, y: 110 },
		// Fish (southern supply depot area)
		{ type: "fish_spot", faction: "neutral", x: 40, y: 118 },
		{ type: "fish_spot", faction: "neutral", x: 60, y: 120 },
		{ type: "fish_spot", faction: "neutral", x: 80, y: 122 },
		{ type: "fish_spot", faction: "neutral", x: 100, y: 118 },
		// Salvage (eastern ruins + scattered across no-man's land)
		{ type: "salvage_cache", faction: "neutral", x: 124, y: 100 },
		{ type: "salvage_cache", faction: "neutral", x: 130, y: 104 },
		{ type: "salvage_cache", faction: "neutral", x: 140, y: 98 },
		{ type: "salvage_cache", faction: "neutral", x: 60, y: 62 },
		{ type: "salvage_cache", faction: "neutral", x: 100, y: 58 },
		// Bonus salvage (behind bunker line 2)
		{ type: "salvage_cache", faction: "neutral", x: 24, y: 60 },
		{ type: "salvage_cache", faction: "neutral", x: 140, y: 60 },

		// ─── Enemies: Bunker Line 1 ───

		{ type: "sandbag_wall", faction: "scale_guard", x: 20, y: 74 },
		{ type: "sandbag_wall", faction: "scale_guard", x: 40, y: 74 },
		{ type: "sandbag_wall", faction: "scale_guard", x: 60, y: 74 },
		{ type: "sandbag_wall", faction: "scale_guard", x: 80, y: 74 },
		{ type: "sandbag_wall", faction: "scale_guard", x: 100, y: 74 },
		{ type: "sandbag_wall", faction: "scale_guard", x: 120, y: 74 },
		{ type: "sandbag_wall", faction: "scale_guard", x: 140, y: 74 },
		{ type: "watchtower", faction: "scale_guard", x: 30, y: 72 },
		{ type: "watchtower", faction: "scale_guard", x: 80, y: 72 },
		{ type: "watchtower", faction: "scale_guard", x: 130, y: 72 },
		{ type: "gator", faction: "scale_guard", x: 24, y: 76 },
		{ type: "gator", faction: "scale_guard", x: 44, y: 76 },
		{ type: "gator", faction: "scale_guard", x: 64, y: 76 },
		{ type: "gator", faction: "scale_guard", x: 84, y: 76 },
		{ type: "gator", faction: "scale_guard", x: 104, y: 76 },
		{ type: "gator", faction: "scale_guard", x: 124, y: 76 },
		{ type: "skink", faction: "scale_guard", x: 36, y: 78 },
		{ type: "skink", faction: "scale_guard", x: 96, y: 78 },

		// ─── Enemies: Bunker Line 2 ───

		{ type: "bunker", faction: "scale_guard", x: 24, y: 48 },
		{ type: "bunker", faction: "scale_guard", x: 56, y: 48 },
		{ type: "bunker", faction: "scale_guard", x: 88, y: 48 },
		{ type: "bunker", faction: "scale_guard", x: 120, y: 48 },
		{ type: "watchtower", faction: "scale_guard", x: 40, y: 50 },
		{ type: "watchtower", faction: "scale_guard", x: 72, y: 50 },
		{ type: "watchtower", faction: "scale_guard", x: 104, y: 50 },
		{ type: "watchtower", faction: "scale_guard", x: 136, y: 50 },
		{ type: "gator", faction: "scale_guard", x: 28, y: 52 },
		{ type: "gator", faction: "scale_guard", x: 60, y: 52 },
		{ type: "gator", faction: "scale_guard", x: 92, y: 52 },
		{ type: "gator", faction: "scale_guard", x: 124, y: 52 },
		{ type: "viper", faction: "scale_guard", x: 44, y: 52 },
		{ type: "viper", faction: "scale_guard", x: 76, y: 52 },
		{ type: "viper", faction: "scale_guard", x: 108, y: 52 },
		{ type: "croc_champion", faction: "scale_guard", x: 80, y: 50 },

		// ─── Enemies: Trench Network ───

		{ type: "gator", faction: "scale_guard", x: 16, y: 36 },
		{ type: "gator", faction: "scale_guard", x: 24, y: 38 },
		{ type: "gator", faction: "scale_guard", x: 32, y: 34 },
		{ type: "viper", faction: "scale_guard", x: 20, y: 40 },
		{ type: "gator", faction: "scale_guard", x: 120, y: 36 },
		{ type: "gator", faction: "scale_guard", x: 128, y: 38 },
		{ type: "gator", faction: "scale_guard", x: 136, y: 34 },
		{ type: "viper", faction: "scale_guard", x: 132, y: 40 },
		{ type: "snapper", faction: "scale_guard", x: 64, y: 36 },
		{ type: "snapper", faction: "scale_guard", x: 96, y: 36 },

		// ─── Enemies: Siphon Core + Inner Defenses ───

		// The Great Siphon — 3-section mega-structure
		{
			type: "great_siphon_west",
			faction: "scale_guard",
			x: 56,
			y: 8,
			hp: 2000,
		},
		{
			type: "great_siphon_center",
			faction: "scale_guard",
			x: 76,
			y: 6,
			hp: 3000,
		},
		{
			type: "great_siphon_east",
			faction: "scale_guard",
			x: 96,
			y: 8,
			hp: 2000,
		},
		// Inner garrison
		{ type: "croc_champion", faction: "scale_guard", x: 60, y: 20 },
		{ type: "croc_champion", faction: "scale_guard", x: 72, y: 18 },
		{ type: "croc_champion", faction: "scale_guard", x: 88, y: 20 },
		{ type: "croc_champion", faction: "scale_guard", x: 100, y: 18 },
		{ type: "gator", faction: "scale_guard", x: 52, y: 22 },
		{ type: "gator", faction: "scale_guard", x: 64, y: 24 },
		{ type: "gator", faction: "scale_guard", x: 80, y: 22 },
		{ type: "gator", faction: "scale_guard", x: 96, y: 24 },
		{ type: "gator", faction: "scale_guard", x: 108, y: 22 },
		{ type: "viper", faction: "scale_guard", x: 56, y: 14 },
		{ type: "viper", faction: "scale_guard", x: 76, y: 12 },
		{ type: "viper", faction: "scale_guard", x: 96, y: 14 },

		// ─── Enemies: Artillery Battery (east flank) ───

		{ type: "venom_spire", faction: "scale_guard", x: 120, y: 20 },
		{ type: "venom_spire", faction: "scale_guard", x: 136, y: 22 },
		{ type: "venom_spire", faction: "scale_guard", x: 148, y: 18 },
		{ type: "gator", faction: "scale_guard", x: 124, y: 24 },
		{ type: "gator", faction: "scale_guard", x: 140, y: 26 },
		{ type: "snapper", faction: "scale_guard", x: 132, y: 20 },
	],

	startResources: { fish: 400, timber: 300, salvage: 200 },
	startPopCap: 30,

	objectives: {
		primary: [objective("breach-line-1", "Breach Bunker Line 1")],
		bonus: [
			objective("build-shield-gen", "Build a Shield Generator to protect your base"),
			objective("bonus-war-chest", "Amass a war chest of 500 salvage"),
		],
	},

	triggers: [
		// =====================================================================
		// PHASE 1: BREACH THE LINE
		// =====================================================================

		// Mission briefing exchange
		trigger(
			"phase:breach:briefing",
			on.timer(3),
			act.exchange([
				{
					speaker: "Gen. Whiskers",
					text: "This is it, Captain. The Great Siphon — the heart of Scale-Guard's occupation machine. That monstrosity drains every river in the northern Reach.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Three defensive lines between us and the target. Sandbags, bunkers, trenches. They've had months to dig in.",
				},
				{
					speaker: "FOXHOUND",
					text: "The siphon itself is a triple-section pumping station. You'll need to destroy all three sections. Each one is heavily armored — sustained fire required.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "New tech from the workshop, Captain — Shield Generators. Build one at your base. It'll absorb incoming artillery while you push forward.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Hit them hard, hit them fast. The longer we sit out here, the more reinforcements they call in. Move out.",
				},
			]),
		),

		// FOXHOUND recon tip at 30s
		trigger(
			"phase:breach:foxhound-recon",
			on.timer(30),
			act.dialogue(
				"foxhound",
				"Bunker Line 1 — sandbags, three watchtowers, six to eight Gators dug in. Recommend Mortar Otters to soften them before the infantry push.",
			),
		),

		// Shield Generator built (bonus objective)
		trigger(
			"phase:breach:shield-gen-built",
			on.buildingCount("ura", "shield_generator", "gte", 1),
			[
				act.completeObjective("build-shield-gen"),
				act.dialogue(
					"sgt_bubbles",
					"Shield Generator online. That'll keep their artillery off our backs. Good thinking, Captain.",
				),
			],
		),

		// Bunker Line 1 cleared — watchtowers destroyed signals the line is breached
		trigger("phase:breach:line-1-clear", on.buildingCount("scale_guard", "watchtower", "lte", 4), [
			act.completeObjective("breach-line-1"),
			act.dialogue(
				"foxhound",
				"Bunker Line 1 is down. Pushing forward — second line is visible now.",
			),
			act.revealZone("no_mans_land"),
			act.revealZone("scarred_jungle_w"),
			act.revealZone("scarred_jungle_e"),
			act.revealZone("bunker_line_2"),
			act.addObjective("breach-line-2", "Break through Bunker Line 2", "primary"),
			act.startPhase("no-mans-land"),
			act.enableTrigger("phase:no-mans-land:briefing"),
			act.enableTrigger("phase:no-mans-land:reinforcement-wave-1"),
			act.enableTrigger("phase:no-mans-land:entered"),
			act.enableTrigger("phase:no-mans-land:line-2-clear"),
		]),

		// =====================================================================
		// PHASE 2: NO MAN'S LAND
		// =====================================================================

		trigger(
			"phase:no-mans-land:briefing",
			on.objectiveComplete("breach-line-1"),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Second line is harder. Concrete bunkers, Viper marksmen, and a Croc Champion anchoring the center. Recommend flanking through the scarred jungle.",
				},
				{
					speaker: "Col. Bubbles",
					text: "They're also calling reinforcements from the north. We don't have all day, Captain.",
				},
			]),
			{ enabled: false },
		),

		// Reinforcement wave — 30s after phase 2 starts (timer from mission start ~330s)
		trigger(
			"phase:no-mans-land:reinforcement-wave-1",
			on.timer(330),
			[
				act.spawn("gator", "scale_guard", 80, 4, 4),
				act.spawn("viper", "scale_guard", 76, 2, 2),
				act.dialogue(
					"foxhound",
					"Reinforcements moving south from the reserve area. They're trying to shore up Line 2.",
				),
			],
			{ enabled: false },
		),

		// Entering no-man's land warning
		trigger(
			"phase:no-mans-land:entered",
			on.areaEntered("ura", "no_mans_land"),
			act.dialogue(
				"foxhound",
				"You're in the open, Captain. No cover. Move fast or you'll get pinned.",
			),
			{ enabled: false },
		),

		// Bunker Line 2 cleared — bunkers destroyed signals breach
		trigger(
			"phase:no-mans-land:line-2-clear",
			on.buildingCount("scale_guard", "bunker", "eq", 0),
			[
				act.completeObjective("breach-line-2"),
				act.dialogue("sgt_bubbles", "Second line broken! One more between us and the siphon."),
				act.revealZone("trench_west"),
				act.revealZone("kill_zone"),
				act.revealZone("trench_east"),
				act.revealZone("bunker_line_3"),
				act.addObjective("reach-siphon", "Reach the Great Siphon", "primary"),
				act.startPhase("kill-zone"),
				act.enableTrigger("phase:kill-zone:briefing"),
				act.enableTrigger("phase:kill-zone:entered"),
				act.enableTrigger("phase:kill-zone:artillery-destroyed"),
				act.enableTrigger("phase:kill-zone:siphon-core-entered"),
			],
			{ enabled: false },
		),

		// =====================================================================
		// PHASE 3: THE KILL ZONE
		// =====================================================================

		trigger(
			"phase:kill-zone:briefing",
			on.objectiveComplete("breach-line-2"),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Inner defenses. Trenches on both flanks, open kill zone in the center. Croc Champions and Snappers dug in deep.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "Don't march into that kill zone head-on, Captain. Use the flanks. That's what the Sappers are for — blow a path through the trench walls.",
				},
				{
					speaker: "Col. Bubbles",
					text: "And watch the east — they've got Venom Spires in an artillery battery. Take those out or they'll shred your forces in the center.",
				},
			]),
			{ enabled: false },
		),

		// Kill zone entered — spawns flankers
		trigger(
			"phase:kill-zone:entered",
			on.areaEntered("ura", "kill_zone"),
			[
				act.dialogue(
					"foxhound",
					"You're in the kill zone. Multiple firing arcs converging on your position. Find cover or push through fast.",
				),
				act.spawn("gator", "scale_guard", 20, 8, 3),
				act.spawn("gator", "scale_guard", 140, 8, 3),
			],
			{ enabled: false },
		),

		// Artillery battery destroyed
		trigger(
			"phase:kill-zone:artillery-destroyed",
			on.buildingCount("scale_guard", "venom_spire", "eq", 0),
			act.dialogue("sgt_bubbles", "Artillery battery silenced. That opens up the center approach."),
			{ enabled: false },
		),

		// Siphon core entered — phase transition
		trigger(
			"phase:kill-zone:siphon-core-entered",
			on.areaEntered("ura", "siphon_core"),
			[
				act.completeObjective("reach-siphon"),
				act.revealZone("siphon_core"),
				act.revealZone("great_siphon_compound"),
				act.revealZone("enemy_reserves"),
				act.panCamera(76, 8, 2000),
				act.dialogue(
					"gen_whiskers",
					"There it is. The Great Siphon. Three pumping sections — west, center, east. Destroy them all, Captain. End this.",
				),
				act.addObjective("destroy-siphon-west", "Destroy Siphon Section — WEST", "primary"),
				act.addObjective("destroy-siphon-center", "Destroy Siphon Section — CENTER", "primary"),
				act.addObjective("destroy-siphon-east", "Destroy Siphon Section — EAST", "primary"),
				act.startPhase("destroy-siphon"),
				act.enableTrigger("phase:destroy-siphon:briefing"),
				act.enableTrigger("phase:destroy-siphon:west-50"),
				act.enableTrigger("phase:destroy-siphon:west-destroyed"),
				act.enableTrigger("phase:destroy-siphon:center-50"),
				act.enableTrigger("phase:destroy-siphon:center-destroyed"),
				act.enableTrigger("phase:destroy-siphon:east-50"),
				act.enableTrigger("phase:destroy-siphon:east-destroyed"),
			],
			{ enabled: false },
		),

		// =====================================================================
		// PHASE 4: DESTROY THE SIPHON
		// =====================================================================

		trigger(
			"phase:destroy-siphon:briefing",
			on.objectiveComplete("reach-siphon"),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "All three sections must go down. They're armored — small arms won't cut it. Sappers and Mortars are your best bet.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Expect a counterattack when you start hitting the siphon. They'll throw everything they have left.",
				},
			]),
			{ enabled: false },
		),

		// Siphon WEST at 50% HP — reinforcement spawn
		trigger(
			"phase:destroy-siphon:west-50",
			on.healthThreshold("great_siphon_west", 50, "below"),
			[
				act.dialogue("foxhound", "West section at half integrity. Keep the pressure on."),
				act.spawn("croc_champion", "scale_guard", 40, 6, 2),
			],
			{ enabled: false },
		),

		// Siphon WEST destroyed
		trigger(
			"phase:destroy-siphon:west-destroyed",
			on.healthThreshold("great_siphon_west", 0, "below"),
			[
				act.completeObjective("destroy-siphon-west"),
				act.dialogue(
					"sgt_bubbles",
					"West section is down! The whole structure is shaking — two more to go!",
				),
			],
			{ enabled: false },
		),

		// Siphon CENTER at 50% HP — massive counterattack
		trigger(
			"phase:destroy-siphon:center-50",
			on.healthThreshold("great_siphon_center", 50, "below"),
			[
				act.dialogue(
					"foxhound",
					"Center section cracking. They're sending everything — Croc Champions from the reserves!",
				),
				act.spawn("croc_champion", "scale_guard", 60, 2, 2),
				act.spawn("croc_champion", "scale_guard", 100, 2, 2),
				act.spawn("gator", "scale_guard", 80, 2, 4),
			],
			{ enabled: false },
		),

		// Siphon CENTER destroyed
		trigger(
			"phase:destroy-siphon:center-destroyed",
			on.healthThreshold("great_siphon_center", 0, "below"),
			[
				act.completeObjective("destroy-siphon-center"),
				act.dialogue(
					"gen_whiskers",
					"Center section gone! The whole pump system is failing. Finish it, Captain!",
				),
			],
			{ enabled: false },
		),

		// Siphon EAST at 50% HP
		trigger(
			"phase:destroy-siphon:east-50",
			on.healthThreshold("great_siphon_east", 50, "below"),
			act.dialogue("foxhound", "East section at half. Almost there, Captain."),
			{ enabled: false },
		),

		// Siphon EAST destroyed
		trigger(
			"phase:destroy-siphon:east-destroyed",
			on.healthThreshold("great_siphon_east", 0, "below"),
			act.completeObjective("destroy-siphon-east"),
			{ enabled: false },
		),

		// =====================================================================
		// BONUS OBJECTIVES
		// =====================================================================

		// Western scarred jungle salvage callout
		trigger(
			"phase:bonus:flank-salvage-w",
			on.areaEntered("ura", "scarred_jungle_w"),
			act.dialogue("foxhound", "Salvage caches in the western ruins. Grab what you can."),
		),

		// Eastern scarred jungle salvage callout
		trigger(
			"phase:bonus:flank-salvage-e",
			on.areaEntered("ura", "scarred_jungle_e"),
			act.dialogue(
				"foxhound",
				"More salvage in the eastern scarred zone. Could fund additional units.",
			),
		),

		// War chest bonus — 500 salvage collected
		trigger(
			"phase:bonus:war-chest",
			on.resourceThreshold("salvage", "gte", 500),
			act.completeObjective("bonus-war-chest"),
		),

		// =====================================================================
		// LOSE CONDITION + VICTORY
		// =====================================================================

		// Lodge destroyed = mission fail
		trigger(
			"lodge-destroyed",
			on.buildingDestroyed("lodge"),
			act.failMission("Lodge destroyed — the OEF field HQ has fallen."),
		),

		// Mission complete — all primary objectives done
		trigger("mission-complete", on.allPrimaryComplete(), [
			act.exchange([
				{
					speaker: "Gen. Whiskers",
					text: "The Great Siphon is destroyed. The rivers run free again. Outstanding work, Captain.",
				},
				{
					speaker: "FOXHOUND",
					text: "Scale-Guard command frequencies are in chaos. Their northern supply chain just collapsed.",
				},
				{
					speaker: "Col. Bubbles",
					text: "That's the beginning of the end for them. But they're not beaten yet — we still have to take the delta. Consolidate your forces. HQ out.",
				},
			]),
			act.victory(),
		]),
	],

	unlocks: {
		buildings: ["shield_generator"],
	},

	parTime: 720,

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
			enemyDamageMultiplier: 1.5,
			enemyHpMultiplier: 1.5,
			resourceMultiplier: 0.75,
			xpMultiplier: 1.5,
		},
	},
};
