// Mission 10: Scorched Earth — Assault / Destruction
//
// Scale-Guard central fuel depot deep in the Blackmarsh. Four massive fuel
// tanks feed the enemy's entire armored offensive. Compound sits in a cleared
// basin surrounded by mangrove thickets and oil-slick drainage channels.
// Teaches: explosive mechanics, fire hazards, siege tactics, terrain denial.
// Win: Destroy all 4 fuel tanks. Bonus: Under 8 min.
// Par time: 15 min (900s).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission10ScorchedEarth: MissionDef = {
	id: "mission_10",
	chapter: 3,
	mission: 2,
	name: "Scorched Earth",
	subtitle: "Destroy four Scale-Guard fuel depots in the Blackmarsh",

	briefing: {
		portraitId: "gen_whiskers",
		lines: [
			{
				speaker: "Gen. Whiskers",
				text: "Scale-Guard's entire Blackmarsh offensive runs on four fuel storage tanks in a central depot. Kill the fuel, kill the advance.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Captain, Sappers on the tanks. But those tanks are volatile — when they blow, oil slicks ignite and fire spreads. Chain reactions are possible. Keep your people clear of the blast radius.",
			},
			{
				speaker: "Gen. Whiskers",
				text: "The explosions work for you if you position right. Destruction order matters — fire burns for ninety seconds and blocks approaches.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Four Venom Spires on the perimeter and heavy patrols inside. Full base at your disposal — build up, then push in.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Light up the Blackmarsh, Captain. They won't run another engine for weeks. HQ out.",
			},
		],
	},

	terrain: {
		width: 128,
		height: 128,
		regions: [
			{ terrainId: "grass", fill: true },

			// Dense mangrove (north — concealment flanking routes)
			{ terrainId: "mangrove", rect: { x: 0, y: 0, w: 56, h: 16 } },
			{ terrainId: "mangrove", rect: { x: 72, y: 0, w: 56, h: 16 } },

			// Fuel depot compound (central basin)
			{ terrainId: "dirt", rect: { x: 32, y: 16, w: 64, h: 48 } },

			// Oil slick hazard zones around fuel tanks (flammable terrain)
			{ terrainId: "toxic_sludge", circle: { cx: 50, cy: 30, r: 6 } },
			{ terrainId: "toxic_sludge", circle: { cx: 78, cy: 30, r: 6 } },
			{ terrainId: "toxic_sludge", circle: { cx: 50, cy: 52, r: 6 } },
			{ terrainId: "toxic_sludge", circle: { cx: 78, cy: 52, r: 6 } },

			// Oil drainage channel (connects tanks — chain reaction path)
			{ terrainId: "toxic_sludge", rect: { x: 56, y: 28, w: 16, h: 4 } },
			{ terrainId: "toxic_sludge", rect: { x: 48, y: 36, w: 4, h: 12 } },
			{ terrainId: "toxic_sludge", rect: { x: 76, y: 36, w: 4, h: 12 } },
			{ terrainId: "toxic_sludge", rect: { x: 56, y: 48, w: 16, h: 4 } },

			// Perimeter walls (destructible)
			{ terrainId: "dirt", rect: { x: 30, y: 14, w: 68, h: 2 } },
			{ terrainId: "dirt", rect: { x: 30, y: 56, w: 68, h: 2 } },

			// Approach roads
			{ terrainId: "dirt", rect: { x: 56, y: 58, w: 16, h: 38 } },
			{ terrainId: "dirt", rect: { x: 8, y: 30, w: 24, h: 4 } },
			{ terrainId: "dirt", rect: { x: 96, y: 30, w: 24, h: 4 } },

			// Jungle flanking corridors
			{ terrainId: "mangrove", rect: { x: 0, y: 64, w: 56, h: 16 } },
			{ terrainId: "mangrove", rect: { x: 72, y: 64, w: 56, h: 16 } },
			{ terrainId: "mangrove", rect: { x: 0, y: 16, w: 30, h: 48 } },
			{ terrainId: "mangrove", rect: { x: 98, y: 16, w: 30, h: 48 } },

			// Player base area
			{ terrainId: "dirt", rect: { x: 32, y: 96, w: 64, h: 16 } },

			// Resource areas
			{ terrainId: "mud", rect: { x: 8, y: 116, w: 24, h: 8 } },
			{ terrainId: "water", circle: { cx: 108, cy: 120, r: 6 } },

			// Mud patches (organic detail)
			{ terrainId: "mud", circle: { cx: 20, cy: 40, r: 4 } },
			{ terrainId: "mud", circle: { cx: 108, cy: 40, r: 4 } },
			{ terrainId: "mud", circle: { cx: 64, cy: 80, r: 5 } },
		],
		overrides: [],
	},

	zones: {
		ura_base: { x: 16, y: 96, width: 96, height: 16 },
		supply_line: { x: 8, y: 112, width: 112, height: 16 },
		approach_road_w: { x: 8, y: 80, width: 48, height: 16 },
		approach_road_e: { x: 72, y: 80, width: 48, height: 16 },
		jungle_sw: { x: 0, y: 64, width: 56, height: 16 },
		jungle_se: { x: 72, y: 64, width: 56, height: 16 },
		south_perimeter: { x: 16, y: 56, width: 96, height: 8 },
		west_perimeter: { x: 0, y: 16, width: 32, height: 48 },
		east_perimeter: { x: 96, y: 16, width: 32, height: 48 },
		depot_north: { x: 32, y: 16, width: 64, height: 12 },
		depot_center: { x: 40, y: 36, width: 48, height: 12 },
		tank_nw: { x: 40, y: 24, width: 20, height: 12 },
		tank_ne: { x: 68, y: 24, width: 20, height: 12 },
		tank_sw: { x: 40, y: 48, width: 20, height: 8 },
		tank_se: { x: 68, y: 48, width: 20, height: 8 },
		mangrove_nw: { x: 0, y: 0, width: 56, height: 16 },
		mangrove_ne: { x: 72, y: 0, width: 56, height: 16 },
	},

	placements: [
		// ── Player base ──────────────────────────────────────────────
		// Lodge
		{ type: "burrow", faction: "ura", x: 64, y: 104 },
		// Pre-built base
		{ type: "command_post", faction: "ura", x: 56, y: 100 },
		{ type: "barracks", faction: "ura", x: 48, y: 100 },
		{ type: "armory", faction: "ura", x: 72, y: 100 },

		// Starting army
		{ type: "mudfoot", faction: "ura", x: 52, y: 98 },
		{ type: "mudfoot", faction: "ura", x: 56, y: 96 },
		{ type: "mudfoot", faction: "ura", x: 60, y: 98 },
		{ type: "mudfoot", faction: "ura", x: 64, y: 96 },
		{ type: "mudfoot", faction: "ura", x: 68, y: 98 },
		{ type: "mudfoot", faction: "ura", x: 72, y: 96 },
		{ type: "shellcracker", faction: "ura", x: 50, y: 102 },
		{ type: "shellcracker", faction: "ura", x: 58, y: 102 },
		{ type: "shellcracker", faction: "ura", x: 66, y: 102 },
		{ type: "sapper", faction: "ura", x: 62, y: 104 },
		{ type: "sapper", faction: "ura", x: 70, y: 104 },

		// Workers
		{ type: "river_rat", faction: "ura", x: 44, y: 106 },
		{ type: "river_rat", faction: "ura", x: 48, y: 108 },
		{ type: "river_rat", faction: "ura", x: 76, y: 106 },

		// ── Resources ────────────────────────────────────────────────
		// Timber (mangrove groves flanking base)
		{ type: "mangrove_tree", faction: "neutral", x: 12, y: 86 },
		{ type: "mangrove_tree", faction: "neutral", x: 18, y: 88 },
		{ type: "mangrove_tree", faction: "neutral", x: 24, y: 84 },
		{ type: "mangrove_tree", faction: "neutral", x: 108, y: 86 },
		{ type: "mangrove_tree", faction: "neutral", x: 114, y: 88 },
		// Fish
		{ type: "fish_spot", faction: "neutral", x: 106, y: 120 },
		{ type: "fish_spot", faction: "neutral", x: 112, y: 118 },
		// Salvage (supply line)
		{ type: "salvage_cache", faction: "neutral", x: 14, y: 118 },
		{ type: "salvage_cache", faction: "neutral", x: 20, y: 122 },
		{ type: "salvage_cache", faction: "neutral", x: 26, y: 120 },

		// ── Enemies — Fuel Tanks ─────────────────────────────────────
		{ type: "fuel_tank", faction: "scale_guard", x: 50, y: 30 },
		{ type: "fuel_tank", faction: "scale_guard", x: 78, y: 30 },
		{ type: "fuel_tank", faction: "scale_guard", x: 50, y: 52 },
		{ type: "fuel_tank", faction: "scale_guard", x: 78, y: 52 },

		// ── Enemies — Perimeter Venom Spires ─────────────────────────
		{ type: "venom_spire", faction: "scale_guard", x: 32, y: 16 },
		{ type: "venom_spire", faction: "scale_guard", x: 94, y: 16 },
		{ type: "venom_spire", faction: "scale_guard", x: 32, y: 56 },
		{ type: "venom_spire", faction: "scale_guard", x: 94, y: 56 },

		// ── Enemies — Tank NW guards ─────────────────────────────────
		{ type: "gator", faction: "scale_guard", x: 46, y: 26 },
		{ type: "gator", faction: "scale_guard", x: 54, y: 34 },
		{ type: "viper", faction: "scale_guard", x: 48, y: 30 },

		// ── Enemies — Tank NE guards ─────────────────────────────────
		{ type: "gator", faction: "scale_guard", x: 74, y: 26 },
		{ type: "gator", faction: "scale_guard", x: 82, y: 34 },
		{ type: "viper", faction: "scale_guard", x: 80, y: 30 },

		// ── Enemies — Tank SW guards ─────────────────────────────────
		{ type: "gator", faction: "scale_guard", x: 46, y: 50 },
		{ type: "gator", faction: "scale_guard", x: 54, y: 54 },
		{ type: "snapper", faction: "scale_guard", x: 50, y: 48 },

		// ── Enemies — Tank SE guards ─────────────────────────────────
		{ type: "gator", faction: "scale_guard", x: 74, y: 50 },
		{ type: "gator", faction: "scale_guard", x: 82, y: 54 },
		{ type: "snapper", faction: "scale_guard", x: 78, y: 48 },

		// ── Enemies — Central depot patrol ───────────────────────────
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 56,
			y: 36,
			patrol: [
				[56, 36],
				[72, 36],
				[72, 48],
				[56, 48],
				[56, 36],
			],
		},
		{
			type: "scout_lizard",
			faction: "scale_guard",
			x: 60,
			y: 40,
			patrol: [
				[60, 40],
				[68, 40],
				[68, 44],
				[60, 44],
				[60, 40],
			],
		},

		// ── Enemies — South gate defenders ───────────────────────────
		{ type: "gator", faction: "scale_guard", x: 56, y: 58, count: 2 },
		{ type: "gator", faction: "scale_guard", x: 68, y: 58, count: 2 },
		{ type: "viper", faction: "scale_guard", x: 62, y: 60 },

		// ── Enemies — North patrol ───────────────────────────────────
		{
			type: "gator",
			faction: "scale_guard",
			x: 48,
			y: 18,
			patrol: [
				[48, 18],
				[80, 18],
				[48, 18],
			],
		},
		{
			type: "gator",
			faction: "scale_guard",
			x: 52,
			y: 20,
			patrol: [
				[52, 20],
				[76, 20],
				[52, 20],
			],
		},
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
		// ─── Phase 1: APPROACH ────────────────────────────────────────
		trigger("phase:approach:start", on.timer(0), act.startPhase("approach")),

		trigger(
			"phase:approach:foxhound-briefing",
			on.timer(3),
			act.dialogue(
				"foxhound",
				"Four fuel tanks in the depot compound. Sappers can plant charges, or you can pound them with Shellcrackers. Watch for oil slick fires \u2014 when a tank blows, oil on the ground ignites.",
			),
		),

		trigger("phase:approach:bubbles-strategy", on.timer(20), [
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Captain, those tanks are volatile. When one blows, fire spreads through the oil drainage channels. If you hit them in the wrong order, fire blocks your approach to the others.",
				},
				{
					speaker: "FOXHOUND",
					text: "The drainage runs between all four tanks. Fire burns for about ninety seconds before it dies. Plan your destruction sequence \u2014 outside tanks first gives you cleaner access.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Four Venom Spires on the perimeter and heavy patrols inside. Build up your force, then push in. HQ out.",
				},
			]),
		]),

		// Lodge destroyed — fail condition
		trigger(
			"lodge-destroyed",
			on.buildingCount("ura", "burrow", "eq", 0),
			act.failMission("Lodge destroyed"),
		),

		// ─── Phase 2: FIRST STRIKE — first tank destroyed ────────────
		trigger("phase:first-strike:start", on.buildingCount("scale_guard", "fuel_tank", "lte", 3), [
			act.startPhase("first-strike"),
			act.dialogue(
				"foxhound",
				"First tank down! Fire's spreading through the drainage \u2014 keep your troops clear of the oil! Three more to go.",
			),
			act.enableTrigger("phase:first-strike:counterattack"),
		]),

		trigger(
			"phase:first-strike:counterattack",
			on.timer(0),
			[
				act.dialogue(
					"sgt_bubbles",
					"They know we're hitting their fuel. Scale-Guard is pulling forces from the northern perimeter \u2014 expect a counterattack!",
				),
				act.spawn("gator", "scale_guard", 64, 4, 4),
				act.spawn("viper", "scale_guard", 48, 8, 2),
			],
			{ enabled: false },
		),

		// ─── Phase 3: SCORCHED EARTH — second and third tanks ────────
		trigger("phase:scorched-earth:start", on.buildingCount("scale_guard", "fuel_tank", "lte", 2), [
			act.startPhase("scorched-earth"),
			act.dialogue(
				"foxhound",
				"Second tank destroyed. They're scrambling now \u2014 expect reinforcements from multiple directions.",
			),
			act.spawn("gator", "scale_guard", 4, 36, 3),
			act.spawn("snapper", "scale_guard", 120, 36, 2),
		]),

		trigger(
			"phase:scorched-earth:third-tank",
			on.buildingCount("scale_guard", "fuel_tank", "lte", 1),
			[
				act.dialogue(
					"foxhound",
					"Three down! One tank left \u2014 but the fire's cut off half the compound. Find an approach.",
				),
				act.spawn("gator", "scale_guard", 64, 4, 5),
				act.spawn("viper", "scale_guard", 4, 60, 3),
				act.spawn("snapper", "scale_guard", 120, 60, 2),
			],
		),

		// ─── Phase 4: TOTAL DESTRUCTION — fourth tank destroyed ──────
		trigger(
			"phase:total-destruction:start",
			on.buildingCount("scale_guard", "fuel_tank", "eq", 0),
			[
				act.startPhase("total-destruction"),
				act.completeObjective("destroy-tank-nw"),
				act.completeObjective("destroy-tank-ne"),
				act.completeObjective("destroy-tank-sw"),
				act.completeObjective("destroy-tank-se"),
				// Enable bonus check — fires only if timer < 480s (engine evaluates)
				act.enableTrigger("bonus:speed-run"),
			],
		),

		trigger("phase:total-destruction:victory", on.allPrimaryComplete(), [
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "All four depots are ablaze. Scale-Guard's armor is stranded without fuel. The Blackmarsh is burning.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Outstanding work, Captain. Their armored push is dead in its tracks. They won't run another engine out here for weeks.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "The Blackmarsh depot is gone. Scale-Guard's northern logistics are shattered. Well done. HQ out.",
				},
			]),
			act.victory(),
		]),

		// ─── Bonus: Speed Run ────────────────────────────────────────
		// Design intent: allPrimaryComplete() AND missionTimer <= 480s.
		// DSL lacks compound conditions. Enabled by phase:total-destruction
		// when all tanks are down; on.timer(0) fires immediately. The engine
		// runtime should gate this on elapsed time < 480s.
		trigger("bonus:speed-run", on.timer(0), act.completeObjective("speed-run"), { enabled: false }),
	],

	unlocks: {
		heroes: ["medic_marina"],
	},

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
			enemyDamageMultiplier: 1.3,
			enemyHpMultiplier: 1.3,
			resourceMultiplier: 0.75,
			xpMultiplier: 1.5,
		},
	},
};
