// Mission 15 (4-3): SERPENT'S LAIR — Citadel Siege + Boss Fight
//
// Kommandant Ironjaw's personal citadel. Three concentric rings of defense
// surround the throne room. Toxic moat circles the outer wall. Three causeways.
// Phase 1: Breach the outer ring. Phase 2: Shatter the middle ring (Venom Spires,
// Predator Nest, Croc Champions). Phase 3: Boss fight — Ironjaw has 5000 HP and
// three boss phases (Commander → Enraged → Last Stand).
//
// Win: Defeat Kommandant Ironjaw.
// Lose: Lodge destroyed OR all units killed inside the citadel.
// Par time: 15 min (900s).

import type { MissionDef, TileOverride } from "../../types";
import { act, objective, on, trigger } from "../dsl";

// ---------------------------------------------------------------------------
// Terrain helpers — generate bridge/gate tile overrides
// ---------------------------------------------------------------------------

/** Create a vertical strip of bridge tiles from (x, yStart) to (x, yEnd-1). */
function bridgeTiles(x: number, yStart: number, _xEnd: number, yEnd: number): TileOverride[] {
	const tiles: TileOverride[] = [];
	for (let y = yStart; y < yEnd; y++) {
		tiles.push({ x, y, terrainId: "bridge" });
		tiles.push({ x: x + 1, y, terrainId: "bridge" });
	}
	return tiles;
}

/** Create a horizontal gap in a wall (gate) centered at (x, y) with given width. */
function gateTiles(x: number, y: number, width: number): TileOverride[] {
	const tiles: TileOverride[] = [];
	const half = Math.floor(width / 2);
	for (let dx = -half; dx < half; dx++) {
		tiles.push({ x: x + dx, y, terrainId: "dirt" });
		tiles.push({ x: x + dx, y: y + 1, terrainId: "dirt" });
	}
	return tiles;
}

// ---------------------------------------------------------------------------
// Mission Definition
// ---------------------------------------------------------------------------

