// Mission 12: Fang Rescue — Hero / Commando
//
// Deep behind enemy lines, Sgt. Fang is captured at a Scale-Guard stronghold.
// Small strike team must infiltrate, rescue Fang, and fight out.
// Teaches: hero synergies, multi-phase mission, fighting retreat.
// Win: Rescue Sgt. Fang, extract to southern LZ.
// Par time: 7 min (420s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission12FangRescue: MissionDef = {
	id: "mission_12",
	chapter: 3,
	mission: 4,
	name: "The Stronghold",
	subtitle: "Infiltrate the Scale-Guard stronghold and rescue Sgt. Fang",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "Sgt. Fang is being held at Scale-Guard's northern stronghold — clifftop position above the Blackmarsh. Layered defenses: walls, towers, heavy patrols.",
			},
			{
				speaker: "Sgt. Bubbles",
				text: "Same play as the Whiskers rescue?",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Harder. This stronghold has three defensive layers before the detention block. You'll lead a four-otter strike team through the ravine. Shellcrackers this time — you'll need the firepower.",
			},
			{
				speaker: "Sgt. Bubbles",
				text: "And once Fang's out, they lock down behind us.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Exactly. Reinforcements flood in from every direction the moment that cell opens. Fight your way south to the ravine extraction. Fang's a siege specialist — we need him for the final push.",
			},
			{
				speaker: "Sgt. Bubbles",
				text: "In fast, out loud. Understood.",
			},
		],
	},

	terrain: {
		width: 36,
		height: 44,
		regions: [
			{ terrainId: "grass", fill: true },
			// Rocky cliff walls (impassable borders)
			{ terrainId: "mud", rect: { x: 0, y: 0, w: 4, h: 44 } },
			{ terrainId: "mud", rect: { x: 32, y: 0, w: 4, h: 44 } },
			// Ravine approach (south to center)
			{ terrainId: "dirt", rect: { x: 12, y: 30, w: 12, h: 14 } },
			// Stronghold compound (center-north)
			{ terrainId: "dirt", rect: { x: 6, y: 4, w: 24, h: 26 } },
			// Detention block (north)
			{ terrainId: "dirt", rect: { x: 12, y: 4, w: 12, h: 8 } },
			// Inner courtyard
			{ terrainId: "dirt", rect: { x: 10, y: 14, w: 16, h: 10 } },
			// Mangrove concealment on flanks
			{ terrainId: "mangrove", rect: { x: 4, y: 20, w: 8, h: 10 } },
			{ terrainId: "mangrove", rect: { x: 24, y: 20, w: 8, h: 10 } },
			// Extraction beach
			{ terrainId: "beach", rect: { x: 12, y: 40, w: 12, h: 4 } },
		],
		overrides: [
			// Stronghold gates
			{ x: 17, y: 30, terrainId: "bridge" },
			{ x: 18, y: 30, terrainId: "bridge" },
			{ x: 17, y: 12, terrainId: "bridge" },
			{ x: 18, y: 12, terrainId: "bridge" },
		],
	},

	zones: {
		extraction_lz: { x: 12, y: 40, width: 12, height: 4 },
		ravine_approach: { x: 12, y: 30, width: 12, height: 10 },
		outer_compound: { x: 6, y: 14, width: 24, height: 16 },
		inner_courtyard: { x: 10, y: 14, width: 16, height: 10 },
		detention_block: { x: 12, y: 4, width: 12, height: 8 },
		west_flank: { x: 4, y: 20, width: 8, height: 10 },
		east_flank: { x: 24, y: 20, width: 8, height: 10 },
	},

	placements: [
		// Player strike team
		{ type: "sgt_bubbles", faction: "ura", x: 18, y: 42 },
		{ type: "mudfoot", faction: "ura", x: 16, y: 41, count: 2 },
		{ type: "shellcracker", faction: "ura", x: 20, y: 41, count: 2 },

		// Outer compound guards
		{
			type: "gator",
			faction: "scale_guard",
			x: 12,
			y: 28,
			patrol: [
				[12, 28],
				[24, 28],
				[12, 28],
			],
		},
		{ type: "gator", faction: "scale_guard", x: 8, y: 20, count: 2 },
		{ type: "gator", faction: "scale_guard", x: 28, y: 20, count: 2 },

		// Inner courtyard guards
		{ type: "viper", faction: "scale_guard", x: 14, y: 16, count: 2 },
		{ type: "viper", faction: "scale_guard", x: 22, y: 16, count: 2 },
		{ type: "snapper", faction: "scale_guard", x: 18, y: 18 },

		// Detention block guards
		{ type: "gator", faction: "scale_guard", x: 14, y: 6 },
		{ type: "gator", faction: "scale_guard", x: 22, y: 6 },
		{ type: "viper", faction: "scale_guard", x: 18, y: 8 },

		// Venom Spires
		{ type: "venom_spire", faction: "scale_guard", x: 10, y: 14 },
		{ type: "venom_spire", faction: "scale_guard", x: 26, y: 14 },
		{ type: "venom_spire", faction: "scale_guard", x: 18, y: 4 },
	],

	startResources: { fish: 0, timber: 0, salvage: 0 },
	startPopCap: 6,

	objectives: {
		primary: [
			objective("rescue-fang", "Rescue Sgt. Fang"),
			objective("extract-south", "Extract to southern LZ"),
		],
		bonus: [objective("no-casualties", "Complete without losing any units")],
	},

	triggers: [
		trigger(
			"mission-start",
			on.timer(3),
			act.dialogue(
				"gen_whiskers",
				"Ravine approach is ahead. Use the flanking mangroves for concealment. The stronghold has three layers of defense before the detention block.",
			),
		),
		trigger(
			"outer-compound-entered",
			on.areaEntered("ura", "outer_compound"),
			act.dialogue(
				"gen_whiskers",
				"You're past the outer gate. Inner courtyard ahead — Vipers and a Snapper are guarding the passage to the detention block.",
			),
		),
		trigger(
			"courtyard-entered",
			on.areaEntered("ura", "inner_courtyard"),
			act.dialogue(
				"gen_whiskers",
				"Inside the courtyard. Detention block is through the north gate. Clear these guards and push through.",
			),
		),
		trigger("detention-reached", on.areaEntered("ura", "detention_block"), [
			act.completeObjective("rescue-fang"),
			act.spawn("sgt_fang", "ura", 18, 6, 1),
			act.exchange([
				{ speaker: "Sgt. Fang", text: "Bubbles. Took your sweet time." },
				{ speaker: "Sgt. Bubbles", text: "You're welcome. Can you fight?" },
				{ speaker: "Sgt. Fang", text: "Can I fight? I've been breaking rocks with my bare hands for two weeks. Give me something to hit." },
				{ speaker: "Sgt. Bubbles", text: "You'll get your chance. They're about to lock this place down." },
				{ speaker: "Sgt. Fang", text: "Good. I know a route through the courtyard. Stay behind me." },
			]),
		]),
		trigger("lockdown-triggered", on.objectiveComplete("rescue-fang"), [
			act.dialogue(
				"gen_whiskers",
				"Fang is free! But the compound is going into lockdown — reinforcements inbound from all sides! Fight your way to the southern extraction!",
			),
			act.spawn("gator", "scale_guard", 6, 16, 3),
			act.spawn("gator", "scale_guard", 30, 16, 3),
			act.spawn("viper", "scale_guard", 18, 26, 2),
			act.spawn("scout_lizard", "scale_guard", 10, 30, 2),
			act.spawn("scout_lizard", "scale_guard", 26, 30, 2),
		]),
		trigger(
			"halfway-out",
			on.areaEntered("ura", "ravine_approach"),
			act.dialogue("sgt_fang", "Almost there! Ravine's ahead — keep moving, don't stop!"),
		),
		trigger(
			"extraction-reached",
			on.areaEntered("ura", "extraction_lz"),
			act.completeObjective("extract-south"),
		),
		// Hero deaths = mission fail
		trigger("bubbles-death", on.unitCount("ura", "sgt_bubbles", "eq", 0), act.failMission()),
		trigger("fang-death", on.unitCount("ura", "sgt_fang", "eq", 0), act.failMission()),
		trigger("mission-complete", on.allPrimaryComplete(), [
			act.dialogue(
				"sgt_fang",
				"Extraction confirmed. Sergeant Fang reporting for duty. Chapter 3 complete — the Blackmarsh is liberated.",
			),
			act.victory(),
		]),
	],

	unlocks: {
		heroes: ["sgt_fang"],
	},

	parTime: 720,

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
			enemyHpMultiplier: 1.4,
			resourceMultiplier: 1.0,
			xpMultiplier: 1.5,
		},
	},
};
