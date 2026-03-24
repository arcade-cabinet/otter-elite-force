// Mission 7: River Rats — Capture the Flag
//
// Wide river divides the map. Player base west, enemy east.
// Must capture 5 enemy supply crates and return to base.
// Teaches: Raftsmen, water traversal, Dock building.
// Win: Return 5 supply crates. Bonus: Build a Dock.
// Par time: 8 min (480s).

import type { MissionDef } from "../../types";

export const mission07RiverRats: MissionDef = {
	id: "mission_7",
	chapter: 2,
	mission: 3,
	name: "River Rats",
	subtitle: "Capture enemy supply crates across the river",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "Scale-Guard has stockpiled supplies on the east bank. Five crates of munitions, rations, and salvage — and we need all of them.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "A wide river cuts the valley in two. Two bridges — north and south — are the only crossing points. Both will be contested.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "New capability: Raftsmen can cross water without bridges. Build a Dock at the riverbank and you can ferry units across anywhere. This changes the game, Sergeant.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Grab those crates and get them back to our base zone on the west side. Each crate must be carried by a unit into the delivery zone. Move out.",
			},
		],
	},

	terrain: {
		width: 52,
		height: 40,
		regions: [
			{ terrainId: "grass", fill: true },
			// Wide river running north-south through center
			{
				terrainId: "water",
				river: {
					points: [
						[26, 0],
						[26, 40],
					],
					width: 4,
				},
			},
			// Mud banks along river
			{ terrainId: "mud", rect: { x: 22, y: 0, w: 2, h: 40 } },
			{ terrainId: "mud", rect: { x: 30, y: 0, w: 2, h: 40 } },
			// Player base (west)
			{ terrainId: "dirt", rect: { x: 2, y: 14, w: 14, h: 12 } },
			// Enemy territory (east)
			{ terrainId: "dirt", rect: { x: 36, y: 14, w: 14, h: 12 } },
			// Mangrove islands in river
			{ terrainId: "mangrove", rect: { x: 24, y: 6, w: 4, h: 3 } },
			{ terrainId: "mangrove", rect: { x: 24, y: 30, w: 4, h: 3 } },
		],
		overrides: [
			// North bridge
			{ x: 26, y: 8, terrainId: "bridge" },
			{ x: 26, y: 9, terrainId: "bridge" },
			{ x: 26, y: 10, terrainId: "bridge" },
			{ x: 26, y: 11, terrainId: "bridge" },
			// South bridge
			{ x: 26, y: 28, terrainId: "bridge" },
			{ x: 26, y: 29, terrainId: "bridge" },
			{ x: 26, y: 30, terrainId: "bridge" },
			{ x: 26, y: 31, terrainId: "bridge" },
		],
	},

	zones: {
		ura_base: { x: 2, y: 14, width: 14, height: 12 },
		delivery_zone: { x: 4, y: 16, width: 10, height: 8 },
		north_bridge: { x: 22, y: 8, width: 8, height: 4 },
		south_bridge: { x: 22, y: 27, width: 8, height: 5 },
		east_territory: { x: 35, y: 0, width: 17, height: 40 },
		enemy_base: { x: 36, y: 14, width: 14, height: 12 },
	},

	placements: [
		// Player units
		{ type: "mudfoot", faction: "ura", zone: "ura_base", count: 6 },
		{ type: "shellcracker", faction: "ura", zone: "ura_base", count: 2 },
		{ type: "river_rat", faction: "ura", zone: "ura_base", count: 3 },

		// Pre-built player base
		{ type: "command_post", faction: "ura", x: 8, y: 19 },
		{ type: "barracks", faction: "ura", x: 5, y: 17 },
		{ type: "armory", faction: "ura", x: 5, y: 21 },
		{ type: "burrow", faction: "ura", x: 10, y: 17 },
		{ type: "burrow", faction: "ura", x: 10, y: 21 },

		// Supply crates (east bank)
		{ type: "supply_crate", faction: "neutral", x: 38, y: 8 },
		{ type: "supply_crate", faction: "neutral", x: 46, y: 14 },
		{ type: "supply_crate", faction: "neutral", x: 40, y: 20 },
		{ type: "supply_crate", faction: "neutral", x: 48, y: 26 },
		{ type: "supply_crate", faction: "neutral", x: 42, y: 34 },

		// Enemy defenders
		{ type: "gator", faction: "scale_guard", zone: "enemy_base", count: 4 },
		{ type: "viper", faction: "scale_guard", x: 40, y: 18, count: 2 },
		{ type: "snapper", faction: "scale_guard", x: 44, y: 20 },
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 36,
			y: 10,
			patrol: [
				[36, 10],
				[36, 30],
				[36, 10],
			],
		},

		// Resources
		{ type: "fish_spot", faction: "neutral", x: 4, y: 12 },
		{ type: "fish_spot", faction: "neutral", x: 14, y: 28 },
	],

	startResources: { fish: 250, timber: 200, salvage: 100 },
	startPopCap: 20,

	objectives: {
		primary: [
			{
				id: "return-crates",
				description: "Return 5 supply crates to the base",
				type: "collect",
				target: "supply_crate",
				count: 5,
			},
		],
		bonus: [
			{
				id: "build-dock",
				description: "Build a Dock",
				type: "build",
				target: "dock",
				count: 1,
			},
		],
	},

	triggers: [
		{
			id: "mission-start",
			condition: "timer:3",
			action:
				"dialogue:gen_whiskers:Five crates scattered across the east bank. Each one needs to be picked up and carried back to our delivery zone. North and south bridges are your main crossing points.",
			once: true,
		},
		{
			id: "dock-hint",
			condition: "timer:120",
			action:
				"dialogue:gen_whiskers:Consider building a Dock at the riverbank. Raftsmen can cross the water directly — no bridge needed.",
			once: true,
		},
		{
			id: "dock-built",
			condition: "building_count:ura:dock:gte:1",
			action:
				"complete_objective:build-dock|dialogue:gen_whiskers:Dock constructed. You can now train Raftsmen to cross the river freely. Smart move.",
			once: true,
		},
		{
			id: "north-bridge-approach",
			condition: "area_entered:ura:north_bridge",
			action: "dialogue:gen_whiskers:North bridge ahead. Expect resistance on the other side.",
			once: true,
		},
		{
			id: "east-territory-entered",
			condition: "area_entered:ura:east_territory",
			action:
				"dialogue:gen_whiskers:You're across the river and in enemy territory. Crates are scattered around — find them and carry them back. Watch for patrols.",
			once: true,
		},
		{
			id: "enemy-reinforcements-1",
			condition: "timer:300",
			action: "spawn:gator:scale_guard:48:19:3|spawn:scout_lizard:scale_guard:48:20:2",
			once: true,
		},
		{
			id: "enemy-reinforcements-2",
			condition: "timer:600",
			action:
				"dialogue:gen_whiskers:More Scale-Guard reinforcements arriving on the east side. They're defending those crates aggressively.|spawn:gator:scale_guard:48:10:4|spawn:viper:scale_guard:48:28:2|spawn:snapper:scale_guard:48:19:2",
			once: true,
		},
		{
			id: "mission-complete",
			condition: "all_primary_complete",
			action:
				"dialogue:gen_whiskers:All five crates recovered. Scale-Guard's supply chain is broken on this front. The Raftsmen and Docks will serve us well.|victory",
			once: true,
		},
	],

	unlocks: {
		units: ["raftsman"],
		buildings: ["dock"],
	},

	parTime: 480,

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