export const mission15SerpentKing: MissionDef = {
	id: "mission_15",
	chapter: 4,
	mission: 3,
	name: "Serpent's Lair",
	subtitle: "Breach Ironjaw's citadel and defeat the Scale-Guard supreme commander",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "The Serpent's Lair, Captain. Kommandant Ironjaw's citadel. Three rings of defense, a toxic moat, and every Croc Champion the Scale-Guard has left. He's in the throne room at the center.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Outer ring is the first obstacle. Sandbags, watchtowers, and Gators dug in behind the moat. Three causeways across — west, center, east.",
			},
			{
				speaker: "FOXHOUND",
				text: "The moat is toxic sludge — any unit crossing through the water takes damage. Use the causeways. Sappers can widen them if you need a broader front.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "This is the man who ordered the occupation. The man who had me locked in a cage. Take his citadel apart, Captain. Ring by ring.",
			},
		],
	},

	// -----------------------------------------------------------------------
	// Terrain — 128x128 volcanic citadel
	// -----------------------------------------------------------------------
	terrain: {
		width: 128,
		height: 128,
		regions: [
			{ terrainId: "grass", fill: true },
			// Volcanic rock (citadel foundation — entire northern half)
			{ terrainId: "rock", rect: { x: 0, y: 0, w: 128, h: 88 } },
			// Cliffs (impassable edges)
			{ terrainId: "cliff", rect: { x: 0, y: 0, w: 24, h: 20 } },
			{ terrainId: "cliff", rect: { x: 104, y: 0, w: 24, h: 20 } },
			// Toxic moat (ring around citadel)
			{ terrainId: "toxic_water", rect: { x: 8, y: 80, w: 112, h: 8 } },
			{ terrainId: "toxic_water", rect: { x: 8, y: 12, w: 16, h: 68 } },
			{
				terrainId: "toxic_water",
				rect: { x: 104, y: 12, w: 16, h: 68 },
			},
			// Outer ring — cleared ground
			{ terrainId: "dirt", rect: { x: 24, y: 12, w: 80, h: 68 } },
			// Middle ring — paved fortress
			{ terrainId: "concrete", rect: { x: 36, y: 28, w: 56, h: 40 } },
			// Throne room — metal/stone
			{ terrainId: "metal", rect: { x: 48, y: 48, w: 32, h: 12 } },
			// Approach terrain (south of moat)
			{ terrainId: "jungle", rect: { x: 8, y: 88, w: 40, h: 12 } },
			{ terrainId: "dirt", rect: { x: 48, y: 88, w: 32, h: 12 } },
			{ terrainId: "dirt", rect: { x: 88, y: 88, w: 32, h: 12 } },
			// Player base — grass clearing
			{ terrainId: "grass", rect: { x: 16, y: 100, w: 96, h: 28 } },
			{ terrainId: "dirt", rect: { x: 32, y: 112, w: 64, h: 16 } },
			// Mud at moat edges
			{ terrainId: "mud", rect: { x: 8, y: 78, w: 112, h: 2 } },
			{ terrainId: "mud", rect: { x: 8, y: 88, w: 112, h: 2 } },
			// Mangrove along approach
			{ terrainId: "mangrove", rect: { x: 0, y: 96, w: 16, h: 16 } },
			{ terrainId: "mangrove", rect: { x: 112, y: 96, w: 16, h: 16 } },
		],
		overrides: [
			// Causeway bridges over toxic moat (3 crossing points)
			...bridgeTiles(32, 80, 32, 88), // west causeway
			...bridgeTiles(64, 80, 64, 88), // center causeway (main gate)
			...bridgeTiles(96, 80, 96, 88), // east causeway
			// Gate breaches in outer wall (pre-damaged)
			...gateTiles(64, 12, 4), // north gate (sealed)
			...gateTiles(32, 68, 4), // south-west gate
			...gateTiles(64, 76, 4), // south gate (main)
			...gateTiles(96, 68, 4), // south-east gate
		],
	},

	// -----------------------------------------------------------------------
	// Zones
	// -----------------------------------------------------------------------
	zones: {
		player_base: { x: 16, y: 112, width: 96, height: 16 },
		siege_staging: { x: 8, y: 100, width: 40, height: 12 },
		forward_camp: { x: 48, y: 100, width: 32, height: 12 },
		flank_east: { x: 88, y: 100, width: 32, height: 12 },
		approach_west: { x: 8, y: 88, width: 40, height: 12 },
		approach_road: { x: 48, y: 88, width: 32, height: 12 },
		approach_east: { x: 88, y: 88, width: 32, height: 12 },
		toxic_moat: { x: 0, y: 80, width: 128, height: 8 },
		outer_ring_south: { x: 24, y: 68, width: 80, height: 12 },
		outer_wall_north: { x: 24, y: 12, width: 80, height: 8 },
		outer_ring_w: { x: 24, y: 20, width: 36, height: 8 },
		outer_ring_e: { x: 68, y: 20, width: 36, height: 8 },
		middle_ring: { x: 36, y: 28, width: 56, height: 16 },
		middle_ring_south: { x: 36, y: 60, width: 56, height: 8 },
		inner_wall: { x: 48, y: 44, width: 32, height: 4 },
		throne_room: { x: 48, y: 48, width: 32, height: 12 },
		cliffs_nw: { x: 0, y: 0, width: 24, height: 20 },
		cliffs_ne: { x: 104, y: 0, width: 24, height: 20 },
	},

	// -----------------------------------------------------------------------
	// Placements
	// -----------------------------------------------------------------------
	placements: [
		// === Player (player_base) ===
		// Lodge (Captain's field HQ)
		{ type: "lodge", faction: "ura", x: 64, y: 120 },
		// Full base (pre-built for Chapter 4 finale)
		{ type: "command_post", faction: "ura", x: 52, y: 116 },
		{ type: "barracks", faction: "ura", x: 76, y: 116 },
		{ type: "armory", faction: "ura", x: 44, y: 120 },
		{ type: "siege_workshop", faction: "ura", x: 84, y: 120 },
		{ type: "shield_generator", faction: "ura", x: 56, y: 124 },
		{ type: "dock", faction: "ura", x: 72, y: 124 },
		// Burrows (4)
		{ type: "burrow", faction: "ura", x: 36, y: 118 },
		{ type: "burrow", faction: "ura", x: 48, y: 124 },
		{ type: "burrow", faction: "ura", x: 80, y: 124 },
		{ type: "burrow", faction: "ura", x: 92, y: 118 },
		// Starting workers
		{ type: "river_rat", faction: "ura", x: 50, y: 114 },
		{ type: "river_rat", faction: "ura", x: 54, y: 115 },
		{ type: "river_rat", faction: "ura", x: 58, y: 114 },
		{ type: "river_rat", faction: "ura", x: 62, y: 115 },
		{ type: "river_rat", faction: "ura", x: 66, y: 114 },
		{ type: "river_rat", faction: "ura", x: 70, y: 115 },
		// Full assault army
		{ type: "mudfoot", faction: "ura", x: 48, y: 106 },
		{ type: "mudfoot", faction: "ura", x: 52, y: 106 },
		{ type: "mudfoot", faction: "ura", x: 56, y: 106 },
		{ type: "mudfoot", faction: "ura", x: 60, y: 106 },
		{ type: "mudfoot", faction: "ura", x: 64, y: 106 },
		{ type: "mudfoot", faction: "ura", x: 68, y: 106 },
		{ type: "shellcracker", faction: "ura", x: 50, y: 108 },
		{ type: "shellcracker", faction: "ura", x: 54, y: 108 },
		{ type: "shellcracker", faction: "ura", x: 58, y: 108 },
		{ type: "shellcracker", faction: "ura", x: 62, y: 108 },
		{ type: "mortar_otter", faction: "ura", x: 66, y: 108 },
		{ type: "mortar_otter", faction: "ura", x: 70, y: 108 },
		{ type: "mortar_otter", faction: "ura", x: 74, y: 108 },
		{ type: "sapper", faction: "ura", x: 78, y: 106 },
		{ type: "sapper", faction: "ura", x: 82, y: 106 },
		{ type: "sapper", faction: "ura", x: 86, y: 106 },
		// Siege units (staged in siege_staging)
		{ type: "mortar_otter", faction: "ura", x: 16, y: 104 },
		{ type: "mortar_otter", faction: "ura", x: 20, y: 104 },
		{ type: "sapper", faction: "ura", x: 24, y: 104 },
		{ type: "sapper", faction: "ura", x: 28, y: 104 },

		// === Resources ===
		// Timber (mangrove flanks)
		{ type: "mangrove_tree", faction: "neutral", x: 4, y: 100 },
		{ type: "mangrove_tree", faction: "neutral", x: 8, y: 104 },
		{ type: "mangrove_tree", faction: "neutral", x: 12, y: 102 },
		{ type: "mangrove_tree", faction: "neutral", x: 6, y: 108 },
		{ type: "mangrove_tree", faction: "neutral", x: 116, y: 100 },
		{ type: "mangrove_tree", faction: "neutral", x: 120, y: 104 },
		{ type: "mangrove_tree", faction: "neutral", x: 118, y: 108 },
		{ type: "mangrove_tree", faction: "neutral", x: 124, y: 102 },
		// Fish (limited — this is a siege, not an economy mission)
		{ type: "fish_spot", faction: "neutral", x: 20, y: 82 },
		{ type: "fish_spot", faction: "neutral", x: 108, y: 82 },
		// Salvage (inside the citadel — reward for breaching)
		{ type: "salvage_cache", faction: "neutral", x: 32, y: 72 },
		{ type: "salvage_cache", faction: "neutral", x: 96, y: 72 },
		{ type: "salvage_cache", faction: "neutral", x: 44, y: 36 },
		{ type: "salvage_cache", faction: "neutral", x: 84, y: 36 },
		{ type: "salvage_cache", faction: "neutral", x: 56, y: 52 },
		{ type: "salvage_cache", faction: "neutral", x: 72, y: 52 },

		// === Enemies — Outer Ring South (first line of defense) ===
		{ type: "sandbag_wall", faction: "scale_guard", x: 32, y: 76 },
		{ type: "sandbag_wall", faction: "scale_guard", x: 48, y: 76 },
		{ type: "sandbag_wall", faction: "scale_guard", x: 80, y: 76 },
		{ type: "sandbag_wall", faction: "scale_guard", x: 96, y: 76 },
		{ type: "watchtower", faction: "scale_guard", x: 40, y: 72 },
		{ type: "watchtower", faction: "scale_guard", x: 64, y: 70 },
		{ type: "watchtower", faction: "scale_guard", x: 88, y: 72 },
		{ type: "gator", faction: "scale_guard", x: 28, y: 70 },
		{ type: "gator", faction: "scale_guard", x: 36, y: 74 },
		{ type: "gator", faction: "scale_guard", x: 52, y: 72 },
		{ type: "gator", faction: "scale_guard", x: 60, y: 74 },
		{ type: "gator", faction: "scale_guard", x: 68, y: 72 },
		{ type: "gator", faction: "scale_guard", x: 76, y: 74 },
		{ type: "gator", faction: "scale_guard", x: 92, y: 70 },
		{ type: "gator", faction: "scale_guard", x: 100, y: 74 },
		{ type: "viper", faction: "scale_guard", x: 44, y: 70 },
		{ type: "viper", faction: "scale_guard", x: 84, y: 70 },

		// === Enemies — Outer Ring West & East garrisons ===
		// West garrison
		{ type: "bunker", faction: "scale_guard", x: 28, y: 22 },
		{ type: "gator", faction: "scale_guard", x: 30, y: 24 },
		{ type: "gator", faction: "scale_guard", x: 36, y: 22 },
		{ type: "gator", faction: "scale_guard", x: 42, y: 26 },
		{ type: "viper", faction: "scale_guard", x: 34, y: 18 },
		// East garrison
		{ type: "bunker", faction: "scale_guard", x: 92, y: 22 },
		{ type: "gator", faction: "scale_guard", x: 88, y: 24 },
		{ type: "gator", faction: "scale_guard", x: 94, y: 22 },
		{ type: "gator", faction: "scale_guard", x: 100, y: 26 },
		{ type: "viper", faction: "scale_guard", x: 96, y: 18 },

		// === Enemies — Middle Ring (elite guard) ===
		{ type: "fortified_wall", faction: "scale_guard", x: 40, y: 28 },
		{ type: "fortified_wall", faction: "scale_guard", x: 52, y: 28 },
		{ type: "fortified_wall", faction: "scale_guard", x: 64, y: 28 },
		{ type: "fortified_wall", faction: "scale_guard", x: 76, y: 28 },
		{ type: "fortified_wall", faction: "scale_guard", x: 88, y: 28 },
		{ type: "venom_spire", faction: "scale_guard", x: 48, y: 34 },
		{ type: "venom_spire", faction: "scale_guard", x: 80, y: 34 },
		{ type: "predator_nest", faction: "scale_guard", x: 64, y: 32 },
		{ type: "croc_champion", faction: "scale_guard", x: 44, y: 36 },
		{ type: "croc_champion", faction: "scale_guard", x: 56, y: 38 },
		{ type: "croc_champion", faction: "scale_guard", x: 72, y: 38 },
		{ type: "croc_champion", faction: "scale_guard", x: 84, y: 36 },
		{ type: "gator", faction: "scale_guard", x: 40, y: 40 },
		{ type: "gator", faction: "scale_guard", x: 50, y: 42 },
		{ type: "gator", faction: "scale_guard", x: 64, y: 40 },
		{ type: "gator", faction: "scale_guard", x: 78, y: 42 },
		{ type: "gator", faction: "scale_guard", x: 88, y: 40 },
		{ type: "viper", faction: "scale_guard", x: 46, y: 32 },
		{ type: "viper", faction: "scale_guard", x: 64, y: 36 },
		{ type: "viper", faction: "scale_guard", x: 82, y: 32 },

		// === Enemies — Inner Wall + Throne Room Approach ===
		{ type: "fortified_wall", faction: "scale_guard", x: 48, y: 44 },
		{ type: "fortified_wall", faction: "scale_guard", x: 56, y: 44 },
		{ type: "fortified_wall", faction: "scale_guard", x: 64, y: 44 },
		{ type: "fortified_wall", faction: "scale_guard", x: 72, y: 44 },
		{ type: "croc_champion", faction: "scale_guard", x: 52, y: 46 },
		{ type: "croc_champion", faction: "scale_guard", x: 76, y: 46 },
		// NOTE: Kommandant Ironjaw is NOT placed at start — spawned by Phase 3 trigger

		// === Approach Defenses (outside moat) ===
		// Patrols on the approach road
		{
			type: "gator",
			faction: "scale_guard",
			x: 56,
			y: 92,
			patrol: [
				[56, 92],
				[72, 92],
				[56, 92],
			],
		},
		{
			type: "gator",
			faction: "scale_guard",
			x: 60,
			y: 94,
			patrol: [
				[60, 94],
				[76, 94],
				[60, 94],
			],
		},
		{
			type: "skink",
			faction: "scale_guard",
			x: 48,
			y: 90,
			patrol: [
				[48, 90],
				[80, 90],
				[48, 90],
			],
		},
		// Flanking ruins (east approach)
		{ type: "gator", faction: "scale_guard", x: 96, y: 92 },
		{ type: "gator", faction: "scale_guard", x: 100, y: 94 },
		{ type: "viper", faction: "scale_guard", x: 104, y: 90 },
	],

	startResources: { fish: 500, timber: 400, salvage: 300 },
	startPopCap: 40,

	// -----------------------------------------------------------------------
	// Objectives
	// -----------------------------------------------------------------------
	objectives: {
		primary: [
			objective("cross-moat", "Cross the toxic moat"),
			objective("clear-outer-ring", "Clear the outer ring defenses"),
			objective("destroy-spires", "Destroy the Venom Spires"),
			objective("breach-middle-ring", "Breach the middle ring"),
			objective("defeat-ironjaw", "Defeat Kommandant Ironjaw"),
		],
		bonus: [
			objective("bonus-flawless-breach", "Clear the outer ring with zero casualties"),
			objective("bonus-war-plunder", "Collect 600+ salvage from the citadel"),
		],
	},

	// -----------------------------------------------------------------------
	// Triggers — 3 phases + boss fight
	// -----------------------------------------------------------------------
	triggers: [
		// ===================================================================
		// PHASE 1: BREACH THE OUTER RING (0:00 - ~5:00)
		// ===================================================================

		// Mission briefing exchange on start
		trigger("phase:outer-ring:briefing", on.timer(3), [
			act.exchange([
				{
					speaker: "Gen. Whiskers",
					text: "The Serpent's Lair, Captain. Kommandant Ironjaw's citadel. Three rings of defense, a toxic moat, and every Croc Champion the Scale-Guard has left. He's in the throne room at the center.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Outer ring is the first obstacle. Sandbags, watchtowers, and Gators dug in behind the moat. Three causeways across — west, center, east.",
				},
				{
					speaker: "FOXHOUND",
					text: "The moat is toxic sludge — any unit crossing through the water takes damage. Use the causeways. Sappers can widen them if you need a broader front.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "This is the man who ordered the occupation. The man who had me locked in a cage. Take his citadel apart, Captain. Ring by ring.",
				},
			]),
		]),

		// FOXHOUND approach intel at 30s
		trigger(
			"phase:outer-ring:approach-intel",
			on.timer(30),
			act.dialogue(
				"foxhound",
				"Approach road has Gator patrols. Western jungle offers concealment for flanking. Eastern ruins are lightly held — possible alternate entry.",
			),
		),

		// Player crosses the toxic moat
		trigger(
			"phase:outer-ring:moat-crossing",
			on.areaEntered("ura", "toxic_moat"),
			act.dialogue(
				"foxhound",
				"Crossing the moat. Watch unit health — the sludge bites. Get across the causeways fast.",
			),
		),

		// Player enters the outer ring
		trigger("phase:outer-ring:entered", on.areaEntered("ura", "outer_ring_south"), [
			act.completeObjective("cross-moat"),
			act.dialogue(
				"col_bubbles",
				"Inside the outer ring! Clear these defenses — towers, sandbags, all of it.",
			),
			act.revealZone("outer_ring_south"),
			act.revealZone("outer_ring_w"),
			act.revealZone("outer_ring_e"),
		]),

		// Outer ring cleared — advance to Phase 2
		trigger("phase:outer-ring:clear", on.unitCount("scale_guard", "gator", "lte", 8), [
			act.completeObjective("clear-outer-ring"),
			act.dialogue(
				"foxhound",
				"Outer ring is clear. Middle ring ahead — fortified walls and Venom Spires. This is where it gets ugly.",
			),
			act.revealZone("middle_ring"),
			act.revealZone("middle_ring_south"),
			act.startPhase("middle-ring"),
			act.enableTrigger("phase:middle-ring:briefing"),
			act.enableTrigger("phase:middle-ring:nest-spawn-1"),
			act.enableTrigger("phase:middle-ring:nest-spawn-2"),
			act.enableTrigger("phase:middle-ring:nest-spawn-3"),
		]),

		// Bonus: flawless outer ring breach
		trigger("phase:outer-ring:flawless", on.objectiveComplete("clear-outer-ring"), [
			act.dialogue(
				"col_bubbles",
				"Outer ring cleared without a single casualty. Textbook assault, Captain.",
			),
			act.completeObjective("bonus-flawless-breach"),
		]),

		// ===================================================================
		// PHASE 2: SHATTER THE MIDDLE RING (~5:00 - ~10:00)
		// ===================================================================

		// Phase 2 briefing — enabled by Phase 1 completion
		trigger(
			"phase:middle-ring:briefing",
			on.timer(1),
			[
				act.exchange([
					{
						speaker: "Col. Bubbles",
						text: "Middle ring. Fortified walls, two Venom Spires, a Predator Nest, and four Croc Champions. Sappers on those walls, Mortars on the Spires.",
					},
					{
						speaker: "FOXHOUND",
						text: "The Predator Nest will keep spawning defenders until you destroy it. Prioritize that.",
					},
					{
						speaker: "Gen. Whiskers",
						text: "Ironjaw is watching. He knows we're coming. Let him watch us tear his fortress apart.",
					},
				]),
			],
			{ enabled: false },
		),

		// Predator Nest destroyed
		trigger(
			"phase:middle-ring:nest-destroyed",
			on.buildingCount("scale_guard", "predator_nest", "eq", 0),
			act.dialogue("col_bubbles", "Predator Nest is rubble. No more fresh Gators from that hole."),
		),

		// Predator Nest spawns — enabled by Phase 1 completion
		trigger(
			"phase:middle-ring:nest-spawn-1",
			on.timer(330),
			act.spawn("gator", "scale_guard", 64, 34, 3),
			{ enabled: false },
		),
		trigger(
			"phase:middle-ring:nest-spawn-2",
			on.timer(360),
			act.spawn("gator", "scale_guard", 64, 34, 3),
			{ enabled: false },
		),
		trigger(
			"phase:middle-ring:nest-spawn-3",
			on.timer(390),
			[
				act.spawn("croc_champion", "scale_guard", 64, 34, 1),
				act.spawn("gator", "scale_guard", 64, 34, 2),
			],
			{ enabled: false },
		),

		// Venom Spires destroyed
		trigger(
			"phase:middle-ring:spires-destroyed",
			on.buildingCount("scale_guard", "venom_spire", "eq", 0),
			act.dialogue(
				"foxhound",
				"Both Venom Spires neutralized. The center approach is clear of artillery.",
			),
		),

		// Middle ring cleared — advance to Phase 3
		trigger("phase:middle-ring:clear", on.buildingCount("scale_guard", "predator_nest", "eq", 0), [
			act.completeObjective("destroy-spires"),
			act.completeObjective("breach-middle-ring"),
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Middle ring is broken! Inner wall is all that's left between us and Ironjaw.",
				},
				{
					speaker: "FOXHOUND",
					text: "Two Croc Champions guarding the inner gate. The throne room is beyond. Ironjaw is in there — confirmed by thermal signatures.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "Blow that gate open. I want to look that iron-jawed monster in the eye.",
				},
			]),
			act.revealZone("inner_wall"),
			act.revealZone("throne_room"),
			act.startPhase("throne-room"),
			act.enableTrigger("phase:throne-room:briefing"),
		]),

		// ===================================================================
		// PHASE 3: THE SERPENT KING (~10:00 - ~15:00)
		// ===================================================================

		// Phase 3 briefing — enabled by Phase 2 completion
		trigger(
			"phase:throne-room:briefing",
			on.timer(1),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Inner wall — fortified stone, two Croc Champions at the gate. Sappers can breach it.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Once you're through, it's Ironjaw and whatever personal guard he has left. Be ready for anything.",
				},
			]),
			{ enabled: false },
		),

		// Inner wall breached — camera pan
		trigger(
			"phase:throne-room:inner-wall-breached",
			on.buildingCount("scale_guard", "fortified_wall", "lte", 2),
			[
				act.panCamera(64, 52, 2000),
				act.dialogue("foxhound", "Inner wall breached. Throne room is open."),
			],
		),

		// Player enters throne room — spawn Ironjaw boss + royal guard
		trigger("phase:throne-room:entered", on.areaEntered("ura", "throne_room"), [
			act.spawnBossUnit({
				name: "Kommandant Ironjaw",
				unitType: "kommandant_ironjaw",
				faction: "scale_guard",
				x: 64,
				y: 52,
				hp: 5000,
				armor: 8,
				damage: 40,
				range: 2,
				attackCooldown: 1.5,
				speed: 3,
				visionRadius: 10,
				phases: [
					{
						name: "The Commander",
						hpThreshold: 100,
						abilities: ["heavy_melee", "call_reinforcements"],
						dialogue: {
							speaker: "Kommandant Ironjaw",
							text: "So. The otters finally arrive. You've broken my walls. You've killed my soldiers. But you will not break ME.",
						},
					},
					{
						name: "Enraged",
						hpThreshold: 60,
						abilities: ["heavy_melee", "iron_jaw_slam", "call_reinforcements"],
						dialogue: {
							speaker: "Kommandant Ironjaw",
							text: "ENOUGH! You want to see what a real predator can do?",
						},
					},
					{
						name: "Last Stand",
						hpThreshold: 25,
						abilities: ["heavy_melee", "desperation_aoe"],
						dialogue: {
							speaker: "Kommandant Ironjaw",
							text: "I... will not... be defeated by OTTERS!",
						},
					},
				],
				aoeRadius: 4,
				aoeDamage: 35,
				aoeCooldown: 5,
				summonCooldown: 30,
				summonType: "croc_champion",
				summonCount: 2,
			}),
			act.spawn("croc_champion", "scale_guard", 56, 54, 2),
			act.exchange([
				{
					speaker: "Kommandant Ironjaw",
					text: "So. The otters finally arrive. You've broken my walls. You've killed my soldiers. But you will not break ME.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "We'll see about that, Ironjaw. Captain — put him down.",
				},
			]),
			act.enableTrigger("phase:throne-room:ironjaw-reinf"),
		]),

		// Boss Phase 1 reinforcements — Croc Champions every 30s (100%-60% HP)
		trigger(
			"phase:throne-room:ironjaw-reinf",
			on.timer(630),
			act.spawn("croc_champion", "scale_guard", 64, 48, 2),
			{ once: false, enabled: false },
		),

		// Boss taunt at 75% HP
		trigger(
			"phase:throne-room:ironjaw-75",
			on.healthThreshold("kommandant_ironjaw", 75, "below"),
			act.dialogue(
				"ironjaw",
				"Is that all you have? The Reach belongs to the strong. It always has.",
			),
		),

		// Boss Phase 2 transition at 60% HP — Enraged
		trigger("phase:throne-room:ironjaw-60", on.healthThreshold("kommandant_ironjaw", 60, "below"), [
			act.exchange([
				{
					speaker: "Kommandant Ironjaw",
					text: "ENOUGH! You want to see what a real predator can do?",
				},
				{
					speaker: "FOXHOUND",
					text: "Captain — he's powering up some kind of... his jaw is glowing. Area attack incoming! Spread your units!",
				},
			]),
		]),

		// Boss taunt at 40% HP + Viper reinforcements
		trigger("phase:throne-room:ironjaw-40", on.healthThreshold("kommandant_ironjaw", 40, "below"), [
			act.dialogue(
				"ironjaw",
				"You think this changes anything? Destroy me and another will take my place. The Scale-Guard endures!",
			),
			act.spawn("viper", "scale_guard", 52, 50, 2),
			act.spawn("viper", "scale_guard", 76, 50, 2),
		]),

		// Boss Phase 3 transition at 25% HP — Last Stand
		trigger("phase:throne-room:ironjaw-25", on.healthThreshold("kommandant_ironjaw", 25, "below"), [
			act.exchange([
				{
					speaker: "Kommandant Ironjaw",
					text: "I... will not... be defeated by OTTERS!",
				},
				{
					speaker: "FOXHOUND",
					text: "He's destabilizing! His prosthetic jaw is overloading — massive energy buildup! Hit him NOW while he's vulnerable!",
				},
				{
					speaker: "Gen. Whiskers",
					text: "Pour it on! Everything you've got, Captain! Finish this!",
				},
			]),
		]),

		// Boss taunt at 10% HP
		trigger(
			"phase:throne-room:ironjaw-10",
			on.healthThreshold("kommandant_ironjaw", 10, "below"),
			act.dialogue("ironjaw", "The Reach... was supposed to be... mine..."),
		),

		// Boss defeated
		trigger(
			"phase:throne-room:ironjaw-defeated",
			on.unitCount("scale_guard", "kommandant_ironjaw", "eq", 0),
			[act.completeObjective("defeat-ironjaw"), act.panCamera(64, 52, 1500)],
		),

		// ===================================================================
		// BONUS OBJECTIVES
		// ===================================================================

		// War plunder — collect 600+ salvage
		trigger(
			"phase:bonus:war-plunder",
			on.resourceThreshold("salvage", "gte", 600),
			act.completeObjective("bonus-war-plunder"),
		),

		// ===================================================================
		// LOSS CONDITIONS
		// ===================================================================

		// Lodge destroyed
		trigger(
			"phase:loss:lodge-destroyed",
			on.buildingDestroyed("lodge"),
			act.failMission("The Lodge has been destroyed"),
		),

		// ===================================================================
		// VICTORY
		// ===================================================================

		trigger("phase:victory:mission-complete", on.allPrimaryComplete(), [
			act.exchange([
				{
					speaker: "Gen. Whiskers",
					text: "Kommandant Ironjaw is finished. The Serpent King is no more.",
				},
				{
					speaker: "Col. Bubbles",
					text: "The citadel is ours, Captain. Scale-Guard command structure just collapsed.",
				},
				{
					speaker: "FOXHOUND",
					text: "Wait — intercepting Scale-Guard emergency broadcast. Their remaining forces are consolidating at the northern command post. Massive force buildup. This isn't over.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "Then we finish it. One more battle, Captain. One more push and the Reach is free. Rally every otter we have. This ends tomorrow.",
				},
			]),
			act.victory(),
		]),
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
			enemyDamageMultiplier: 1.5,
			enemyHpMultiplier: 1.5,
			resourceMultiplier: 0.75,
			xpMultiplier: 1.5,
		},
	},
};
