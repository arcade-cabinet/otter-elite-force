// Mission 1-2: THE CAUSEWAY — Escort / Defend
//
// Dense jungle interior of Copper-Silt Reach. A narrow dirt causeway cuts
// north through swamp and canopy. Scale-Guard ambush territory. OEF must
// escort a supply convoy from the southern depot to the northern firebase
// staging area. Three prepared ambush positions along the road, each
// escalating in difficulty.
//
// Teaches: combat, escort mechanics, managing objectives under pressure.
// Win:  All 3 convoy trucks reach the northern extraction point.
// Lose: Lodge destroyed OR all 3 convoy trucks destroyed.
// Par time: 20 min (1200s).
// Unlocks: Shellcracker (heavy infantry).

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission02Causeway: MissionDef = {
	id: "mission_2",
	chapter: 1,
	mission: 2,
	name: "The Causeway",
	subtitle: "Escort a supply convoy through hostile jungle",

	briefing: {
		portraitId: "foxhound",
		lines: [
			{
				speaker: "Col. Bubbles",
				text: "Captain, listen up. Three supply trucks need to reach Firebase Delta up north. The causeway is the only road through this swamp, and Scale-Guard knows it.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Those trucks are loaded with munitions and construction materials. We lose them, we lose our foothold in the Reach.",
			},
			{
				speaker: "FOXHOUND",
				text: "Intel shows at least three prepared ambush positions along the causeway. They've had days to dig in.",
			},
			{
				speaker: "FOXHOUND",
				text: "I'll mark contacts as we spot them. Keep your soldiers ahead of the convoy — those trucks can't shoot back.",
			},
			{
				speaker: "Col. Bubbles",
				text: "You've got a Barracks and some Mudfoots. Train more if you want, but don't take forever — every minute is a minute they use to reinforce.",
			},
		],
	},

	// ─── 128×128 Terrain ───

	terrain: {
		width: 128,
		height: 128,
		regions: [
			// Base layer — grass
			{ terrainId: "grass", fill: true },

			// Dense jungle canopy (most of the map, north of depot)
			{ terrainId: "jungle", rect: { x: 0, y: 0, w: 128, h: 88 } },

			// Dirt causeway — winding north-south road, modeled as a river-width path
			{
				terrainId: "dirt",
				river: {
					points: [
						[32, 88],
						[30, 80],
						[28, 72],
						[32, 64],
						[36, 56],
						[34, 48],
						[30, 40],
						[28, 32],
						[32, 24],
						[36, 16],
						[40, 8],
						[44, 4],
					],
					width: 8,
				},
			},

			// Depot clearing (south)
			{ terrainId: "dirt", rect: { x: 8, y: 88, w: 112, h: 40 } },

			// Extraction clearing (north)
			{ terrainId: "dirt", rect: { x: 68, y: 0, w: 48, h: 8 } },

			// Swamp / bog zones
			{ terrainId: "swamp", rect: { x: 0, y: 56, w: 24, h: 16 } },
			{ terrainId: "swamp", rect: { x: 0, y: 16, w: 24, h: 8 } },
			{ terrainId: "swamp", circle: { cx: 16, cy: 64, r: 6 } },
			{ terrainId: "swamp", circle: { cx: 12, cy: 20, r: 5 } },

			// Mud patches along causeway edges
			{ terrainId: "mud", rect: { x: 20, y: 70, w: 8, h: 4 } },
			{ terrainId: "mud", rect: { x: 22, y: 46, w: 6, h: 4 } },
			{ terrainId: "mud", rect: { x: 24, y: 30, w: 8, h: 4 } },

			// Ambush ridge (ambush_3 — elevated terrain)
			{ terrainId: "rock", rect: { x: 72, y: 8, w: 40, h: 12 } },

			// Mangrove pockets
			{ terrainId: "mangrove", rect: { x: 8, y: 58, w: 16, h: 10 } },
			{ terrainId: "mangrove", circle: { cx: 100, cy: 60, r: 6 } },

			// Supply cache clearing
			{ terrainId: "dirt", rect: { x: 76, y: 42, w: 16, h: 8 } },

			// Ambush 2 ravine (impassable flanking terrain)
			{ terrainId: "water", rect: { x: 4, y: 26, w: 12, h: 4 } },
		],
		overrides: [],
	},

	// ─── Zones ───

	zones: {
		depot_zone: { x: 8, y: 88, width: 112, height: 40 },
		causeway_south: { x: 8, y: 72, width: 48, height: 16 },
		jungle_se: { x: 64, y: 72, width: 56, height: 16 },
		swamp_south: { x: 8, y: 56, width: 48, height: 16 },
		ambush_1: { x: 64, y: 56, width: 56, height: 16 },
		causeway_mid: { x: 8, y: 40, width: 48, height: 16 },
		supply_cache: { x: 64, y: 40, width: 56, height: 16 },
		ambush_2: { x: 8, y: 24, width: 48, height: 16 },
		jungle_ne: { x: 64, y: 24, width: 56, height: 16 },
		swamp_north: { x: 8, y: 16, width: 48, height: 8 },
		ambush_3: { x: 64, y: 8, width: 56, height: 16 },
		jungle_nw: { x: 8, y: 0, width: 48, height: 16 },
		extraction_point: { x: 64, y: 0, width: 56, height: 8 },
	},

	// ─── Placements ───

	placements: [
		// ── Player (depot_zone) ──

		// Lodge (Captain's field HQ)
		{ type: "burrow", faction: "ura", x: 24, y: 96 },

		// Starting combat units — 6 Mudfoots
		{ type: "mudfoot", faction: "ura", x: 20, y: 94 },
		{ type: "mudfoot", faction: "ura", x: 22, y: 98 },
		{ type: "mudfoot", faction: "ura", x: 26, y: 98 },
		{ type: "mudfoot", faction: "ura", x: 28, y: 94 },
		{ type: "mudfoot", faction: "ura", x: 30, y: 96 },
		{ type: "mudfoot", faction: "ura", x: 18, y: 96 },

		// Starting workers — 2 River Rats
		{ type: "river_rat", faction: "ura", x: 32, y: 100 },
		{ type: "river_rat", faction: "ura", x: 36, y: 100 },

		// Pre-built buildings
		{ type: "barracks", faction: "ura", x: 40, y: 96 },
		{ type: "command_post", faction: "ura", x: 48, y: 96 },

		// Convoy trucks (scripted entities, follow causeway path)
		{ type: "convoy_truck", faction: "ura", x: 56, y: 100 },
		{ type: "convoy_truck", faction: "ura", x: 60, y: 100 },
		{ type: "convoy_truck", faction: "ura", x: 64, y: 100 },

		// ── Resources ──

		// Timber (jungle southeast)
		{ type: "jungle_tree", faction: "neutral", x: 70, y: 74 },
		{ type: "jungle_tree", faction: "neutral", x: 76, y: 76 },
		{ type: "jungle_tree", faction: "neutral", x: 82, y: 78 },
		{ type: "jungle_tree", faction: "neutral", x: 88, y: 74 },
		{ type: "jungle_tree", faction: "neutral", x: 74, y: 80 },
		{ type: "jungle_tree", faction: "neutral", x: 80, y: 82 },

		// Fish (swamp ponds)
		{ type: "fish_spot", faction: "neutral", x: 14, y: 62 },
		{ type: "fish_spot", faction: "neutral", x: 10, y: 18 },

		// Salvage (hidden supply cache)
		{ type: "salvage_cache", faction: "neutral", x: 80, y: 44 },
		{ type: "salvage_cache", faction: "neutral", x: 84, y: 46 },
		{ type: "salvage_cache", faction: "neutral", x: 78, y: 48 },

		// Crate drops (bonus resources off-road)
		{ type: "supply_crate", faction: "neutral", x: 100, y: 36 },

		// ── Enemies — Ambush 2 (static, dug-in along ravine) ──

		{ type: "gator", faction: "scale_guard", x: 14, y: 26 },
		{ type: "gator", faction: "scale_guard", x: 18, y: 28 },
		{ type: "gator", faction: "scale_guard", x: 22, y: 26 },
		{ type: "gator", faction: "scale_guard", x: 26, y: 30 },
		{ type: "gator", faction: "scale_guard", x: 30, y: 28 },
		{ type: "skink", faction: "scale_guard", x: 12, y: 30 },
		{ type: "skink", faction: "scale_guard", x: 34, y: 30 },
		// Log barricade (destructible, blocks road)
		{ type: "log_barricade", faction: "scale_guard", x: 28, y: 28 },

		// ── Enemies — Ambush 3 (elevated ridge) ──

		{ type: "gator", faction: "scale_guard", x: 76, y: 10 },
		{ type: "gator", faction: "scale_guard", x: 80, y: 12 },
		{ type: "gator", faction: "scale_guard", x: 84, y: 10 },
		{ type: "gator", faction: "scale_guard", x: 88, y: 14 },
		{ type: "viper", faction: "scale_guard", x: 92, y: 10 },
		{ type: "viper", faction: "scale_guard", x: 96, y: 12 },
		{ type: "skink", faction: "scale_guard", x: 100, y: 8 },
		{ type: "skink", faction: "scale_guard", x: 104, y: 10 },
		// Mortar emplacement on ridge
		{ type: "mortar_pit", faction: "scale_guard", x: 88, y: 8 },

		// ── Enemies — Patrols (jungle_ne, active throughout) ──

		{
			type: "skink",
			faction: "scale_guard",
			x: 80,
			y: 28,
			patrol: [
				[80, 28],
				[90, 32],
				[100, 28],
				[90, 24],
			],
		},
		{
			type: "skink",
			faction: "scale_guard",
			x: 82,
			y: 30,
			patrol: [
				[82, 30],
				[92, 34],
				[102, 30],
				[92, 26],
			],
		},
	],

	// ─── Starting Resources ───

	startResources: { fish: 200, timber: 100, salvage: 50 },
	startPopCap: 15,

	// ─── Objectives ───

	objectives: {
		primary: [
			objective("escort-convoy", "Escort all 3 convoy trucks to the extraction point"),
			objective("clear-ambush-1", "Clear the first ambush"),
			objective("clear-barricade", "Destroy the road barricade"),
			objective("clear-ravine", "Clear the ravine ambush"),
			objective("destroy-mortar", "Destroy the mortar pit on the ridge"),
		],
		bonus: [objective("bonus-supply-cache", "Find the hidden supply cache")],
	},

	// ─── Triggers ───

	triggers: [
		// ────────────────────────────────────────────
		// Phase 1: MUSTERING (mission start → ~4:00)
		// ────────────────────────────────────────────

		trigger(
			"phase:mustering:bubbles-briefing",
			on.timer(5),
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Captain, listen up. Three supply trucks need to reach Firebase Delta up north. The causeway is the only road through this swamp, and Scale-Guard knows it.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Those trucks are loaded with munitions and construction materials. We lose them, we lose our foothold in the Reach.",
				},
			]),
		),

		trigger(
			"phase:mustering:foxhound-intel",
			on.timer(20),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Intel shows at least three prepared ambush positions along the causeway. They've had days to dig in.",
				},
				{
					speaker: "FOXHOUND",
					text: "I'll mark contacts as we spot them. Keep your soldiers ahead of the convoy — those trucks can't shoot back.",
				},
			]),
		),

		trigger(
			"phase:mustering:bubbles-move-out",
			on.timer(45),
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "You've got a Barracks and some Mudfoots. Train more if you want, but don't take forever — every minute is a minute they use to reinforce.",
				},
				{
					speaker: "Col. Bubbles",
					text: "When you're ready, move a unit north onto the causeway. The convoy will follow your lead.",
				},
			]),
		),

		// Convoy starts when a Mudfoot enters causeway_south
		trigger(
			"phase:mustering:convoy-start",
			on.areaEntered("ura", "causeway_south", { unitType: "mudfoot" }),
			[
				act.dialogue(
					"sgt_bubbles",
					"Convoy is rolling. Stay ahead of the trucks, Captain. They'll follow the road — you handle the ambushes.",
				),
				act.startPhase("first-ambush"),
				act.addObjective("keep-trucks-alive", "Keep at least 1 truck alive", "primary"),
			],
		),

		// ────────────────────────────────────────────
		// Phase 2: FIRST BLOOD (~4:00 → ~9:00)
		// ────────────────────────────────────────────

		// Ambush 1 — spawns when convoy/player enters ambush_1 zone
		trigger("phase:first-ambush:ambush-1-trigger", on.areaEntered("ura", "ambush_1"), [
			act.spawn("gator", "scale_guard", 72, 58, 4),
			act.spawn("skink", "scale_guard", 80, 62, 2),
			act.dialogue(
				"foxhound",
				"Ambush! Contacts in the treeline, east side! They're targeting the trucks!",
			),
			act.dialogue("sgt_bubbles", "Get your Mudfoots in front of those trucks NOW!"),
		]),

		// Truck damage warnings
		trigger(
			"phase:first-ambush:truck-damaged-warning",
			on.healthThreshold("convoy_truck", 50, "below"),
			act.dialogue(
				"foxhound",
				"Truck taking heavy damage! Pull your fighters in close — don't let them pick off the convoy!",
			),
		),

		trigger(
			"phase:first-ambush:truck-destroyed-1",
			on.unitCount("ura", "convoy_truck", "lte", 2),
			act.dialogue(
				"sgt_bubbles",
				"We lost a truck! Damn it — protect the rest, Captain. We can still make this work with two.",
			),
		),

		trigger(
			"phase:first-ambush:truck-destroyed-2",
			on.unitCount("ura", "convoy_truck", "lte", 1),
			act.dialogue(
				"sgt_bubbles",
				"Two trucks down! One left, Captain — if we lose that last one, it's over. Everything rides on it.",
			),
		),

		// All trucks destroyed — mission failure
		trigger(
			"phase:first-ambush:all-trucks-destroyed",
			on.unitCount("ura", "convoy_truck", "eq", 0),
			[
				act.exchange([
					{
						speaker: "Col. Bubbles",
						text: "All trucks destroyed. The convoy is gone, Captain. Firebase Delta won't get its supplies.",
					},
					{
						speaker: "Gen. Whiskers",
						text: "Mission failed. Pull your forces back to the depot. We'll have to find another way.",
					},
				]),
				act.failMission("All convoy trucks destroyed"),
			],
		),

		// First ambush cleared → advance to Phase 3
		trigger("phase:first-ambush:ambush-1-cleared", on.areaEntered("ura", "causeway_mid"), [
			act.completeObjective("clear-ambush-1"),
			act.dialogue(
				"foxhound",
				"First ambush site clear. Convoy's moving again. Road narrows up ahead — stay sharp.",
			),
			act.revealZone("causeway_mid"),
			act.revealZone("supply_cache"),
			act.startPhase("ravine-ambush"),
		]),

		// ────────────────────────────────────────────
		// Phase 3: THE RAVINE (~9:00 → ~15:00)
		// ────────────────────────────────────────────

		trigger(
			"phase:ravine-ambush:briefing",
			on.objectiveComplete("clear-ambush-1"),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Road ahead crosses a ravine. I'm reading a barricade — they've dropped logs across the causeway. Convoy can't pass until it's cleared.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Send your boys in. Clear the barricade, clear the hostiles. The convoy will hold position until the road is open.",
				},
			]),
		),

		trigger("phase:ravine-ambush:barricade-approach", on.areaEntered("ura", "ambush_2"), [
			act.dialogue(
				"foxhound",
				"Multiple contacts along the ravine. They're dug in. Watch the flanks — Skinks in the treeline.",
			),
			act.addObjective("clear-barricade-obj", "Clear the road barricade", "primary"),
			act.addObjective("clear-ravine-obj", "Escort the convoy past the ravine", "primary"),
		]),

		trigger("phase:ravine-ambush:barricade-destroyed", on.buildingDestroyed("log_barricade"), [
			act.completeObjective("clear-barricade"),
			act.dialogue("sgt_bubbles", "Barricade is down. Convoy, roll forward!"),
		]),

		// Bonus: supply cache
		trigger("phase:ravine-ambush:supply-cache-found", on.areaEntered("ura", "supply_cache"), [
			act.dialogue(
				"foxhound",
				"Looks like Scale-Guard left supplies behind east of the road. Salvage for the taking, Captain.",
			),
		]),

		trigger(
			"phase:ravine-ambush:supply-cache-collected",
			on.resourceThreshold("salvage", "gte", 150),
			act.completeObjective("bonus-supply-cache"),
		),

		// Ravine cleared → advance to Phase 4
		trigger("phase:ravine-ambush:ravine-cleared", on.objectiveComplete("clear-barricade"), [
			act.completeObjective("clear-ravine"),
			act.dialogue("foxhound", "Ravine clear. One more stretch, Captain. And it's the worst one."),
			act.revealZone("ambush_3"),
			act.revealZone("swamp_north"),
			act.revealZone("extraction_point"),
			act.startPhase("final-push"),
		]),

		// ────────────────────────────────────────────
		// Phase 4: FINAL PUSH (~15:00+)
		// ────────────────────────────────────────────

		trigger(
			"phase:final-push:briefing",
			on.objectiveComplete("clear-ravine"),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Last stretch. Ridge overlooking the road at the north end — they've got a mortar up there. If that thing fires on the convoy, it's over fast.",
				},
				{
					speaker: "Col. Bubbles",
					text: "That mortar is your priority. Take the ridge, kill the gun, then bring the trucks home.",
				},
			]),
		),

		// Mortar fires when player approaches ambush_3
		trigger("phase:final-push:mortar-fires", on.areaEntered("ura", "ambush_3"), [
			act.dialogue(
				"foxhound",
				"Mortar firing! Incoming on the convoy! Take out that emplacement, Captain!",
			),
			act.addObjective("destroy-mortar-obj", "Destroy the mortar pit on the ridge", "primary"),
			// Arm delayed reinforcement trigger
			act.enableTrigger("phase:final-push:ridge-reinforcements"),
		]),

		// Ridge reinforcements — 45s after mortar fires
		trigger(
			"phase:final-push:ridge-reinforcements",
			on.timer(1200 + 45),
			[
				act.spawn("gator", "scale_guard", 68, 14, 4),
				act.spawn("skink", "scale_guard", 72, 10, 2),
				act.dialogue(
					"foxhound",
					"Reinforcements from the northwest! They're trying to box you in!",
				),
			],
			{ enabled: false },
		),

		// Mortar destroyed
		trigger("phase:final-push:mortar-destroyed", on.buildingDestroyed("mortar_pit"), [
			act.completeObjective("destroy-mortar"),
			act.dialogue("sgt_bubbles", "Mortar's down! Clear the ridge and get those trucks moving!"),
		]),

		// Ridge fully cleared
		trigger(
			"phase:final-push:ridge-cleared",
			on.objectiveComplete("destroy-mortar"),
			act.dialogue(
				"foxhound",
				"Ridge is clear. Road's open all the way to extraction. Bring them home.",
			),
		),

		// Convoy reaches extraction
		trigger(
			"phase:final-push:convoy-arrives",
			on.areaEntered("ura", "extraction_point"),
			act.completeObjective("escort-convoy"),
		),

		// ────────────────────────────────────────────
		// Mission Complete / Lodge Destroyed
		// ────────────────────────────────────────────

		trigger("phase:complete:mission-complete", on.allPrimaryComplete(), [
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Convoy's in! Outstanding work, Captain. Firebase Delta has the supplies it needs.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "The causeway is ours. First Landing holds. I'm sending you a new unit — Shellcrackers. Heavy infantry. You've earned the firepower.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Get some rest. The next op won't wait long. HQ out.",
				},
			]),
			act.victory(),
		]),

		// Lodge destroyed — mission failure
		trigger("phase:complete:lodge-destroyed", on.buildingDestroyed("burrow"), [
			act.dialogue(
				"sgt_bubbles",
				"The lodge is gone! We've lost our command structure. Fall back!",
			),
			act.failMission("Lodge destroyed"),
		]),
	],

	// ─── Unlocks ───

	unlocks: {
		units: ["shellcracker"],
		buildings: ["command_post", "barracks"],
	},

	// ─── Par Time (20 minutes) ───

	parTime: 1200,

	// ─── Difficulty Scaling ───
	//
	// Support:  ambushes have 60% units, no mortar reinforcements
	// Tactical: as designed
	// Elite:    ambushes have 140% units, mortar has splash, second reinforcement wave at 90s

	difficulty: {
		support: {
			enemyDamageMultiplier: 0.6,
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
