// Mission 16: Last Stand — Final Mission / Survival + Assault
//
// Scale-Guard's remaining forces launch a desperate all-out attack on the
// URA's main base, then the player must counterattack their last stronghold.
// Two phases: survive 10 waves, then destroy the final Scale-Guard base.
// Teaches: culmination of all mechanics, endgame.
// Win: Survive all waves AND destroy the Scale-Guard Command Post.
// Par time: 18 min (1080s).

import type { MissionDef } from "../../types";

export const mission16LastStand: MissionDef = {
	id: "mission_16",
	chapter: 4,
	mission: 4,
	name: "The Reckoning",
	subtitle: "Survive the final assault and crush Scale-Guard once and for all",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "This is it, Sergeant. Scale-Guard's remaining forces are massing for a final assault on our main base. They know they're finished — this is their last throw of the dice.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Phase one: survive. Ten waves of everything they've got — Gators, Vipers, Snappers, everything. Fortify your base and hold the line.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Phase two: counterattack. Once you've broken their assault, push north to their last Command Post. Destroy it and the war is over.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Every hero, every unit type, every trick you've learned — use it all. This is the final mission of the campaign. Make it count.",
			},
		],
	},

	terrain: {
		width: 64,
		height: 64,
		regions: [
			{ terrainId: "grass", fill: true },
			// Player base (south-center)
			{ terrainId: "dirt", rect: { x: 20, y: 46, w: 24, h: 18 } },
			// Central battlefield
			{ terrainId: "dirt", rect: { x: 16, y: 28, w: 32, h: 18 } },
			// Enemy base (north)
			{ terrainId: "dirt", rect: { x: 22, y: 2, w: 20, h: 14 } },
			// Approach corridors
			{ terrainId: "dirt", rect: { x: 30, y: 16, w: 4, h: 12 } },
			{ terrainId: "dirt", rect: { x: 8, y: 30, w: 8, h: 4 } },
			{ terrainId: "dirt", rect: { x: 48, y: 30, w: 8, h: 4 } },
			// River cutting through center
			{
				terrainId: "water",
				river: {
					points: [
						[0, 28],
						[16, 26],
						[48, 30],
						[64, 28],
					],
					width: 3,
				},
			},
			// Mud zones (chokepoints)
			{ terrainId: "mud", rect: { x: 0, y: 24, w: 16, h: 4 } },
			{ terrainId: "mud", rect: { x: 48, y: 28, w: 16, h: 4 } },
			// Mangrove flanking routes
			{ terrainId: "mangrove", rect: { x: 0, y: 36, w: 12, h: 10 } },
			{ terrainId: "mangrove", rect: { x: 52, y: 36, w: 12, h: 10 } },
			// Toxic sludge around enemy base
			{ terrainId: "toxic_sludge", rect: { x: 20, y: 0, w: 24, h: 2 } },
			{ terrainId: "toxic_sludge", rect: { x: 20, y: 16, w: 24, h: 2 } },
		],
		overrides: [
			// Central bridge
			{ x: 31, y: 26, terrainId: "bridge" },
			{ x: 31, y: 27, terrainId: "bridge" },
			{ x: 31, y: 28, terrainId: "bridge" },
			{ x: 32, y: 26, terrainId: "bridge" },
			{ x: 32, y: 27, terrainId: "bridge" },
			{ x: 32, y: 28, terrainId: "bridge" },
			// West bridge
			{ x: 10, y: 26, terrainId: "bridge" },
			{ x: 10, y: 27, terrainId: "bridge" },
			{ x: 10, y: 28, terrainId: "bridge" },
			// East bridge
			{ x: 52, y: 28, terrainId: "bridge" },
			{ x: 52, y: 29, terrainId: "bridge" },
			{ x: 52, y: 30, terrainId: "bridge" },
		],
	},

	zones: {
		ura_base: { x: 20, y: 46, width: 24, height: 18 },
		central_field: { x: 16, y: 28, width: 32, height: 18 },
		enemy_base: { x: 22, y: 2, width: 20, height: 14 },
		nw_spawn: { x: 0, y: 0, width: 6, height: 6 },
		ne_spawn: { x: 58, y: 0, width: 6, height: 6 },
		west_approach: { x: 0, y: 24, width: 16, height: 8 },
		east_approach: { x: 48, y: 24, width: 16, height: 8 },
		north_gate: { x: 28, y: 16, width: 8, height: 4 },
	},

	placements: [
		// All player heroes
		{ type: "sgt_bubbles", faction: "ura", x: 32, y: 52 },
		{ type: "cpl_splash", faction: "ura", x: 30, y: 52 },
		{ type: "sgt_fang", faction: "ura", x: 34, y: 52 },
		{ type: "gen_whiskers", faction: "ura", x: 32, y: 54 },

		// Full player army
		{ type: "mudfoot", faction: "ura", zone: "ura_base", count: 8 },
		{ type: "shellcracker", faction: "ura", zone: "ura_base", count: 6 },
		{ type: "sapper", faction: "ura", zone: "ura_base", count: 4 },
		{ type: "river_rat", faction: "ura", zone: "ura_base", count: 4 },
		{ type: "raftsman", faction: "ura", zone: "ura_base", count: 3 },
		{ type: "scout_otter", faction: "ura", zone: "ura_base", count: 2 },

		// Full player base
		{ type: "command_post", faction: "ura", x: 32, y: 56 },
		{ type: "barracks", faction: "ura", x: 26, y: 50 },
		{ type: "barracks", faction: "ura", x: 38, y: 50 },
		{ type: "armory", faction: "ura", x: 32, y: 48 },
		{ type: "dock", faction: "ura", x: 22, y: 46 },
		{ type: "watchtower", faction: "ura", x: 20, y: 48 },
		{ type: "watchtower", faction: "ura", x: 42, y: 48 },
		{ type: "watchtower", faction: "ura", x: 20, y: 58 },
		{ type: "watchtower", faction: "ura", x: 42, y: 58 },
		{ type: "burrow", faction: "ura", x: 24, y: 54 },
		{ type: "burrow", faction: "ura", x: 40, y: 54 },

		// Enemy base (north)
		{ type: "command_post", faction: "scale_guard", x: 32, y: 8 },
		{ type: "venom_spire", faction: "scale_guard", x: 24, y: 4 },
		{ type: "venom_spire", faction: "scale_guard", x: 40, y: 4 },
		{ type: "venom_spire", faction: "scale_guard", x: 24, y: 14 },
		{ type: "venom_spire", faction: "scale_guard", x: 40, y: 14 },

		// Enemy base garrison
		{ type: "gator", faction: "scale_guard", zone: "enemy_base", count: 8 },
		{ type: "viper", faction: "scale_guard", x: 28, y: 6, count: 4 },
		{ type: "snapper", faction: "scale_guard", x: 36, y: 6, count: 3 },

		// Resources
		{ type: "fish_spot", faction: "neutral", x: 8, y: 52 },
		{ type: "fish_spot", faction: "neutral", x: 56, y: 52 },
		{ type: "salvage_cache", faction: "neutral", x: 32, y: 60 },
		{ type: "salvage_cache", faction: "neutral", x: 20, y: 60 },
		{ type: "salvage_cache", faction: "neutral", x: 44, y: 60 },
	],

	startResources: { fish: 600, timber: 500, salvage: 350 },
	startPopCap: 35,

	weather: {
		pattern: [
			{ type: "clear", startTime: 0, duration: 300 },
			{ type: "rain", startTime: 300, duration: 180 },
			{ type: "storm", startTime: 480, duration: 180 },
			{ type: "clear", startTime: 660, duration: 180 },
			{ type: "rain", startTime: 840, duration: 120 },
			{ type: "clear", startTime: 960, duration: 300 },
		],
	},

	objectives: {
		primary: [
			{
				id: "survive-all-waves",
				description: "Survive all 10 assault waves",
				type: "survive",
			},
			{
				id: "destroy-enemy-cp",
				description: "Destroy the Scale-Guard Command Post",
				type: "destroy",
				target: "command_post",
				count: 1,
			},
		],
		bonus: [
			{
				id: "all-heroes-survive",
				description: "All heroes survive the campaign",
				type: "survive",
			},
		],
	},

	triggers: [
		{
			id: "mission-start",
			condition: "timer:3",
			action:
				"dialogue:gen_whiskers:All hands to battle stations. Ten waves incoming, then we counterattack. This is the final mission — everything we've fought for comes down to today.",
			once: true,
		},
		// Wave 1 (1:00)
		{
			id: "wave-1",
			condition: "timer:60",
			action:
				"dialogue:gen_whiskers:Wave 1 — scouts from the north!|spawn:scout_lizard:scale_guard:32:18:4|spawn:gator:scale_guard:30:18:3",
			once: true,
		},
		// Wave 2 (2:30)
		{
			id: "wave-2",
			condition: "timer:150",
			action:
				"dialogue:gen_whiskers:Wave 2 — west flank!|spawn:gator:scale_guard:2:26:4|spawn:scout_lizard:scale_guard:2:28:3",
			once: true,
		},
		// Wave 3 (4:00)
		{
			id: "wave-3",
			condition: "timer:240",
			action:
				"dialogue:gen_whiskers:Wave 3 — east and west pincer!|spawn:gator:scale_guard:2:26:3|spawn:gator:scale_guard:60:28:3|spawn:viper:scale_guard:2:28:2|spawn:viper:scale_guard:60:30:2",
			once: true,
		},
		// Wave 4 (5:30)
		{
			id: "wave-4",
			condition: "timer:330",
			action:
				"dialogue:gen_whiskers:Wave 4 — heavy column from the center!|spawn:gator:scale_guard:32:18:5|spawn:snapper:scale_guard:30:18:3|spawn:viper:scale_guard:34:18:2",
			once: true,
		},
		// Wave 5 (7:00)
		{
			id: "wave-5",
			condition: "timer:420",
			action:
				"dialogue:gen_whiskers:Wave 5 — all three routes! This is getting intense!|spawn:gator:scale_guard:2:26:3|spawn:gator:scale_guard:32:18:3|spawn:gator:scale_guard:60:28:3|spawn:viper:scale_guard:32:20:2",
			once: true,
		},
		// Wave 6 (8:30)
		{
			id: "wave-6",
			condition: "timer:510",
			action:
				"dialogue:gen_whiskers:Wave 6 — elite vipers from the flanks!|spawn:viper:scale_guard:2:26:4|spawn:viper:scale_guard:60:28:4|spawn:snapper:scale_guard:32:18:2",
			once: true,
		},
		// Wave 7 (10:00)
		{
			id: "wave-7",
			condition: "timer:600",
			action:
				"dialogue:gen_whiskers:Wave 7 — massive push! Hold the bridges!|spawn:gator:scale_guard:2:26:4|spawn:gator:scale_guard:60:28:4|spawn:gator:scale_guard:32:18:4|spawn:viper:scale_guard:30:18:3|spawn:snapper:scale_guard:34:18:2",
			once: true,
		},
		// Wave 8 (11:30)
		{
			id: "wave-8",
			condition: "timer:690",
			action:
				"dialogue:gen_whiskers:Wave 8 — they're throwing everything!|spawn:gator:scale_guard:2:26:5|spawn:gator:scale_guard:60:28:5|spawn:viper:scale_guard:2:28:3|spawn:snapper:scale_guard:60:30:3",
			once: true,
		},
		// Wave 9 (13:00)
		{
			id: "wave-9",
			condition: "timer:780",
			action:
				"dialogue:gen_whiskers:Wave 9 — almost done! One more after this!|spawn:gator:scale_guard:32:18:6|spawn:viper:scale_guard:2:26:4|spawn:viper:scale_guard:60:28:4|spawn:snapper:scale_guard:32:20:3",
			once: true,
		},
		// Wave 10 (14:30) — FINAL WAVE
		{
			id: "wave-10",
			condition: "timer:870",
			action:
				"dialogue:gen_whiskers:FINAL WAVE! Everything they have — this is it!|spawn:gator:scale_guard:2:26:6|spawn:gator:scale_guard:60:28:6|spawn:gator:scale_guard:32:18:6|spawn:viper:scale_guard:2:28:4|spawn:viper:scale_guard:60:30:4|spawn:snapper:scale_guard:32:20:4",
			once: true,
		},
		// Waves cleared (16:00)
		{
			id: "waves-cleared",
			condition: "timer:960",
			action:
				"complete_objective:survive-all-waves|dialogue:gen_whiskers:All ten waves repelled! Their assault is broken. Now it's our turn — push north and destroy their Command Post! End this war!",
			once: true,
		},
		// Approaching enemy base
		{
			id: "enemy-base-approach",
			condition: "area_entered:ura:enemy_base",
			action:
				"dialogue:gen_whiskers:You've reached their last base. Destroy the Command Post and it's over. Four Venom Spires and a heavy garrison — hit them hard.",
			once: true,
		},
		// Enemy CP destroyed
		{
			id: "enemy-cp-destroyed",
			condition: "building_count:scale_guard:command_post:eq:0",
			action: "complete_objective:destroy-enemy-cp",
			once: true,
		},
		// CP loss = defeat
		{
			id: "ura-cp-destroyed",
			condition: "building_count:ura:command_post:eq:0",
			action: "defeat",
			once: true,
		},
		// Hero death = defeat
		{
			id: "bubbles-death",
			condition: "unit_count:ura:sgt_bubbles:eq:0",
			action: "defeat",
			once: true,
		},
		// Mission complete
		{
			id: "mission-complete",
			condition: "all_primary_complete",
			action:
				"dialogue:gen_whiskers:It's over. The Scale-Guard Command Post is destroyed. Their forces are scattering. The Copper-Silt Reach, the Blackmarsh, the Iron Delta — all liberated. Outstanding work, Sergeant Bubbles. The Otter Elite Force has won the war.|victory",
			once: true,
		},
	],

	unlocks: {},

	parTime: 1200,

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
			xpMultiplier: 2.0,
		},
	},
};
