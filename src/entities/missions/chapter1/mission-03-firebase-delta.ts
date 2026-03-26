// Mission 3: Firebase Delta — King of the Hill (4-phase)
//
// Three jungle hilltops in a triangle overlooking the Copper-Silt river valley.
// Scale-Guard controls all three positions. OEF assaults uphill, captures each
// firebase, then holds against coordinated counterattack waves.
//
// Phase 1 — RECONNAISSANCE: Build up, assault Hilltop Charlie (closest).
// Phase 2 — TWO-FRONT WAR: Defend Charlie, cross river to capture Bravo.
// Phase 3 — ASSAULT ON ALPHA: Hardest hilltop, dual counterattacks.
// Phase 4 — HOLD THE LINE: 3-minute survival hold on all 3 hilltops.
//
// Map: 128x128 tiles.
// Win: Capture and hold all 3 hilltops for 3 minutes after the final capture.
// Lose: Lodge destroyed OR all 3 hilltops recaptured by Scale-Guard.
// Par time: 25 minutes (1500s).
// Unlocks: Mortar Otter (artillery), Gun Tower, Stone Wall.

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission03FirebaseDelta: MissionDef = {
	id: "mission_3",
	chapter: 1,
	mission: 3,
	name: "Firebase Delta",
	subtitle: "Assault three jungle hilltops and hold them against counterattack",

	// ─── Briefing ──────────────────────────────────────────────────────
	briefing: {
		portraitId: "col_bubbles",
		lines: [
			{
				speaker: "Col. Bubbles",
				text: "Captain, Firebase Delta is a triangle of three hilltops overlooking the river valley. Scale-Guard holds all three.",
			},
			{
				speaker: "Col. Bubbles",
				text: "We take those hills, we control the central Reach. Hilltop Charlie is closest — start there.",
			},
			{
				speaker: "FOXHOUND",
				text: "Terrain report: Charlie is southeast, lightly garrisoned. Bravo is west across the river — stronger. Alpha is far north, heavily fortified with a radio tower.",
			},
			{
				speaker: "FOXHOUND",
				text: "The river gorge cuts the map in two. Two ford crossings — one west, one east. Plan your approach.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Build up your force. Those Shellcrackers will soak damage on the uphill push. Move when you're ready. HQ out.",
			},
		],
	},

	// ─── Terrain (128x128) ─────────────────────────────────────────────
	terrain: {
		width: 128,
		height: 128,
		regions: [
			// Base layer
			{ terrainId: "grass", fill: true },

			// Dense jungle (most of the northern map)
			{ terrainId: "jungle", rect: { x: 0, y: 0, w: 128, h: 80 } },

			// Hilltop Alpha (northeast — highest elevation, strongest garrison)
			{ terrainId: "rock", rect: { x: 72, y: 2, w: 40, h: 12 } },
			{ terrainId: "dirt", rect: { x: 76, y: 4, w: 32, h: 8 } },

			// Hilltop Bravo (west-center — medium elevation)
			{ terrainId: "rock", rect: { x: 12, y: 32, w: 36, h: 8 } },
			{ terrainId: "dirt", rect: { x: 16, y: 34, w: 28, h: 4 } },

			// Hilltop Charlie (southeast — lowest, closest to player)
			{ terrainId: "rock", rect: { x: 68, y: 56, w: 40, h: 8 } },
			{ terrainId: "dirt", rect: { x: 72, y: 58, w: 32, h: 4 } },

			// River gorge (impassable except at fords)
			{
				terrainId: "water",
				river: {
					points: [
						[0, 24],
						[16, 22],
						[32, 20],
						[48, 24],
						[64, 28],
						[80, 44],
						[96, 48],
						[112, 44],
						[128, 46],
					],
					width: 8,
				},
			},

			// Ford crossings (shallow water — passable, 40% move speed)
			{ terrainId: "mud", rect: { x: 44, y: 22, w: 8, h: 4 } },
			{ terrainId: "mud", rect: { x: 84, y: 44, w: 8, h: 4 } },

			// Base camp clearing
			{ terrainId: "dirt", rect: { x: 12, y: 80, w: 40, h: 8 } },

			// Resource field
			{ terrainId: "grass", rect: { x: 68, y: 80, w: 48, h: 8 } },

			// Approach trails (dirt paths through jungle — modeled as rects)
			// Western trail: base_camp → jungle_sw → hilltop_bravo
			{ terrainId: "dirt", rect: { x: 22, y: 64, w: 4, h: 20 } },
			{ terrainId: "dirt", rect: { x: 18, y: 48, w: 4, h: 16 } },
			{ terrainId: "dirt", rect: { x: 20, y: 38, w: 4, h: 10 } },
			// Eastern trail: base_camp → hilltop_charlie
			{ terrainId: "dirt", rect: { x: 82, y: 64, w: 4, h: 20 } },
			// Northern trail: ford → hilltop_alpha
			{ terrainId: "dirt", rect: { x: 54, y: 16, w: 4, h: 8 } },
			{ terrainId: "dirt", rect: { x: 62, y: 8, w: 4, h: 8 } },
			{ terrainId: "dirt", rect: { x: 68, y: 4, w: 4, h: 8 } },

			// Mangrove groves (jungle_west)
			{ terrainId: "mangrove", rect: { x: 12, y: 42, w: 24, h: 10 } },

			// Valley center (open ground — dangerous kill zone)
			{ terrainId: "grass", rect: { x: 68, y: 32, w: 48, h: 8 } },

			// Jungle southwest (thick brush — reduced movement speed)
			{ terrainId: "thicket", rect: { x: 12, y: 66, w: 40, h: 12 } },

			// Depot staging area (south, safe zone)
			{ terrainId: "dirt", rect: { x: 8, y: 88, w: 112, h: 40 } },
		],
		overrides: [],
	},

	// ─── Zones ─────────────────────────────────────────────────────────
	zones: {
		depot_south: { x: 8, y: 88, width: 112, height: 40 },
		base_camp: { x: 8, y: 80, width: 48, height: 8 },
		resource_field: { x: 64, y: 80, width: 56, height: 8 },
		jungle_sw: { x: 8, y: 64, width: 48, height: 16 },
		rally_point: { x: 64, y: 64, width: 56, height: 16 },
		approach_south: { x: 8, y: 56, width: 48, height: 8 },
		hilltop_charlie: { x: 64, y: 56, width: 48, height: 8 },
		jungle_west: { x: 8, y: 40, width: 48, height: 16 },
		river_south: { x: 64, y: 40, width: 56, height: 16 },
		hilltop_bravo: { x: 8, y: 32, width: 48, height: 8 },
		valley_center: { x: 64, y: 32, width: 56, height: 8 },
		river_gorge: { x: 8, y: 16, width: 48, height: 16 },
		jungle_ne: { x: 64, y: 16, width: 56, height: 16 },
		jungle_nw: { x: 8, y: 0, width: 48, height: 16 },
		hilltop_alpha: { x: 64, y: 0, width: 56, height: 16 },
	},

	// ─── Placements ────────────────────────────────────────────────────
	placements: [
		// ── Player base_camp ──
		// Lodge (Captain's field HQ)
		{ type: "burrow", faction: "ura", x: 24, y: 84 },
		// Pre-built structures
		{ type: "barracks", faction: "ura", x: 32, y: 82 },
		{ type: "command_post", faction: "ura", x: 40, y: 82 },
		// Starting combat units — 6 Mudfoots, 2 Shellcrackers
		{ type: "mudfoot", faction: "ura", x: 20, y: 86 },
		{ type: "mudfoot", faction: "ura", x: 22, y: 88 },
		{ type: "mudfoot", faction: "ura", x: 24, y: 86 },
		{ type: "mudfoot", faction: "ura", x: 26, y: 88 },
		{ type: "mudfoot", faction: "ura", x: 28, y: 86 },
		{ type: "mudfoot", faction: "ura", x: 30, y: 88 },
		{ type: "shellcracker", faction: "ura", x: 34, y: 86 },
		{ type: "shellcracker", faction: "ura", x: 36, y: 88 },
		// Starting workers — 3 River Rats
		{ type: "river_rat", faction: "ura", x: 44, y: 86 },
		{ type: "river_rat", faction: "ura", x: 46, y: 88 },
		{ type: "river_rat", faction: "ura", x: 48, y: 86 },

		// ── Resources ──
		// Timber (resource_field)
		{ type: "jungle_tree", faction: "neutral", x: 72, y: 82 },
		{ type: "jungle_tree", faction: "neutral", x: 78, y: 84 },
		{ type: "jungle_tree", faction: "neutral", x: 84, y: 82 },
		{ type: "jungle_tree", faction: "neutral", x: 90, y: 86 },
		{ type: "jungle_tree", faction: "neutral", x: 96, y: 84 },
		{ type: "jungle_tree", faction: "neutral", x: 102, y: 82 },
		// Timber (jungle_west)
		{ type: "jungle_tree", faction: "neutral", x: 16, y: 44 },
		{ type: "jungle_tree", faction: "neutral", x: 22, y: 46 },
		{ type: "jungle_tree", faction: "neutral", x: 28, y: 48 },
		{ type: "jungle_tree", faction: "neutral", x: 34, y: 44 },
		// Fish (river fords and base pond)
		{ type: "fish_spot", faction: "neutral", x: 48, y: 24 },
		{ type: "fish_spot", faction: "neutral", x: 88, y: 46 },
		{ type: "fish_spot", faction: "neutral", x: 108, y: 84 },
		// Salvage (scattered across hilltops — captured as bonus)
		{ type: "salvage_cache", faction: "neutral", x: 80, y: 60 },
		{ type: "salvage_cache", faction: "neutral", x: 24, y: 34 },
		{ type: "salvage_cache", faction: "neutral", x: 84, y: 6 },

		// ── Hilltop Charlie garrison (closest, weakest) ──
		// Flag Post (capture objective)
		{ type: "flag_post", faction: "scale_guard", x: 84, y: 60 },
		// Garrison: 4 Gators + 1 Skink + Watchtower
		{ type: "gator", faction: "scale_guard", x: 76, y: 58 },
		{ type: "gator", faction: "scale_guard", x: 80, y: 62 },
		{ type: "gator", faction: "scale_guard", x: 88, y: 58 },
		{ type: "gator", faction: "scale_guard", x: 92, y: 62 },
		{ type: "skink", faction: "scale_guard", x: 96, y: 58 },
		{ type: "watchtower", faction: "scale_guard", x: 100, y: 60 },

		// ── Hilltop Bravo garrison (across river, medium) ──
		// Flag Post (capture objective)
		{ type: "flag_post", faction: "scale_guard", x: 28, y: 36 },
		// Garrison: 5 Gators + 1 Viper + 1 Skink + Gun Emplacement
		{ type: "gator", faction: "scale_guard", x: 20, y: 34 },
		{ type: "gator", faction: "scale_guard", x: 24, y: 38 },
		{ type: "gator", faction: "scale_guard", x: 32, y: 34 },
		{ type: "gator", faction: "scale_guard", x: 36, y: 38 },
		{ type: "gator", faction: "scale_guard", x: 40, y: 36 },
		{ type: "viper", faction: "scale_guard", x: 16, y: 36 },
		{ type: "skink", faction: "scale_guard", x: 44, y: 34 },
		{ type: "gun_emplacement", faction: "scale_guard", x: 22, y: 32 },

		// ── Hilltop Alpha garrison (furthest, strongest) ──
		// Flag Post (capture objective)
		{ type: "flag_post", faction: "scale_guard", x: 88, y: 8 },
		// Garrison: 6 Gators + 2 Vipers + 1 Skink + Radio Tower + Gun Emplacement
		{ type: "gator", faction: "scale_guard", x: 80, y: 6 },
		{ type: "gator", faction: "scale_guard", x: 84, y: 10 },
		{ type: "gator", faction: "scale_guard", x: 88, y: 4 },
		{ type: "gator", faction: "scale_guard", x: 92, y: 10 },
		{ type: "gator", faction: "scale_guard", x: 96, y: 6 },
		{ type: "gator", faction: "scale_guard", x: 100, y: 8 },
		{ type: "viper", faction: "scale_guard", x: 76, y: 4 },
		{ type: "viper", faction: "scale_guard", x: 104, y: 4 },
		{ type: "skink", faction: "scale_guard", x: 108, y: 8 },
		{ type: "radio_tower", faction: "scale_guard", x: 92, y: 2 },
		{ type: "gun_emplacement", faction: "scale_guard", x: 82, y: 2 },

		// ── Patrols (valley_center and jungle_ne) ──
		// Valley patrol — crosses open ground
		{
			type: "skink",
			faction: "scale_guard",
			x: 72,
			y: 34,
			patrol: [
				[72, 34],
				[88, 36],
				[104, 34],
				[88, 32],
			],
		},
		{
			type: "skink",
			faction: "scale_guard",
			x: 74,
			y: 36,
			patrol: [
				[74, 36],
				[90, 38],
				[106, 36],
				[90, 34],
			],
		},
		// NE jungle patrol — guards approach to Alpha
		{
			type: "gator",
			faction: "scale_guard",
			x: 72,
			y: 20,
			patrol: [
				[72, 20],
				[80, 18],
				[88, 22],
				[80, 24],
			],
		},
		{
			type: "gator",
			faction: "scale_guard",
			x: 74,
			y: 22,
			patrol: [
				[74, 22],
				[82, 20],
				[90, 24],
				[82, 26],
			],
		},
	],

	// ─── Starting Resources ────────────────────────────────────────────
	startResources: { fish: 300, timber: 150, salvage: 75 },
	startPopCap: 20,

	// ─── Objectives ────────────────────────────────────────────────────
	objectives: {
		primary: [
			objective("capture-charlie", "Capture Hilltop Charlie"),
			objective("capture-bravo", "Capture Hilltop Bravo"),
			objective("capture-alpha", "Capture Hilltop Alpha"),
			objective("hold-hilltops", "Hold all 3 hilltops for 3 minutes"),
		],
		bonus: [objective("bonus-radio-tower", "Destroy the radio tower on Alpha")],
	},

	// ─── Triggers ──────────────────────────────────────────────────────
	triggers: [
		// ════════════════════════════════════════════════════════════════
		// PHASE 1: RECONNAISSANCE (~0:00 - ~6:00)
		// ════════════════════════════════════════════════════════════════

		// [0:05] Opening briefing from Col. Bubbles
		trigger("phase:recon:bubbles-briefing", on.timer(5), act.exchange([
			{
				speaker: "Col. Bubbles",
				text: "Captain, Firebase Delta is a triangle of three hilltops overlooking the river valley. Scale-Guard holds all three.",
			},
			{
				speaker: "Col. Bubbles",
				text: "We take those hills, we control the central Reach. Hilltop Charlie is closest — start there.",
			},
		])),

		// [0:15] FOXHOUND terrain assessment
		trigger("phase:recon:foxhound-terrain", on.timer(15), act.exchange([
			{
				speaker: "FOXHOUND",
				text: "Terrain report: Charlie is southeast, lightly garrisoned. Bravo is west across the river — stronger. Alpha is far north, heavily fortified with a radio tower.",
			},
			{
				speaker: "FOXHOUND",
				text: "The river gorge cuts the map in two. Two ford crossings — one west, one east. Plan your approach.",
			},
		])),

		// [0:30] Build-up hint
		trigger(
			"phase:recon:bubbles-build-up",
			on.timer(30),
			act.dialogue(
				"sgt_bubbles",
				"Build up your force. Those Shellcrackers will soak damage on the uphill push. Move when you're ready.",
			),
		),

		// Player approaches Hilltop Charlie
		trigger("phase:recon:approach-charlie", on.areaEntered("ura", "hilltop_charlie"), [
			act.dialogue(
				"foxhound",
				"Contact at Charlie. Garrison of Gators plus a watchtower. Hit them hard and fast — don't give them time to call for help.",
			),
			act.revealZone("hilltop_charlie"),
		]),

		// Charlie captured — Flag Post destroyed (2 of 3 remaining)
		trigger(
			"phase:recon:charlie-captured",
			on.buildingCount("scale_guard", "flag_post", "eq", 2),
			[
				act.completeObjective("capture-charlie"),
				act.dialogue(
					"sgt_bubbles",
					"Charlie is ours! Good. Get some troops dug in there — they'll try to take it back.",
				),
				act.dialogue(
					"foxhound",
					"Recommend building defenses on the hilltop. Watchtower, walls — whatever you can manage before the next push.",
				),
				act.startPhase("two-front-war"),
			],
		),

		// ════════════════════════════════════════════════════════════════
		// PHASE 2: TWO-FRONT WAR (~6:00 - ~14:00)
		// Enabled when Charlie is captured via startPhase("two-front-war")
		// ════════════════════════════════════════════════════════════════

		// Phase 2 briefing — enabled by charlie-captured
		trigger(
			"phase:two-front-war:briefing",
			on.objectiveComplete("capture-charlie"),
			[
				act.exchange([
					{
						speaker: "Col. Bubbles",
						text: "Don't get comfortable. Bravo is next — west side, across the river. Use the southern ford to cross.",
					},
					{
						speaker: "FOXHOUND",
						text: "Be warned: they'll counterattack Charlie while you're pushing Bravo. Split your force or build defenses.",
					},
				]),
				// Reveal new zones for Phase 2
				act.revealZone("hilltop_bravo"),
				act.revealZone("valley_center"),
				act.revealZone("jungle_west"),
				act.revealZone("river_south"),
				act.revealZone("approach_south"),
				// Add persistent defense objective
				act.addObjective("defend-charlie", "Defend Hilltop Charlie", "primary"),
				// Enable Phase 2 counterattack trigger
				act.enableTrigger("phase:two-front-war:counterattack-charlie"),
			],
		),

		// [Phase 2 + ~60s] Counterattack on Charlie from the east
		trigger(
			"phase:two-front-war:counterattack-charlie",
			on.timer(420),
			[
				act.spawn("gator", "scale_guard", 108, 52, 4),
				act.spawn("skink", "scale_guard", 112, 56, 2),
				act.dialogue(
					"foxhound",
					"Counterattack on Charlie! Hostiles approaching from the east!",
				),
				act.dialogue(
					"sgt_bubbles",
					"Hold that hill, Captain! If they retake it, we lose everything.",
				),
			],
			{ enabled: false },
		),

		// Player crosses the river ford
		trigger(
			"phase:two-front-war:ford-crossing",
			on.areaEntered("ura", "river_south"),
			act.dialogue(
				"foxhound",
				"Crossing the ford. Water's shallow here but you're exposed. Move fast.",
			),
		),

		// Player approaches Hilltop Bravo
		trigger("phase:two-front-war:approach-bravo", on.areaEntered("ura", "hilltop_bravo"), [
			act.dialogue(
				"foxhound",
				"Bravo ahead. Gun emplacement on the west face — it'll chew up your infantry. Flank it or rush with Shellcrackers.",
			),
			act.revealZone("hilltop_bravo"),
		]),

		// Bravo captured — Flag Post destroyed (1 of 3 remaining)
		trigger(
			"phase:two-front-war:bravo-captured",
			on.buildingCount("scale_guard", "flag_post", "eq", 1),
			[
				act.completeObjective("capture-bravo"),
				act.dialogue(
					"sgt_bubbles",
					"Bravo is down! Two hills secured. One more — the big one.",
				),
				act.dialogue(
					"foxhound",
					"Alpha is across the gorge, northeast. Heavily defended. Radio tower is calling in reinforcements — take that out and the counterattack will be weaker.",
				),
				act.startPhase("assault-alpha"),
			],
		),

		// ════════════════════════════════════════════════════════════════
		// PHASE 3: ASSAULT ON ALPHA (~14:00 - ~20:00)
		// Enabled when Bravo is captured via startPhase("assault-alpha")
		// ════════════════════════════════════════════════════════════════

		// Phase 3 briefing — enabled by bravo-captured
		trigger(
			"phase:assault-alpha:briefing",
			on.objectiveComplete("capture-bravo"),
			[
				act.exchange([
					{
						speaker: "Col. Bubbles",
						text: "Alpha is the keystone. Radio tower, gun emplacement, full garrison. This is the hard one, Captain.",
					},
					{
						speaker: "FOXHOUND",
						text: "Cross at the western ford, push through the northwest jungle, and hit them from the flank. The front approach through the valley is a kill zone.",
					},
					{
						speaker: "Col. Bubbles",
						text: "Build defenses on Charlie and Bravo. They will hit both while you push Alpha.",
					},
				]),
				// Reveal northern zones
				act.revealZone("hilltop_alpha"),
				act.revealZone("jungle_ne"),
				act.revealZone("jungle_nw"),
				act.revealZone("river_gorge"),
				// Add defense objective for Bravo
				act.addObjective("defend-bravo", "Defend Hilltop Bravo", "primary"),
				// Enable Phase 3 dual counterattack
				act.enableTrigger("phase:assault-alpha:dual-counterattack"),
			],
		),

		// [Phase 3 + ~45s] Dual counterattack on both captured hilltops
		trigger(
			"phase:assault-alpha:dual-counterattack",
			on.timer(900),
			[
				// Counterattack on Charlie from east
				act.spawn("gator", "scale_guard", 108, 52, 3),
				act.spawn("skink", "scale_guard", 112, 56, 2),
				// Counterattack on Bravo from west
				act.spawn("gator", "scale_guard", 4, 28, 3),
				act.spawn("viper", "scale_guard", 8, 32, 1),
				act.dialogue(
					"foxhound",
					"Counterattack on both hills! Charlie from the east, Bravo from the west!",
				),
				act.dialogue(
					"sgt_bubbles",
					"Hold your positions! Don't pull defenders for the Alpha push — that's what they want!",
				),
			],
			{ enabled: false },
		),

		// Radio tower destroyed (bonus objective)
		trigger(
			"phase:assault-alpha:radio-tower-destroyed",
			on.buildingDestroyed("radio_tower"),
			[
				act.completeObjective("bonus-radio-tower"),
				act.dialogue(
					"foxhound",
					"Radio tower is down! Scale-Guard comms are disrupted — their counterattack coordination is crippled.",
				),
			],
		),

		// Player approaches Hilltop Alpha
		trigger("phase:assault-alpha:approach-alpha", on.areaEntered("ura", "hilltop_alpha"), [
			act.dialogue(
				"foxhound",
				"You're in Alpha's perimeter. Gun emplacement dead ahead — heaviest resistance on the map.",
			),
			act.dialogue(
				"sgt_bubbles",
				"Everything we've got, Captain. Take that hill.",
			),
		]),

		// Alpha captured — all 3 Flag Posts destroyed
		trigger(
			"phase:assault-alpha:alpha-captured",
			on.buildingCount("scale_guard", "flag_post", "eq", 0),
			[
				act.completeObjective("capture-alpha"),
				act.dialogue(
					"sgt_bubbles",
					"Alpha is OURS! All three hilltops secured! But they won't take this lying down —",
				),
				act.dialogue(
					"foxhound",
					"Massive Scale-Guard formation moving from the north. They're throwing everything at us. Brace for final counterattack.",
				),
				act.startPhase("hold-the-line"),
			],
		),

		// ════════════════════════════════════════════════════════════════
		// PHASE 4: HOLD THE LINE (~20:00+)
		// 3-minute survival timer. Three coordinated waves.
		// ════════════════════════════════════════════════════════════════

		// Phase 4 briefing — enabled by alpha-captured
		trigger(
			"phase:hold-the-line:briefing",
			on.objectiveComplete("capture-alpha"),
			[
				act.exchange([
					{
						speaker: "Col. Bubbles",
						text: "Three minutes, Captain. Hold every hill for three minutes and Firebase Delta is permanently ours. Reinforcements are en route but they need time.",
					},
					{
						speaker: "FOXHOUND",
						text: "Multiple hostile formations inbound from all directions. This is their last shot. Make it count.",
					},
				]),
				// Enable all Phase 4 wave triggers
				act.enableTrigger("phase:hold-the-line:wave-1"),
				act.enableTrigger("phase:hold-the-line:wave-2"),
				act.enableTrigger("phase:hold-the-line:wave-3"),
				act.enableTrigger("phase:hold-the-line:hold-complete"),
			],
		),

		// [Phase 4 + 15s] Wave 1 — all sectors
		trigger(
			"phase:hold-the-line:wave-1",
			on.timer(1215),
			[
				// Charlie from east
				act.spawn("gator", "scale_guard", 120, 52, 4),
				act.spawn("skink", "scale_guard", 116, 48, 3),
				// Bravo from west
				act.spawn("gator", "scale_guard", 4, 28, 3),
				// Alpha from north
				act.spawn("gator", "scale_guard", 76, 20, 4),
				act.dialogue("foxhound", "First wave incoming! All sectors!"),
			],
			{ enabled: false },
		),

		// [Phase 4 + 75s] Wave 2 — harder
		trigger(
			"phase:hold-the-line:wave-2",
			on.timer(1275),
			[
				// Charlie from east
				act.spawn("gator", "scale_guard", 112, 56, 3),
				act.spawn("viper", "scale_guard", 120, 60, 2),
				// Bravo from west
				act.spawn("gator", "scale_guard", 8, 24, 4),
				act.spawn("skink", "scale_guard", 4, 20, 2),
				// Alpha from north
				act.spawn("gator", "scale_guard", 68, 18, 3),
				act.spawn("viper", "scale_guard", 72, 14, 2),
				act.dialogue(
					"sgt_bubbles",
					"Second wave! They're hitting harder! Keep those lines tight!",
				),
			],
			{ enabled: false },
		),

		// [Phase 4 + 140s] Wave 3 — final, strongest
		trigger(
			"phase:hold-the-line:wave-3",
			on.timer(1340),
			[
				// Charlie from east
				act.spawn("gator", "scale_guard", 108, 48, 5),
				act.spawn("viper", "scale_guard", 116, 52, 3),
				// Bravo from west
				act.spawn("gator", "scale_guard", 12, 30, 4),
				act.spawn("viper", "scale_guard", 8, 26, 2),
				// Alpha from north
				act.spawn("gator", "scale_guard", 80, 22, 5),
				act.spawn("skink", "scale_guard", 84, 18, 3),
				act.dialogue(
					"foxhound",
					"Final wave! This is everything they've got! Hold the line, Captain!",
				),
			],
			{ enabled: false },
		),

		// Hold complete — 3-minute timer expires with all hilltops controlled
		// Runtime: fires at ~phase4 + 180s. Engine checks ura controls all 3 zones.
		trigger(
			"phase:hold-the-line:hold-complete",
			on.timer(1380),
			act.completeObjective("hold-hilltops"),
			{ enabled: false },
		),

		// ════════════════════════════════════════════════════════════════
		// GLOBAL TRIGGERS (always active)
		// ════════════════════════════════════════════════════════════════

		// Lodge destroyed = mission failure
		trigger(
			"phase:global:lodge-destroyed",
			on.buildingCount("ura", "burrow", "eq", 0),
			act.failMission("Lodge destroyed — Firebase Delta is lost."),
		),

		// Mission victory — all primary objectives complete
		trigger("phase:global:mission-complete", on.allPrimaryComplete(), [
			act.exchange([
				{
					speaker: "Gen. Whiskers",
					text: "Firebase Delta is secured. All three hilltops confirmed under OEF control. Outstanding tactical work, Captain.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Reinforcements are digging in. This position gives us eyes on the entire central Reach.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "I'm authorizing new ordnance for your command. Mortar Otters — artillery support. Plus Gun Tower and Stone Wall construction permits. You've earned every bit of it.",
				},
				{
					speaker: "Col. Bubbles",
					text: "One more thing, Captain. We've received intelligence that General Whiskers' forward staff officer was captured during a recon patrol. We need to get him back. Stand by for briefing. HQ out.",
				},
			]),
			act.victory(),
		]),
	],

	// ─── Unlocks ───────────────────────────────────────────────────────
	unlocks: {
		units: ["mortar_otter"],
		buildings: ["gun_tower", "stone_wall"],
	},

	// ─── Par Time ──────────────────────────────────────────────────────
	parTime: 1500,

	// ─── Difficulty Scaling ────────────────────────────────────────────
	difficulty: {
		support: {
			// Garrisons reduced 40%, counterattacks reduced 50%, hold timer 2 min
			enemyDamageMultiplier: 0.6,
			enemyHpMultiplier: 0.6,
			resourceMultiplier: 1.5,
			xpMultiplier: 1.0,
		},
		tactical: {
			// As designed
			enemyDamageMultiplier: 1.0,
			enemyHpMultiplier: 1.0,
			resourceMultiplier: 1.0,
			xpMultiplier: 1.2,
		},
		elite: {
			// Garrisons +30%, 4 counterattack waves, hold timer 4 min, Vipers in every wave
			enemyDamageMultiplier: 1.3,
			enemyHpMultiplier: 1.3,
			resourceMultiplier: 0.75,
			xpMultiplier: 1.5,
		},
	},
};
