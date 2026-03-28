// Mission 2-1: SIPHON VALLEY — Destroy three siphon installations
//
// Wide industrial valley bisected by a polluted river. Three Scale-Guard
// siphon installations drain toxic runoff into the Copper-Silt waterways.
// Progressive zone discovery as siphons fall. Raftsman unlock on completion.
// Win: Destroy all 3 Fuel Tanks.
// Lose: Lodge destroyed.
// Par time: 20 min (1200s).

import type { MissionDef, TileOverride } from "../../types";
import { act, objective, on, trigger } from "../dsl";

// ---------------------------------------------------------------------------
// Ford tile helper — generates shallow-crossing overrides for a rect region
// ---------------------------------------------------------------------------
function fordTiles(x1: number, y1: number, x2: number, y2: number): TileOverride[] {
	const tiles: TileOverride[] = [];
	for (let x = x1; x < x2; x++) {
		for (let y = y1; y < y2; y++) {
			tiles.push({ x, y, terrainId: "mud" });
		}
	}
	return tiles;
}

export const mission05SiphonValley: MissionDef = {
	id: "mission_5",
	chapter: 2,
	mission: 1,
	name: "Siphon Valley",
	subtitle: "Destroy three toxic siphon installations",

	// ── Briefing ──────────────────────────────────────────────────────────
	briefing: {
		portraitId: "col_bubbles",
		lines: [
			{
				speaker: "Col. Bubbles",
				text: "Captain, intelligence has located three siphon installations in an industrial valley north of the Copper-Silt. They're pumping toxic runoff straight into the river — killing everything downstream.",
			},
			{
				speaker: "FOXHOUND",
				text: "Each siphon is built around a central Fuel Tank. Destroy the tank, the siphon goes offline. Three tanks, three targets.",
			},
			{
				speaker: "Col. Bubbles",
				text: "We've established a forward base at the south end of the valley. You'll have workers, a mortar team, and enough supplies to get started. Build up, cross the river, and take those siphons out.",
			},
			{
				speaker: "FOXHOUND",
				text: "Be advised — the river is contaminated. Toxic water deals damage to anything wading through it. There are fords at the western and eastern bends — use them.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Siphon Alpha is the weakest — start there. Work your way east. Siphon Charlie is a fortress. Good hunting, Captain. HQ out.",
			},
		],
	},

	// ── Terrain (160x128) ─────────────────────────────────────────────────
	terrain: {
		width: 160,
		height: 128,
		regions: [
			// Base fill
			{ terrainId: "grass", fill: true },
			// Southern safe zone
			{ terrainId: "grass", rect: { x: 0, y: 88, w: 160, h: 40 } },
			// Forward base clearing
			{ terrainId: "dirt", rect: { x: 12, y: 92, w: 48, h: 20 } },
			// Timber grove
			{ terrainId: "mangrove", rect: { x: 100, y: 90, w: 40, h: 18 } },
			// Mud flats (slow terrain)
			{ terrainId: "mud", rect: { x: 0, y: 72, w: 56, h: 16 } },
			{ terrainId: "mud", circle: { cx: 40, cy: 78, r: 6 } },
			// Toxic river (east-west, polluted)
			{
				terrainId: "toxic_water",
				river: {
					points: [
						[0, 64],
						[24, 62],
						[48, 66],
						[72, 64],
						[96, 62],
						[120, 66],
						[140, 64],
						[160, 62],
					],
					width: 8,
				},
			},
			// River ford (western)
			{ terrainId: "mud", rect: { x: 20, y: 62, w: 8, h: 8 } },
			// River ford (eastern)
			{ terrainId: "mud", rect: { x: 108, y: 60, w: 8, h: 8 } },
			// Approach east (sparse scrub)
			{ terrainId: "dirt", rect: { x: 72, y: 72, w: 88, h: 16 } },
			// Scrap field
			{ terrainId: "dirt", rect: { x: 4, y: 38, w: 24, h: 18 } },
			// Siphon Alpha clearing (scrubland)
			{ terrainId: "dirt", rect: { x: 12, y: 18, w: 40, h: 18 } },
			// Pipe corridor (industrial)
			{ terrainId: "dirt", rect: { x: 56, y: 18, w: 40, h: 20 } },
			// Siphon Bravo — toxic sludge pools
			{ terrainId: "toxic_sludge", rect: { x: 60, y: 38, w: 40, h: 18 } },
			{ terrainId: "toxic_sludge", circle: { cx: 72, cy: 44, r: 6 } },
			{ terrainId: "toxic_sludge", circle: { cx: 88, cy: 48, r: 5 } },
			{ terrainId: "toxic_sludge", circle: { cx: 80, cy: 52, r: 4 } },
			// Siphon Charlie compound (ridge)
			{ terrainId: "stone", rect: { x: 124, y: 20, w: 28, h: 36 } },
			// Northern ridge (barren)
			{ terrainId: "stone", rect: { x: 0, y: 0, w: 160, h: 16 } },
			// Supply depot
			{ terrainId: "dirt", rect: { x: 106, y: 42, w: 16, h: 12 } },
		],
		overrides: [
			// Ford crossing tiles (western) — shallow crossing allowing foot traffic
			...fordTiles(22, 62, 26, 68),
			// Ford crossing tiles (eastern)
			...fordTiles(110, 60, 114, 68),
		],
	},

	// ── Zones ─────────────────────────────────────────────────────────────
	zones: {
		forward_base: { x: 8, y: 88, width: 56, height: 28 },
		timber_grove: { x: 96, y: 88, width: 48, height: 24 },
		southern_bank: { x: 0, y: 112, width: 160, height: 16 },
		mud_flats: { x: 0, y: 72, width: 56, height: 16 },
		approach_east: { x: 72, y: 72, width: 88, height: 16 },
		toxic_river: { x: 0, y: 60, width: 160, height: 12 },
		scrap_field: { x: 0, y: 36, width: 32, height: 24 },
		siphon_alpha: { x: 8, y: 16, width: 48, height: 24 },
		pipe_corridor: { x: 56, y: 16, width: 40, height: 24 },
		siphon_bravo: { x: 56, y: 36, width: 48, height: 24 },
		siphon_charlie: { x: 120, y: 16, width: 36, height: 44 },
		supply_depot: { x: 104, y: 40, width: 20, height: 16 },
		northern_ridge: { x: 0, y: 0, width: 160, height: 16 },
	},

	// ── Placements ────────────────────────────────────────────────────────
	placements: [
		// --- Player (forward_base) ---
		// Lodge (Captain's field HQ)
		{ type: "burrow", faction: "ura", x: 24, y: 100 },
		// Starting workers
		{ type: "river_rat", faction: "ura", x: 20, y: 102 },
		{ type: "river_rat", faction: "ura", x: 28, y: 103 },
		{ type: "river_rat", faction: "ura", x: 22, y: 105 },
		{ type: "river_rat", faction: "ura", x: 30, y: 101 },
		// Starting combat units
		{ type: "mudfoot", faction: "ura", x: 32, y: 98 },
		{ type: "mudfoot", faction: "ura", x: 36, y: 99 },
		// Starting mortar
		{ type: "mortar_otter", faction: "ura", x: 38, y: 102 },

		// --- Resources ---
		// Timber (mangrove grove east)
		{ type: "mangrove_tree", faction: "neutral", x: 102, y: 92 },
		{ type: "mangrove_tree", faction: "neutral", x: 108, y: 94 },
		{ type: "mangrove_tree", faction: "neutral", x: 114, y: 91 },
		{ type: "mangrove_tree", faction: "neutral", x: 120, y: 95 },
		{ type: "mangrove_tree", faction: "neutral", x: 106, y: 98 },
		{ type: "mangrove_tree", faction: "neutral", x: 116, y: 100 },
		{ type: "mangrove_tree", faction: "neutral", x: 126, y: 93 },
		{ type: "mangrove_tree", faction: "neutral", x: 132, y: 96 },
		// Fish (southern bank, safe)
		{ type: "fish_spot", faction: "neutral", x: 60, y: 110 },
		{ type: "fish_spot", faction: "neutral", x: 80, y: 114 },
		{ type: "fish_spot", faction: "neutral", x: 140, y: 112 },
		// Salvage (scrap field, contested)
		{ type: "salvage_cache", faction: "neutral", x: 10, y: 40 },
		{ type: "salvage_cache", faction: "neutral", x: 18, y: 44 },
		{ type: "salvage_cache", faction: "neutral", x: 14, y: 48 },
		// Supply depot salvage (bonus)
		{ type: "salvage_cache", faction: "neutral", x: 110, y: 44 },
		{ type: "salvage_cache", faction: "neutral", x: 114, y: 48 },
		{ type: "salvage_cache", faction: "neutral", x: 108, y: 50 },
		{ type: "salvage_cache", faction: "neutral", x: 116, y: 46 },

		// --- Siphon Alpha (lightly defended) ---
		{ type: "fuel_tank", faction: "scale_guard", x: 32, y: 26 },
		{ type: "siphon_drone", faction: "scale_guard", x: 28, y: 28 },
		{ type: "gator", faction: "scale_guard", x: 24, y: 24 },
		{ type: "gator", faction: "scale_guard", x: 36, y: 24 },
		{ type: "skink", faction: "scale_guard", x: 30, y: 20 },

		// --- Siphon Bravo (medium defense, toxic terrain) ---
		{ type: "fuel_tank", faction: "scale_guard", x: 80, y: 44 },
		{ type: "siphon_drone", faction: "scale_guard", x: 76, y: 42 },
		{ type: "siphon_drone", faction: "scale_guard", x: 84, y: 46 },
		{ type: "gator", faction: "scale_guard", x: 72, y: 40 },
		{ type: "gator", faction: "scale_guard", x: 88, y: 40 },
		{ type: "gator", faction: "scale_guard", x: 76, y: 48 },
		{ type: "gator", faction: "scale_guard", x: 84, y: 50 },
		{ type: "viper", faction: "scale_guard", x: 80, y: 38 },
		{ type: "venom_spire", faction: "scale_guard", x: 80, y: 50 },

		// --- Siphon Charlie (heavily fortified compound) ---
		{ type: "fuel_tank", faction: "scale_guard", x: 140, y: 32 },
		{ type: "siphon_drone", faction: "scale_guard", x: 136, y: 30 },
		{ type: "siphon_drone", faction: "scale_guard", x: 144, y: 34 },
		{ type: "watchtower", faction: "scale_guard", x: 128, y: 24 },
		{ type: "watchtower", faction: "scale_guard", x: 148, y: 24 },
		{ type: "sandbag_wall", faction: "scale_guard", x: 124, y: 36 },
		{ type: "sandbag_wall", faction: "scale_guard", x: 126, y: 36 },
		{ type: "sandbag_wall", faction: "scale_guard", x: 128, y: 36 },
		{ type: "gator", faction: "scale_guard", x: 132, y: 28 },
		{ type: "gator", faction: "scale_guard", x: 138, y: 28 },
		{ type: "gator", faction: "scale_guard", x: 144, y: 28 },
		{ type: "gator", faction: "scale_guard", x: 136, y: 36 },
		{ type: "gator", faction: "scale_guard", x: 142, y: 36 },
		{ type: "gator", faction: "scale_guard", x: 148, y: 32 },
		{ type: "viper", faction: "scale_guard", x: 130, y: 22 },
		{ type: "viper", faction: "scale_guard", x: 146, y: 22 },
		{ type: "croc_champion", faction: "scale_guard", x: 140, y: 26 },

		// --- Pipe corridor patrol ---
		{ type: "skink", faction: "scale_guard", x: 64, y: 24 },
		{ type: "skink", faction: "scale_guard", x: 76, y: 28 },

		// --- Supply depot guard ---
		{ type: "gator", faction: "scale_guard", x: 108, y: 44 },
		{ type: "gator", faction: "scale_guard", x: 114, y: 48 },
	],

	startResources: { fish: 400, timber: 250, salvage: 100 },
	startPopCap: 25,

	// ── Objectives ────────────────────────────────────────────────────────
	objectives: {
		primary: [
			objective("destroy-siphon-alpha", "Locate and destroy Siphon Alpha"),
			objective("destroy-siphon-bravo", "Destroy Siphon Bravo"),
			objective("destroy-siphon-charlie", "Destroy Siphon Charlie"),
			objective("destroy-all-siphons", "Destroy all 3 siphon installations (0/3)"),
		],
		bonus: [
			objective("bonus-supply-depot", "Capture the Scale-Guard supply depot"),
			objective("speed-bonus", "Destroy all 3 siphons within 20 minutes"),
		],
	},

	// ── Triggers ──────────────────────────────────────────────────────────
	triggers: [
		// ==================================================================
		// Phase 1: RECON (mission start — ~5:00)
		// ==================================================================

		// [0:10] FOXHOUND briefing — three siphon overview
		trigger(
			"phase:recon:foxhound-briefing",
			on.timer(10),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Captain, intelligence confirms three siphon installations in this valley. They're pumping toxic runoff into the Copper-Silt river — killing everything downstream.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Those siphons are your targets. Each one has a Fuel Tank at its core — destroy the tank and the siphon goes offline.",
				},
				{
					speaker: "FOXHOUND",
					text: "Siphon Alpha is to the northwest across the river. Lightly defended. Start there.",
				},
			]),
		),

		// [0:30] Bubbles — Raftsman schematic unlock hint
		trigger(
			"phase:recon:bubbles-raftsman",
			on.timer(30),
			act.dialogue(
				"col_bubbles",
				"HQ is sending Raftsman schematics to your Barracks. These river specialists can build transport rafts. You'll want them for crossing that toxic water.",
			),
		),

		// [0:45] FOXHOUND — toxic water/sludge warning
		trigger(
			"phase:recon:foxhound-toxic-warning",
			on.timer(45),
			act.dialogue(
				"foxhound",
				"Be advised — the river is contaminated. Any unit that enters toxic water or sludge takes damage over time. Move through it fast or find the fords.",
			),
		),

		// Western ford discovery
		trigger(
			"phase:recon:ford-discovered-west",
			on.areaEntered("ura", "mud_flats"),
			act.dialogue(
				"foxhound",
				"Shallow ford at the western river bend, Captain. Your troops can cross there without swimming through the worst of it.",
			),
		),

		// Eastern ford discovery
		trigger(
			"phase:recon:ford-discovered-east",
			on.areaEntered("ura", "approach_east"),
			act.dialogue(
				"foxhound",
				"Eastern ford identified. Leads toward the ridgeline — that's the path to Siphon Charlie, but save that for later.",
			),
		),

		// Scrap field discovery
		trigger(
			"phase:recon:scrap-discovery",
			on.areaEntered("ura", "scrap_field"),
			act.dialogue(
				"foxhound",
				"Scrap field to the west. Usable salvage in that wreckage, Captain.",
			),
		),

		// Lodge destroyed — mission fail
		trigger(
			"lodge-destroyed",
			on.buildingDestroyed("burrow"),
			act.failMission("The Lodge has been destroyed. Mission failed."),
		),

		// ==================================================================
		// Phase 2: FIRST SIPHON (~5:00 — ~10:00)
		// ==================================================================

		// Alpha approach — intel on defenders
		trigger(
			"phase:first-siphon:alpha-approach",
			on.areaEntered("ura", "siphon_alpha"),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Siphon Alpha in visual range. Fuel Tank is the cylindrical structure at center. Two Gators on patrol, one Skink scout, and a Siphon Drone pumping unit.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Take out the Fuel Tank. The drone will shut down on its own once the tank is gone.",
				},
			]),
		),

		// Alpha destroyed — complete objective, reveal next zones, start phase 3
		trigger(
			"phase:first-siphon:alpha-destroyed",
			on.buildingCount("scale_guard", "fuel_tank", "lte", 2),
			[
				act.completeObjective("destroy-siphon-alpha"),
				act.exchange([
					{
						speaker: "FOXHOUND",
						text: "Siphon Alpha offline. River contamination dropping in this sector. Good hit, Captain.",
					},
					{
						speaker: "Col. Bubbles",
						text: "One down, two to go. FOXHOUND is marking the next target — Siphon Bravo, northeast across the pipe corridor.",
					},
				]),
				act.revealZone("siphon_bravo"),
				act.revealZone("pipe_corridor"),
				act.enableTrigger("phase:toxic-terrain:briefing"),
				act.startPhase("toxic-terrain"),
			],
		),

		// ==================================================================
		// Phase 3: TOXIC TERRAIN (~10:00 — ~16:00)
		// ==================================================================

		// Phase 3 briefing — enabled by alpha-destroyed
		trigger(
			"phase:toxic-terrain:briefing",
			on.timer(1),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Siphon Bravo is in the center of a toxic sludge basin. That area deals continuous damage to your troops. Move fast or bring healers.",
				},
				{
					speaker: "Col. Bubbles",
					text: "The sludge pools are the worst of it. Stick to the pipe corridor approach if you can — less exposure. But the corridor has patrols.",
				},
			]),
			{ enabled: false },
		),

		// Pipe corridor patrol warning
		trigger(
			"phase:toxic-terrain:corridor-patrol",
			on.areaEntered("ura", "pipe_corridor"),
			act.dialogue(
				"foxhound",
				"Pipe corridor. Scale-Guard Skinks on patrol between the siphons. Watch the flanks.",
			),
		),

		// Bravo approach — toxic damage warning
		trigger(
			"phase:toxic-terrain:bravo-approach",
			on.areaEntered("ura", "siphon_bravo"),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "You're in the sludge zone. Toxic damage is active — your units are taking hits every few seconds.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Hit the Fuel Tank and get out. Don't linger in that filth.",
				},
			]),
		),

		// Bravo destroyed — spawn reinforcements from north, reveal Charlie
		trigger(
			"phase:toxic-terrain:bravo-destroyed",
			on.buildingCount("scale_guard", "fuel_tank", "lte", 1),
			[
				act.completeObjective("destroy-siphon-bravo"),
				act.exchange([
					{
						speaker: "FOXHOUND",
						text: "Siphon Bravo neutralized. Two down. But Captain — enemy reinforcements are mobilizing from the northern ridge.",
					},
					{
						speaker: "Col. Bubbles",
						text: "They know what we're doing. Last siphon is Siphon Charlie — it's a fortress on the eastern ridge. Regroup before you push.",
					},
				]),
				act.revealZone("siphon_charlie"),
				act.revealZone("northern_ridge"),
				act.spawn("gator", "scale_guard", 80, 8, 4),
				act.spawn("skink", "scale_guard", 72, 6, 2),
				act.spawn("viper", "scale_guard", 88, 10, 1),
				act.enableTrigger("phase:fortress-siphon:briefing"),
				act.enableTrigger("phase:fortress-siphon:northern-reinforcements"),
				act.startPhase("fortress-siphon"),
			],
		),

		// ==================================================================
		// Phase 4: FORTRESS SIPHON (~16:00+)
		// ==================================================================

		// Phase 4 briefing — enabled by bravo-destroyed
		trigger(
			"phase:fortress-siphon:briefing",
			on.timer(1),
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Siphon Charlie is their crown jewel. Walled compound, two watchtowers, a Croc Champion commanding the garrison. This is the real fight, Captain.",
				},
				{
					speaker: "FOXHOUND",
					text: "Frontal assault through the sandbag line is costly. Consider flanking from the pipe corridor or looping around the eastern ford.",
				},
			]),
			{ enabled: false },
		),

		// Charlie approach — inside perimeter
		trigger(
			"phase:fortress-siphon:charlie-approach",
			on.areaEntered("ura", "siphon_charlie"),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Inside Charlie's perimeter. Heavy resistance. Watchtowers have long range — take them out first if you can.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Use your mortar on those towers. Then push the infantry in.",
				},
			]),
		),

		// [Phase 4 + 90s] Northern reinforcements — enabled by bravo-destroyed
		trigger(
			"phase:fortress-siphon:northern-reinforcements",
			on.timer(90),
			[
				act.spawn("gator", "scale_guard", 100, 4, 3),
				act.spawn("viper", "scale_guard", 108, 6, 1),
				act.dialogue(
					"foxhound",
					"Reinforcements from the northern ridge! They're heading toward Charlie to bolster the defense.",
				),
			],
			{ enabled: false },
		),

		// Charlie destroyed — all fuel tanks gone
		trigger(
			"phase:fortress-siphon:charlie-destroyed",
			on.buildingCount("scale_guard", "fuel_tank", "eq", 0),
			[
				act.completeObjective("destroy-siphon-charlie"),
				act.completeObjective("destroy-all-siphons"),
			],
		),

		// ==================================================================
		// Bonus: Supply depot
		// ==================================================================

		trigger(
			"phase:bonus:supply-depot-discovery",
			on.areaEntered("ura", "supply_depot"),
			act.dialogue(
				"foxhound",
				"Supply depot, Captain. Scale-Guard logistics cache. Lightly guarded — take it and we gain 200 salvage for the war effort.",
			),
		),

		// Depot captured — guards cleared + area entered
		// Uses unitCount check on depot guards (2 gators at supply_depot)
		trigger("phase:bonus:supply-depot-captured", on.unitCount("scale_guard", "gator", "lte", 6), [
			act.completeObjective("bonus-supply-depot"),
			act.grantResource("salvage", 200),
			act.dialogue(
				"col_bubbles",
				"Supply depot secured. Those materials will serve us better than they served the Scale-Guard.",
			),
		]),

		// ==================================================================
		// Mission complete / victory
		// ==================================================================

		trigger("mission-complete", on.allPrimaryComplete(), [
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "All three siphons offline. Toxicity readings dropping across the valley. The river will recover.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Outstanding work, Captain. We've crippled their industrial operation in this sector.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "The Reach breathes a little easier today. Well done. Prepare for the next deployment — monsoon season is rolling in. HQ out.",
				},
			]),
			act.victory(),
		]),
	],

	// ── Unlocks ───────────────────────────────────────────────────────────
	unlocks: {
		units: ["raftsman"],
	},

	parTime: 1200,

	// ── Difficulty Scaling ────────────────────────────────────────────────
	// Support:  Alpha 1 Gator, Bravo 2 Gators + 1 Drone, Charlie 4 Gators + 1 Watchtower; no reinforcements
	// Tactical: as designed
	// Elite:    Alpha +1 Viper, Bravo +2 Gators + 1 Croc Champion, Charlie +4 Gators + 1 extra Croc; reinforcements doubled
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
