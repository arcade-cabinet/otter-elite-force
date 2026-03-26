// Mission 16: Last Stand — THE RECKONING (Mission 4-4)
//
// 160x160 map. Two massive phases: 10-wave defense + counterattack.
// Phase 1: Survive the largest Scale-Guard assault ever launched (200+ enemies).
// Phase 2: Counterattack north, breach their wall, destroy the Command Post.
// Every named character radios in during victory. Campaign finale.
// Win: Survive all 10 waves AND destroy the Scale-Guard Command Post.
// Lose: Lodge destroyed.
// Par time: 20 min (1200s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

// ---------------------------------------------------------------------------
// Helpers — inline bridge/ford tile overrides (no bridgeTiles/fordTiles util)
// ---------------------------------------------------------------------------

function bridgeTiles(x: number, yStart: number, yEnd: number) {
	const tiles: { x: number; y: number; terrainId: string }[] = [];
	for (let y = yStart; y <= yEnd; y++) {
		tiles.push({ x, y, terrainId: "bridge" });
		tiles.push({ x: x + 1, y, terrainId: "bridge" });
	}
	return tiles;
}

function fordTiles(xStart: number, yStart: number, xEnd: number, yEnd: number) {
	const tiles: { x: number; y: number; terrainId: string }[] = [];
	for (let x = xStart; x <= xEnd; x++) {
		for (let y = yStart; y <= yEnd; y++) {
			tiles.push({ x, y, terrainId: "bridge" });
		}
	}
	return tiles;
}

