// Mission 6: Monsoon Ambush — Survival / Timed
//
// Pre-built base. 8 waves of Scale-Guard across 3 monsoon cycles.
// Teaches: defensive strategy, weather adaptation, rally points.
// Win: Survive all 8 waves.
// Par time: 10 min (600s).

import type { MissionDef } from "../../types";

export const mission06MonsoonAmbush: MissionDef = {
	id: "mission_6",
	chapter: 2,
	mission: 2,
	name: "Monsoon Ambush",
	subtitle: "Defend your base through 8 waves and 3 monsoon cycles",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "Intel says Scale-Guard is massing for a full assault on our forward operating base. Monsoon season is rolling in — rain hits in 3 minutes, and it's going to get worse.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Your base is pre-built: Command Post, two Barracks, Armory, four Watchtowers, and sandbag walls. Garrison is already in position. Use what you've got.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Eight waves are coming from all four approach roads. Mud patches will slow everyone during the rain — use that to your advantage. Position Shellcrackers at the chokepoints.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Survive all 8 waves and keep your Command Post standing. If it falls, we lose the Reach. Dig in, Sergeant.",
			},
		],
	},

	terrain: {
		width: 48,
		height: 40,
		regions: [
			{ terrainId: "grass", fill: true },
			// Mud patches at approach roads (slows during rain)
			{ terrainId: "mud", rect: { x: 0, y: 16, w: 8, h: 8 } },
			{ terrainId: "mud", rect: { x: 40, y: 16, w: 8, h: 8 } },
			{ terrainId: "mud", rect: { x: 18, y: 0, w: 12, h: 6 } },
			{ terrainId: "mud", rect: { x: 18, y: 34, w: 12, h: 6 } },
			// Base clearing in center
			{ terrainId: "dirt", rect: { x: 16, y: 14, w: 16, h: 12 } },
			// Approach road corridors
			{ terrainId: "dirt", rect: { x: 0, y: 18, w: 48, h: 4 } },
			{ terrainId: "dirt", rect: { x: 22, y: 0, w: 4, h: 40 } },
		],
		overrides: [],
	},

	zones: {
		base_center: { x: 16, y: 14, width: 16, height: 12 },
		nw_approach: { x: 0, y: 0, width: 6, height: 4 },
		ne_approach: { x: 42, y: 0, width: 6, height: 4 },
		sw_approach: { x: 0, y: 36, width: 6, height: 4 },
		se_approach: { x: 42, y: 36, width: 6, height: 4 },
		west_road: { x: 0, y: 16, width: 8, height: 8 },
		east_road: { x: 40, y: 16, width: 8, height: 8 },
	},

	placements: [
		// Player garrison
		{ type: "mudfoot", faction: "ura", zone: "base_center", count: 4 },
		{ type: "shellcracker", faction: "ura", zone: "base_center", count: 4 },
		{ type: "river_rat", faction: "ura", zone: "base_center", count: 2 },

		// Pre-built base
		{ type: "command_post", faction: "ura", x: 24, y: 19 },
		{ type: "barracks", faction: "ura", x: 21, y: 17 },
		{ type: "barracks", faction: "ura", x: 27, y: 17 },
		{ type: "armory", faction: "ura", x: 24, y: 16 },
		{ type: "watchtower", faction: "ura", x: 18, y: 15 },
		{ type: "watchtower", faction: "ura", x: 30, y: 15 },
		{ type: "watchtower", faction: "ura", x: 18, y: 23 },
		{ type: "watchtower", faction: "ura", x: 30, y: 23 },

		// Resources near base
		{ type: "fish_spot", faction: "neutral", x: 20, y: 28 },
		{ type: "fish_spot", faction: "neutral", x: 28, y: 12 },
	],

	startResources: { fish: 300, timber: 200, salvage: 100 },
	startPopCap: 16,

	weather: {
		pattern: [
			{ type: "clear", startTime: 0, duration: 180 },
			{ type: "rain", startTime: 180, duration: 180 },
			{ type: "storm", startTime: 360, duration: 240 },
			{ type: "clear", startTime: 600, duration: 180 },
			{ type: "rain", startTime: 780, duration: 120 },
			{ type: "clear", startTime: 900, duration: 120 },
		],
	},

	objectives: {
		primary: [
			{
				id: "survive-all-waves",
				description: "Survive all 8 waves",
				type: "survive",
			},
		],
		bonus: [
			{
				id: "cp-health-bonus",
				description: "Keep Command Post above 50% HP",
				type: "survive",
			},
		],
	},

	triggers: [
		{
			id: "mission-start",
			condition: "timer:3",
			action:
				"dialogue:gen_whiskers:Position your forces at the approach roads. Mud patches slow movement during rain — bait enemies through them. First wave incoming soon.",
			once: true,
		},
		// Wave 1 (1:30) — NW scouts
		{
			id: "wave-1",
			condition: "timer:90",
			action:
				"dialogue:gen_whiskers:Wave 1 — scouts from the northwest road!|spawn:scout_lizard:scale_guard:4:1:3|spawn:gator:scale_guard:4:2:2",
			once: true,
		},
		// Wave 2 (3:30) — SE approach
		{
			id: "wave-2",
			condition: "timer:210",
			action:
				"dialogue:gen_whiskers:Wave 2 — southeast road. They're using the rain for cover!|spawn:gator:scale_guard:44:37:4|spawn:scout_lizard:scale_guard:45:37:2",
			once: true,
		},
		// Wave 3 (5:00) — Pincer north
		{
			id: "wave-3",
			condition: "timer:300",
			action:
				"dialogue:gen_whiskers:Wave 3 — pincer from both north roads!|spawn:gator:scale_guard:4:1:3|spawn:gator:scale_guard:44:1:3|spawn:viper:scale_guard:4:2:2",
			once: true,
		},
		// Wave 4 (7:00) — SW heavy push
		{
			id: "wave-4",
			condition: "timer:420",
			action:
				"dialogue:gen_whiskers:Wave 4 — heavy column from the southwest!|spawn:gator:scale_guard:4:37:4|spawn:snapper:scale_guard:5:37:2|spawn:viper:scale_guard:4:38:2",
			once: true,
		},
		// Wave 5 (9:00) — All four roads
		{
			id: "wave-5",
			condition: "timer:540",
			action:
				"dialogue:gen_whiskers:Wave 5 — they're coming from everywhere! All roads!|spawn:gator:scale_guard:4:1:2|spawn:gator:scale_guard:44:1:2|spawn:gator:scale_guard:4:37:2|spawn:gator:scale_guard:44:37:2",
			once: true,
		},
		// Wave 6 (11:00) — Vipers and Snappers
		{
			id: "wave-6",
			condition: "timer:660",
			action:
				"dialogue:gen_whiskers:Wave 6 — elite units. Vipers and Snappers from the flanks.|spawn:viper:scale_guard:0:18:3|spawn:snapper:scale_guard:46:18:2|spawn:viper:scale_guard:46:25:2",
			once: true,
		},
		// Wave 7 (13:00) — Rain returns, massive push
		{
			id: "wave-7",
			condition: "timer:780",
			action:
				"dialogue:gen_whiskers:Wave 7 — the rain's back and so is the assault!|spawn:gator:scale_guard:4:1:3|spawn:gator:scale_guard:44:37:3|spawn:viper:scale_guard:44:1:2|spawn:snapper:scale_guard:4:37:2",
			once: true,
		},
		// Wave 8 (15:00) — Final wave
		{
			id: "wave-8",
			condition: "timer:900",
			action:
				"dialogue:gen_whiskers:FINAL WAVE! Everything they've got — all four roads! Hold that line, Sergeant!|spawn:gator:scale_guard:4:1:4|spawn:gator:scale_guard:44:37:4|spawn:viper:scale_guard:44:1:3|spawn:snapper:scale_guard:4:37:3|spawn:viper:scale_guard:0:18:2|spawn:snapper:scale_guard:46:25:2",
			once: true,
		},
		// Waves cleared (17:00)
		{
			id: "waves-cleared",
			condition: "timer:1020",
			action:
				"complete_objective:survive-all-waves|dialogue:gen_whiskers:All waves repelled. The base held. Outstanding defense, Sergeant.",
			once: true,
		},
		// CP destroyed = defeat
		{
			id: "cp-destroyed",
			condition: "building_count:ura:command_post:eq:0",
			action: "defeat",
			once: true,
		},
		// Mission complete
		{
			id: "mission-complete",
			condition: "all_primary_complete",
			action:
				"dialogue:gen_whiskers:The monsoon assault failed. Scale-Guard is retreating. This position is ours.|victory",
			once: true,
		},
	],

	unlocks: {},

	parTime: 600,

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
