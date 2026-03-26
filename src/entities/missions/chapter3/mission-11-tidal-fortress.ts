// Mission 11: Entrenchment — Tidal Siege
//
// Scale-Guard's regional command sits on Stonebreak Island, a heavily
// fortified rocky island in the northern Blackmarsh. Tidal flats surround
// the fortress — three land bridges surface during low tide, each covered
// by a Venom Spire. The player must time assaults to the 3-minute tidal
// cycle, cross the bridges during low tide, breach the fortress walls,
// and destroy the Scale-Guard Command Post.
//
// Teaches: tidal mechanics, siege timing, coordinated multi-prong attacks.
// Win: Destroy the Scale-Guard Command Post. Bonus: Destroy all 3 Venom Spires.
// Par time: 18 min (1080s).

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
				text: "Scale-Guard's regional command sits on Stonebreak Island. Tidal flats surround it — the only approach is during low tide when the land bridges surface.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Captain, tides cycle every three minutes. Low tide gives you a window to cross. When the water rises, anyone still on the flats drowns. No exceptions.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Probe on the first cycle, commit on the second.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Three Venom Spires cover the approaches — take those first to open lanes for your main force. Their Command Post in the center is the primary target.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Patience and timing, Captain. Crack this rock. HQ out.",
			},
		],
	},

	terrain: {
		width: 160,
		height: 128,
		regions: [
			{ terrainId: "water", fill: true },
			// Southern mainland (player territory)
			{ terrainId: "grass", rect: { x: 0, y: 80, w: 160, h: 48 } },
			// Player base clearing
			{ terrainId: "dirt", rect: { x: 32, y: 96, w: 96, h: 16 } },
			// Mangrove cover on mainland
			{ terrainId: "mangrove", rect: { x: 0, y: 80, w: 28, h: 16 } },
			{ terrainId: "mangrove", rect: { x: 132, y: 80, w: 28, h: 16 } },
			{ terrainId: "mangrove", circle: { cx: 48, cy: 88, r: 6 } },
			{ terrainId: "mangrove", circle: { cx: 112, cy: 88, r: 6 } },
			// Muddy shoreline (staging areas)
			{ terrainId: "mud", rect: { x: 0, y: 56, w: 160, h: 24 } },
			// Mud patches
			{ terrainId: "mud", circle: { cx: 28, cy: 62, r: 5 } },
			{ terrainId: "mud", circle: { cx: 132, cy: 62, r: 5 } },
			// Tidal flats (terrain changes with tide — water or beach)
			// At mission start (low tide): beach
			{ terrainId: "beach", rect: { x: 0, y: 40, w: 160, h: 16 } },
			// Three land bridges (always beach at low tide, submerged at high)
			{ terrainId: "beach", rect: { x: 20, y: 32, w: 16, h: 24 } },
			{ terrainId: "beach", rect: { x: 68, y: 32, w: 16, h: 24 } },
			{ terrainId: "beach", rect: { x: 120, y: 32, w: 16, h: 24 } },
			// Fortress island
			{ terrainId: "dirt", rect: { x: 40, y: 0, w: 80, h: 32 } },
			// Inner fortress (stone floor)
			{ terrainId: "dirt", rect: { x: 56, y: 12, w: 48, h: 12 } },
			// Fortress walls (stone — destructible but high HP)
			{ terrainId: "dirt", rect: { x: 40, y: 10, w: 80, h: 2 } },
			{ terrainId: "dirt", rect: { x: 40, y: 24, w: 80, h: 2 } },
			{ terrainId: "dirt", rect: { x: 40, y: 10, w: 2, h: 16 } },
			{ terrainId: "dirt", rect: { x: 118, y: 10, w: 2, h: 16 } },
			// Resource areas (south)
			{ terrainId: "mud", rect: { x: 8, y: 116, w: 20, h: 8 } },
			{ terrainId: "water", circle: { cx: 140, cy: 120, r: 6 } },
		],
		overrides: [
			// Gate breaches in fortress walls (3 entry points, one per bridge)
			// West gate
			{ x: 40, y: 18, terrainId: "dirt" },
			{ x: 40, y: 19, terrainId: "dirt" },
			// Center gate (north wall)
			{ x: 78, y: 10, terrainId: "dirt" },
			{ x: 79, y: 10, terrainId: "dirt" },
			// East gate
			{ x: 118, y: 18, terrainId: "dirt" },
			{ x: 118, y: 19, terrainId: "dirt" },
		],
	},

	zones: {
		ura_base: { x: 24, y: 96, width: 112, height: 16 },
		supply_south: { x: 8, y: 112, width: 144, height: 16 },
		mainland_w: { x: 0, y: 80, width: 64, height: 16 },
		mainland_center: { x: 64, y: 80, width: 96, height: 16 },
		mudshore_w: { x: 0, y: 56, width: 56, height: 24 },
		mudshore_center: { x: 56, y: 56, width: 48, height: 24 },
		mudshore_e: { x: 104, y: 56, width: 56, height: 24 },
		tidal_flats: { x: 0, y: 40, width: 160, height: 16 },
		west_bridge: { x: 20, y: 32, width: 16, height: 16 },
		center_bridge: { x: 68, y: 32, width: 16, height: 16 },
		east_bridge: { x: 120, y: 32, width: 16, height: 16 },
		fortress_south: { x: 40, y: 24, width: 80, height: 8 },
		fortress_north: { x: 40, y: 0, width: 80, height: 12 },
		inner_fortress: { x: 56, y: 12, width: 48, height: 12 },
		spire_west: { x: 44, y: 24, width: 8, height: 8 },
		spire_north: { x: 72, y: 2, width: 8, height: 8 },
		spire_east: { x: 108, y: 24, width: 8, height: 8 },
	},

	placements: [
		// ─── Player (ura_base) ───

		// Lodge
		{ type: "burrow", faction: "ura", x: 80, y: 104 },
		// Pre-built base
		{ type: "command_post", faction: "ura", x: 72, y: 100 },
		{ type: "barracks", faction: "ura", x: 56, y: 100 },
		{ type: "armory", faction: "ura", x: 88, y: 100 },

		// Starting army — 8 Mudfoots
		{ type: "mudfoot", faction: "ura", x: 56, y: 98 },
		{ type: "mudfoot", faction: "ura", x: 60, y: 96 },
		{ type: "mudfoot", faction: "ura", x: 64, y: 98 },
		{ type: "mudfoot", faction: "ura", x: 68, y: 96 },
		{ type: "mudfoot", faction: "ura", x: 72, y: 98 },
		{ type: "mudfoot", faction: "ura", x: 76, y: 96 },
		{ type: "mudfoot", faction: "ura", x: 80, y: 98 },
		{ type: "mudfoot", faction: "ura", x: 84, y: 96 },
		// 4 Shellcrackers
		{ type: "shellcracker", faction: "ura", x: 52, y: 102 },
		{ type: "shellcracker", faction: "ura", x: 60, y: 102 },
		{ type: "shellcracker", faction: "ura", x: 68, y: 102 },
		{ type: "shellcracker", faction: "ura", x: 84, y: 102 },
		// 2 Mortar Otters
		{ type: "mortar_otter", faction: "ura", x: 76, y: 104 },
		{ type: "mortar_otter", faction: "ura", x: 88, y: 104 },
		// 2 Sappers
		{ type: "sapper", faction: "ura", x: 64, y: 104 },
		{ type: "sapper", faction: "ura", x: 96, y: 102 },
		// 3 Workers
		{ type: "river_rat", faction: "ura", x: 48, y: 106 },
		{ type: "river_rat", faction: "ura", x: 52, y: 108 },
		{ type: "river_rat", faction: "ura", x: 100, y: 106 },

		// ─── Resources ───

		// Timber (mangrove trees)
		{ type: "mangrove_tree", faction: "neutral", x: 8, y: 84 },
		{ type: "mangrove_tree", faction: "neutral", x: 14, y: 86 },
		{ type: "mangrove_tree", faction: "neutral", x: 20, y: 88 },
		{ type: "mangrove_tree", faction: "neutral", x: 136, y: 84 },
		{ type: "mangrove_tree", faction: "neutral", x: 142, y: 86 },
		{ type: "mangrove_tree", faction: "neutral", x: 148, y: 88 },
		// Fish
		{ type: "fish_spot", faction: "neutral", x: 138, y: 118 },
		{ type: "fish_spot", faction: "neutral", x: 144, y: 122 },
		{ type: "fish_spot", faction: "neutral", x: 12, y: 120 },
		// Salvage
		{ type: "salvage_cache", faction: "neutral", x: 80, y: 112 },
		{ type: "salvage_cache", faction: "neutral", x: 40, y: 114 },
		{ type: "salvage_cache", faction: "neutral", x: 120, y: 114 },

		// ─── Enemies — Fortress Garrison ───

		// Scale-Guard Command Post (primary objective)
		{ type: "command_post", faction: "scale_guard", x: 80, y: 16 },

		// Three Venom Spires covering land bridge approaches
		{ type: "venom_spire", faction: "scale_guard", x: 46, y: 26 },
		{ type: "venom_spire", faction: "scale_guard", x: 76, y: 4 },
		{ type: "venom_spire", faction: "scale_guard", x: 112, y: 26 },

		// Fortress wall garrison — outer ring
		{ type: "gator", faction: "scale_guard", x: 48, y: 18 },
		{ type: "gator", faction: "scale_guard", x: 56, y: 22 },
		{ type: "gator", faction: "scale_guard", x: 100, y: 18 },
		{ type: "gator", faction: "scale_guard", x: 108, y: 22 },
		{ type: "viper", faction: "scale_guard", x: 64, y: 20 },
		{ type: "viper", faction: "scale_guard", x: 96, y: 20 },

		// Inner fortress garrison — Command Post defenders
		{ type: "gator", faction: "scale_guard", x: 72, y: 14 },
		{ type: "gator", faction: "scale_guard", x: 80, y: 18 },
		{ type: "gator", faction: "scale_guard", x: 88, y: 14 },
		{ type: "viper", faction: "scale_guard", x: 76, y: 12, count: 2 },
		{ type: "viper", faction: "scale_guard", x: 84, y: 12, count: 2 },
		{ type: "snapper", faction: "scale_guard", x: 80, y: 14, count: 2 },

		// Beach patrol (patrols tidal flats during low tide)
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 40,
			y: 36,
			patrol: [
				[40, 36],
				[120, 36],
				[40, 36],
			],
		},
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 60,
			y: 38,
			patrol: [
				[60, 38],
				[100, 38],
				[60, 38],
			],
		},

		// Bridge checkpoint sentries
		{ type: "gator", faction: "scale_guard", x: 28, y: 30, count: 2 },
		{ type: "gator", faction: "scale_guard", x: 76, y: 30, count: 2 },
		{ type: "gator", faction: "scale_guard", x: 128, y: 30, count: 2 },
	],

	startResources: { fish: 350, timber: 250, salvage: 150 },
	startPopCap: 25,

	weather: {
		pattern: [
			{ type: "clear", startTime: 0, duration: 180 },
			{ type: "rain", startTime: 180, duration: 180 },
			{ type: "clear", startTime: 360, duration: 180 },
			{ type: "rain", startTime: 540, duration: 180 },
			{ type: "clear", startTime: 720, duration: 180 },
			{ type: "storm", startTime: 900, duration: 180 },
		],
	},

	objectives: {
		primary: [objective("destroy-enemy-cp", "Destroy the Scale-Guard Command Post")],
		bonus: [objective("destroy-all-spires", "Destroy all 3 Venom Spires")],
	},

	triggers: [
		// ─── Phase 1: RECON TIDE (0:00 – ~3:00) — LOW TIDE ───

		trigger("phase:recon:start", on.timer(0), act.startPhase("recon")),
		trigger(
			"phase:recon:foxhound-briefing",
			on.timer(3),
			act.dialogue(
				"foxhound",
				"Tide is out for the first three minutes. The land bridges are passable — use this window to scout their defenses. Don't commit your main force yet.",
			),
		),
		trigger(
			"phase:recon:bubbles-tidal-briefing",
			on.timer(15),
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Captain, tides cycle every three minutes. Low tide gives you a window to cross the flats. When the water rises, anyone on the bridges or flats drowns. No exceptions.",
				},
				{
					speaker: "FOXHOUND",
					text: "Three land bridges: west, center, and east. Each one is covered by at least one Venom Spire. Those spires are secondary targets — take them down to open lanes.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Their Command Post is in the center of the fortress. Mortar Otters can hit it from outside the walls if you get close enough. Patience and timing, Captain.",
				},
			]),
		),
		trigger(
			"phase:recon:tide-warning",
			on.timer(150),
			act.dialogue(
				"foxhound",
				"Thirty seconds until high tide. Pull back from the flats or your units drown.",
			),
		),

		// ─── Phase 2: FIRST HIGH TIDE (~3:00 – ~6:00) ───

		trigger("phase:high1:start", on.timer(180), [
			act.startPhase("high-tide-1"),
			act.dialogue(
				"sgt_bubbles",
				"Tide's in! Water is covering the flats. Anything on the bridges is going under. Hold position on the mainland.",
			),
		]),
		trigger(
			"phase:high1:buildup",
			on.timer(210),
			act.dialogue(
				"sgt_bubbles",
				"Use this downtime. Train reinforcements, position your forces at the shoreline. Next low tide, you commit.",
			),
		),
		trigger(
			"phase:high1:tide-warning",
			on.timer(330),
			act.dialogue(
				"foxhound",
				"Thirty seconds to low tide. Get your assault force to the shoreline.",
			),
		),

		// ─── Phase 3: ASSAULT TIDE (~6:00 – ~9:00) — LOW TIDE ───

		trigger("phase:assault:start", on.timer(360), [
			act.startPhase("assault-tide"),
			act.dialogue(
				"sgt_bubbles",
				"Low tide! Bridges are open. This is your assault window — three minutes to get across and establish a foothold. Move, Captain!",
			),
		]),
		trigger(
			"phase:assault:bridge-crossed",
			on.areaEntered("ura", "fortress_south"),
			act.dialogue(
				"foxhound",
				"You're on the island! Push for the inner fortress. Watch for Spire coverage.",
			),
		),
		trigger(
			"phase:assault:bridge-crossed-north",
			on.areaEntered("ura", "fortress_north"),
			act.dialogue(
				"foxhound",
				"You're on the island! Push for the inner fortress. Watch for Spire coverage.",
			),
		),
		trigger(
			"phase:assault:tide-warning",
			on.timer(510),
			act.dialogue(
				"foxhound",
				"Tide coming in again in thirty seconds! Anyone still on the bridges needs to reach the island or fall back to shore. No middle ground.",
			),
		),

		// ─── Phase 4: SIEGE TIDE (~9:00 – ~12:00) — HIGH TIDE ───

		trigger("phase:siege:start", on.timer(540), [
			act.startPhase("siege-tide"),
			act.dialogue(
				"sgt_bubbles",
				"Water's rising! Your forces on the island are on their own until the next low tide. Whatever you've got — it has to be enough.",
			),
		]),
		trigger("phase:siege:fortress-breached", on.areaEntered("ura", "inner_fortress"), [
			act.dialogue(
				"foxhound",
				"You're inside the inner fortress! Their Command Post is right there. Expect them to throw everything they have at you.",
			),
			act.spawn("gator", "scale_guard", 72, 8, 3),
			act.spawn("viper", "scale_guard", 88, 8, 2),
			act.spawn("snapper", "scale_guard", 80, 6, 2),
		]),
		trigger(
			"phase:siege:tide-warning",
			on.timer(690),
			act.dialogue("foxhound", "Next low tide in thirty seconds. Reinforcements can cross then."),
		),

		// ─── Phase 5: FINAL PUSH (~12:00+) — LOW TIDE ───

		trigger("phase:final:start", on.timer(720), [
			act.startPhase("final-push"),
			act.dialogue(
				"sgt_bubbles",
				"Third low tide. If you haven't cracked that fortress yet, this is your window. All in, Captain. Everything you've got.",
			),
		]),
		trigger("phase:final:desperation-reinforcements", on.timer(720), [
			act.spawn("gator", "scale_guard", 60, 6, 4),
			act.spawn("gator", "scale_guard", 100, 6, 4),
			act.spawn("viper", "scale_guard", 80, 2, 3),
			act.dialogue(
				"foxhound",
				"Scale-Guard is pulling reserves from across the Blackmarsh! Massive enemy force converging on the island!",
			),
		]),

		// ─── Objective Completion ───

		trigger(
			"phase:objective:cp-destroyed",
			on.buildingCount("scale_guard", "command_post", "eq", 0),
			act.completeObjective("destroy-enemy-cp"),
		),
		trigger(
			"phase:objective:spires-destroyed",
			on.buildingCount("scale_guard", "venom_spire", "eq", 0),
			[
				act.completeObjective("destroy-all-spires"),
				act.dialogue(
					"foxhound",
					"All Venom Spires neutralized. Approaches are wide open — no more tower fire on the bridges.",
				),
			],
		),
		trigger("phase:objective:mission-complete", on.allPrimaryComplete(), [
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Scale-Guard Command Post is down! Stonebreak Fortress has fallen!",
				},
				{
					speaker: "Col. Bubbles",
					text: "Their regional command is shattered. The Blackmarsh campaign is nearly won, Captain.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "Stonebreak Island is ours. Outstanding siege work. Mortar teams — precision bombardment protocols are now standard doctrine. HQ out.",
				},
			]),
			act.victory(),
		]),
	],

	unlocks: {},

	parTime: 1080,

	difficulty: {
		support: {
			enemyDamageMultiplier: 0.8,
			enemyHpMultiplier: 0.75,
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
			enemyDamageMultiplier: 1.25,
			enemyHpMultiplier: 1.4,
			resourceMultiplier: 0.75,
			xpMultiplier: 1.5,
		},
	},
};
