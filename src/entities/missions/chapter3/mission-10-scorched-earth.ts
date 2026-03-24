// Mission 10: Scorched Earth — Assault / Destruction
//
// Scale-Guard has fortified a fuel depot. Player must destroy 4 fuel tanks
// while managing fire spread and explosive chains.
// Teaches: explosive mechanics, fire hazards, siege tactics.
// Win: Destroy all 4 fuel tanks. Bonus: Under par time.
// Par time: 10 min (600s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission10ScorchedEarth: MissionDef = {
	id: "mission_10",
	chapter: 3,
	mission: 2,
	name: "The Healer's Grove",
	subtitle: "Destroy four Scale-Guard fuel depots in the Blackmarsh",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "Scale-Guard's northern offensive runs on fuel. Four fuel storage tanks are supplying their entire Blackmarsh operation — knock them out and their armor grinds to a halt.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Fair warning: those tanks are explosive. When they blow, fire spreads. Oil slicks around the depot will ignite — use that to your advantage, but don't get caught in it.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Sappers can plant charges on the tanks. Clear the guards, plant the charge, and pull your team back before the blast. Chain reactions are possible if tanks are close enough.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "Full base at your disposal. Build up, push in, and burn it all down. Make it count, Sergeant.",
			},
		],
	},

	terrain: {
		width: 56,
		height: 48,
		regions: [
			{ terrainId: "grass", fill: true },
			// Central fuel depot compound
			{ terrainId: "dirt", rect: { x: 18, y: 14, w: 20, h: 20 } },
			// Oil slick zones around fuel tanks
			{ terrainId: "toxic_sludge", circle: { cx: 22, cy: 18, r: 3 } },
			{ terrainId: "toxic_sludge", circle: { cx: 34, cy: 18, r: 3 } },
			{ terrainId: "toxic_sludge", circle: { cx: 22, cy: 30, r: 3 } },
			{ terrainId: "toxic_sludge", circle: { cx: 34, cy: 30, r: 3 } },
			// Approach roads
			{ terrainId: "dirt", rect: { x: 26, y: 34, w: 4, h: 14 } },
			{ terrainId: "dirt", rect: { x: 0, y: 22, w: 18, h: 4 } },
			// Player base (south)
			{ terrainId: "dirt", rect: { x: 18, y: 40, w: 20, h: 8 } },
			// Mangrove concealment (flanking routes)
			{ terrainId: "mangrove", rect: { x: 0, y: 10, w: 10, h: 12 } },
			{ terrainId: "mangrove", rect: { x: 46, y: 10, w: 10, h: 12 } },
			// Mud perimeter around depot
			{ terrainId: "mud", rect: { x: 16, y: 12, w: 24, h: 2 } },
			{ terrainId: "mud", rect: { x: 16, y: 34, w: 24, h: 2 } },
		],
		overrides: [],
	},

	zones: {
		ura_base: { x: 18, y: 40, width: 20, height: 8 },
		fuel_depot: { x: 18, y: 14, width: 20, height: 20 },
		tank_nw: { x: 20, y: 16, width: 5, height: 5 },
		tank_ne: { x: 32, y: 16, width: 5, height: 5 },
		tank_sw: { x: 20, y: 28, width: 5, height: 5 },
		tank_se: { x: 32, y: 28, width: 5, height: 5 },
		west_flank: { x: 0, y: 10, width: 10, height: 12 },
		east_flank: { x: 46, y: 10, width: 10, height: 12 },
	},

	placements: [
		// Player starting units
		{ type: "mudfoot", faction: "ura", zone: "ura_base", count: 6 },
		{ type: "shellcracker", faction: "ura", zone: "ura_base", count: 3 },
		{ type: "sapper", faction: "ura", zone: "ura_base", count: 2 },

		// Pre-built base
		{ type: "command_post", faction: "ura", x: 28, y: 44 },
		{ type: "barracks", faction: "ura", x: 24, y: 42 },
		{ type: "armory", faction: "ura", x: 32, y: 42 },

		// Fuel tanks
		{ type: "fuel_tank", faction: "scale_guard", x: 22, y: 18 },
		{ type: "fuel_tank", faction: "scale_guard", x: 34, y: 18 },
		{ type: "fuel_tank", faction: "scale_guard", x: 22, y: 30 },
		{ type: "fuel_tank", faction: "scale_guard", x: 34, y: 30 },

		// Depot defenders
		{ type: "gator", faction: "scale_guard", zone: "fuel_depot", count: 6 },
		{ type: "viper", faction: "scale_guard", x: 28, y: 20, count: 2 },
		{ type: "snapper", faction: "scale_guard", x: 28, y: 26, count: 2 },
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 18,
			y: 24,
			patrol: [
				[18, 24],
				[38, 24],
				[18, 24],
			],
		},

		// Perimeter turrets
		{ type: "venom_spire", faction: "scale_guard", x: 18, y: 14 },
		{ type: "venom_spire", faction: "scale_guard", x: 36, y: 14 },
		{ type: "venom_spire", faction: "scale_guard", x: 18, y: 34 },
		{ type: "venom_spire", faction: "scale_guard", x: 36, y: 34 },

		// Resources
		{ type: "fish_spot", faction: "neutral", x: 6, y: 44 },
		{ type: "salvage_cache", faction: "neutral", x: 44, y: 44 },
	],

	startResources: { fish: 300, timber: 250, salvage: 150 },
	startPopCap: 20,

	objectives: {
		primary: [
			objective("destroy-tank-nw", "Destroy NW fuel tank"),
			objective("destroy-tank-ne", "Destroy NE fuel tank"),
			objective("destroy-tank-sw", "Destroy SW fuel tank"),
			objective("destroy-tank-se", "Destroy SE fuel tank"),
		],
		bonus: [objective("speed-run", "Destroy all tanks within 8 minutes")],
	},

	triggers: [
		trigger(
			"mission-start",
			on.timer(3),
			act.dialogue(
				"gen_whiskers",
				"Four fuel tanks in the depot compound. Sappers can plant charges, or you can pound them with Shellcrackers. Watch for oil slick fires.",
			),
		),
		trigger(
			"depot-approach",
			on.areaEntered("ura", "fuel_depot"),
			act.dialogue(
				"gen_whiskers",
				"You're inside the depot perimeter. Guards are spread across all four quadrants. Clear them out before sending in Sappers.",
			),
		),
		trigger("first-tank-destroyed", on.buildingCount("scale_guard", "fuel_tank", "lte", 3), [
			act.completeObjective("destroy-tank-nw"),
			act.dialogue("gen_whiskers", "First tank down! Fire's spreading — watch your spacing. Three more to go."),
		]),
		trigger("second-tank-destroyed", on.buildingCount("scale_guard", "fuel_tank", "lte", 2), [
			act.completeObjective("destroy-tank-ne"),
			act.dialogue("gen_whiskers", "Second tank destroyed. They know we're here now — expect reinforcements."),
		]),
		trigger("third-tank-destroyed", on.buildingCount("scale_guard", "fuel_tank", "lte", 1), [
			act.completeObjective("destroy-tank-sw"),
			act.dialogue("gen_whiskers", "Three down! One more and their fuel supply is finished."),
		]),
		trigger("fourth-tank-destroyed", on.buildingCount("scale_guard", "fuel_tank", "eq", 0), [
			act.completeObjective("destroy-tank-se"),
			act.dialogue("gen_whiskers", "All fuel tanks destroyed. The Blackmarsh depot is burning."),
		]),
		trigger("reinforcements-1", on.timer(300), [
			act.dialogue("gen_whiskers", "Scale-Guard reinforcements from the north!"),
			act.spawn("gator", "scale_guard", 28, 2, 4),
			act.spawn("viper", "scale_guard", 26, 2, 2),
		]),
		trigger("reinforcements-2", on.timer(540), [
			act.spawn("gator", "scale_guard", 2, 24, 3),
			act.spawn("snapper", "scale_guard", 52, 24, 2),
			act.spawn("viper", "scale_guard", 28, 2, 3),
		]),
		trigger("mission-complete", on.allPrimaryComplete(), [
			act.dialogue(
				"gen_whiskers",
				"All four depots are ablaze. Scale-Guard's armor is stranded without fuel. The Blackmarsh is ours.",
			),
			act.victory(),
		]),
	],

	unlocks: {
		heroes: ["medic_marina"],
	},

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
			enemyDamageMultiplier: 1.3,
			enemyHpMultiplier: 1.3,
			resourceMultiplier: 0.75,
			xpMultiplier: 1.5,
		},
	},
};
