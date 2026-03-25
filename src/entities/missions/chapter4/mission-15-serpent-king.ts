// Mission 15: The Serpent King — Boss Battle
//
// The Scale-Guard supreme commander (Serpent King) commands from a fortified
// citadel. Player must breach three defensive rings and defeat the boss.
// Teaches: boss mechanics, all-hero coordination, escalating difficulty.
// Win: Defeat the Serpent King. Bonus: All heroes survive.
// Par time: 14 min (840s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission15SerpentKing: MissionDef = {
	id: "mission_15",
	chapter: 4,
	mission: 3,
	name: "Serpent's Lair",
	subtitle: "Breach the citadel and defeat the Scale-Guard supreme commander",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "The Serpent King. Scale-Guard's supreme commander. He's holed up in the Iron Citadel with his elite guard — the last concentration of Scale-Guard power in the region.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "The Citadel has three defensive rings. The outer ring is walls and Venom Spires. The middle ring is the elite barracks — the strongest troops they have. The inner ring is the throne room.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "The Serpent King himself is a formidable opponent. High HP, area damage, and he'll summon reinforcements when wounded. All three heroes will need to engage him directly.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "This is the climactic battle. Everything we've built, everything we've learned — it all comes down to this. End the Serpent King's reign, Sergeant.",
			},
		],
	},

	terrain: {
		width: 52,
		height: 52,
		regions: [
			{ terrainId: "grass", fill: true },
			// Outer defensive ring (walls)
			{ terrainId: "dirt", circle: { cx: 26, cy: 20, r: 18 } },
			// Inner ring (citadel core)
			{ terrainId: "dirt", circle: { cx: 26, cy: 20, r: 10 } },
			// Throne room
			{ terrainId: "dirt", rect: { x: 22, y: 16, w: 8, h: 8 } },
			// Approach roads from south
			{ terrainId: "dirt", rect: { x: 24, y: 38, w: 4, h: 14 } },
			{ terrainId: "dirt", rect: { x: 10, y: 36, w: 4, h: 10 } },
			{ terrainId: "dirt", rect: { x: 38, y: 36, w: 4, h: 10 } },
			// Player staging area
			{ terrainId: "dirt", rect: { x: 14, y: 42, w: 24, h: 10 } },
			// Toxic moat around citadel
			{ terrainId: "toxic_sludge", circle: { cx: 26, cy: 20, r: 14 } },
			// Re-apply inner ring on top of moat
			{ terrainId: "dirt", circle: { cx: 26, cy: 20, r: 10 } },
			// Mangrove flanking routes
			{ terrainId: "mangrove", rect: { x: 0, y: 14, w: 8, h: 12 } },
			{ terrainId: "mangrove", rect: { x: 44, y: 14, w: 8, h: 12 } },
		],
		overrides: [
			// South gate bridge over toxic moat
			{ x: 25, y: 34, terrainId: "bridge" },
			{ x: 26, y: 34, terrainId: "bridge" },
			{ x: 25, y: 33, terrainId: "bridge" },
			{ x: 26, y: 33, terrainId: "bridge" },
			// West gate
			{ x: 12, y: 20, terrainId: "bridge" },
			{ x: 13, y: 20, terrainId: "bridge" },
			// East gate
			{ x: 39, y: 20, terrainId: "bridge" },
			{ x: 40, y: 20, terrainId: "bridge" },
		],
	},

	zones: {
		staging_area: { x: 14, y: 42, width: 24, height: 10 },
		outer_ring: { x: 8, y: 2, width: 36, height: 36 },
		middle_ring: { x: 16, y: 10, width: 20, height: 20 },
		throne_room: { x: 22, y: 16, width: 8, height: 8 },
		south_gate: { x: 22, y: 32, width: 8, height: 4 },
		west_flank: { x: 0, y: 14, width: 8, height: 12 },
		east_flank: { x: 44, y: 14, width: 8, height: 12 },
	},

	placements: [
		// Player heroes
		{ type: "sgt_bubbles", faction: "ura", x: 26, y: 48 },
		{ type: "cpl_splash", faction: "ura", x: 24, y: 48 },
		{ type: "sgt_fang", faction: "ura", x: 28, y: 48 },

		// Player army
		{ type: "mudfoot", faction: "ura", zone: "staging_area", count: 8 },
		{ type: "shellcracker", faction: "ura", zone: "staging_area", count: 4 },
		{ type: "sapper", faction: "ura", zone: "staging_area", count: 3 },
		{ type: "river_rat", faction: "ura", zone: "staging_area", count: 3 },
		{ type: "raftsman", faction: "ura", zone: "staging_area", count: 2 },

		// Pre-built base
		{ type: "command_post", faction: "ura", x: 26, y: 46 },
		{ type: "barracks", faction: "ura", x: 22, y: 44 },
		{ type: "barracks", faction: "ura", x: 30, y: 44 },
		{ type: "armory", faction: "ura", x: 26, y: 42 },

		// Outer ring defenses
		{ type: "venom_spire", faction: "scale_guard", x: 26, y: 4 },
		{ type: "venom_spire", faction: "scale_guard", x: 14, y: 10 },
		{ type: "venom_spire", faction: "scale_guard", x: 38, y: 10 },
		{ type: "venom_spire", faction: "scale_guard", x: 14, y: 30 },
		{ type: "venom_spire", faction: "scale_guard", x: 38, y: 30 },
		{ type: "venom_spire", faction: "scale_guard", x: 26, y: 34 },

		// Outer ring garrison
		{ type: "gator", faction: "scale_guard", zone: "outer_ring", count: 6 },
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 26,
			y: 36,
			patrol: [
				[14, 36],
				[38, 36],
				[14, 36],
			],
		},

		// Middle ring elite garrison
		{ type: "gator", faction: "scale_guard", zone: "middle_ring", count: 6 },
		{ type: "viper", faction: "scale_guard", x: 20, y: 14, count: 3 },
		{ type: "viper", faction: "scale_guard", x: 32, y: 14, count: 3 },
		{ type: "snapper", faction: "scale_guard", x: 26, y: 12, count: 2 },

		// Throne room — the Serpent King + royal guard
		{ type: "serpent_king", faction: "scale_guard", x: 26, y: 20 },
		{ type: "viper", faction: "scale_guard", x: 24, y: 18, count: 2 },
		{ type: "snapper", faction: "scale_guard", x: 28, y: 18, count: 2 },

		// Resources
		{ type: "fish_spot", faction: "neutral", x: 6, y: 48 },
		{ type: "fish_spot", faction: "neutral", x: 46, y: 48 },
		{ type: "salvage_cache", faction: "neutral", x: 26, y: 50 },
	],

	startResources: { fish: 500, timber: 400, salvage: 300 },
	startPopCap: 30,

	objectives: {
		primary: [objective("defeat-serpent-king", "Defeat the Serpent King")],
		bonus: [objective("all-heroes-survive", "All heroes survive the battle")],
	},

	triggers: [
		trigger(
			"mission-start",
			on.timer(3),
			act.dialogue(
				"gen_whiskers",
				"The Iron Citadel. Three rings of defense between you and the Serpent King. Use the flanking routes through the mangroves to split their defenses.",
			),
		),
		trigger(
			"outer-ring-entered",
			on.areaEntered("ura", "outer_ring"),
			act.dialogue(
				"gen_whiskers",
				"You've breached the outer ring. Venom Spires are the priority targets — knock them out to open lanes for your infantry.",
			),
		),
		trigger("middle-ring-entered", on.areaEntered("ura", "middle_ring"), [
			act.dialogue(
				"gen_whiskers",
				"Middle ring — elite garrison. Vipers and Snappers. This is where they'll make their stand.",
			),
			act.spawn("gator", "scale_guard", 26, 6, 4),
			act.spawn("viper", "scale_guard", 18, 20, 2),
			act.spawn("viper", "scale_guard", 34, 20, 2),
		]),
		trigger(
			"throne-room-entered",
			on.areaEntered("ura", "throne_room"),
			act.dialogue(
				"gen_whiskers",
				"The throne room! The Serpent King is here. Engage with all heroes — coordinate your attacks!",
			),
		),
		trigger("serpent-king-wounded", on.timer(600), [
			act.dialogue("gen_whiskers", "The Serpent King is summoning reinforcements! Hold the line!"),
			act.spawn("gator", "scale_guard", 26, 4, 6),
			act.spawn("viper", "scale_guard", 10, 20, 3),
			act.spawn("snapper", "scale_guard", 42, 20, 3),
		]),
		trigger(
			"serpent-king-defeated",
			on.unitCount("scale_guard", "serpent_king", "eq", 0),
			act.completeObjective("defeat-serpent-king"),
		),
		// Hero deaths
		trigger("bubbles-death", on.unitCount("ura", "sgt_bubbles", "eq", 0), act.failMission()),
		trigger("mission-complete", on.allPrimaryComplete(), [
			act.dialogue(
				"gen_whiskers",
				"The Serpent King has fallen. Scale-Guard's supreme commander is defeated. But the remaining forces are regrouping for one last desperate stand...",
			),
			act.victory(),
		]),
	],

	unlocks: {},

	parTime: 900,

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
