// Mission 3-4: THE STRONGHOLD — Fang Rescue
//
// Scale-Guard's northern stronghold — a clifftop fortress above the Blackmarsh.
// Layered defenses: outer wall, inner courtyard, detention block carved into
// the cliff face. Full 20-unit assault force (no base, no economy) must storm
// three defensive layers, rescue Sgt. Fang, and fight a desperate retreat south
// to the extraction beach.
//
// 5 Phases:
//   1. RAVINE APPROACH — push through narrow ravine under ambush
//   2. OUTER BREACH — breach south wall, clear outer compound wings
//   3. COURTYARD ASSAULT — heaviest pre-rescue fight, Venom Spires flanking
//   4. RESCUE — free Sgt. Fang from the deepest cell
//   5. FIGHTING RETREAT — lockdown, 3 reinforcement waves, extract both heroes
//
// Win: Rescue Sgt. Fang AND extract all heroes to southern LZ.
// Lose: Col. Bubbles killed OR Sgt. Fang killed (after rescue).
// Par time: 14 min (840s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission12FangRescue: MissionDef = {
	id: "mission_12",
	chapter: 3,
	mission: 4,
	name: "The Stronghold",
	subtitle: "Storm the Scale-Guard stronghold and rescue Sgt. Fang",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "Sgt. Fang is being held at Scale-Guard's northern stronghold — clifftop fortress above the Blackmarsh. Three defensive layers before the detention block. This is their last position in the theater.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Captain, you'll take a full strike team — twenty units. Mudfoots, Shellcrackers, Sappers for the walls, Mortar Otters for suppression, and Divers for scouting. Biggest commando force we've assembled.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Three walls, three breaches. Outer wall, inner courtyard, then the detention block. Once Fang's out, they lock the compound down. Reinforcements flood in from every direction.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Fight your way south to the extraction beach. Fang's a siege specialist — we need him for the Iron Delta. In fast, out loud, Captain. HQ out.",
			},
		],
	},

	terrain: {
		width: 128,
		height: 128,
		regions: [
			{ terrainId: "grass", fill: true },
			// Impassable cliff face (north)
			{ terrainId: "mud", rect: { x: 0, y: 0, w: 16, h: 20 } },
			{ terrainId: "mud", rect: { x: 112, y: 0, w: 16, h: 20 } },
			{ terrainId: "mud", rect: { x: 0, y: 0, w: 128, h: 8 } },
			// Detention block (carved into cliff)
			{ terrainId: "dirt", rect: { x: 16, y: 8, w: 96, h: 12 } },
			// Fortress compound (layered stone)
			{ terrainId: "dirt", rect: { x: 16, y: 20, w: 96, h: 44 } },
			// Stone walls (3 layers)
			{ terrainId: "dirt", rect: { x: 24, y: 20, w: 80, h: 2 } },
			{ terrainId: "dirt", rect: { x: 16, y: 40, w: 96, h: 2 } },
			{ terrainId: "dirt", rect: { x: 24, y: 60, w: 80, h: 2 } },
			// Rocky cliff walls flanking the compound
			{ terrainId: "mud", rect: { x: 0, y: 20, w: 16, h: 44 } },
			{ terrainId: "mud", rect: { x: 112, y: 20, w: 16, h: 44 } },
			// Ravine (narrow approach — rocky walls on sides)
			{ terrainId: "dirt", rect: { x: 36, y: 62, w: 56, h: 14 } },
			{ terrainId: "dirt", rect: { x: 40, y: 76, w: 48, h: 12 } },
			{ terrainId: "mud", rect: { x: 24, y: 64, w: 12, h: 24 } },
			{ terrainId: "mud", rect: { x: 92, y: 64, w: 12, h: 24 } },
			// Mangrove flanking routes
			{ terrainId: "mangrove", rect: { x: 0, y: 88, w: 32, h: 12 } },
			{ terrainId: "mangrove", rect: { x: 96, y: 88, w: 32, h: 12 } },
			{ terrainId: "mangrove", circle: { cx: 16, cy: 94, r: 6 } },
			{ terrainId: "mangrove", circle: { cx: 112, cy: 94, r: 6 } },
			// Staging area
			{ terrainId: "dirt", rect: { x: 32, y: 100, w: 64, h: 12 } },
			// Extraction beach (south)
			{ terrainId: "beach", rect: { x: 32, y: 112, w: 64, h: 16 } },
			// Mud patches (organic detail)
			{ terrainId: "mud", circle: { cx: 64, cy: 80, r: 4 } },
			{ terrainId: "mud", circle: { cx: 48, cy: 96, r: 3 } },
			{ terrainId: "mud", circle: { cx: 80, cy: 96, r: 3 } },
		],
		overrides: [
			// South gate (breakable)
			{ x: 62, y: 60, terrainId: "bridge" },
			{ x: 63, y: 60, terrainId: "bridge" },
			{ x: 64, y: 60, terrainId: "bridge" },
			{ x: 65, y: 60, terrainId: "bridge" },
			// Mid gate (breakable)
			{ x: 62, y: 40, terrainId: "bridge" },
			{ x: 63, y: 40, terrainId: "bridge" },
			{ x: 64, y: 40, terrainId: "bridge" },
			{ x: 65, y: 40, terrainId: "bridge" },
			// North gate (detention access, breakable)
			{ x: 62, y: 20, terrainId: "bridge" },
			{ x: 63, y: 20, terrainId: "bridge" },
			{ x: 64, y: 20, terrainId: "bridge" },
			{ x: 65, y: 20, terrainId: "bridge" },
		],
	},

	zones: {
		extraction_lz: { x: 32, y: 112, width: 64, height: 16 },
		staging_area: { x: 24, y: 100, width: 80, height: 12 },
		west_flank: { x: 0, y: 88, width: 32, height: 12 },
		east_flank: { x: 96, y: 88, width: 32, height: 12 },
		ravine_lower: { x: 32, y: 76, width: 64, height: 12 },
		ravine_upper: { x: 36, y: 64, width: 56, height: 12 },
		wall_south: { x: 24, y: 60, width: 80, height: 4 },
		outer_compound_w: { x: 16, y: 44, width: 48, height: 16 },
		outer_compound_e: { x: 64, y: 44, width: 48, height: 16 },
		wall_mid: { x: 16, y: 40, width: 96, height: 4 },
		inner_courtyard: { x: 24, y: 24, width: 80, height: 16 },
		wall_north: { x: 24, y: 20, width: 80, height: 4 },
		detention_wing_w: { x: 16, y: 8, width: 40, height: 12 },
		detention_block: { x: 56, y: 8, width: 48, height: 12 },
		cliff_face_w: { x: 0, y: 0, width: 32, height: 8 },
		cliff_face_e: { x: 96, y: 0, width: 32, height: 8 },
	},

	placements: [
		// ── Player strike team (staging_area + extraction_lz) ──
		// Hero: Col. Bubbles (tactical commander)
		{ type: "sgt_bubbles", faction: "ura", x: 64, y: 116 },

		// Assault infantry (8 Mudfoots)
		{ type: "mudfoot", faction: "ura", x: 48, y: 108 },
		{ type: "mudfoot", faction: "ura", x: 52, y: 106 },
		{ type: "mudfoot", faction: "ura", x: 56, y: 108 },
		{ type: "mudfoot", faction: "ura", x: 60, y: 106 },
		{ type: "mudfoot", faction: "ura", x: 68, y: 106 },
		{ type: "mudfoot", faction: "ura", x: 72, y: 108 },
		{ type: "mudfoot", faction: "ura", x: 76, y: 106 },
		{ type: "mudfoot", faction: "ura", x: 80, y: 108 },

		// Heavy support (4 Shellcrackers)
		{ type: "shellcracker", faction: "ura", x: 44, y: 112 },
		{ type: "shellcracker", faction: "ura", x: 56, y: 114 },
		{ type: "shellcracker", faction: "ura", x: 72, y: 114 },
		{ type: "shellcracker", faction: "ura", x: 84, y: 112 },

		// Sappers for wall breaching (3 Sappers)
		{ type: "sapper", faction: "ura", x: 50, y: 116 },
		{ type: "sapper", faction: "ura", x: 64, y: 118 },
		{ type: "sapper", faction: "ura", x: 78, y: 116 },

		// Mortar support (2 Mortar Otters)
		{ type: "mortar_otter", faction: "ura", x: 54, y: 110 },
		{ type: "mortar_otter", faction: "ura", x: 74, y: 110 },

		// Divers for scouting (2 Divers)
		{ type: "diver", faction: "ura", x: 46, y: 104 },
		{ type: "diver", faction: "ura", x: 82, y: 104 },

		// ── Enemies — Layer 1: Outer Compound ──
		// South wall gate guards
		{ type: "gator", faction: "scale_guard", x: 58, y: 62 },
		{ type: "gator", faction: "scale_guard", x: 68, y: 62 },
		{ type: "viper", faction: "scale_guard", x: 64, y: 64 },

		// Ravine ambush patrol
		{
			type: "gator",
			faction: "scale_guard",
			x: 52,
			y: 70,
			patrol: [
				[52, 70],
				[76, 70],
				[52, 70],
			],
		},
		{
			type: "gator",
			faction: "scale_guard",
			x: 56,
			y: 72,
			patrol: [
				[56, 72],
				[72, 72],
				[56, 72],
			],
		},

		// Outer compound — west wing
		{ type: "gator", faction: "scale_guard", x: 24, y: 48, count: 2 },
		{ type: "gator", faction: "scale_guard", x: 32, y: 52, count: 2 },
		{ type: "viper", faction: "scale_guard", x: 28, y: 50 },

		// Outer compound — east wing
		{ type: "gator", faction: "scale_guard", x: 96, y: 48, count: 2 },
		{ type: "gator", faction: "scale_guard", x: 88, y: 52, count: 2 },
		{ type: "viper", faction: "scale_guard", x: 92, y: 50 },

		// Outer perimeter Venom Spires
		{ type: "venom_spire", faction: "scale_guard", x: 28, y: 60 },
		{ type: "venom_spire", faction: "scale_guard", x: 100, y: 60 },

		// ── Enemies — Layer 2: Inner Courtyard ──
		// Mid wall gate guards
		{ type: "gator", faction: "scale_guard", x: 58, y: 42 },
		{ type: "gator", faction: "scale_guard", x: 68, y: 42 },

		// Courtyard garrison
		{ type: "viper", faction: "scale_guard", x: 36, y: 30, count: 2 },
		{ type: "viper", faction: "scale_guard", x: 88, y: 30, count: 2 },
		{ type: "snapper", faction: "scale_guard", x: 56, y: 32 },
		{ type: "snapper", faction: "scale_guard", x: 72, y: 32 },
		{ type: "gator", faction: "scale_guard", x: 44, y: 36, count: 2 },
		{ type: "gator", faction: "scale_guard", x: 80, y: 36, count: 2 },

		// Courtyard Venom Spires (flanking the north gate)
		{ type: "venom_spire", faction: "scale_guard", x: 32, y: 28 },
		{ type: "venom_spire", faction: "scale_guard", x: 92, y: 28 },

		// ── Enemies — Layer 3: Detention Block ──
		// North wall gate guards
		{ type: "gator", faction: "scale_guard", x: 58, y: 22 },
		{ type: "gator", faction: "scale_guard", x: 68, y: 22 },
		{ type: "viper", faction: "scale_guard", x: 64, y: 18 },

		// Detention block guards
		{ type: "gator", faction: "scale_guard", x: 60, y: 12 },
		{ type: "gator", faction: "scale_guard", x: 72, y: 12 },
		{ type: "gator", faction: "scale_guard", x: 80, y: 10 },
		{ type: "viper", faction: "scale_guard", x: 68, y: 14 },
		{ type: "snapper", faction: "scale_guard", x: 76, y: 10 },

		// Detention Venom Spire (guarding Fang's cell)
		{ type: "venom_spire", faction: "scale_guard", x: 64, y: 10 },
	],

	startResources: { fish: 0, timber: 0, salvage: 0 },
	startPopCap: 21,

	objectives: {
		primary: [
			objective("rescue-fang", "Rescue Sgt. Fang from the detention block"),
			objective("extract-south", "Extract all heroes to the southern extraction LZ"),
		],
		bonus: [
			objective("no-casualties", "Complete without losing any units"),
			objective("destroy-all-spires", "Destroy all 5 Venom Spires"),
		],
	},

	triggers: [
		// ────────────────────────────────────────────────────
		// PHASE 1: RAVINE APPROACH (0:00 - ~4:00)
		// ────────────────────────────────────────────────────
		trigger("phase:ravine:briefing", on.timer(3), [
			act.startPhase("ravine"),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Stronghold ahead, Captain. Three defensive layers: outer wall, inner courtyard, detention block. Sgt. Fang is in the deepest chamber.",
				},
				{
					speaker: "Col. Bubbles",
					text: "This is bigger than the Whiskers rescue. We've got the firepower this time — Shellcrackers, Mortar Otters, and Sappers for the walls.",
				},
			]),
		]),

		trigger("phase:ravine:plan", on.timer(15), [
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Send your Divers forward to scout the ravine. Sappers blow the gates, Mortars suppress the defenders, infantry pushes through. Three walls, three breaches.",
				},
				{
					speaker: "FOXHOUND",
					text: "Scale-Guard has Venom Spires covering each gate approach. Five total. Taking them down opens your lanes but draws attention.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Once we free Fang, they lock the place down. Every Scale-Guard in the Blackmarsh converges on this position. We fight our way back south to the extraction beach. In fast, out loud.",
				},
			]),
		]),

		trigger(
			"phase:ravine:entered",
			on.areaEntered("ura", "ravine_upper"),
			act.dialogue("foxhound", "Ravine narrows ahead. Watch for ambush patrols between the walls."),
		),

		// ────────────────────────────────────────────────────
		// PHASE 2: OUTER BREACH (~4:00 - ~7:00)
		// ────────────────────────────────────────────────────
		trigger("phase:outer:wall-approach", on.areaEntered("ura", "wall_south"), [
			act.startPhase("outer_breach"),
			act.dialogue(
				"sgt_bubbles",
				"Outer wall ahead. Sappers — plant charges on that gate. Everyone else, covering fire!",
			),
		]),

		trigger("phase:outer:compound-entered-w", on.areaEntered("ura", "outer_compound_w"), [
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "You're past the outer wall. Inner courtyard ahead — Vipers and Snappers are guarding the mid-gate. Two more walls to go.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Mortar Otters — set up behind the infantry. Suppress those courtyard defenders while the Sappers move up.",
				},
			]),
		]),

		trigger("phase:outer:compound-entered-e", on.areaEntered("ura", "outer_compound_e"), [
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "You're past the outer wall. Inner courtyard ahead — Vipers and Snappers are guarding the mid-gate. Two more walls to go.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Mortar Otters — set up behind the infantry. Suppress those courtyard defenders while the Sappers move up.",
				},
			]),
		]),

		// ────────────────────────────────────────────────────
		// PHASE 3: COURTYARD ASSAULT (~7:00 - ~10:00)
		// ────────────────────────────────────────────────────
		trigger("phase:courtyard:entered", on.areaEntered("ura", "inner_courtyard"), [
			act.startPhase("courtyard_assault"),
			act.dialogue(
				"foxhound",
				"Inside the courtyard. Detention block is through the north gate. Clear these guards and push through — this is the hardest room in the stronghold.",
			),
			// Reinforcement spawn on courtyard entry
			act.spawn("gator", "scale_guard", 48, 28, 2),
			act.spawn("gator", "scale_guard", 80, 28, 2),
		]),

		trigger(
			"phase:courtyard:spires-down",
			on.buildingCount("scale_guard", "venom_spire", "lte", 2),
			act.dialogue(
				"sgt_bubbles",
				"Courtyard Spires are down! North gate approach is clear. Sappers, move up!",
			),
		),

		// ────────────────────────────────────────────────────
		// PHASE 4: RESCUE (~10:00 - ~11:00)
		// ────────────────────────────────────────────────────
		trigger("phase:rescue:detention-reached", on.areaEntered("ura", "detention_block"), [
			act.startPhase("rescue"),
			act.completeObjective("rescue-fang"),
			act.spawn("sgt_fang", "ura", 76, 10, 1),
			act.exchange([
				{
					speaker: "Sgt. Fang",
					text: "Took your sweet time, Captain.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Fang, this is Bubbles. Can you fight?",
				},
				{
					speaker: "Sgt. Fang",
					text: "Can I fight? I've been breaking rocks with my bare hands for two weeks. Give me something to hit.",
				},
				{
					speaker: "Col. Bubbles",
					text: "You'll get your chance. They're about to lock this place down.",
				},
				{
					speaker: "Sgt. Fang",
					text: "Good. I know a shortcut through the west wing. Stay behind me — I'll put a hole in anything that moves.",
				},
			]),
			// Arm the fang-death trigger only after Fang is spawned
			act.enableTrigger("phase:retreat:fang-death"),
		]),

		// ────────────────────────────────────────────────────
		// PHASE 5: FIGHTING RETREAT (~11:00+)
		// ────────────────────────────────────────────────────

		// Lockdown — immediate reinforcement wave on rescue
		trigger("phase:retreat:lockdown", on.objectiveComplete("rescue-fang"), [
			act.startPhase("fighting_retreat"),
			act.dialogue(
				"foxhound",
				"Fang is free! Compound lockdown! Reinforcements flooding in from every direction! Fight your way to the southern extraction!",
			),
			// Wave 1: immediate compound reinforcements
			act.spawn("gator", "scale_guard", 20, 32, 4),
			act.spawn("gator", "scale_guard", 108, 32, 4),
			act.spawn("viper", "scale_guard", 64, 50, 3),
			// Wave 1: ravine blockers
			act.spawn("gator", "scale_guard", 44, 72, 3),
			act.spawn("gator", "scale_guard", 84, 72, 3),
			act.spawn("scout_lizard", "scale_guard", 52, 80, 2),
			act.spawn("scout_lizard", "scale_guard", 76, 80, 2),
			// Arm the timed reinforcement waves
			act.enableTrigger("phase:retreat:wave-2"),
			act.enableTrigger("phase:retreat:wave-3"),
		]),

		// Wave 2: +30s after lockdown (enabled by lockdown trigger)
		trigger(
			"phase:retreat:wave-2",
			on.timer(30),
			[
				act.dialogue(
					"sgt_bubbles",
					"More Scale-Guard coming in from the flanks! Keep moving — don't get bogged down!",
				),
				act.spawn("gator", "scale_guard", 8, 90, 4),
				act.spawn("snapper", "scale_guard", 120, 90, 3),
				act.spawn("viper", "scale_guard", 64, 64, 2),
			],
			{ enabled: false },
		),

		// Wave 3: +60s after lockdown (enabled by lockdown trigger)
		trigger(
			"phase:retreat:wave-3",
			on.timer(60),
			[
				act.dialogue("foxhound", "Third wave! They're pulling everything — this is it, Captain!"),
				act.spawn("gator", "scale_guard", 32, 56, 5),
				act.spawn("gator", "scale_guard", 96, 56, 5),
				act.spawn("viper", "scale_guard", 16, 80, 3),
				act.spawn("snapper", "scale_guard", 112, 80, 2),
			],
			{ enabled: false },
		),

		// Retreat progress dialogue
		trigger(
			"phase:retreat:halfway-out",
			on.areaEntered("ura", "ravine_lower"),
			act.dialogue(
				"sgt_fang",
				"Almost there! Ravine's ahead — keep moving, don't stop for anything!",
			),
		),

		// Extraction — both heroes must be in the LZ
		trigger(
			"phase:retreat:extraction-reached",
			on.areaEntered("ura", "extraction_lz", {
				unitType: "sgt_bubbles",
				minUnits: 1,
			}),
			[act.enableTrigger("phase:retreat:extraction-confirm")],
		),

		// Confirm extraction: Fang also in the LZ
		trigger(
			"phase:retreat:extraction-confirm",
			on.areaEntered("ura", "extraction_lz", {
				unitType: "sgt_fang",
				minUnits: 1,
			}),
			act.completeObjective("extract-south"),
			{ enabled: false },
		),

		// ────────────────────────────────────────────────────
		// HERO DEATH = MISSION FAILURE
		// ────────────────────────────────────────────────────
		trigger(
			"phase:retreat:bubbles-death",
			on.unitCount("ura", "sgt_bubbles", "eq", 0),
			act.failMission("Col. Bubbles has been killed. Mission failed."),
		),

		// Fang death only matters after rescue (enabled by detention trigger)
		trigger(
			"phase:retreat:fang-death",
			on.unitCount("ura", "sgt_fang", "eq", 0),
			act.failMission("Sgt. Fang has been killed during extraction. Mission failed."),
			{ enabled: false },
		),

		// ────────────────────────────────────────────────────
		// BONUS OBJECTIVES
		// ────────────────────────────────────────────────────
		trigger(
			"phase:bonus:all-spires-destroyed",
			on.buildingCount("scale_guard", "venom_spire", "eq", 0),
			[
				act.completeObjective("destroy-all-spires"),
				act.dialogue("foxhound", "All Venom Spires neutralized. Stronghold defenses are stripped."),
			],
		),

		// ────────────────────────────────────────────────────
		// MISSION COMPLETE
		// ────────────────────────────────────────────────────
		trigger("phase:victory:complete", on.allPrimaryComplete(), [
			act.exchange([
				{
					speaker: "Sgt. Fang",
					text: "Extraction confirmed. Sergeant Fang, reporting for duty.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Welcome back, Fang. The Captain got you out in one piece.",
				},
				{
					speaker: "Sgt. Fang",
					text: "I owe this squad a debt. Won't forget it.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "Chapter 3 complete. The Blackmarsh is liberated. Every Scale-Guard stronghold in the region has fallen. Outstanding work, Captain.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Fang's siege expertise is ours now. We'll need it — the Iron Delta is next. Rest your troops. HQ out.",
				},
			]),
			act.victory(),
		]),
	],

	unlocks: {
		heroes: ["sgt_fang"],
	},

	parTime: 840,

	difficulty: {
		support: {
			enemyDamageMultiplier: 0.7,
			enemyHpMultiplier: 0.75,
			resourceMultiplier: 1.0,
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
			enemyHpMultiplier: 1.25,
			resourceMultiplier: 1.0,
			xpMultiplier: 1.5,
		},
	},
};
