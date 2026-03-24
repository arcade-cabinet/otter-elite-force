// Mission 9: Fog of War — Recon / Exploration
//
// Dense fog blankets the Blackmarsh. Player must scout 4 intel markers
// before the fog lifts and Scale-Guard counterattacks.
// Teaches: fog weather, recon units, vision management.
// Win: Discover all 4 intel markers. Bonus: No unit losses.
// Par time: 8 min (480s).

import type { MissionDef } from "../../types";

export const mission09FogOfWar: MissionDef = {
	id: "mission-09-fog-of-war",
	chapter: 3,
	mission: 9,
	name: "Fog of War",
	subtitle: "Scout four intel markers through the Blackmarsh fog",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "The Blackmarsh is blanketed in thick fog. Perfect conditions for reconnaissance — and for ambushes. Scale-Guard has been moving troops through here, and we need eyes on their positions.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Four intel markers are scattered across the marsh. Each one is a Scale-Guard supply cache or staging point. Find all four and we'll have a complete picture of their northern front.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "You have scouts and a small strike team. The fog reduces vision to half range — use it to your advantage. Stay mobile, avoid large engagements.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "When the fog lifts at the 6-minute mark, they'll see you too. Get it done before that, Sergeant.",
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
		{ type: "scout_otter", faction: "ura", zone: "ura_start", count: 3 },
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
			{
				id: "discover-intel-nw",
				description: "Discover NW intel marker",
				type: "explore",
			},
			{
				id: "discover-intel-ne",
				description: "Discover NE intel marker",
				type: "explore",
			},
			{
				id: "discover-intel-center",
				description: "Discover central intel marker",
				type: "explore",
			},
			{
				id: "discover-intel-se",
				description: "Discover SE intel marker",
				type: "explore",
			},
		],
		bonus: [
			{
				id: "no-losses",
				description: "Complete without losing any units",
				type: "survive",
			},
		],
	},

	triggers: [
		{
			id: "mission-start",
			condition: "timer:3",
			action:
				"dialogue:gen_whiskers:Fog's thick. Vision is halved for everyone — use that. Your scouts have better sight range, so put them on point.",
			once: true,
		},
		{
			id: "intel-nw-found",
			condition: "area_entered:ura:intel_nw",
			action:
				"complete_objective:discover-intel-nw|dialogue:gen_whiskers:Northwest marker found — Scale-Guard supply cache. Three more to go.",
			once: true,
		},
		{
			id: "intel-ne-found",
			condition: "area_entered:ura:intel_ne",
			action:
				"complete_objective:discover-intel-ne|dialogue:gen_whiskers:Northeast marker located — that's a staging area. They're building up forces here.",
			once: true,
		},
		{
			id: "intel-center-found",
			condition: "area_entered:ura:intel_center",
			action:
				"complete_objective:discover-intel-center|dialogue:gen_whiskers:Central marker confirmed — communications relay. This is how they're coordinating.",
			once: true,
		},
		{
			id: "intel-se-found",
			condition: "area_entered:ura:intel_se",
			action:
				"complete_objective:discover-intel-se|dialogue:gen_whiskers:Southeast marker identified — ammunition depot. That completes the picture.",
			once: true,
		},
		{
			id: "fog-lifting-warning",
			condition: "timer:300",
			action:
				"dialogue:gen_whiskers:Fog's thinning. You have about a minute before full visibility. Finish your recon.",
			once: true,
		},
		{
			id: "fog-lifted-counterattack",
			condition: "timer:360",
			action:
				"dialogue:gen_whiskers:Fog's lifted — they can see you now! Scale-Guard is mobilizing!|spawn:gator:scale_guard:26:2:4|spawn:viper:scale_guard:2:20:3|spawn:scout_lizard:scale_guard:48:24:3",
			once: true,
		},
		{
			id: "mission-complete",
			condition: "all_primary_complete",
			action:
				"dialogue:gen_whiskers:All four intel markers recovered. We have a complete map of their northern positions. Outstanding recon, Sergeant.|victory",
			once: true,
		},
	],

	unlocks: {
		units: ["scout_otter"],
	},

	parTime: 480,

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
