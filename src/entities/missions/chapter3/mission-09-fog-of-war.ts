// Mission 9: Fog of War — Recon / Exploration
//
// Dense fog blankets the Blackmarsh. Player must scout 4 intel markers
// before the fog lifts and Scale-Guard counterattacks.
// Teaches: fog weather, recon units, vision management.
// Win: Discover all 4 intel markers. Bonus: No unit losses.
// Par time: 8 min (480s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission09FogOfWar: MissionDef = {
	id: "mission_9",
	chapter: 3,
	mission: 1,
	name: "Dense Canopy",
	subtitle: "Scout four intel markers through the Blackmarsh fog",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "The Blackmarsh is blanketed in thick fog. Scale-Guard has been moving troops through here — we need eyes on four intel markers scattered across the marsh.",
			},
			{
				speaker: "Sgt. Bubbles",
				text: "Fog cuts both ways. What's our visibility?",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Half range for everyone. Your Divers have better sight, so put them on point. Stay mobile — avoid prolonged engagements.",
			},
			{
				speaker: "Sgt. Bubbles",
				text: "And if the fog lifts while we're out there?",
			},
			{
				speaker: "Gen. Whiskers",
				text: "That's the problem. Six minutes, then it clears and every Scale-Guard patrol sees you. Word is Venom has snipers in the area. Get the intel before that happens.",
			},
			{
				speaker: "Sgt. Bubbles",
				text: "Four markers, six minutes. We'll split into pairs and sweep wide. Bubbles out.",
			},
		],
	},

	terrain: {
		width: 52,
		height: 44,
		regions: [
			{ terrainId: "grass", fill: true },
			// Marshland patches
			{ terrainId: "mud", rect: { x: 10, y: 8, w: 12, h: 10 } },
			{ terrainId: "mud", rect: { x: 30, y: 20, w: 14, h: 10 } },
			{ terrainId: "mud", rect: { x: 6, y: 30, w: 10, h: 8 } },
			// Waterlogged areas
			{ terrainId: "water", circle: { cx: 16, cy: 12, r: 4 } },
			{ terrainId: "water", circle: { cx: 36, cy: 28, r: 3 } },
			// Mangrove concealment corridors
			{ terrainId: "mangrove", rect: { x: 0, y: 16, w: 8, h: 12 } },
			{ terrainId: "mangrove", rect: { x: 24, y: 0, w: 6, h: 10 } },
			{ terrainId: "mangrove", rect: { x: 42, y: 12, w: 10, h: 8 } },
			{ terrainId: "mangrove", rect: { x: 20, y: 34, w: 12, h: 8 } },
			// Player base area (south)
			{ terrainId: "dirt", rect: { x: 20, y: 38, w: 12, h: 6 } },
		],
		overrides: [],
	},

	zones: {
		ura_start: { x: 20, y: 38, width: 12, height: 6 },
		intel_nw: { x: 4, y: 4, width: 6, height: 6 },
		intel_ne: { x: 42, y: 4, width: 8, height: 6 },
		intel_center: { x: 22, y: 16, width: 8, height: 6 },
		intel_se: { x: 38, y: 32, width: 8, height: 6 },
	},

	placements: [
		// Player units
		{ type: "mudfoot", faction: "ura", zone: "ura_start", count: 4 },
		{ type: "diver", faction: "ura", zone: "ura_start", count: 3 },
		{ type: "shellcracker", faction: "ura", zone: "ura_start", count: 2 },

		// Intel markers
		{ type: "intel_marker", faction: "neutral", x: 7, y: 6 },
		{ type: "intel_marker", faction: "neutral", x: 45, y: 6 },
		{ type: "intel_marker", faction: "neutral", x: 26, y: 18 },
		{ type: "intel_marker", faction: "neutral", x: 42, y: 34 },

		// Scattered enemy patrols (hidden in fog)
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 12,
			y: 10,
			patrol: [
				[12, 10],
				[20, 10],
				[12, 10],
			],
		},
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 36,
			y: 14,
			patrol: [
				[36, 14],
				[44, 14],
				[36, 14],
			],
		},
		{ type: "gator", faction: "scale_guard", x: 8, y: 6, count: 2 },
		{ type: "gator", faction: "scale_guard", x: 44, y: 5, count: 2 },
		{ type: "viper", faction: "scale_guard", x: 24, y: 18 },
		{ type: "gator", faction: "scale_guard", x: 40, y: 34, count: 2 },
		{ type: "snapper", faction: "scale_guard", x: 28, y: 20 },
	],

	startResources: { fish: 0, timber: 0, salvage: 0 },
	startPopCap: 10,

	weather: {
		pattern: [
			{ type: "fog", startTime: 0, duration: 360 },
			{ type: "clear", startTime: 360, duration: 120 },
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
		trigger(
			"mission-start",
			on.timer(3),
			act.dialogue(
				"gen_whiskers",
				"Fog's thick. Vision is halved for everyone — use that. Your scouts have better sight range, so put them on point.",
			),
		),
		trigger("intel-nw-found", on.areaEntered("ura", "intel_nw"), [
			act.completeObjective("discover-intel-nw"),
			act.dialogue(
				"gen_whiskers",
				"Northwest marker found — Scale-Guard supply cache. Three more to go.",
			),
		]),
		trigger("intel-ne-found", on.areaEntered("ura", "intel_ne"), [
			act.completeObjective("discover-intel-ne"),
			act.dialogue(
				"gen_whiskers",
				"Northeast marker located — that's a staging area. They're building up forces here.",
			),
		]),
		trigger("intel-center-found", on.areaEntered("ura", "intel_center"), [
			act.completeObjective("discover-intel-center"),
			act.dialogue(
				"gen_whiskers",
				"Central marker confirmed — communications relay. This is how they're coordinating.",
			),
		]),
		trigger("intel-se-found", on.areaEntered("ura", "intel_se"), [
			act.completeObjective("discover-intel-se"),
			act.dialogue(
				"gen_whiskers",
				"Southeast marker identified — ammunition depot. That completes the picture.",
			),
		]),
		trigger(
			"fog-lifting-warning",
			on.timer(300),
			act.dialogue(
				"gen_whiskers",
				"Fog's thinning. You have about a minute before full visibility. Finish your recon.",
			),
		),
		trigger("fog-lifted-counterattack", on.timer(360), [
			act.dialogue(
				"gen_whiskers",
				"Fog's lifted — they can see you now! Scale-Guard is mobilizing!",
			),
			act.spawn("gator", "scale_guard", 26, 2, 4),
			act.spawn("viper", "scale_guard", 2, 20, 3),
			act.spawn("scout_lizard", "scale_guard", 48, 24, 3),
		]),
		trigger("mission-complete", on.allPrimaryComplete(), [
			act.dialogue(
				"gen_whiskers",
				"All four intel markers recovered. We have a complete map of their northern positions. Outstanding recon, Sergeant.",
			),
			act.victory(),
		]),
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
