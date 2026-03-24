// Mission 13: The Great Siphon — Full Assault
//
// Scale-Guard HQ at the Great Siphon. Massive map, full army required.
// Player must destroy the Great Siphon — a multi-stage boss structure.
// Teaches: large-scale army management, multi-front combat.
// Win: Destroy the Great Siphon (3 stages). Bonus: Destroy all Scale-Guard buildings.
// Par time: 15 min (900s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission13GreatSiphon: MissionDef = {
	id: "mission_13",
	chapter: 4,
	mission: 1,
	name: "Supply Lines",
	subtitle: "Assault Scale-Guard headquarters and destroy the Great Siphon",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "This is it. The Great Siphon — Scale-Guard's central command and their ultimate weapon. It's pumping toxins into every waterway in the region. If we don't shut it down, nothing else we've done matters.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "The Siphon is a three-stage structure. Outer shield generators protect the core. Destroy both generators, then hit the core itself. Each stage will trigger a counterattack.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Full combined arms. Every unit type we've unlocked, every hero on deck. Bubbles, Splash, and Fang will lead the assault. This is the biggest operation of the war.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Build your army, control the resource points, and push to the Siphon in the northeast. We end this today, Sergeant.",
			},
		],
	},

	terrain: {
		width: 64,
		height: 56,
		regions: [
			{ terrainId: "grass", fill: true },
			// Toxic wasteland around the Siphon
			{ terrainId: "toxic_sludge", circle: { cx: 50, cy: 12, r: 12 } },
			// Re-apply dirt for the Siphon compound
			{ terrainId: "dirt", circle: { cx: 50, cy: 12, r: 8 } },
			// River running SW to NE
			{
				terrainId: "water",
				river: {
					points: [
						[0, 40],
						[20, 30],
						[40, 20],
						[64, 10],
					],
					width: 3,
				},
			},
			// Player base (southwest)
			{ terrainId: "dirt", rect: { x: 2, y: 42, w: 18, h: 14 } },
			// Central battlefield
			{ terrainId: "dirt", rect: { x: 24, y: 24, w: 16, h: 12 } },
			// Mangrove groves (resources)
			{ terrainId: "mangrove", rect: { x: 0, y: 20, w: 10, h: 12 } },
			{ terrainId: "mangrove", rect: { x: 50, y: 36, w: 14, h: 10 } },
			// Mud approaches
			{ terrainId: "mud", rect: { x: 36, y: 14, w: 8, h: 8 } },
			// Forward staging area
			{ terrainId: "dirt", rect: { x: 30, y: 10, w: 10, h: 8 } },
		],
		overrides: [
			// River bridges
			{ x: 12, y: 34, terrainId: "bridge" },
			{ x: 12, y: 35, terrainId: "bridge" },
			{ x: 12, y: 36, terrainId: "bridge" },
			{ x: 32, y: 24, terrainId: "bridge" },
			{ x: 32, y: 25, terrainId: "bridge" },
			{ x: 32, y: 26, terrainId: "bridge" },
		],
	},

	zones: {
		ura_base: { x: 2, y: 42, width: 18, height: 14 },
		central_field: { x: 24, y: 24, width: 16, height: 12 },
		forward_staging: { x: 30, y: 10, width: 10, height: 8 },
		siphon_compound: { x: 42, y: 4, width: 16, height: 16 },
		generator_west: { x: 44, y: 8, width: 4, height: 4 },
		generator_east: { x: 52, y: 8, width: 4, height: 4 },
		siphon_core: { x: 48, y: 10, width: 4, height: 4 },
		resource_west: { x: 0, y: 20, width: 10, height: 12 },
		resource_east: { x: 50, y: 36, width: 14, height: 10 },
	},

	placements: [
		// Player heroes
		{ type: "sgt_bubbles", faction: "ura", x: 10, y: 48 },
		{ type: "cpl_splash", faction: "ura", x: 8, y: 48 },
		{ type: "sgt_fang", faction: "ura", x: 12, y: 48 },

		// Player starting army
		{ type: "mudfoot", faction: "ura", zone: "ura_base", count: 8 },
		{ type: "shellcracker", faction: "ura", zone: "ura_base", count: 4 },
		{ type: "sapper", faction: "ura", zone: "ura_base", count: 3 },
		{ type: "river_rat", faction: "ura", zone: "ura_base", count: 4 },

		// Pre-built player base
		{ type: "command_post", faction: "ura", x: 10, y: 48 },
		{ type: "barracks", faction: "ura", x: 6, y: 46 },
		{ type: "barracks", faction: "ura", x: 14, y: 46 },
		{ type: "armory", faction: "ura", x: 10, y: 44 },
		{ type: "dock", faction: "ura", x: 4, y: 42 },

		// Great Siphon (3-stage boss)
		{ type: "shield_generator", faction: "scale_guard", x: 46, y: 10 },
		{ type: "shield_generator", faction: "scale_guard", x: 54, y: 10 },
		{ type: "great_siphon", faction: "scale_guard", x: 50, y: 12 },

		// Siphon compound defenses
		{ type: "venom_spire", faction: "scale_guard", x: 44, y: 6 },
		{ type: "venom_spire", faction: "scale_guard", x: 56, y: 6 },
		{ type: "venom_spire", faction: "scale_guard", x: 50, y: 4 },
		{ type: "venom_spire", faction: "scale_guard", x: 44, y: 18 },
		{ type: "venom_spire", faction: "scale_guard", x: 56, y: 18 },

		// Heavy garrison
		{ type: "gator", faction: "scale_guard", zone: "siphon_compound", count: 8 },
		{ type: "viper", faction: "scale_guard", x: 48, y: 8, count: 4 },
		{ type: "snapper", faction: "scale_guard", x: 50, y: 14, count: 3 },

		// Central field defenders
		{ type: "gator", faction: "scale_guard", zone: "central_field", count: 4 },
		{ type: "viper", faction: "scale_guard", x: 30, y: 28, count: 2 },
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 28,
			y: 20,
			patrol: [
				[28, 20],
				[40, 20],
				[28, 20],
			],
		},

		// Resources
		{ type: "fish_spot", faction: "neutral", x: 4, y: 50 },
		{ type: "fish_spot", faction: "neutral", x: 16, y: 52 },
		{ type: "mangrove_tree", faction: "neutral", zone: "resource_west", count: 15 },
		{ type: "mangrove_tree", faction: "neutral", zone: "resource_east", count: 10 },
		{ type: "salvage_cache", faction: "neutral", x: 18, y: 42 },
		{ type: "salvage_cache", faction: "neutral", x: 32, y: 30 },
	],

	startResources: { fish: 500, timber: 400, salvage: 250 },
	startPopCap: 30,

	objectives: {
		primary: [
			objective("destroy-generator-west", "Destroy west shield generator"),
			objective("destroy-generator-east", "Destroy east shield generator"),
			objective("destroy-great-siphon", "Destroy the Great Siphon"),
		],
		bonus: [objective("destroy-all-buildings", "Destroy all Scale-Guard buildings")],
	},

	triggers: [
		trigger(
			"mission-start",
			on.timer(3),
			act.dialogue(
				"gen_whiskers",
				"All heroes on deck. Build up your forces and push northeast. The Siphon is shielded — take out the generators on each flank before hitting the core.",
			),
		),
		trigger(
			"central-field-engaged",
			on.areaEntered("ura", "central_field"),
			act.dialogue(
				"gen_whiskers",
				"You've reached the central battlefield. Scale-Guard will contest this ground hard. Secure it before pushing further north.",
			),
		),
		trigger(
			"siphon-approach",
			on.areaEntered("ura", "siphon_compound"),
			act.dialogue(
				"gen_whiskers",
				"You're inside the Siphon compound. Five Venom Spires and heavy garrison. Clear the flanks and hit those generators.",
			),
		),
		trigger(
			"generator-west-destroyed",
			on.buildingCount("scale_guard", "shield_generator", "lte", 1),
			[
				act.completeObjective("destroy-generator-west"),
				act.dialogue(
					"gen_whiskers",
					"West generator down! The Siphon's shields are weakening. One more generator to go.",
				),
				act.spawn("gator", "scale_guard", 50, 2, 4),
				act.spawn("viper", "scale_guard", 42, 12, 3),
			],
		),
		trigger(
			"generator-east-destroyed",
			on.buildingCount("scale_guard", "shield_generator", "eq", 0),
			[
				act.completeObjective("destroy-generator-east"),
				act.dialogue(
					"gen_whiskers",
					"Both generators destroyed! The Siphon core is exposed. Hit it with everything you've got!",
				),
				act.spawn("snapper", "scale_guard", 50, 2, 3),
				act.spawn("gator", "scale_guard", 58, 12, 4),
				act.spawn("viper", "scale_guard", 42, 4, 3),
			],
		),
		trigger(
			"siphon-destroyed",
			on.buildingCount("scale_guard", "great_siphon", "eq", 0),
			act.completeObjective("destroy-great-siphon"),
		),
		trigger("counterattack-1", on.timer(420), [
			act.dialogue("gen_whiskers", "Scale-Guard counterattack from the east!"),
			act.spawn("gator", "scale_guard", 62, 30, 5),
			act.spawn("viper", "scale_guard", 60, 28, 3),
		]),
		trigger("counterattack-2", on.timer(720), [
			act.dialogue("gen_whiskers", "Massive reinforcements! They're throwing everything at us!"),
			act.spawn("gator", "scale_guard", 62, 20, 6),
			act.spawn("snapper", "scale_guard", 62, 24, 3),
			act.spawn("viper", "scale_guard", 40, 2, 4),
		]),
		// Hero deaths
		trigger("bubbles-death", on.unitCount("ura", "sgt_bubbles", "eq", 0), act.failMission()),
		trigger("mission-complete", on.allPrimaryComplete(), [
			act.dialogue(
				"gen_whiskers",
				"The Great Siphon is destroyed! Scale-Guard's central command has fallen. But the war isn't over — their supreme commander has retreated to the Iron Delta.",
			),
			act.victory(),
		]),
	],

	unlocks: {},

	parTime: 720,

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
			xpMultiplier: 1.5,
		},
	},
};
