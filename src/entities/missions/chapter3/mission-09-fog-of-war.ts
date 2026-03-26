// Mission 9 (3-1): DENSE CANOPY — Fog Recon
//
// Deep Blackmarsh interior. Dense mangrove canopy blocks aerial observation.
// Thick fog blankets the marsh floor. Waterlogged terrain forces narrow paths
// between mud flats and flooded gullies. Scale-Guard patrols move through the
// haze on fixed routes.
//
// Win:  Discover all 4 intel markers.
// Lose: All units killed (commando rules -- no lodge).
// Par:  12 min (720s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission09FogOfWar: MissionDef = {
	id: "mission_9",
	chapter: 3,
	mission: 1,
	name: "Dense Canopy",
	subtitle: "Scout four intel markers through the Blackmarsh fog",

	briefing: {
		portraitId: "foxhound",
		lines: [
			{
				speaker: "Col. Bubbles",
				text: "Captain, four intel markers scattered across the Blackmarsh. Scale-Guard patrols are moving through the fog on fixed routes.",
			},
			{
				speaker: "FOXHOUND",
				text: "Fog only clears permanently around discovered markers. Elsewhere, you're blind again the moment you leave. Split your forces \u2014 Divers forward, combat units trailing.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Avoid engagements where possible. You don't have reinforcements out here.",
			},
			{
				speaker: "FOXHOUND",
				text: "Vision is halved for everyone. Your Divers retain better sight range \u2014 put them on point.",
			},
		],
	},

	// -- 128x128 map ---------------------------------------------------------

	terrain: {
		width: 128,
		height: 128,
		regions: [
			{ terrainId: "grass", fill: true },

			// Dense mangrove canopy -- NW quadrant
			{ terrainId: "mangrove", rect: { x: 0, y: 0, w: 60, h: 24 } },
			{ terrainId: "mangrove", rect: { x: 68, y: 0, w: 60, h: 20 } },

			// Flooded gullies (impassable water channels)
			{
				terrainId: "water",
				river: {
					points: [
						[0, 36],
						[20, 34],
						[40, 38],
						[60, 35],
						[80, 32],
						[100, 36],
						[128, 34],
					],
					width: 4,
				},
			},
			{
				terrainId: "water",
				river: {
					points: [
						[0, 56],
						[16, 54],
						[32, 58],
						[48, 52],
						[64, 56],
						[80, 54],
						[96, 58],
						[128, 56],
					],
					width: 3,
				},
			},

			// Waterlogged pools
			{ terrainId: "water", circle: { cx: 20, cy: 10, r: 6 } },
			{ terrainId: "water", circle: { cx: 100, cy: 12, r: 5 } },
			{ terrainId: "water", circle: { cx: 50, cy: 50, r: 4 } },
			{ terrainId: "water", circle: { cx: 90, cy: 60, r: 3 } },

			// Mud flats (slow movement)
			{ terrainId: "mud", rect: { x: 0, y: 24, w: 64, h: 24 } },
			{ terrainId: "mud", rect: { x: 0, y: 64, w: 64, h: 16 } },
			{ terrainId: "mud", circle: { cx: 32, cy: 80, r: 8 } },
			{ terrainId: "mud", circle: { cx: 96, cy: 40, r: 6 } },
			{ terrainId: "mud", circle: { cx: 40, cy: 100, r: 5 } },

			// Mangrove corridors (concealment routes)
			{ terrainId: "mangrove", rect: { x: 0, y: 48, w: 12, h: 20 } },
			{ terrainId: "mangrove", rect: { x: 64, y: 48, w: 60, h: 16 } },
			{ terrainId: "mangrove", rect: { x: 56, y: 24, w: 8, h: 48 } },
			{ terrainId: "mangrove", circle: { cx: 110, cy: 30, r: 8 } },

			// Central clearing (patrol hub -- exposed)
			{ terrainId: "dirt", rect: { x: 72, y: 28, w: 24, h: 16 } },

			// Ruined outpost (SE intel location)
			{ terrainId: "dirt", rect: { x: 78, y: 66, w: 16, h: 12 } },

			// Staging area
			{ terrainId: "dirt", rect: { x: 32, y: 112, w: 64, h: 16 } },

			// Jungle buffer (light cover transition)
			{ terrainId: "mangrove", rect: { x: 8, y: 80, w: 20, h: 12 } },
			{ terrainId: "mangrove", rect: { x: 100, y: 84, w: 20, h: 8 } },

			// Narrow passable land bridges over gullies
			{ terrainId: "dirt", rect: { x: 28, y: 34, w: 4, h: 8 } },
			{ terrainId: "dirt", rect: { x: 76, y: 32, w: 4, h: 6 } },
			{ terrainId: "dirt", rect: { x: 44, y: 52, w: 4, h: 8 } },
			{ terrainId: "dirt", rect: { x: 112, y: 54, w: 4, h: 6 } },
		],
		overrides: [],
	},

	zones: {
		landing_zone: { x: 24, y: 112, width: 80, height: 16 },
		staging_area_w: { x: 8, y: 96, width: 48, height: 16 },
		staging_area_e: { x: 64, y: 96, width: 56, height: 16 },
		jungle_buffer: { x: 0, y: 80, width: 128, height: 16 },
		swamp_south: { x: 0, y: 64, width: 64, height: 16 },
		gully_south: { x: 0, y: 48, width: 64, height: 16 },
		marsh_east: { x: 64, y: 48, width: 64, height: 16 },
		deep_marsh_west: { x: 0, y: 24, width: 64, height: 24 },
		central_clearing: { x: 64, y: 24, width: 64, height: 24 },
		marsh_nw: { x: 0, y: 0, width: 64, height: 24 },
		marsh_ne: { x: 64, y: 0, width: 64, height: 24 },
		intel_nw: { x: 16, y: 6, width: 8, height: 8 },
		intel_ne: { x: 96, y: 8, width: 8, height: 8 },
		intel_center: { x: 88, y: 52, width: 8, height: 8 },
		intel_se: { x: 80, y: 68, width: 8, height: 8 },
	},

	placements: [
		// -- Player strike team (landing_zone) -- no lodge, commando rules ---
		{ type: "mudfoot", faction: "ura", x: 52, y: 118 },
		{ type: "mudfoot", faction: "ura", x: 56, y: 120 },
		{ type: "mudfoot", faction: "ura", x: 60, y: 118 },
		{ type: "mudfoot", faction: "ura", x: 64, y: 120 },
		{ type: "diver", faction: "ura", x: 48, y: 122 },
		{ type: "diver", faction: "ura", x: 58, y: 122 },
		{ type: "diver", faction: "ura", x: 68, y: 122 },
		{ type: "shellcracker", faction: "ura", x: 54, y: 124 },
		{ type: "shellcracker", faction: "ura", x: 62, y: 124 },

		// -- Intel markers ---------------------------------------------------
		{ type: "intel_marker", faction: "neutral", x: 20, y: 10 },
		{ type: "intel_marker", faction: "neutral", x: 100, y: 12 },
		{ type: "intel_marker", faction: "neutral", x: 92, y: 56 },
		{ type: "intel_marker", faction: "neutral", x: 84, y: 72 },

		// -- Enemies ---------------------------------------------------------

		// Patrol Route Alpha -- NW corridor (2 Scout Lizards, looping)
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 24,
			y: 18,
			patrol: [
				[24, 18],
				[40, 18],
				[40, 30],
				[24, 30],
				[24, 18],
			],
		},
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 28,
			y: 18,
			patrol: [
				[28, 18],
				[44, 18],
				[44, 30],
				[28, 30],
				[28, 18],
			],
		},

		// Patrol Route Bravo -- central clearing perimeter (3 Gators)
		{
			type: "gator",
			faction: "scale_guard",
			x: 76,
			y: 30,
			patrol: [
				[76, 30],
				[92, 30],
				[92, 42],
				[76, 42],
				[76, 30],
			],
		},
		{
			type: "gator",
			faction: "scale_guard",
			x: 80,
			y: 32,
			patrol: [
				[80, 32],
				[96, 32],
				[96, 40],
				[80, 40],
				[80, 32],
			],
		},
		{ type: "gator", faction: "scale_guard", x: 84, y: 34 },

		// Intel NW guards (2 Gators, stationary ambush)
		{ type: "gator", faction: "scale_guard", x: 18, y: 8 },
		{ type: "gator", faction: "scale_guard", x: 22, y: 12 },

		// Intel NE guards (2 Gators + 1 Viper)
		{ type: "gator", faction: "scale_guard", x: 98, y: 10 },
		{ type: "gator", faction: "scale_guard", x: 102, y: 14 },
		{ type: "viper", faction: "scale_guard", x: 96, y: 6 },

		// Patrol Route Charlie -- eastern marsh (2 Scout Lizards, wide sweep)
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 100,
			y: 48,
			patrol: [
				[100, 48],
				[120, 48],
				[120, 64],
				[100, 64],
				[100, 48],
			],
		},
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 104,
			y: 52,
			patrol: [
				[104, 52],
				[116, 52],
				[116, 60],
				[104, 60],
				[104, 52],
			],
		},

		// Intel Center guards (1 Viper + 1 Snapper in mangrove)
		{ type: "viper", faction: "scale_guard", x: 90, y: 54 },
		{ type: "snapper", faction: "scale_guard", x: 94, y: 58 },

		// Intel SE guards (ruined outpost -- 3 Gators + 1 Viper)
		{ type: "gator", faction: "scale_guard", x: 82, y: 70 },
		{ type: "gator", faction: "scale_guard", x: 86, y: 74 },
		{ type: "gator", faction: "scale_guard", x: 80, y: 68 },
		{ type: "viper", faction: "scale_guard", x: 88, y: 72 },

		// Deep marsh ambush (hidden in mud -- 2 Gators)
		{ type: "gator", faction: "scale_guard", x: 30, y: 40 },
		{ type: "gator", faction: "scale_guard", x: 36, y: 44 },

		// Southern gully watchers (1 Scout Lizard, patrolling)
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 20,
			y: 56,
			patrol: [
				[20, 56],
				[48, 56],
				[48, 60],
				[20, 60],
				[20, 56],
			],
		},
	],

	startResources: { fish: 0, timber: 0, salvage: 0 },
	startPopCap: 10,

	weather: {
		pattern: [
			{ type: "fog", startTime: 0, duration: 420 },
			{ type: "clear", startTime: 420, duration: 300 },
		],
	},

	objectives: {
		primary: [
			objective("discover-intel-nw", "Discover NW intel marker"),
			objective("discover-intel-ne", "Discover NE intel marker"),
			objective("discover-intel-center", "Discover central intel marker"),
			objective("discover-intel-se", "Discover SE intel marker"),
		],
		bonus: [objective("no-losses", "Complete without losing any units")],
	},

	triggers: [
		// =====================================================================
		// Phase 1: INTO THE FOG (0:00 - ~4:00)
		// =====================================================================

		trigger(
			"phase:into-the-fog:foxhound-briefing",
			on.timer(3),
			act.dialogue(
				"foxhound",
				"Fog's thick. Vision is halved for everyone \u2014 use that. Your Divers have better sight range, so put them on point.",
			),
		),

		trigger("phase:into-the-fog:bubbles-tactics", on.timer(20), [
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Captain, four intel markers scattered across the Blackmarsh. Scale-Guard patrols are moving through the fog on fixed routes.",
				},
				{
					speaker: "FOXHOUND",
					text: "Fog only clears permanently around discovered markers. Elsewhere, you're blind again the moment you leave. Split your forces \u2014 Divers forward, combat units trailing.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Avoid engagements where possible. You don't have reinforcements out here.",
				},
			]),
		]),

		// =====================================================================
		// Phase 2: DEEP RECON (~4:00 - ~8:00) -- intel discovery triggers
		// =====================================================================

		trigger("phase:deep-recon:intel-nw-found", on.areaEntered("ura", "intel_nw"), [
			act.completeObjective("discover-intel-nw"),
			act.revealZone("intel_nw"),
			act.dialogue(
				"foxhound",
				"Northwest marker found \u2014 Scale-Guard supply cache. Fog's clearing around the site. Three more to go.",
			),
		]),

		trigger("phase:deep-recon:intel-ne-found", on.areaEntered("ura", "intel_ne"), [
			act.completeObjective("discover-intel-ne"),
			act.revealZone("intel_ne"),
			act.dialogue(
				"foxhound",
				"Northeast marker located \u2014 that's a staging area. They're building up forces here. Fog lifting around the marker.",
			),
		]),

		trigger("phase:deep-recon:intel-center-found", on.areaEntered("ura", "intel_center"), [
			act.completeObjective("discover-intel-center"),
			act.revealZone("intel_center"),
			act.dialogue(
				"foxhound",
				"Central marker confirmed \u2014 communications relay. This is how they're coordinating patrols through the canopy.",
			),
		]),

		trigger("phase:deep-recon:intel-se-found", on.areaEntered("ura", "intel_se"), [
			act.completeObjective("discover-intel-se"),
			act.revealZone("intel_se"),
			act.dialogue(
				"foxhound",
				"Southeast marker identified \u2014 ammunition depot in the ruined outpost. That completes the picture.",
			),
		]),

		// Directional hint after 2 markers collected.
		// Fires when the second individual intel objective completes (whichever
		// pair finishes second). We chain off each discovery and gate behind the
		// "second-marker-hint" trigger being enabled by a separate enableTrigger.
		// Because we cannot express objectiveCount directly, we use a
		// pair-of-objectives approach: enable a hidden trigger when each
		// objective completes, and it fires once enough are done.

		// After second marker -- enable via individual intel triggers
		trigger(
			"phase:deep-recon:second-marker-hint",
			on.timer(1),
			act.dialogue(
				"foxhound",
				"Two markers down. Remaining signals are pinging deeper in. Stay sharp \u2014 patrols are tighter deeper in.",
			),
			{ once: true, enabled: false },
		),

		// After third marker -- warning from Bubbles
		trigger(
			"phase:deep-recon:third-marker-warning",
			on.timer(1),
			act.dialogue(
				"sgt_bubbles",
				"One marker left. Scale-Guard comms traffic is spiking \u2014 they know someone's in the marsh. Find it fast, Captain.",
			),
			{ once: true, enabled: false },
		),

		// =====================================================================
		// Phase 3: FOG LIFTS (6:00+ timer, or skipped if all found)
		// =====================================================================

		trigger(
			"phase:fog-lifts:fog-lifting-warning",
			on.timer(360),
			act.dialogue(
				"foxhound",
				"Fog's thinning. You have about a minute before full visibility. Finish your recon \u2014 they'll see you soon.",
			),
		),

		trigger("phase:fog-lifts:counterattack", on.timer(420), [
			act.dialogue(
				"foxhound",
				"Fog's lifted \u2014 they can see you now! Scale-Guard is mobilizing from all sectors!",
			),
			act.spawn("gator", "scale_guard", 64, 4, 4),
			act.spawn("viper", "scale_guard", 4, 40, 3),
			act.spawn("scout_lizard", "scale_guard", 120, 48, 3),
			act.spawn("gator", "scale_guard", 80, 80, 3),
		]),

		trigger("phase:fog-lifts:reinforcement-wave-2", on.timer(480), [
			act.dialogue(
				"sgt_bubbles",
				"More contacts inbound! Get those last markers, Captain \u2014 we can't hold this position!",
			),
			act.spawn("gator", "scale_guard", 32, 8, 3),
			act.spawn("snapper", "scale_guard", 110, 30, 2),
			act.spawn("viper", "scale_guard", 60, 60, 2),
		]),

		// =====================================================================
		// Phase 4: EXTRACTION -- all 4 markers discovered
		// =====================================================================

		trigger("phase:extraction:mission-complete", on.allPrimaryComplete(), [
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "All four intel markers recovered. We have a complete map of their Blackmarsh positions. Outstanding recon, Captain.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Good work. We know where their fuel, staging, comms, and ammo are. That's everything we need for the next push. HQ out.",
				},
			]),
			act.victory(),
		]),

		// =====================================================================
		// Bonus: no unit losses
		// =====================================================================

		trigger(
			"phase:extraction:no-losses",
			on.allPrimaryComplete(),
			act.completeObjective("no-losses"),
		),

		// =====================================================================
		// Fail condition: all URA units killed (commando rules)
		// =====================================================================

		trigger(
			"phase:into-the-fog:all-killed",
			on.unitCount("ura", "all", "eq", 0),
			act.failMission("All units lost in the Blackmarsh."),
			{ once: true },
		),
	],

	unlocks: {
		units: ["diver"],
	},

	parTime: 720,

	difficulty: {
		support: {
			enemyDamageMultiplier: 0.8,
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
			enemyDamageMultiplier: 1.3,
			enemyHpMultiplier: 1.3,
			resourceMultiplier: 1.0,
			xpMultiplier: 1.5,
		},
	},
};
