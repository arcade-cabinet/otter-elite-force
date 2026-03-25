// Mission 14: Iron Delta — Naval / Combined Arms
//
// Amphibious assault across a delta. Player must control three island outposts
// while managing naval and land forces simultaneously.
// Teaches: combined naval/land operations, multi-objective control.
// Win: Capture all 3 island outposts. Bonus: Build 3 Docks.
// Par time: 12 min (720s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission14IronDelta: MissionDef = {
	id: "mission_14",
	chapter: 4,
	mission: 2,
	name: "Gas Depot",
	subtitle: "Capture three island outposts across the Iron Delta",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "Scale-Guard has retreated to the Iron Delta — a maze of river channels and fortified islands. Three outpost islands control the delta's chokepoints.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "We need all three to secure passage to their final stronghold. Each island has a Scale-Guard flag post — capture it by moving your units into the control zone and holding it.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "The delta channels are deep — you'll need Raftsmen and Docks to move forces between islands. Cpl. Splash can swim the channels directly.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Establish a base on the south shore, build your fleet, and take those islands one by one. Or all at once if you're feeling bold.",
			},
		],
	},

	terrain: {
		width: 60,
		height: 52,
		regions: [
			{ terrainId: "water", fill: true },
			// South mainland (player base)
			{ terrainId: "grass", rect: { x: 0, y: 38, w: 60, h: 14 } },
			{ terrainId: "dirt", rect: { x: 20, y: 42, w: 20, h: 10 } },
			// Island West
			{ terrainId: "grass", circle: { cx: 10, cy: 18, r: 7 } },
			{ terrainId: "dirt", circle: { cx: 10, cy: 18, r: 4 } },
			// Island Central
			{ terrainId: "grass", circle: { cx: 30, cy: 12, r: 8 } },
			{ terrainId: "dirt", circle: { cx: 30, cy: 12, r: 5 } },
			// Island East
			{ terrainId: "grass", circle: { cx: 50, cy: 18, r: 7 } },
			{ terrainId: "dirt", circle: { cx: 50, cy: 18, r: 4 } },
			// Shallow crossings (beach/mud)
			{ terrainId: "beach", rect: { x: 6, y: 25, w: 8, h: 3 } },
			{ terrainId: "beach", rect: { x: 26, y: 20, w: 8, h: 3 } },
			{ terrainId: "beach", rect: { x: 46, y: 25, w: 8, h: 3 } },
			// Mud shores
			{ terrainId: "mud", rect: { x: 0, y: 36, w: 60, h: 2 } },
		],
		overrides: [],
	},

	zones: {
		ura_base: { x: 20, y: 42, width: 20, height: 10 },
		island_west: { x: 6, y: 14, width: 8, height: 8 },
		island_central: { x: 25, y: 7, width: 10, height: 10 },
		island_east: { x: 46, y: 14, width: 8, height: 8 },
		west_capture: { x: 8, y: 16, width: 4, height: 4 },
		central_capture: { x: 28, y: 10, width: 4, height: 4 },
		east_capture: { x: 48, y: 16, width: 4, height: 4 },
		south_shore: { x: 0, y: 38, width: 60, height: 4 },
	},

	placements: [
		// Player heroes
		{ type: "sgt_bubbles", faction: "ura", x: 30, y: 46 },
		{ type: "cpl_splash", faction: "ura", x: 28, y: 46 },

		// Player starting army
		{ type: "mudfoot", faction: "ura", zone: "ura_base", count: 6 },
		{ type: "shellcracker", faction: "ura", zone: "ura_base", count: 3 },
		{ type: "raftsman", faction: "ura", zone: "ura_base", count: 4 },
		{ type: "river_rat", faction: "ura", zone: "ura_base", count: 3 },

		// Pre-built base
		{ type: "command_post", faction: "ura", x: 30, y: 48 },
		{ type: "barracks", faction: "ura", x: 26, y: 44 },
		{ type: "armory", faction: "ura", x: 34, y: 44 },
		{ type: "dock", faction: "ura", x: 22, y: 42 },

		// Island West defenders
		{ type: "flag_post", faction: "scale_guard", x: 10, y: 18 },
		{ type: "gator", faction: "scale_guard", zone: "island_west", count: 3 },
		{ type: "viper", faction: "scale_guard", x: 8, y: 16 },
		{ type: "venom_spire", faction: "scale_guard", x: 12, y: 14 },

		// Island Central defenders (strongest)
		{ type: "flag_post", faction: "scale_guard", x: 30, y: 12 },
		{ type: "gator", faction: "scale_guard", zone: "island_central", count: 5 },
		{ type: "viper", faction: "scale_guard", x: 28, y: 10, count: 2 },
		{ type: "snapper", faction: "scale_guard", x: 32, y: 12, count: 2 },
		{ type: "venom_spire", faction: "scale_guard", x: 26, y: 8 },
		{ type: "venom_spire", faction: "scale_guard", x: 34, y: 8 },

		// Island East defenders
		{ type: "flag_post", faction: "scale_guard", x: 50, y: 18 },
		{ type: "gator", faction: "scale_guard", zone: "island_east", count: 3 },
		{ type: "viper", faction: "scale_guard", x: 52, y: 16 },
		{ type: "venom_spire", faction: "scale_guard", x: 48, y: 14 },

		// Water patrols
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 20,
			y: 30,
			patrol: [
				[20, 30],
				[40, 30],
				[20, 30],
			],
		},

		// Resources
		{ type: "fish_spot", faction: "neutral", x: 10, y: 44 },
		{ type: "fish_spot", faction: "neutral", x: 50, y: 44 },
		{ type: "salvage_cache", faction: "neutral", x: 30, y: 50 },
	],

	startResources: { fish: 400, timber: 300, salvage: 200 },
	startPopCap: 25,

	objectives: {
		primary: [
			objective("capture-island-west", "Capture Island West outpost"),
			objective("capture-island-central", "Capture Island Central outpost"),
			objective("capture-island-east", "Capture Island East outpost"),
		],
		bonus: [objective("build-3-docks", "Build 3 Docks")],
	},

	triggers: [
		trigger(
			"mission-start",
			on.timer(3),
			act.dialogue(
				"gen_whiskers",
				"Three islands, three flag posts. Clear the defenders and move your units into the capture zone to claim each outpost. Use Raftsmen to cross the channels.",
			),
		),
		trigger("west-captured", on.areaEntered("ura", "west_capture"), [
			act.completeObjective("capture-island-west"),
			act.dialogue(
				"gen_whiskers",
				"Island West is ours! Good staging point for the central assault.",
			),
		]),
		trigger("central-captured", on.areaEntered("ura", "central_capture"), [
			act.completeObjective("capture-island-central"),
			act.dialogue(
				"gen_whiskers",
				"Central island captured! That was the hardest one — well done.",
			),
		]),
		trigger("east-captured", on.areaEntered("ura", "east_capture"), [
			act.completeObjective("capture-island-east"),
			act.dialogue("gen_whiskers", "Island East secured! The delta is under our control."),
		]),
		trigger("dock-bonus", on.buildingCount("ura", "dock", "gte", 3), [
			act.completeObjective("build-3-docks"),
			act.dialogue("gen_whiskers", "Three Docks operational. Full naval superiority in the delta."),
		]),
		trigger("reinforcements-1", on.timer(360), [
			act.dialogue("gen_whiskers", "Scale-Guard reinforcements arriving by water!"),
			act.spawn("gator", "scale_guard", 0, 10, 4),
			act.spawn("scout_lizard", "scale_guard", 58, 10, 3),
		]),
		trigger("reinforcements-2", on.timer(600), [
			act.spawn("gator", "scale_guard", 30, 2, 5),
			act.spawn("viper", "scale_guard", 0, 18, 3),
			act.spawn("snapper", "scale_guard", 58, 18, 2),
		]),
		// Hero death
		trigger("bubbles-death", on.unitCount("ura", "sgt_bubbles", "eq", 0), act.failMission()),
		trigger("mission-complete", on.allPrimaryComplete(), [
			act.dialogue(
				"gen_whiskers",
				"All three outposts captured. The Iron Delta is ours. Scale-Guard's last defense line is broken — their fortress lies ahead.",
			),
			act.victory(),
		]),
	],

	unlocks: {},

	parTime: 360,

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
			enemyDamageMultiplier: 1.4,
			enemyHpMultiplier: 1.4,
			resourceMultiplier: 0.75,
			xpMultiplier: 1.5,
		},
	},
};
