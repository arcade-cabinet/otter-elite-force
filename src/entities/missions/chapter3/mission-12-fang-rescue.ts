// Mission 12: Fang Rescue — Hero / Commando
//
// Deep behind enemy lines, Sgt. Fang is captured at a Scale-Guard stronghold.
// Small strike team must infiltrate, rescue Fang, and fight out.
// Teaches: hero synergies, multi-phase mission, fighting retreat.
// Win: Rescue Sgt. Fang, extract to southern LZ.
// Par time: 7 min (420s).

import type { MissionDef } from "../../types";

export const mission12FangRescue: MissionDef = {
	id: "mission-12-fang-rescue",
	chapter: 3,
	mission: 12,
	name: "Fang Rescue",
	subtitle: "Infiltrate the Scale-Guard stronghold and rescue Sgt. Fang",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "We've located Sgt. Fang. He's being held at Scale-Guard's northern stronghold — a heavily fortified position on the cliffs above the Blackmarsh.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "This is a commando operation. Bubbles will lead a four-otter strike team through the ravine approach. The stronghold has layered defenses — walls, towers, and heavy patrols.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Fang is in the detention block at the north end of the compound. Once you free him, you'll have to fight your way back out — they'll lock down every exit.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Extraction is at the southern ravine entrance. Get Fang there alive. He's one of our best — we can't afford to lose him.",
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
			{
				id: "rescue-fang",
				description: "Rescue Sgt. Fang",
				type: "rescue",
				target: "sgt_fang",
				count: 1,
			},
			{
				id: "extract-south",
				description: "Extract to southern LZ",
				type: "explore",
			},
		],
		bonus: [
			{
				id: "no-casualties",
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
				"dialogue:gen_whiskers:Ravine approach is ahead. Use the flanking mangroves for concealment. The stronghold has three layers of defense before the detention block.",
			once: true,
		},
		{
			id: "outer-compound-entered",
			condition: "area_entered:ura:outer_compound",
			action:
				"dialogue:gen_whiskers:You're past the outer gate. Inner courtyard ahead — Vipers and a Snapper are guarding the passage to the detention block.",
			once: true,
		},
		{
			id: "courtyard-entered",
			condition: "area_entered:ura:inner_courtyard",
			action:
				"dialogue:gen_whiskers:Inside the courtyard. Detention block is through the north gate. Clear these guards and push through.",
			once: true,
		},
		{
			id: "detention-reached",
			condition: "area_entered:ura:detention_block",
			action:
				"complete_objective:rescue-fang|spawn:sgt_fang:ura:18:6:1|dialogue:sgt_fang:Bubbles! About time someone showed up. These scale-backs were about to transfer me to their main camp. Let's get out of here — I know a route through the courtyard.",
			once: true,
		},
		{
			id: "lockdown-triggered",
			condition: "objective_complete:rescue-fang",
			action:
				"dialogue:gen_whiskers:Fang is free! But the compound is going into lockdown — reinforcements inbound from all sides! Fight your way to the southern extraction!|spawn:gator:scale_guard:6:16:3|spawn:gator:scale_guard:30:16:3|spawn:viper:scale_guard:18:26:2|spawn:scout_lizard:scale_guard:10:30:2|spawn:scout_lizard:scale_guard:26:30:2",
			once: true,
		},
		{
			id: "halfway-out",
			condition: "area_entered:ura:ravine_approach",
			action: "dialogue:sgt_fang:Almost there! Ravine's ahead — keep moving, don't stop!",
			once: true,
		},
		{
			id: "extraction-reached",
			condition: "area_entered:ura:extraction_lz",
			action: "complete_objective:extract-south",
			once: true,
		},
		// Hero deaths = mission fail
		{
			id: "bubbles-death",
			condition: "unit_count:ura:sgt_bubbles:eq:0",
			action: "defeat",
			once: true,
		},
		{
			id: "fang-death",
			condition: "unit_count:ura:sgt_fang:eq:0",
			action: "defeat",
			once: true,
		},
		{
			id: "mission-complete",
			condition: "all_primary_complete",
			action:
				"dialogue:sgt_fang:Extraction confirmed. Sergeant Fang reporting for duty. Chapter 3 complete — the Blackmarsh is liberated.|victory",
			once: true,
		},
	],

	unlocks: {
		heroes: ["sgt_fang"],
	},

	parTime: 420,

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
