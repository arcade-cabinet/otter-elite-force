// Mission 6: Monsoon Ambush — Hilltop Defense / Wave Survival
//
// Fortified hilltop outpost in the Copper-Silt highlands.
// Captain Scalebreak launches a four-direction monsoon assault.
// 3-minute build phase (clear weather), then 8 waves as monsoon degrades
// visibility and movement. Mud, rain, and lightning dominate the second half.
// Teaches: defensive strategy, weather adaptation, rally points.
// Win: Survive all 8 attack waves (Lodge survives).
// Par time: 20 min (1200s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission06MonsoonAmbush: MissionDef = {
	id: "mission_6",
	chapter: 2,
	mission: 2,
	name: "Monsoon Ambush",
	subtitle: "Hold the hilltop against 8 waves as the monsoon closes in",

	briefing: {
		portraitId: "sgt_bubbles",
		lines: [
			{
				speaker: "Col. Bubbles",
				text: "Captain, Scale-Guard forces are massing on all sides. Captain Scalebreak is directing this assault personally — he wants this position.",
			},
			{
				speaker: "FOXHOUND",
				text: "Monsoon front hits in approximately three minutes. When the rain starts, visibility drops to half range and all ground units slow by 20%.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Use the clear weather to build. Walls, watchtowers, barracks — anything you can raise before the first wave.",
			},
			{
				speaker: "FOXHOUND",
				text: "Four attack corridors, Captain. North is open ground — fast approach. East is a rocky slope — they'll be slower but tougher. South is a wide valley — expect numbers. West is a muddy trail — natural chokepoint.",
			},
			{
				speaker: "Col. Bubbles",
				text: "You can't wall off everything. Pick your priorities. And get workers gathering — there's timber northwest, fish southwest. Dig in, Captain. HQ out.",
			},
		],
	},

	// ─── Terrain: 128x128 (4096x4096px) ───

	terrain: {
		width: 128,
		height: 128,
		regions: [
			{ terrainId: "grass", fill: true },
			// Central base hilltop (elevated, clear ground)
			{ terrainId: "dirt", rect: { x: 44, y: 44, w: 40, h: 40 } },
			{ terrainId: "dirt", circle: { cx: 64, cy: 64, r: 24 } },
			// Northern approach (open field)
			{ terrainId: "grass", rect: { x: 44, y: 4, w: 40, h: 36 } },
			{ terrainId: "dirt", rect: { x: 56, y: 8, w: 16, h: 32 } }, // worn trail
			// Eastern approach (rocky slope)
			{ terrainId: "stone", rect: { x: 92, y: 28, w: 32, h: 56 } },
			{ terrainId: "dirt", rect: { x: 88, y: 48, w: 8, h: 16 } }, // trail entrance
			// Southern approach (wide valley)
			{ terrainId: "grass", rect: { x: 44, y: 88, w: 40, h: 36 } },
			{ terrainId: "mud", rect: { x: 52, y: 96, w: 24, h: 20 } }, // muddy valley floor
			// Western approach (muddy trail)
			{ terrainId: "mud", rect: { x: 4, y: 28, w: 36, h: 56 } },
			{ terrainId: "mud", circle: { cx: 20, cy: 48, r: 8 } },
			{ terrainId: "mud", circle: { cx: 16, cy: 64, r: 6 } },
			// Resource grove (northwest, jungle)
			{ terrainId: "mangrove", rect: { x: 4, y: 4, w: 28, h: 20 } },
			// Fish pond (southwest)
			{ terrainId: "water", circle: { cx: 16, cy: 92, r: 8 } },
			{ terrainId: "mud", circle: { cx: 16, cy: 92, r: 12 } },
			// Corner SE ruins
			{ terrainId: "stone", rect: { x: 96, y: 108, w: 24, h: 16 } },
			// Southern fringe
			{ terrainId: "mangrove", rect: { x: 4, y: 108, w: 40, h: 16 } },
		],
		overrides: [],
	},

	// ─── Zones ───

	zones: {
		base: { x: 40, y: 40, width: 48, height: 48 },
		approach_north: { x: 40, y: 0, width: 48, height: 40 },
		approach_east: { x: 88, y: 24, width: 40, height: 64 },
		approach_south: { x: 40, y: 88, width: 48, height: 40 },
		approach_west: { x: 0, y: 24, width: 40, height: 64 },
		corner_nw: { x: 0, y: 0, width: 40, height: 24 },
		corner_se: { x: 88, y: 104, width: 40, height: 24 },
		corner_sw: { x: 0, y: 80, width: 40, height: 24 },
		southern_fringe: { x: 0, y: 104, width: 48, height: 24 },
		resource_grove: { x: 4, y: 4, width: 28, height: 20 },
		fish_pond: { x: 4, y: 84, width: 28, height: 16 },
	},

	// ─── Placements ───

	placements: [
		// === Player (base) ===
		// Lodge (Captain's field HQ)
		{ type: "burrow", faction: "ura", x: 64, y: 64 },
		// Pre-built defenses (partial fortification)
		{ type: "watchtower", faction: "ura", x: 56, y: 48 },
		{ type: "sandbag_wall", faction: "ura", x: 52, y: 56 },
		{ type: "sandbag_wall", faction: "ura", x: 54, y: 56 },
		{ type: "sandbag_wall", faction: "ura", x: 76, y: 56 },
		{ type: "sandbag_wall", faction: "ura", x: 78, y: 56 },
		// Starting workers (5 River Rats)
		{ type: "river_rat", faction: "ura", x: 60, y: 66 },
		{ type: "river_rat", faction: "ura", x: 68, y: 66 },
		{ type: "river_rat", faction: "ura", x: 62, y: 70 },
		{ type: "river_rat", faction: "ura", x: 66, y: 70 },
		{ type: "river_rat", faction: "ura", x: 64, y: 74 },
		// Starting combat units (3 Mudfoots)
		{ type: "mudfoot", faction: "ura", x: 56, y: 60 },
		{ type: "mudfoot", faction: "ura", x: 72, y: 60 },
		{ type: "mudfoot", faction: "ura", x: 64, y: 58 },

		// === Resources ===
		// Timber (resource grove, northwest — contested, must venture out)
		{ type: "mangrove_tree", faction: "neutral", x: 8, y: 8 },
		{ type: "mangrove_tree", faction: "neutral", x: 14, y: 10 },
		{ type: "mangrove_tree", faction: "neutral", x: 20, y: 6 },
		{ type: "mangrove_tree", faction: "neutral", x: 10, y: 14 },
		{ type: "mangrove_tree", faction: "neutral", x: 22, y: 16 },
		{ type: "mangrove_tree", faction: "neutral", x: 16, y: 18 },
		{ type: "mangrove_tree", faction: "neutral", x: 26, y: 12 },
		{ type: "mangrove_tree", faction: "neutral", x: 28, y: 8 },
		// Fish (fish pond, southwest — contested)
		{ type: "fish_spot", faction: "neutral", x: 12, y: 88 },
		{ type: "fish_spot", faction: "neutral", x: 20, y: 92 },
		{ type: "fish_spot", faction: "neutral", x: 16, y: 96 },
		// Salvage (corner_se ruins)
		{ type: "salvage_cache", faction: "neutral", x: 100, y: 112 },
		{ type: "salvage_cache", faction: "neutral", x: 108, y: 110 },

		// === Enemies ===
		// No enemies on map at start — all spawned by wave triggers
	],

	startResources: { fish: 400, timber: 300, salvage: 150 },
	startPopCap: 25,

	// ─── Weather schedule (supplementary — main transitions via triggers) ───

	weather: {
		pattern: [
			{ type: "clear", startTime: 0, duration: 150 },
			{ type: "rain", startTime: 150, duration: 30 },
			{ type: "storm", startTime: 180, duration: 600 },
			{ type: "clear", startTime: 780, duration: 420 },
		],
	},

	// ─── Objectives ───

	objectives: {
		primary: [
			objective("survive-waves", "Survive all 8 attack waves (0/8)"),
			objective("prepare-defenses", "Prepare defenses before the storm hits"),
		],
		bonus: [objective("bonus-no-losses", "Win without losing any buildings")],
	},

	// ─── Triggers ───
	// Phase triggers are prefixed with "phase:<name>:"
	// Wave-clear triggers use enableTrigger chaining for conditional sequencing.

	triggers: [
		// =====================================================================
		// PHASE 1: FORTIFY (0:00 - 3:00) — Clear weather build phase
		// =====================================================================

		// [0:05] Opening briefing exchange
		trigger(
			"phase:fortify:bubbles-briefing",
			on.timer(5),
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Captain, Scale-Guard forces are massing on all sides. Captain Scalebreak is directing this assault personally — he wants this position.",
				},
				{
					speaker: "FOXHOUND",
					text: "Monsoon front hits in approximately three minutes. When the rain starts, visibility drops to half range and all ground units slow by 20%.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Use the clear weather to build. Walls, watchtowers, barracks — anything you can raise before the first wave.",
				},
			]),
		),

		// [0:20] FOXHOUND explains approach directions
		trigger(
			"phase:fortify:foxhound-directions",
			on.timer(20),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Four attack corridors, Captain. North is open ground — fast approach. East is a rocky slope — they'll be slower but tougher. South is a wide valley — expect numbers. West is a muddy trail — natural chokepoint.",
				},
				{
					speaker: "Col. Bubbles",
					text: "You can't wall off everything. Pick your priorities. And get workers gathering — there's timber northwest, fish southwest.",
				},
			]),
		),

		// [0:45] Field Hospital and Dock unlock notification
		trigger(
			"phase:fortify:foxhound-hospital",
			on.timer(45),
			act.dialogue(
				"foxhound",
				"HQ has authorized Field Hospital schematics, Captain. Build one to heal wounded troops between waves. Dock blueprints are also available — useful if you need naval assets later.",
			),
		),

		// [2:30] Weather warning — overcast transition
		trigger("phase:fortify:weather-warning", on.timer(150), [
			act.dialogue("foxhound", "Thirty seconds to monsoon. Final preparations, Captain."),
			act.changeWeather("rain"),
		]),

		// [3:00] Monsoon hits — Phase 1 ends, Phase 2 begins
		trigger("phase:fortify:monsoon-hits", on.timer(180), [
			act.completeObjective("prepare-defenses"),
			act.changeWeather("monsoon"),
			act.dialogue("sgt_bubbles", "The storm is here. And so are they. First wave incoming!"),
			act.startPhase("early-waves"),
		]),

		// =====================================================================
		// PHASE 2: EARLY WAVES (3:00 - ~8:00) — Monsoon active
		// =====================================================================

		// === WAVE 1 (3:00) — Probing attack from north: 4 Skinks ===
		trigger("phase:early-waves:wave-1-spawn", on.timer(180), [
			act.dialogue("foxhound", "Wave one — Skinks from the north! Scout force, fast movers."),
			act.spawn("skink", "scale_guard", 60, 2, 2),
			act.spawn("skink", "scale_guard", 68, 4, 2),
		]),

		// Wave 1 clear — timer-based (allow ~70s for engagement)
		trigger("phase:early-waves:wave-1-clear", on.timer(250), [
			act.dialogue(
				"sgt_bubbles",
				"Wave one down. That was just a probe. They'll hit harder next time.",
			),
		]),

		// === WAVE 2 (4:30) — Pincer from east + west: 12 Gators ===
		trigger("phase:early-waves:wave-2-spawn", on.timer(270), [
			act.dialogue(
				"foxhound",
				"Wave two — Gators from east AND west! They're splitting our attention.",
			),
			// East
			act.spawn("gator", "scale_guard", 120, 48, 3),
			act.spawn("gator", "scale_guard", 120, 56, 3),
			// West
			act.spawn("gator", "scale_guard", 4, 48, 3),
			act.spawn("gator", "scale_guard", 4, 56, 3),
		]),

		// Wave 2 clear
		trigger("phase:early-waves:wave-2-clear", on.timer(340), [
			act.dialogue("foxhound", "Wave two cleared. No time to rest — next wave is forming."),
		]),

		// === WAVE 3 (6:00) — Heavy push from south: 4 Gators + 2 Vipers ===
		trigger("phase:early-waves:wave-3-spawn", on.timer(360), [
			act.dialogue("foxhound", "Wave three — heavy force from the south! Gators and Vipers!"),
			act.spawn("gator", "scale_guard", 56, 124, 2),
			act.spawn("gator", "scale_guard", 72, 124, 2),
			act.spawn("viper", "scale_guard", 64, 122, 2),
		]),

		// Wave 3 clear — transitions to Phase 3
		trigger("phase:early-waves:wave-3-clear", on.timer(440), [
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Three down, five to go. Repair what you can. The worst is still coming.",
				},
				{
					speaker: "FOXHOUND",
					text: "Brief calm before the next push. Use it.",
				},
			]),
			act.startPhase("heavy-waves"),
		]),

		// =====================================================================
		// PHASE 3: HEAVY WAVES (~8:00 - ~15:00) — Monsoon intensifying
		// =====================================================================

		// Weather intensifies ~30s after wave 3 clear
		trigger("phase:heavy-waves:weather-intensifies", on.timer(470), [
			act.changeWeather("monsoon"),
			act.dialogue(
				"foxhound",
				"Storm is intensifying. Visibility dropping further. Lightning will give you brief flashes of the approaches.",
			),
		]),

		// === WAVE 4 (8:30) — Multi-direction Gator assault: 16 Gators (north + east) ===
		trigger("phase:heavy-waves:wave-4-spawn", on.timer(510), [
			act.dialogue("foxhound", "Wave four — massed Gators from the north and east!"),
			// North
			act.spawn("gator", "scale_guard", 56, 2, 4),
			act.spawn("gator", "scale_guard", 68, 4, 4),
			// East
			act.spawn("gator", "scale_guard", 122, 44, 4),
			act.spawn("gator", "scale_guard", 124, 56, 4),
		]),

		// Wave 4 clear
		trigger("phase:heavy-waves:wave-4-clear", on.timer(590), [
			act.dialogue(
				"sgt_bubbles",
				"Halfway there, Captain. They're burning through troops but they have more.",
			),
		]),

		// === WAVE 5 (10:30) — Snappers from south (heavy armor): 4 Snappers + 2 Gators ===
		trigger("phase:heavy-waves:wave-5-spawn", on.timer(630), [
			act.dialogue(
				"foxhound",
				"Wave five — Snappers from the south! Heavy armor, slow but devastating.",
			),
			act.dialogue("sgt_bubbles", "Snappers! Focus fire on them. Don't let them reach the walls."),
			act.spawn("snapper", "scale_guard", 56, 126, 2),
			act.spawn("snapper", "scale_guard", 72, 126, 2),
			act.spawn("gator", "scale_guard", 64, 124, 2),
		]),

		// Wave 5 clear
		trigger("phase:heavy-waves:wave-5-clear", on.timer(720), [
			act.dialogue("foxhound", "Snappers down. Heavy casualties on their side."),
		]),

		// === WAVE 6 (12:30) — All directions simultaneously ===
		trigger("phase:heavy-waves:wave-6-spawn", on.timer(750), [
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Wave six — contacts on ALL approaches! North, south, east, and west!",
				},
				{
					speaker: "Col. Bubbles",
					text: "They're throwing everything at us! All units to defensive positions!",
				},
			]),
			// North: 3 Gators + 2 Skinks
			act.spawn("gator", "scale_guard", 64, 2, 3),
			act.spawn("skink", "scale_guard", 56, 4, 2),
			// East: 3 Gators + 1 Viper
			act.spawn("gator", "scale_guard", 124, 52, 3),
			act.spawn("viper", "scale_guard", 122, 60, 1),
			// South: 3 Gators + 2 Skinks
			act.spawn("gator", "scale_guard", 64, 126, 3),
			act.spawn("skink", "scale_guard", 72, 124, 2),
			// West: 3 Gators + 1 Viper
			act.spawn("gator", "scale_guard", 4, 52, 3),
			act.spawn("viper", "scale_guard", 6, 60, 1),
		]),

		// Wave 6 clear — transitions to Phase 4
		trigger("phase:heavy-waves:wave-6-clear", on.timer(860), [
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Six down. Two more. Rebuild, rearm, retrain — you've got a window.",
				},
				{
					speaker: "FOXHOUND",
					text: "Scalebreak is committing his reserves. The last two waves will be the worst we've seen.",
				},
			]),
			act.startPhase("final-waves"),
			act.enableTrigger("phase:final-waves:lull-briefing"),
		]),

		// =====================================================================
		// PHASE 4: FINAL WAVES (~15:00+) — Monsoon heavy, lightning every 15s
		// =====================================================================

		// Lull briefing (enabled by wave-6-clear)
		trigger(
			"phase:final-waves:lull-briefing",
			on.timer(865),
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Scalebreak's sending his elite. Croc Champions and everything he has left. This is the final push.",
				},
				{
					speaker: "FOXHOUND",
					text: "Sixty seconds to rebuild. Use every one of them, Captain.",
				},
			]),
			{ enabled: false },
		),

		// === WAVE 7 (~wave-6-clear + 60s) — Elite northern assault ===
		// 12 Gators + 4 Vipers + 2 Croc Champions from north
		trigger("phase:final-waves:wave-7-spawn", on.timer(920), [
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Wave seven — massive assault from the north! Croc Champions leading the charge!",
				},
				{
					speaker: "Col. Bubbles",
					text: "HOLD THE LINE, Captain!",
				},
			]),
			act.spawn("gator", "scale_guard", 48, 2, 4),
			act.spawn("gator", "scale_guard", 64, 2, 4),
			act.spawn("gator", "scale_guard", 80, 2, 4),
			act.spawn("viper", "scale_guard", 56, 4, 2),
			act.spawn("viper", "scale_guard", 72, 4, 2),
			act.spawn("croc_champion", "scale_guard", 60, 6, 1),
			act.spawn("croc_champion", "scale_guard", 68, 6, 1),
		]),

		// Wave 7 clear
		trigger("phase:final-waves:wave-7-clear", on.timer(1010), [
			act.dialogue(
				"sgt_bubbles",
				"Champions are down! One more wave, Captain — one more and we break them!",
			),
			act.enableTrigger("phase:final-waves:wave-8-spawn"),
		]),

		// === WAVE 8 (~wave-7-clear + 30s) — Final all-direction assault + Serpent King ===
		trigger(
			"phase:final-waves:wave-8-spawn",
			on.timer(1040),
			[
				act.exchange([
					{
						speaker: "FOXHOUND",
						text: "FINAL WAVE — all directions! And Captain... we're reading a Serpent King signature from the north.",
					},
					{
						speaker: "Col. Bubbles",
						text: "Everything they have. This is it. Every unit, every wall, every last ounce of fight. DO NOT BREAK.",
					},
				]),
				// North (main assault + Serpent King)
				act.spawn("gator", "scale_guard", 56, 2, 3),
				act.spawn("gator", "scale_guard", 72, 2, 3),
				act.spawn("viper", "scale_guard", 64, 4, 2),
				act.spawn("serpent_king", "scale_guard", 64, 2, 1),
				// East
				act.spawn("gator", "scale_guard", 124, 48, 3),
				act.spawn("snapper", "scale_guard", 122, 56, 1),
				// South
				act.spawn("gator", "scale_guard", 56, 126, 3),
				act.spawn("viper", "scale_guard", 68, 124, 2),
				act.spawn("croc_champion", "scale_guard", 64, 126, 1),
				// West
				act.spawn("gator", "scale_guard", 4, 48, 3),
				act.spawn("snapper", "scale_guard", 6, 56, 1),
			],
			{ enabled: false },
		),

		// Wave 8 clear — survive objective complete
		trigger("phase:final-waves:wave-8-clear", on.timer(1140), [
			act.completeObjective("survive-waves"),
		]),

		// =====================================================================
		// MISSION-LEVEL TRIGGERS
		// =====================================================================

		// Lodge (burrow) destroyed = mission failure
		trigger(
			"lodge-destroyed",
			on.buildingCount("ura", "burrow", "eq", 0),
			act.failMission("The Lodge has been destroyed. Mission failed."),
		),

		// All primary objectives complete = victory
		trigger("mission-complete", on.allPrimaryComplete(), [
			act.changeWeather("clear"),
			act.exchange([
				{
					speaker: "Gen. Whiskers",
					text: "They're pulling back. Scalebreak has lost his offensive. You held that position against everything he threw at you, Captain.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Storm's breaking. And so is their assault. Outstanding work — the highlands are ours.",
				},
				{
					speaker: "FOXHOUND",
					text: "All Scale-Guard forces in retreat. The monsoon offensive has failed. Well done, Captain.",
				},
			]),
			act.victory(),
		]),

		// Bonus: no buildings lost — checked when primary objectives complete
		trigger(
			"bonus-no-buildings-lost",
			on.allPrimaryComplete(),
			act.dialogue(
				"gen_whiskers",
				"Not a single structure lost. Textbook defensive engagement, Captain. Truly exceptional.",
			),
		),
	],

	// ─── Unlocks ───

	unlocks: {
		buildings: ["field_hospital", "dock"],
	},

	parTime: 1200,

	// ─── Difficulty Scaling ───
	// Support: Waves 1-3 only, no Snappers or Champions, no Serpent King in wave 8
	// Tactical: as written (full 8 waves)
	// Elite: +50% enemies per wave, wave 8 adds second Serpent King, Champions from wave 5

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
