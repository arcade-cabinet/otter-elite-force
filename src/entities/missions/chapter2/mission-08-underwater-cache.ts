// Mission 8: The Underwater Cache — Commando Rescue + Recovery
//
// Flooded ruins of an ancient otter settlement at the Copper-Silt delta.
// Cpl. Splash was captured during a solo recon dive and is held in a
// submerged Scale-Guard detention cage. OEF must infiltrate with a small
// commando squad, rescue Splash, recover a sealed munitions cache from an
// underwater vault, and extract under pursuit.
//
// Teaches: commando ops (no lodge), water specialists, hero escort, timed extraction.
// Win: Rescue Cpl. Splash AND recover the munitions cache.
// Lose: All units killed OR Cpl. Splash killed (after rescue).
// Par time: 16 min (960s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission08UnderwaterCache: MissionDef = {
	id: "mission_8",
	chapter: 2,
	mission: 4,
	name: "The Underwater Cache",
	subtitle: "Rescue Cpl. Splash and recover a submerged munitions cache",

	briefing: {
		portraitId: "foxhound",
		lines: [
			{
				speaker: "FOXHOUND",
				text: "Captain, Cpl. Splash was captured three days ago during a recon dive. He's being held in a flooded ruin complex ahead -- an old otter settlement, now mostly underwater.",
			},
			{
				speaker: "Col. Bubbles",
				text: "This is a commando operation. No lodge, no reinforcements. You have three Mudfoots for land combat, three Divers for the submerged zones, and a Raftsman for water transport.",
			},
			{
				speaker: "FOXHOUND",
				text: "The ruins are layered. Surface level is wade-depth -- your Mudfoots can handle it. But the deeper sections? Only Divers can operate down there. Splash is somewhere in the submerged detention block.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Rescue Splash, then recover a pre-war munitions cache from a sealed underwater vault. Get everyone out alive. HQ out.",
			},
		],
	},

	terrain: {
		width: 128,
		height: 128,
		regions: [
			{ terrainId: "grass", fill: true },

			// --- Insertion point (jungle clearing) ---
			{ terrainId: "dirt", rect: { x: 20, y: 104, w: 88, h: 8 } },
			{ terrainId: "mangrove", rect: { x: 8, y: 100, w: 16, h: 16 } },
			{ terrainId: "mangrove", rect: { x: 104, y: 100, w: 20, h: 12 } },

			// --- River south ---
			{
				terrainId: "water",
				river: {
					points: [
						[0, 122],
						[32, 120],
						[64, 124],
						[96, 120],
						[128, 122],
					],
					width: 8,
				},
			},

			// --- Approach trail (jungle path) ---
			{ terrainId: "dirt", rect: { x: 20, y: 86, w: 24, h: 12 } },
			{ terrainId: "mangrove", rect: { x: 8, y: 84, w: 12, h: 16 } },
			{ terrainId: "mangrove", rect: { x: 44, y: 88, w: 12, h: 8 } },

			// --- Marshland (shallow water + mangrove) ---
			{ terrainId: "shallow_water", rect: { x: 68, y: 86, w: 48, h: 12 } },
			{ terrainId: "mangrove", circle: { cx: 80, cy: 90, r: 6 } },
			{ terrainId: "mangrove", circle: { cx: 100, cy: 92, r: 5 } },
			{ terrainId: "mud", circle: { cx: 88, cy: 94, r: 4 } },

			// --- Ruin entrance (half-submerged stone) ---
			{ terrainId: "stone", rect: { x: 12, y: 70, w: 40, h: 12 } },
			{ terrainId: "shallow_water", rect: { x: 12, y: 76, w: 40, h: 6 } },

			// --- Ruin east (collapsed walls) ---
			{ terrainId: "stone", rect: { x: 68, y: 70, w: 44, h: 12 } },
			{ terrainId: "shallow_water", rect: { x: 76, y: 74, w: 32, h: 8 } },

			// --- Flooded corridor (wade-depth throughout) ---
			{ terrainId: "shallow_water", rect: { x: 0, y: 56, w: 128, h: 12 } },
			{ terrainId: "stone", rect: { x: 16, y: 58, w: 8, h: 8 } }, // ruined pillar
			{ terrainId: "stone", rect: { x: 56, y: 60, w: 8, h: 6 } }, // ruined arch
			{ terrainId: "stone", rect: { x: 96, y: 58, w: 8, h: 8 } }, // ruined wall

			// --- Underwater passage (fully submerged tunnel) ---
			{ terrainId: "deep_water", rect: { x: 12, y: 42, w: 32, h: 12 } },
			{ terrainId: "stone", rect: { x: 8, y: 40, w: 4, h: 16 } }, // tunnel wall
			{ terrainId: "stone", rect: { x: 44, y: 40, w: 4, h: 16 } }, // tunnel wall

			// --- Cache vault (submerged, sealed) ---
			{ terrainId: "deep_water", rect: { x: 60, y: 42, w: 40, h: 12 } },
			{ terrainId: "stone", rect: { x: 56, y: 40, w: 4, h: 16 } }, // vault wall
			{ terrainId: "stone", rect: { x: 100, y: 40, w: 4, h: 16 } }, // vault wall

			// --- Detention block (fully submerged) ---
			{ terrainId: "deep_water", rect: { x: 12, y: 22, w: 32, h: 16 } },
			{ terrainId: "stone", rect: { x: 8, y: 20, w: 4, h: 20 } }, // wall
			{ terrainId: "stone", rect: { x: 44, y: 20, w: 4, h: 20 } }, // wall

			// --- Submerged plaza (fully submerged) ---
			{ terrainId: "deep_water", rect: { x: 60, y: 22, w: 56, h: 16 } },
			{ terrainId: "stone", circle: { cx: 80, cy: 28, r: 4 } }, // collapsed statue
			{ terrainId: "stone", circle: { cx: 100, cy: 32, r: 3 } }, // debris pile

			// --- Deep ruins north (fully submerged) ---
			{ terrainId: "deep_water", rect: { x: 4, y: 2, w: 120, h: 16 } },
			{ terrainId: "stone", rect: { x: 24, y: 4, w: 8, h: 8 } }, // ancient arch
			{ terrainId: "stone", rect: { x: 64, y: 6, w: 12, h: 6 } }, // collapsed dome
			{ terrainId: "stone", rect: { x: 96, y: 4, w: 8, h: 8 } }, // ruined column
		],
		overrides: [],
	},

	zones: {
		insertion_point: { x: 16, y: 100, width: 96, height: 16 },
		river_south: { x: 0, y: 116, width: 128, height: 12 },
		approach_trail: { x: 8, y: 84, width: 48, height: 16 },
		marshland: { x: 64, y: 84, width: 56, height: 16 },
		ruin_entrance: { x: 8, y: 68, width: 48, height: 16 },
		ruin_east: { x: 64, y: 68, width: 52, height: 16 },
		flooded_corridor: { x: 0, y: 56, width: 128, height: 12 },
		underwater_passage: { x: 8, y: 40, width: 40, height: 16 },
		cache_vault: { x: 56, y: 40, width: 48, height: 16 },
		detention_block: { x: 8, y: 20, width: 40, height: 20 },
		submerged_plaza: { x: 56, y: 20, width: 64, height: 20 },
		deep_ruins_north: { x: 0, y: 0, width: 128, height: 20 },
	},

	placements: [
		// --- Player (insertion_point) --- NO LODGE ---
		// Mudfoots (land/shallow combat)
		{ type: "mudfoot", faction: "ura", x: 40, y: 106 },
		{ type: "mudfoot", faction: "ura", x: 44, y: 108 },
		{ type: "mudfoot", faction: "ura", x: 48, y: 106 },
		// Divers (underwater specialists)
		{ type: "diver", faction: "ura", x: 56, y: 108 },
		{ type: "diver", faction: "ura", x: 60, y: 106 },
		{ type: "diver", faction: "ura", x: 64, y: 108 },
		// Raftsman (water transport)
		{ type: "raftsman", faction: "ura", x: 72, y: 106 },

		// --- Resources (limited field salvage) ---
		// Ruin entrance rubble
		{ type: "salvage_cache", faction: "neutral", x: 20, y: 72 },
		{ type: "salvage_cache", faction: "neutral", x: 36, y: 74 },
		// Ruin east debris
		{ type: "salvage_cache", faction: "neutral", x: 76, y: 72 },
		{ type: "salvage_cache", faction: "neutral", x: 92, y: 70 },
		// Munitions cache (Phase 2 objective)
		{ type: "munitions_cache", faction: "neutral", x: 80, y: 48 },

		// --- Enemies ---

		// Approach trail (light patrol)
		{ type: "skink", faction: "scale_guard", x: 32, y: 88 },
		{ type: "skink", faction: "scale_guard", x: 40, y: 86 },

		// Marshland patrol
		{ type: "gator", faction: "scale_guard", x: 84, y: 88 },
		{ type: "skink", faction: "scale_guard", x: 96, y: 86 },

		// Ruin entrance checkpoint
		{ type: "gator", faction: "scale_guard", x: 24, y: 72 },
		{ type: "gator", faction: "scale_guard", x: 32, y: 74 },
		{ type: "gator", faction: "scale_guard", x: 40, y: 72 },
		{ type: "watchtower", faction: "scale_guard", x: 36, y: 68 },

		// Ruin east (alternate route guards)
		{ type: "gator", faction: "scale_guard", x: 76, y: 74 },
		{ type: "gator", faction: "scale_guard", x: 88, y: 72 },
		{ type: "viper", faction: "scale_guard", x: 100, y: 70 },

		// Flooded corridor (underwater patrol)
		{ type: "gator", faction: "scale_guard", x: 28, y: 60 },
		{ type: "gator", faction: "scale_guard", x: 64, y: 62 },
		{ type: "skink", faction: "scale_guard", x: 100, y: 58 },

		// Submerged plaza (cage drones + guards)
		{ type: "cage_drone", faction: "scale_guard", x: 72, y: 28 },
		{ type: "cage_drone", faction: "scale_guard", x: 92, y: 30 },
		{ type: "gator", faction: "scale_guard", x: 80, y: 24 },
		{ type: "gator", faction: "scale_guard", x: 96, y: 26 },
		{ type: "viper", faction: "scale_guard", x: 88, y: 22 },

		// Detention block (Splash's prison)
		{ type: "detention_cage", faction: "scale_guard", x: 28, y: 28 },
		{ type: "gator", faction: "scale_guard", x: 20, y: 26 },
		{ type: "gator", faction: "scale_guard", x: 36, y: 26 },
		{ type: "gator", faction: "scale_guard", x: 28, y: 34 },

		// Deep ruins north (patrolling heavies)
		{ type: "gator", faction: "scale_guard", x: 32, y: 8 },
		{ type: "gator", faction: "scale_guard", x: 56, y: 10 },
		{ type: "croc_champion", faction: "scale_guard", x: 80, y: 8 },
		{ type: "viper", faction: "scale_guard", x: 108, y: 6 },
	],

	startResources: { fish: 0, timber: 0, salvage: 0 },
	startPopCap: 8,

	objectives: {
		primary: [
			objective("rescue-splash", "Locate and rescue Cpl. Splash"),
			objective("recover-cache", "Recover the munitions cache from the underwater vault"),
			objective("extract-splash", "Get Cpl. Splash to the extraction point"),
		],
		bonus: [
			objective("bonus-no-casualties", "Complete without losing any units"),
			objective("bonus-plaza-cleared", "Clear all enemies from the submerged plaza"),
		],
	},

	triggers: [
		// =====================================================================
		// PHASE 1: INFILTRATION
		// =====================================================================

		// [0:05] FOXHOUND briefing
		trigger(
			"phase:infiltration:foxhound-briefing",
			on.timer(5),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Captain, Cpl. Splash was captured three days ago during a recon dive. He's being held in a flooded ruin complex ahead -- an old otter settlement, now mostly underwater.",
				},
				{
					speaker: "Col. Bubbles",
					text: "This is a commando operation. No lodge, no reinforcements. You have three Mudfoots for land combat, three Divers for the submerged zones, and a Raftsman for water transport.",
				},
				{
					speaker: "FOXHOUND",
					text: "The ruins are layered. Surface level is wade-depth -- your Mudfoots can handle it. But the deeper sections? Only Divers can operate down there. Splash is somewhere in the submerged detention block.",
				},
			]),
		),

		// [0:25] Route options
		trigger(
			"phase:infiltration:foxhound-routes",
			on.timer(25),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Two approaches to the ruins. Direct path through the jungle trail hits a Scale-Guard checkpoint at the main entrance -- a Watchtower and three Gators.",
				},
				{
					speaker: "FOXHOUND",
					text: "Or you can loop through the marshland to the east. Softer defenses but the terrain is slow -- shallow water and mangrove. Your Divers can move faster through it than Mudfoots.",
				},
			]),
		),

		// Approach trail entry
		trigger(
			"phase:infiltration:approach-trail-entry",
			on.areaEntered("ura", "approach_trail"),
			act.dialogue(
				"foxhound",
				"Approach trail. Scale-Guard scouts ahead -- two Skinks. Eliminate them quietly before they raise an alarm.",
			),
		),

		// Marshland entry
		trigger(
			"phase:infiltration:marshland-entry",
			on.areaEntered("ura", "marshland"),
			act.dialogue(
				"foxhound",
				"Marshland approach. Gator patrol and a Skink scout in the shallows. Your Divers can slip past submerged if you don't want a fight.",
			),
		),

		// Ruin entrance approach
		trigger(
			"phase:infiltration:ruin-entrance-approach",
			on.areaEntered("ura", "ruin_entrance"),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Ruin entrance. Scale-Guard checkpoint -- watchtower and Gator guards. This is the front door.",
				},
				{
					speaker: "Col. Bubbles",
					text: "You can fight through or find another way in. The eastern ruins have a collapsed wall gap.",
				},
			]),
		),

		// Ruin east approach
		trigger(
			"phase:infiltration:ruin-east-approach",
			on.areaEntered("ura", "ruin_east"),
			act.dialogue(
				"foxhound",
				"Eastern ruins. Collapsed wall section gives access to the flooded interior. Gators and a Viper on guard -- fewer than the front gate, but that Viper hits hard.",
			),
		),

		// Flooded corridor entry
		trigger(
			"phase:infiltration:flooded-corridor-entry",
			on.areaEntered("ura", "flooded_corridor"),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "You're in the flooded corridor. Wade-depth here -- Mudfoots can still fight but movement is slowed. Gators patrolling ahead.",
				},
				{
					speaker: "Col. Bubbles",
					text: "The detention block is northwest, deeper down. Send your Divers ahead to scout -- they move faster in water and they're invisible while submerged.",
				},
			]),
		),

		// Detention block entry (Divers)
		trigger(
			"phase:infiltration:detention-block-entry",
			on.areaEntered("ura", "detention_block", { unitType: "diver" }),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Detention block located. Splash's cage is at the center -- three Gator guards, fully submerged zone.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Clear those guards and break the cage. Only Divers can fight down here.",
				},
			]),
		),

		// Detention block entry (Mudfoots -- warning)
		trigger(
			"phase:infiltration:detention-block-no-diver",
			on.areaEntered("ura", "detention_block", { unitType: "mudfoot" }),
			act.dialogue(
				"foxhound",
				"Captain, Mudfoots can't operate at this depth. Pull them back -- you need Divers for this zone.",
			),
		),

		// Splash rescued (detention cage destroyed)
		trigger(
			"phase:infiltration:splash-rescued",
			on.buildingCount("scale_guard", "detention_cage", "eq", 0),
			[
				act.completeObjective("rescue-splash"),
				act.spawn("cpl_splash", "ura", 28, 28, 1),
				act.exchange([
					{
						speaker: "Cpl. Splash",
						text: "Captain! I knew OEF wouldn't leave me down here. Those Scale-Guard don't know the first thing about underwater ops -- they just know how to lock cages.",
					},
					{
						speaker: "Col. Bubbles",
						text: "Good to hear your voice, Splash. But we're not done -- FOXHOUND has a secondary objective.",
					},
					{
						speaker: "FOXHOUND",
						text: "Captain, our original intel was right. There's a munitions cache sealed in an underwater vault southeast of Splash's position. Pre-war OEF stockpile. We need it.",
					},
				]),
				act.revealZone("cache_vault"),
				act.revealZone("underwater_passage"),
				act.startPhase("cache-recovery"),
				act.enableTrigger("phase:cache-recovery:briefing"),
				act.enableTrigger("phase:cache-recovery:splash-ability-hint"),
				act.enableTrigger("phase:cache-recovery:underwater-passage-entry"),
				act.enableTrigger("phase:cache-recovery:underwater-passage-blocked"),
				act.enableTrigger("phase:cache-recovery:cache-vault-entry"),
				act.enableTrigger("phase:cache-recovery:cache-vault-no-splash"),
				act.enableTrigger("phase:cache-recovery:cache-recovered"),
			],
		),

		// Keep your squad alive (informational -- fail if all units dead)
		trigger(
			"phase:infiltration:all-units-killed",
			on.unitCount("ura", "mudfoot", "eq", 0),
			act.failMission("All units killed -- mission failed"),
			{ once: true },
		),

		// =====================================================================
		// PHASE 2: CACHE RECOVERY (enabled by splash-rescued)
		// =====================================================================

		// Phase 2 briefing
		trigger(
			"phase:cache-recovery:briefing",
			on.timer(1),
			act.exchange([
				{
					speaker: "Cpl. Splash",
					text: "The vault? I saw it during my recon dive before they nabbed me. Southeast, through the underwater passage. The passage is tight -- Divers only.",
				},
				{
					speaker: "FOXHOUND",
					text: "Splash's enhanced sonar can reveal the vault seal. He has to be part of the dive team that enters the vault.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Send Splash and your Divers through the underwater passage. Mudfoots hold the corridor against counterattack.",
				},
			]),
			{ enabled: false },
		),

		// Splash ability hint (10s after rescue)
		trigger(
			"phase:cache-recovery:splash-ability-hint",
			on.timer(10),
			act.dialogue(
				"foxhound",
				"Captain, Splash has a passive reveal ability -- he can detect submerged objects and hidden passages that your other Divers can't see. Keep him close to the dive team.",
			),
			{ enabled: false },
		),

		// Underwater passage entry (Divers)
		trigger(
			"phase:cache-recovery:underwater-passage-entry",
			on.areaEntered("ura", "underwater_passage", { unitType: "diver" }),
			act.dialogue(
				"foxhound",
				"Underwater passage. Tight and dark -- but no enemy patrols inside. Move through to the vault.",
			),
			{ enabled: false },
		),

		// Underwater passage blocked (Mudfoots)
		trigger(
			"phase:cache-recovery:underwater-passage-blocked",
			on.areaEntered("ura", "underwater_passage", { unitType: "mudfoot" }),
			act.dialogue(
				"foxhound",
				"Fully submerged passage, Captain. Divers only. Mudfoots will drown in there.",
			),
			{ enabled: false },
		),

		// Cache vault entry (Splash required)
		trigger(
			"phase:cache-recovery:cache-vault-entry",
			on.areaEntered("ura", "cache_vault", { unitType: "cpl_splash" }),
			act.exchange([
				{
					speaker: "Cpl. Splash",
					text: "There's the vault seal. Give me a moment... got it. Old OEF cipher lock -- still works.",
				},
				{
					speaker: "FOXHOUND",
					text: "Vault is open. The munitions cache is inside. Splash, grab it.",
				},
			]),
			{ enabled: false },
		),

		// Cache vault without Splash (warning)
		trigger(
			"phase:cache-recovery:cache-vault-no-splash",
			on.areaEntered("ura", "cache_vault"),
			act.dialogue(
				"foxhound",
				"Captain, the vault seal requires Splash's sonar to open. He needs to be here personally.",
			),
			{ enabled: false },
		),

		// Cache recovered (Splash interacts with munitions_cache)
		trigger(
			"phase:cache-recovery:cache-recovered",
			on.areaEntered("ura", "cache_vault", { unitType: "cpl_splash" }),
			[
				act.completeObjective("recover-cache"),
				act.addObjective("extract-splash", "Get Cpl. Splash to the extraction point", "primary"),
				act.exchange([
					{
						speaker: "Cpl. Splash",
						text: "Cache secured! Full crate of pre-war munitions. Heavy, but I can carry it. Let's move.",
					},
					{
						speaker: "Col. Bubbles",
						text: "Outstanding. Now get everyone to the extraction point -- south bank, near where you inserted. Move fast.",
					},
					{
						speaker: "FOXHOUND",
						text: "Be advised -- Scale-Guard knows something's wrong. Reinforcements entering the ruins from the north.",
					},
				]),
				// Reinforcements from north
				act.spawn("gator", "scale_guard", 20, 4, 3),
				act.spawn("gator", "scale_guard", 60, 6, 2),
				act.spawn("viper", "scale_guard", 40, 8, 1),
				act.spawn("croc_champion", "scale_guard", 80, 4, 1),
				act.startPhase("extraction"),
				act.enableTrigger("phase:extraction:briefing"),
				act.enableTrigger("phase:extraction:flooded-corridor-return"),
				act.enableTrigger("phase:extraction:second-reinforcement"),
				act.enableTrigger("phase:extraction:third-reinforcement"),
				act.enableTrigger("phase:extraction:ruin-exit"),
				act.enableTrigger("phase:extraction:splash-extracted"),
			],
			{ enabled: false },
		),

		// Splash killed after rescue (fail condition)
		trigger(
			"phase:cache-recovery:splash-death",
			on.unitCount("ura", "cpl_splash", "eq", 0),
			act.failMission("Cpl. Splash was killed -- mission failed"),
			{ enabled: false },
		),

		// =====================================================================
		// PHASE 3: EXTRACTION (enabled by cache-recovered)
		// =====================================================================

		// Phase 3 briefing
		trigger(
			"phase:extraction:briefing",
			on.timer(1),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Enemy reinforcements in the deep ruins -- a Croc Champion leading Gators and a Viper. They're pushing south through the submerged plaza.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Splash is weighed down with that cache. He can still swim but he's slower. Cover him. Get to the extraction point.",
				},
			]),
			{ enabled: false },
		),

		// Flooded corridor return
		trigger(
			"phase:extraction:flooded-corridor-return",
			on.areaEntered("ura", "flooded_corridor", { unitType: "cpl_splash" }),
			act.dialogue(
				"foxhound",
				"Splash is in the flooded corridor. Hostiles may still be in the area -- clear a path.",
			),
			{ enabled: false },
		),

		// Second reinforcement wave (60s after cache recovery)
		trigger(
			"phase:extraction:second-reinforcement",
			on.timer(60),
			[
				act.spawn("gator", "scale_guard", 100, 10, 3),
				act.spawn("skink", "scale_guard", 112, 8, 2),
				act.dialogue(
					"foxhound",
					"More Scale-Guard from the north! They're flooding the ruins. Keep moving, Captain.",
				),
			],
			{ enabled: false },
		),

		// Third reinforcement wave (120s after cache recovery)
		trigger(
			"phase:extraction:third-reinforcement",
			on.timer(120),
			[
				act.spawn("gator", "scale_guard", 48, 6, 2),
				act.spawn("croc_champion", "scale_guard", 32, 4, 1),
				act.dialogue("foxhound", "They're coming hard now! Almost there -- push through!"),
			],
			{ enabled: false },
		),

		// Ruin exit (Splash reaches approach trail or marshland)
		trigger(
			"phase:extraction:ruin-exit",
			on.areaEntered("ura", "approach_trail", { unitType: "cpl_splash" }),
			act.dialogue(
				"foxhound",
				"Splash is clear of the ruins. Extraction point ahead -- just a short run south.",
			),
			{ enabled: false },
		),

		// Splash reaches extraction point
		trigger(
			"phase:extraction:splash-extracted",
			on.areaEntered("ura", "insertion_point", { unitType: "cpl_splash" }),
			act.completeObjective("extract-splash"),
			{ enabled: false },
		),

		// =====================================================================
		// BONUS OBJECTIVES
		// =====================================================================

		// No casualties bonus
		trigger(
			"phase:extraction:bonus-no-casualties",
			on.allPrimaryComplete(),
			act.dialogue(
				"foxhound",
				"Not a single operative lost. In a commando mission through flooded enemy territory. That's the kind of precision that wins wars, Captain.",
			),
		),

		// Submerged plaza cleared bonus
		trigger(
			"phase:infiltration:bonus-plaza-cleared",
			on.unitCount("scale_guard", "cage_drone", "eq", 0),
			[
				act.completeObjective("bonus-plaza-cleared"),
				act.dialogue(
					"foxhound",
					"Submerged plaza cleared. That opens a faster route for future operations in this area. Additional salvage recovered from the debris.",
				),
			],
		),

		// =====================================================================
		// MISSION COMPLETE / FAIL
		// =====================================================================

		// Victory
		trigger("phase:extraction:mission-complete", on.allPrimaryComplete(), [
			act.exchange([
				{
					speaker: "Cpl. Splash",
					text: "We made it, Captain. Cache intact, all fingers and toes accounted for. Those ruins were something -- I want to go back when there aren't Scale-Guard trying to kill me.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Splash is safe and we've recovered a full pre-war munitions stockpile. That's a mission and a half, Captain.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "Corporal Splash is one of our best. And those munitions will arm the next phase of the campaign. Deep Operations complete, Captain -- you've proven this force can operate anywhere: land, river, and underwater. Outstanding. HQ out.",
				},
			]),
			act.victory(),
		]),
	],

	unlocks: {
		heroes: ["cpl_splash"],
	},

	parTime: 960,

	difficulty: {
		support: {
			enemyDamageMultiplier: 0.7,
			enemyHpMultiplier: 0.8,
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
			enemyDamageMultiplier: 1.5,
			enemyHpMultiplier: 1.3,
			resourceMultiplier: 1.0,
			xpMultiplier: 1.5,
		},
	},
};