export const mission16LastStand: MissionDef = {
	id: "mission_16",
	chapter: 4,
	mission: 4,
	name: "The Reckoning",
	subtitle: "Survive the final assault and crush Scale-Guard once and for all",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "All units, this is Gen. Whiskers. This is the day we've been fighting toward since Beachhead. The Scale-Guard have consolidated everything they have left for one final assault on our position. If we hold — they're done. If we break — the campaign was for nothing.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "I'm not going to stand here and tell you this will be easy. It won't. They outnumber us. They outweigh us. They have every reason to fight to the last scale. But we have something they don't — we're fighting for our home.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Tactical brief, Captain. They'll hit us from the north across no-man's land. Three bridges, two fords. Fortified wall is our primary defense — keep your Shellcrackers on the wall, Mortars behind it.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "To every otter on this line: you are the Otter Elite Force. You are the best soldiers in the Copper-Silt Reach. And today, you will prove it. Through mud and water, Captain. Hold the line.",
			},
		],
	},

	// ═══════════════════════════════════════════════════════════════════════
	// TERRAIN — 160x160
	// ═══════════════════════════════════════════════════════════════════════

	terrain: {
		width: 160,
		height: 160,
		regions: [
			{ terrainId: "grass", fill: true },

			// --- Player base — surviving jungle and cleared ground ---
			{ terrainId: "grass", rect: { x: 0, y: 88, w: 160, h: 72 } },
			{ terrainId: "dirt", rect: { x: 48, y: 96, w: 64, h: 48 } },
			{ terrainId: "mangrove", rect: { x: 0, y: 112, w: 48, h: 16 } },
			{ terrainId: "mangrove", rect: { x: 112, y: 112, w: 48, h: 16 } },
			{ terrainId: "concrete", rect: { x: 48, y: 128, w: 64, h: 16 } },

			// Player forward wall zone
			{ terrainId: "concrete", rect: { x: 0, y: 88, w: 160, h: 8 } },

			// --- No-man's land — scarred, cratered earth ---
			{ terrainId: "dirt", rect: { x: 0, y: 56, w: 160, h: 32 } },
			{ terrainId: "mud", circle: { cx: 24, cy: 76, r: 6 } },
			{ terrainId: "mud", circle: { cx: 56, cy: 80, r: 4 } },
			{ terrainId: "mud", circle: { cx: 80, cy: 74, r: 8 } },
			{ terrainId: "mud", circle: { cx: 104, cy: 78, r: 5 } },
			{ terrainId: "mud", circle: { cx: 136, cy: 76, r: 6 } },
			{ terrainId: "mud", circle: { cx: 40, cy: 64, r: 5 } },
			{ terrainId: "mud", circle: { cx: 120, cy: 62, r: 4 } },

			// Burned mangrove (contested zone — stumps, no resources)
			{ terrainId: "burned_mangrove", rect: { x: 0, y: 56, w: 48, h: 16 } },
			{ terrainId: "burned_mangrove", rect: { x: 112, y: 56, w: 48, h: 16 } },

			// River through center of contested zone
			{
				terrainId: "water",
				river: {
					points: [
						[0, 64],
						[32, 62],
						[64, 66],
						[96, 62],
						[128, 66],
						[160, 64],
					],
					width: 4,
				},
			},

			// --- Enemy territory — stripped industrial ground ---
			{ terrainId: "dirt", rect: { x: 0, y: 0, w: 160, h: 56 } },
			{ terrainId: "concrete", rect: { x: 0, y: 32, w: 160, h: 8 } },
			{ terrainId: "concrete", rect: { x: 48, y: 16, w: 64, h: 16 } },
			{ terrainId: "metal", rect: { x: 64, y: 4, w: 32, h: 8 } },

			// Supply depot (rear)
			{ terrainId: "dirt", rect: { x: 16, y: 148, w: 128, h: 8 } },
		],
		overrides: [
			// Bridges over contested river (3 crossing points)
			...bridgeTiles(32, 62, 68), // west bridge
			...bridgeTiles(80, 62, 68), // center bridge (main)
			...bridgeTiles(128, 62, 68), // east bridge
			// Ford crossings (shallow, slower movement)
			...fordTiles(56, 64, 64, 68), // west ford
			...fordTiles(96, 62, 104, 66), // east ford
		],
	},

	// ═══════════════════════════════════════════════════════════════════════
	// ZONES
	// ═══════════════════════════════════════════════════════════════════════

	zones: {
		// Player zones (south)
		ura_supply_depot: { x: 16, y: 144, width: 128, height: 16 },
		ura_reserve_w: { x: 0, y: 128, width: 48, height: 16 },
		ura_rear_base: { x: 48, y: 128, width: 64, height: 16 },
		ura_reserve_e: { x: 112, y: 128, width: 48, height: 16 },
		ura_resource_w: { x: 0, y: 112, width: 48, height: 16 },
		ura_main_base: { x: 48, y: 112, width: 64, height: 16 },
		ura_resource_e: { x: 112, y: 112, width: 48, height: 16 },
		ura_west_flank: { x: 0, y: 96, width: 48, height: 16 },
		ura_front_base: { x: 48, y: 96, width: 64, height: 16 },
		ura_east_flank: { x: 112, y: 96, width: 48, height: 16 },
		ura_wall_north: { x: 0, y: 88, width: 160, height: 8 },

		// Contested middle ground
		contested_sw: { x: 0, y: 72, width: 48, height: 16 },
		no_mans_land: { x: 48, y: 72, width: 64, height: 16 },
		contested_se: { x: 112, y: 72, width: 48, height: 16 },
		contested_nw: { x: 0, y: 56, width: 48, height: 16 },
		river_crossing: { x: 48, y: 56, width: 64, height: 16 },
		contested_ne: { x: 112, y: 56, width: 48, height: 16 },

		// Enemy zones (north)
		sg_staging_w: { x: 0, y: 40, width: 48, height: 16 },
		sg_staging_center: { x: 48, y: 40, width: 64, height: 16 },
		sg_staging_e: { x: 112, y: 40, width: 48, height: 16 },
		sg_wall_north: { x: 0, y: 32, width: 160, height: 8 },
		sg_armory_w: { x: 0, y: 16, width: 48, height: 16 },
		sg_inner_compound: { x: 48, y: 16, width: 64, height: 16 },
		sg_armory_e: { x: 112, y: 16, width: 48, height: 16 },
		sg_barracks_nw: { x: 0, y: 0, width: 48, height: 16 },
		sg_command_post: { x: 48, y: 0, width: 112, height: 16 },
	},

	// ═══════════════════════════════════════════════════════════════════════
	// PLACEMENTS
	// ═══════════════════════════════════════════════════════════════════════

	placements: [
		// ----- Heroes (all named characters) -----
		{ type: "sgt_bubbles", faction: "ura", x: 80, y: 108 },
		{ type: "cpl_splash", faction: "ura", x: 72, y: 108 },
		{ type: "sgt_fang", faction: "ura", x: 88, y: 108 },
		{ type: "gen_whiskers", faction: "ura", x: 80, y: 112 },
		{ type: "medic_marina", faction: "ura", x: 76, y: 110 },

		// ----- Player base buildings -----
		// Lodge (Captain's field HQ — lose condition)
		{ type: "lodge", faction: "ura", x: 80, y: 120 },
		// Full base complex
		{ type: "command_post", faction: "ura", x: 64, y: 116 },
		{ type: "barracks", faction: "ura", x: 96, y: 116 },
		{ type: "armory", faction: "ura", x: 56, y: 100 },
		{ type: "siege_workshop", faction: "ura", x: 96, y: 100 },
		{ type: "shield_generator", faction: "ura", x: 72, y: 132 },
		{ type: "shield_generator", faction: "ura", x: 88, y: 132 },
		{ type: "dock", faction: "ura", x: 80, y: 136 },
		// Burrows (5 — large pop cap)
		{ type: "burrow", faction: "ura", x: 8, y: 132 },
		{ type: "burrow", faction: "ura", x: 24, y: 136 },
		{ type: "burrow", faction: "ura", x: 40, y: 132 },
		{ type: "burrow", faction: "ura", x: 120, y: 132 },
		{ type: "burrow", faction: "ura", x: 136, y: 136 },
		// Fish Traps (pre-built economy)
		{ type: "fish_trap", faction: "ura", x: 120, y: 118 },
		{ type: "fish_trap", faction: "ura", x: 128, y: 120 },
		{ type: "fish_trap", faction: "ura", x: 136, y: 118 },
		// Forward wall (pre-built defensive line — 9 segments)
		{ type: "fortified_wall", faction: "ura", x: 16, y: 90 },
		{ type: "fortified_wall", faction: "ura", x: 32, y: 90 },
		{ type: "fortified_wall", faction: "ura", x: 48, y: 90 },
		{ type: "fortified_wall", faction: "ura", x: 64, y: 90 },
		{ type: "fortified_wall", faction: "ura", x: 80, y: 90 },
		{ type: "fortified_wall", faction: "ura", x: 96, y: 90 },
		{ type: "fortified_wall", faction: "ura", x: 112, y: 90 },
		{ type: "fortified_wall", faction: "ura", x: 128, y: 90 },
		{ type: "fortified_wall", faction: "ura", x: 144, y: 90 },
		// Watchtowers on wall line (5)
		{ type: "watchtower", faction: "ura", x: 24, y: 92 },
		{ type: "watchtower", faction: "ura", x: 56, y: 92 },
		{ type: "watchtower", faction: "ura", x: 80, y: 92 },
		{ type: "watchtower", faction: "ura", x: 104, y: 92 },
		{ type: "watchtower", faction: "ura", x: 136, y: 92 },

		// ----- Starting workers (8 River Rats) -----
		{ type: "river_rat", faction: "ura", x: 68, y: 122 },
		{ type: "river_rat", faction: "ura", x: 72, y: 123 },
		{ type: "river_rat", faction: "ura", x: 76, y: 122 },
		{ type: "river_rat", faction: "ura", x: 80, y: 123 },
		{ type: "river_rat", faction: "ura", x: 84, y: 122 },
		{ type: "river_rat", faction: "ura", x: 88, y: 123 },
		{ type: "river_rat", faction: "ura", x: 92, y: 122 },
		{ type: "river_rat", faction: "ura", x: 96, y: 123 },

		// ----- Starting army — the largest OEF force ever assembled -----
		// Front line (behind wall — 12 Mudfoots)
		{ type: "mudfoot", faction: "ura", x: 24, y: 94 },
		{ type: "mudfoot", faction: "ura", x: 32, y: 94 },
		{ type: "mudfoot", faction: "ura", x: 40, y: 94 },
		{ type: "mudfoot", faction: "ura", x: 48, y: 94 },
		{ type: "mudfoot", faction: "ura", x: 56, y: 94 },
		{ type: "mudfoot", faction: "ura", x: 64, y: 94 },
		{ type: "mudfoot", faction: "ura", x: 72, y: 94 },
		{ type: "mudfoot", faction: "ura", x: 80, y: 94 },
		{ type: "mudfoot", faction: "ura", x: 88, y: 94 },
		{ type: "mudfoot", faction: "ura", x: 96, y: 94 },
		{ type: "mudfoot", faction: "ura", x: 104, y: 94 },
		{ type: "mudfoot", faction: "ura", x: 112, y: 94 },
		// Second line (6 Shellcrackers — ranged)
		{ type: "shellcracker", faction: "ura", x: 32, y: 98 },
		{ type: "shellcracker", faction: "ura", x: 48, y: 98 },
		{ type: "shellcracker", faction: "ura", x: 64, y: 98 },
		{ type: "shellcracker", faction: "ura", x: 80, y: 98 },
		{ type: "shellcracker", faction: "ura", x: 96, y: 98 },
		{ type: "shellcracker", faction: "ura", x: 112, y: 98 },
		// Artillery (5 Mortar Otters)
		{ type: "mortar_otter", faction: "ura", x: 40, y: 102 },
		{ type: "mortar_otter", faction: "ura", x: 56, y: 102 },
		{ type: "mortar_otter", faction: "ura", x: 72, y: 102 },
		{ type: "mortar_otter", faction: "ura", x: 88, y: 102 },
		{ type: "mortar_otter", faction: "ura", x: 104, y: 102 },
		// Sappers (4 — siege reserve)
		{ type: "sapper", faction: "ura", x: 60, y: 106 },
		{ type: "sapper", faction: "ura", x: 68, y: 106 },
		{ type: "sapper", faction: "ura", x: 76, y: 106 },
		{ type: "sapper", faction: "ura", x: 84, y: 106 },
		// Divers and Raftsmen (flanking reserve)
		{ type: "diver", faction: "ura", x: 16, y: 104 },
		{ type: "diver", faction: "ura", x: 20, y: 104 },
		{ type: "raftsman", faction: "ura", x: 140, y: 104 },
		{ type: "raftsman", faction: "ura", x: 144, y: 104 },

		// ═══════════════════════════════════════════════════════════════════
		// NEUTRAL RESOURCES
		// ═══════════════════════════════════════════════════════════════════

		// Timber (western mangrove grove)
		{ type: "mangrove_tree", faction: "neutral", x: 8, y: 114 },
		{ type: "mangrove_tree", faction: "neutral", x: 14, y: 118 },
		{ type: "mangrove_tree", faction: "neutral", x: 20, y: 116 },
		{ type: "mangrove_tree", faction: "neutral", x: 26, y: 120 },
		{ type: "mangrove_tree", faction: "neutral", x: 32, y: 114 },
		{ type: "mangrove_tree", faction: "neutral", x: 10, y: 122 },
		{ type: "mangrove_tree", faction: "neutral", x: 18, y: 124 },
		{ type: "mangrove_tree", faction: "neutral", x: 36, y: 118 },
		{ type: "mangrove_tree", faction: "neutral", x: 40, y: 122 },
		// Timber (eastern mangrove grove)
		{ type: "mangrove_tree", faction: "neutral", x: 120, y: 114 },
		{ type: "mangrove_tree", faction: "neutral", x: 126, y: 118 },
		{ type: "mangrove_tree", faction: "neutral", x: 132, y: 116 },
		{ type: "mangrove_tree", faction: "neutral", x: 138, y: 120 },
		{ type: "mangrove_tree", faction: "neutral", x: 144, y: 114 },
		{ type: "mangrove_tree", faction: "neutral", x: 128, y: 122 },
		{ type: "mangrove_tree", faction: "neutral", x: 136, y: 124 },
		{ type: "mangrove_tree", faction: "neutral", x: 148, y: 118 },
		{ type: "mangrove_tree", faction: "neutral", x: 152, y: 122 },
		// Fish (river spots)
		{ type: "fish_spot", faction: "neutral", x: 116, y: 116 },
		{ type: "fish_spot", faction: "neutral", x: 124, y: 114 },
		{ type: "fish_spot", faction: "neutral", x: 132, y: 116 },
		{ type: "fish_spot", faction: "neutral", x: 140, y: 114 },
		// Salvage (no-man's land — risky to gather during defense phase)
		{ type: "salvage_cache", faction: "neutral", x: 32, y: 76 },
		{ type: "salvage_cache", faction: "neutral", x: 64, y: 78 },
		{ type: "salvage_cache", faction: "neutral", x: 96, y: 74 },
		{ type: "salvage_cache", faction: "neutral", x: 128, y: 76 },
		// Salvage (enemy base — reward for counterattack)
		{ type: "salvage_cache", faction: "neutral", x: 24, y: 20 },
		{ type: "salvage_cache", faction: "neutral", x: 56, y: 24 },
		{ type: "salvage_cache", faction: "neutral", x: 96, y: 20 },
		{ type: "salvage_cache", faction: "neutral", x: 136, y: 24 },

		// ═══════════════════════════════════════════════════════════════════
		// SCALE-GUARD BASE (north — active during Phase 2)
		// ═══════════════════════════════════════════════════════════════════

		// Command Post (the final objective — 4000 HP)
		{ type: "sg_command_post", faction: "scale_guard", x: 80, y: 6, hp: 4000 },
		// Base buildings
		{ type: "predator_nest", faction: "scale_guard", x: 16, y: 4 },
		{ type: "predator_nest", faction: "scale_guard", x: 40, y: 8 },
		{ type: "barracks", faction: "scale_guard", x: 120, y: 4 },
		{ type: "barracks", faction: "scale_guard", x: 140, y: 8 },
		{ type: "venom_spire", faction: "scale_guard", x: 56, y: 20 },
		{ type: "venom_spire", faction: "scale_guard", x: 104, y: 20 },
		{ type: "watchtower", faction: "scale_guard", x: 32, y: 34 },
		{ type: "watchtower", faction: "scale_guard", x: 64, y: 34 },
		{ type: "watchtower", faction: "scale_guard", x: 96, y: 34 },
		{ type: "watchtower", faction: "scale_guard", x: 128, y: 34 },
		// Enemy forward wall (9 segments — mirrors player wall)
		{ type: "fortified_wall", faction: "scale_guard", x: 16, y: 36 },
		{ type: "fortified_wall", faction: "scale_guard", x: 32, y: 36 },
		{ type: "fortified_wall", faction: "scale_guard", x: 48, y: 36 },
		{ type: "fortified_wall", faction: "scale_guard", x: 64, y: 36 },
		{ type: "fortified_wall", faction: "scale_guard", x: 80, y: 36 },
		{ type: "fortified_wall", faction: "scale_guard", x: 96, y: 36 },
		{ type: "fortified_wall", faction: "scale_guard", x: 112, y: 36 },
		{ type: "fortified_wall", faction: "scale_guard", x: 128, y: 36 },
		{ type: "fortified_wall", faction: "scale_guard", x: 144, y: 36 },
		// Base garrison — Croc Champions (5)
		{ type: "croc_champion", faction: "scale_guard", x: 64, y: 12 },
		{ type: "croc_champion", faction: "scale_guard", x: 80, y: 10 },
		{ type: "croc_champion", faction: "scale_guard", x: 96, y: 12 },
		{ type: "croc_champion", faction: "scale_guard", x: 72, y: 22 },
		{ type: "croc_champion", faction: "scale_guard", x: 88, y: 22 },
		// Gators — garrison (12)
		{ type: "gator", faction: "scale_guard", x: 24, y: 18 },
		{ type: "gator", faction: "scale_guard", x: 36, y: 14 },
		{ type: "gator", faction: "scale_guard", x: 48, y: 18 },
		{ type: "gator", faction: "scale_guard", x: 60, y: 26 },
		{ type: "gator", faction: "scale_guard", x: 76, y: 28 },
		{ type: "gator", faction: "scale_guard", x: 84, y: 26 },
		{ type: "gator", faction: "scale_guard", x: 100, y: 28 },
		{ type: "gator", faction: "scale_guard", x: 116, y: 18 },
		{ type: "gator", faction: "scale_guard", x: 132, y: 14 },
		{ type: "gator", faction: "scale_guard", x: 144, y: 18 },
		{ type: "gator", faction: "scale_guard", x: 28, y: 30 },
		{ type: "gator", faction: "scale_guard", x: 132, y: 30 },
		// Vipers (4)
		{ type: "viper", faction: "scale_guard", x: 40, y: 22 },
		{ type: "viper", faction: "scale_guard", x: 56, y: 16 },
		{ type: "viper", faction: "scale_guard", x: 104, y: 16 },
		{ type: "viper", faction: "scale_guard", x: 120, y: 22 },
		// Snappers (3)
		{ type: "snapper", faction: "scale_guard", x: 52, y: 30 },
		{ type: "snapper", faction: "scale_guard", x: 80, y: 30 },
		{ type: "snapper", faction: "scale_guard", x: 108, y: 30 },

		// No-man's land — scattered Skink scouts
		{
			type: "skink",
			faction: "scale_guard",
			x: 40,
			y: 60,
			patrol: [
				[40, 60],
				[80, 60],
				[120, 60],
				[80, 60],
				[40, 60],
			],
		},
		{
			type: "skink",
			faction: "scale_guard",
			x: 100,
			y: 58,
			patrol: [
				[100, 58],
				[140, 58],
				[100, 58],
			],
		},
	],

	startResources: { fish: 600, timber: 500, salvage: 400 },
	startPopCap: 30,

	weather: {
		pattern: [
			{ type: "clear", startTime: 0, duration: 240 },
			{ type: "rain", startTime: 240, duration: 180 },
			{ type: "storm", startTime: 420, duration: 120 },
			{ type: "clear", startTime: 540, duration: 180 },
			{ type: "rain", startTime: 720, duration: 120 },
			{ type: "clear", startTime: 840, duration: 360 },
		],
	},

	objectives: {
		primary: [
			objective("survive-10-waves", "Survive the Scale-Guard final offensive — 10 waves"),
			objective("destroy-command-post", "Destroy the Scale-Guard Command Post"),
		],
		bonus: [
			objective("bonus-fortress", "No buildings lost during the defense"),
			objective("bonus-blitzkrieg", "Complete the mission in under 16 minutes"),
			objective("bonus-no-hero-left-behind", "All named heroes survive the campaign"),
		],
	},

	// ═══════════════════════════════════════════════════════════════════════
	// TRIGGERS
	// ═══════════════════════════════════════════════════════════════════════

	triggers: [
		// ────────────────────────────────────────────────────────────────
		// PHASE 1: THE LAST STAND — 10-wave defense
		// ────────────────────────────────────────────────────────────────

		// Mission briefing — Gen. Whiskers' speech
		trigger(
			"phase:defense:briefing",
			on.timer(3),
			act.exchange([
				{
					speaker: "Gen. Whiskers",
					text: "All units, this is Gen. Whiskers. This is the day we've been fighting toward since Beachhead. The Scale-Guard have consolidated everything they have left for one final assault on our position. If we hold — they're done. If we break — the campaign was for nothing.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "I'm not going to stand here and tell you this will be easy. It won't. They outnumber us. They outweigh us. They have every reason to fight to the last scale. But we have something they don't — we're fighting for our home.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "To every otter on this line: you are the Otter Elite Force. You are the best soldiers in the Copper-Silt Reach. And today, you will prove it. Through mud and water, Captain. Hold the line.",
				},
			]),
		),

		// Tactical brief from Col. Bubbles + FOXHOUND
		trigger(
			"phase:defense:tactical-brief",
			on.timer(10),
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Tactical brief, Captain. They'll hit us from the north across no-man's land. Three bridges, two fords. Fortified wall is our primary defense — keep your Shellcrackers on the wall, Mortars behind it.",
				},
				{
					speaker: "FOXHOUND",
					text: "Scale-Guard staging areas are massing troops. I count ten distinct formation groups. Expect ten waves over the next twelve minutes. They'll start probing and escalate to full commitment.",
				},
			]),
		),

		// All-hands radio check
		trigger(
			"phase:defense:all-hands",
			on.timer(20),
			act.exchange([
				{
					speaker: "Medic Marina",
					text: "Field hospital is standing by, Captain. I'll keep your troops patched up as long as I can. Stay close to your Burrows for the retreat protocol.",
				},
				{
					speaker: "FOXHOUND",
					text: "First wave forming up. Here they come.",
				},
			]),
		),

		// ═══ WAVE 1 (1:00) — Probing attack: 6 Gators, 4 Skinks = 10 ═══
		trigger("phase:defense:wave-1", on.timer(60), [
			act.spawn("gator", "scale_guard", 80, 44, 6),
			act.spawn("skink", "scale_guard", 76, 42, 4),
			act.dialogue(
				"foxhound",
				"Wave one! Gators and Skinks, center approach. Standard probing force.",
			),
		]),

		// ═══ WAVE 2 (2:30) — Two-pronged: 8 Gators, 4 Vipers = 12 ═══
		trigger("phase:defense:wave-2", on.timer(150), [
			act.spawn("gator", "scale_guard", 32, 44, 4),
			act.spawn("gator", "scale_guard", 128, 44, 4),
			act.spawn("viper", "scale_guard", 36, 42, 2),
			act.spawn("viper", "scale_guard", 124, 42, 2),
			act.dialogue(
				"foxhound",
				"Wave two — split attack! Gators on both flanks, Vipers providing covering fire.",
			),
		]),

		// ═══ WAVE 3 (4:00) — Heavy center push: 12 Gators, 2 Snappers = 14 ═══
		trigger("phase:defense:wave-3", on.timer(240), [
			act.spawn("gator", "scale_guard", 72, 44, 6),
			act.spawn("gator", "scale_guard", 88, 44, 6),
			act.spawn("snapper", "scale_guard", 80, 42, 2),
			act.dialogue(
				"sgt_bubbles",
				"Wave three — heavy push up the center! Snappers leading the charge. Focus fire on those Snappers before they reach the wall!",
			),
		]),

		// ═══ WAVE 4 (5:15) — Three-pronged flanking: 12 Gators, 6 Vipers = 18 ═══
		trigger("phase:defense:wave-4", on.timer(315), [
			act.spawn("gator", "scale_guard", 8, 56, 4),
			act.spawn("gator", "scale_guard", 152, 56, 4),
			act.spawn("viper", "scale_guard", 12, 54, 3),
			act.spawn("viper", "scale_guard", 148, 54, 3),
			act.spawn("gator", "scale_guard", 80, 44, 4),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Wave four! They're trying to flank — forces coming through the burned jungle on both sides AND up the center!",
				},
				{
					speaker: "Col. Bubbles",
					text: "West flank watchtowers, focus those flankers! East flank, same! Center holds the line!",
				},
			]),
		]),

		// ═══ WAVE 5 (6:30) — Croc Champions: 4 Champs, 8 Gators = 12 ═══
		trigger("phase:defense:wave-5", on.timer(390), [
			act.spawn("croc_champion", "scale_guard", 56, 44, 2),
			act.spawn("croc_champion", "scale_guard", 104, 44, 2),
			act.spawn("gator", "scale_guard", 48, 46, 4),
			act.spawn("gator", "scale_guard", 96, 46, 4),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Wave five — Croc Champions! Two on the left, two on the right. They're bringing the heavies.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "Mortar Otters, target those Champions. Don't let them reach the wall.",
				},
			]),
		]),

		// Midpoint rally
		trigger(
			"phase:defense:midpoint-rally",
			on.timer(395),
			act.dialogue(
				"sgt_bubbles",
				"Halfway there, Captain. Five waves down. Five to go. You're doing it.",
			),
		),

		// ═══ WAVE 6 (7:45) — Mass infantry + Snappers: 8 Gators, 4 Vipers, 3 Snappers = 15 ═══
		trigger("phase:defense:wave-6", on.timer(465), [
			act.spawn("gator", "scale_guard", 64, 44, 8),
			act.spawn("viper", "scale_guard", 56, 40, 4),
			act.spawn("snapper", "scale_guard", 72, 40, 3),
			act.dialogue(
				"foxhound",
				"Wave six — massed infantry with Snapper fire support. They're trying to overwhelm the center.",
			),
		]),

		// ═══ WAVE 7 (9:00) — Coordinated multi-front: 16 Gators, 2 Champs, 6 Vipers = 24 ═══
		trigger("phase:defense:wave-7", on.timer(540), [
			act.spawn("gator", "scale_guard", 32, 44, 5),
			act.spawn("gator", "scale_guard", 80, 44, 6),
			act.spawn("gator", "scale_guard", 128, 44, 5),
			act.spawn("croc_champion", "scale_guard", 80, 42, 2),
			act.spawn("viper", "scale_guard", 64, 40, 3),
			act.spawn("viper", "scale_guard", 96, 40, 3),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Wave seven! All three approaches simultaneously! This is their biggest push yet!",
				},
				{
					speaker: "Col. Bubbles",
					text: "Everything on the line, Captain! Pull reserves forward if you have them!",
				},
			]),
		]),

		// ═══ WAVE 8 (10:00) — Shock assault: 9 Champs, 8 Gators = 17 ═══
		trigger("phase:defense:wave-8", on.timer(600), [
			act.spawn("croc_champion", "scale_guard", 40, 44, 3),
			act.spawn("croc_champion", "scale_guard", 80, 44, 3),
			act.spawn("croc_champion", "scale_guard", 120, 44, 3),
			act.spawn("gator", "scale_guard", 60, 46, 4),
			act.spawn("gator", "scale_guard", 100, 46, 4),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Wave eight — nine Croc Champions leading a full assault! This is their shock force!",
				},
				{
					speaker: "Medic Marina",
					text: "Captain, casualties are mounting. I'm doing what I can but we need that wall to hold!",
				},
				{
					speaker: "Gen. Whiskers",
					text: "HOLD! Do NOT give ground! We break them here or we lose everything!",
				},
			]),
		]),

		// ═══ WAVE 9 (11:00) — Desperation: 24 Gators, 2 Champs, 6 Vipers, 2 Snappers = 34 ═══
		trigger("phase:defense:wave-9", on.timer(660), [
			act.spawn("gator", "scale_guard", 24, 44, 6),
			act.spawn("gator", "scale_guard", 56, 44, 6),
			act.spawn("gator", "scale_guard", 104, 44, 6),
			act.spawn("gator", "scale_guard", 136, 44, 6),
			act.spawn("croc_champion", "scale_guard", 80, 42, 2),
			act.spawn("viper", "scale_guard", 40, 40, 3),
			act.spawn("viper", "scale_guard", 120, 40, 3),
			act.spawn("snapper", "scale_guard", 80, 40, 2),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Wave nine — everything from everywhere! Twenty-four Gators, two Champions, six Vipers, two Snappers!",
				},
				{
					speaker: "Col. Bubbles",
					text: "This is their all-in, Captain. They're throwing the last of their reserves at us. One more wave after this!",
				},
			]),
		]),

		// ═══ WAVE 10 (12:00) — FINAL WAVE: 10 Champs, 20 Gators, 8 Vipers, 4 Snappers = 42 ═══
		trigger("phase:defense:wave-10", on.timer(720), [
			act.spawn("croc_champion", "scale_guard", 32, 42, 3),
			act.spawn("croc_champion", "scale_guard", 80, 42, 4),
			act.spawn("croc_champion", "scale_guard", 128, 42, 3),
			act.spawn("gator", "scale_guard", 48, 44, 6),
			act.spawn("gator", "scale_guard", 80, 44, 8),
			act.spawn("gator", "scale_guard", 112, 44, 6),
			act.spawn("viper", "scale_guard", 64, 40, 4),
			act.spawn("viper", "scale_guard", 96, 40, 4),
			act.spawn("snapper", "scale_guard", 56, 40, 2),
			act.spawn("snapper", "scale_guard", 104, 40, 2),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "WAVE TEN! FINAL WAVE! Everything they have — Champions, Gators, Vipers, Snappers — ALL OF IT!",
				},
				{
					speaker: "Gen. Whiskers",
					text: "THIS IS IT! The last wave! Hold this line and the Scale-Guard offensive is BROKEN! FOR THE REACH!",
				},
			]),
		]),

		// Waves cleared — timer-based (allows wave 10 forces to be engaged/destroyed)
		// At ~14:00 the last wave should be cleared; fires Phase 2 transition
		trigger("phase:defense:waves-cleared", on.timer(840), [
			act.completeObjective("survive-10-waves"),
			act.exchange([
				{
					speaker: "Gen. Whiskers",
					text: "...They're retreating. The line holds. THE LINE HOLDS!",
				},
				{
					speaker: "Col. Bubbles",
					text: "Ten waves, Captain. You held against ten waves. I've never seen anything like it.",
				},
				{
					speaker: "Medic Marina",
					text: "Casualties are... significant. But we're still here. We're still standing.",
				},
				{
					speaker: "FOXHOUND",
					text: "Scale-Guard offensive capability is spent. Their staging areas are empty. They have nothing left but what's in that base.",
				},
			]),
			act.startPhase("counterattack"),
			act.enableTrigger("phase:counterattack:briefing"),
			act.enableTrigger("phase:counterattack:reveal-base"),
		]),

		// ────────────────────────────────────────────────────────────────
		// PHASE 2: COUNTERATTACK
		// ────────────────────────────────────────────────────────────────

		// Phase 2 briefing (enabled by Phase 1 completion)
		trigger(
			"phase:counterattack:briefing",
			on.timer(845),
			[
				act.exchange([
					{
						speaker: "Gen. Whiskers",
						text: "Now it's our turn. They threw everything at us and we didn't break. Their base is exposed. Captain — give the order.",
					},
					{
						speaker: "Col. Bubbles",
						text: "Scale-Guard command post is due north, behind their wall line. Predator Nests, Venom Spires, Croc Champions — a full garrison. But they have no reserves. What you see is what they have.",
					},
					{
						speaker: "FOXHOUND",
						text: "I'm revealing their base layout now. Three bridges across the river, two fords. Their wall mirrors ours. Sappers will need to breach it.",
					},
				]),
				act.addObjective("destroy-command-post", "Destroy the Scale-Guard Command Post", "primary"),
			],
			{ enabled: false },
		),

		// Reveal enemy base zones (enabled by Phase 1 completion)
		trigger(
			"phase:counterattack:reveal-base",
			on.timer(850),
			[
				act.revealZone("sg_staging_w"),
				act.revealZone("sg_staging_center"),
				act.revealZone("sg_staging_e"),
				act.revealZone("sg_wall_north"),
				act.revealZone("sg_armory_w"),
				act.revealZone("sg_inner_compound"),
				act.revealZone("sg_armory_e"),
				act.revealZone("sg_barracks_nw"),
				act.revealZone("sg_command_post"),
				act.exchange([
					{
						speaker: "Cpl. Splash",
						text: "Splash reporting in, Captain. My Divers are ready. We can swim the river and hit their flanks before they know we're coming.",
					},
					{
						speaker: "Sgt. Fang",
						text: "Fang here. Give me the word and my siege team will punch through that wall like it's made of mud.",
					},
				]),
			],
			{ enabled: false },
		),

		// River crossed
		trigger(
			"phase:counterattack:river-crossed",
			on.areaEntered("ura", "river_crossing"),
			act.dialogue(
				"foxhound",
				"Forces crossing the river. You're in their territory now, Captain.",
			),
		),

		// Contested north entered
		trigger(
			"phase:counterattack:contested-north",
			on.areaEntered("ura", "contested_nw"),
			act.dialogue(
				"sgt_bubbles",
				"Pushing through no-man's land. Keep the momentum — don't let them regroup.",
			),
		),

		// Approaching Scale-Guard wall
		trigger(
			"phase:counterattack:sg-wall-approach",
			on.areaEntered("ura", "sg_staging_center"),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Scale-Guard forward wall. Watchtowers, fortified positions. Sapper teams — breach those walls.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Mortars, suppress those watchtowers! Infantry, stand by to push through the breach!",
				},
			]),
		),

		// Scale-Guard wall breached
		trigger(
			"phase:counterattack:sg-wall-breached",
			on.buildingCount("scale_guard", "fortified_wall", "lte", 2),
			act.dialogue(
				"sgt_bubbles",
				"Wall breached! Push into their compound! The command post is in sight!",
			),
		),

		// Compound entered
		trigger(
			"phase:counterattack:compound-entered",
			on.areaEntered("ura", "sg_inner_compound"),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Inside the compound. Venom Spires on both flanks — take them out. Command post is straight ahead.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "We're inside their walls, Captain. Finish this. End the occupation.",
				},
			]),
		),

		// Venom Spires destroyed
		trigger(
			"phase:counterattack:spires-destroyed",
			on.buildingCount("scale_guard", "venom_spire", "eq", 0),
			act.dialogue("foxhound", "Both Venom Spires down. Path to the command post is clear."),
		),

		// Predator Nests destroyed
		trigger(
			"phase:counterattack:nests-destroyed",
			on.buildingCount("scale_guard", "predator_nest", "eq", 0),
			act.dialogue(
				"sgt_bubbles",
				"Predator Nests destroyed. No more Scale-Guard spawning. This is the end for them.",
			),
		),

		// Command Post at 50% HP
		trigger(
			"phase:counterattack:cp-50",
			on.healthThreshold("sg_command_post", 50, "below"),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Command post at half integrity! They're fighting to the last scale but they can't stop us now.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "Keep hitting it! Don't stop until that building is rubble!",
				},
			]),
		),

		// Command Post at 25% HP
		trigger(
			"phase:counterattack:cp-25",
			on.healthThreshold("sg_command_post", 25, "below"),
			act.dialogue(
				"sgt_bubbles",
				"Command post is crumbling! One more push, Captain! ONE MORE PUSH!",
			),
		),

		// Command Post destroyed
		trigger(
			"phase:counterattack:cp-destroyed",
			on.buildingCount("scale_guard", "sg_command_post", "eq", 0),
			act.completeObjective("destroy-command-post"),
		),

		// ────────────────────────────────────────────────────────────────
		// DEFEAT CONDITIONS
		// ────────────────────────────────────────────────────────────────

		// Lodge destroyed = defeat
		trigger(
			"phase:defeat:lodge-destroyed",
			on.buildingCount("ura", "lodge", "eq", 0),
			act.failMission("The Lodge has been destroyed. The OEF has fallen."),
		),

		// ────────────────────────────────────────────────────────────────
		// VICTORY — THE WAR IS OVER
		// Every named character radios in.
		// ────────────────────────────────────────────────────────────────

		trigger("phase:victory:mission-complete", on.allPrimaryComplete(), [
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "...Scale-Guard command post destroyed. All Scale-Guard frequencies have gone silent. Confirming — the Scale-Guard command structure has collapsed.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Captain... we did it. It's over. The occupation of the Copper-Silt Reach is over.",
				},
				{
					speaker: "Medic Marina",
					text: "Medical teams are moving in. So many wounded... but they're alive, Captain. They're alive because of you.",
				},
				{
					speaker: "Cpl. Splash",
					text: "Splash here. I grew up on these rivers, Captain. I never thought I'd see them free again. Thank you. From every otter who ever called the Reach home — thank you.",
				},
				{
					speaker: "Sgt. Fang",
					text: "Fang reporting. The last of the Scale-Guard garrison is laying down arms. No more resistance. The Reach is ours.",
				},
				{
					speaker: "FOXHOUND",
					text: "This is FOXHOUND signing off combat operations. All OEF units — the war is won. I repeat: the war is won.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "Captain.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "When we landed at that beach — Mission One, you remember — I was in a cage. Ironjaw had me locked up in that compound and I thought that was the end. The end of the OEF. The end of everything we'd fought for.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "Then you came. A Captain with four River Rats and nothing but mangrove timber and stubbornness. And you built. You fought. You rescued me. You rescued all of us.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "Sixteen battles, Captain. From Beachhead to the Reckoning. Through monsoons and toxic sludge and three rings of fortress wall and the largest Scale-Guard army ever assembled. And you never lost. Not once.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "The Copper-Silt Reach is free tonight because of you. The rivers run clean. The villages can rebuild. The crossings are open. Our people can go home.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "I've commanded soldiers for thirty years, Captain. I've never served with a finer one than you.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "Through mud and water. OEF out.",
				},
			]),
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
			enemyDamageMultiplier: 1.5,
			enemyHpMultiplier: 1.5,
			resourceMultiplier: 0.75,
			xpMultiplier: 2.0,
		},
	},
};
