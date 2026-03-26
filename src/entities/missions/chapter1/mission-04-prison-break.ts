// Mission 4: Prison Break — Commando / Rescue
//
// COMMANDO mission — no lodge, no base building, small fixed squad.
// OEF commando team infiltrates a Scale-Guard detention compound in the
// Copper-Silt jungle to rescue Gen. Whiskers and extract to the southern
// exfil zone. Detection towers, searchlights, and patrols guard the compound.
//
// Phase 1 — Insertion: neutralize observation post, approach compound.
// Phase 2 — Inside the Wire: navigate compound, reach prison block, free prisoner.
// Phase 3 — Exfiltration: escort Gen. Whiskers south to exfil zone.
//
// Teaches: stealth, detection, hero abilities, escort mechanics.
// Win: Rescue Gen. Whiskers and extract to the exfil zone.
// Lose: All commando units killed OR Gen. Whiskers killed after rescue.
// Par time: 18 min (1080s).
// Unlocks: Sapper, Diver, Armory, Minefield.

import type { MissionDef } from "../../types";
import { act, objective, on, trigger } from "../dsl";

export const mission04PrisonBreak: MissionDef = {
	id: "mission_4",
	chapter: 1,
	mission: 4,
	name: "Prison Break",
	subtitle: "Infiltrate a Scale-Guard compound and rescue Gen. Whiskers",

	// ─── Briefing ────────────────────────────────────────────────────────────
	briefing: {
		portraitId: "foxhound",
		lines: [
			{
				speaker: "FOXHOUND",
				text: "HQ, Gen. Whiskers is alive — held in a Scale-Guard detention compound deep in the Copper-Silt jungle. Warden Fangrot's operation, heavily fortified.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Captain, this is a knife-in-the-dark op. No lodge, no base, no reinforcements. Four of our best — that's all you get.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Gen. Whiskers is being held in the prison block, north side of the compound. Get in, get him out, get to exfil. Simple plan.",
			},
			{
				speaker: "FOXHOUND",
				text: "Stealth is everything here. If they sound the alarm, the entire garrison wakes up and reinforcements pour in. You will be overwhelmed.",
			},
			{
				speaker: "FOXHOUND",
				text: "Two ways in: the main gate — guarded with a searchlight — or a drainage canal on the east side that runs under the wall. Tight squeeze, but unguarded.",
			},
			{
				speaker: "Col. Bubbles",
				text: "Get it done, Captain. HQ out.",
			},
		],
	},

	// ─── Terrain (128 x 96) ─────────────────────────────────────────────────
	terrain: {
		width: 128,
		height: 96,
		regions: [
			// Base layer — dense jungle floor
			{ terrainId: "jungle", fill: true },

			// Compound interior (cleared ground between walls)
			{ terrainId: "dirt", rect: { x: 12, y: 16, w: 104, h: 20 } },

			// Compound walls — north, south, west, east (stone, impassable)
			{ terrainId: "stone_wall", rect: { x: 8, y: 12, w: 112, h: 2 } },
			{ terrainId: "stone_wall", rect: { x: 8, y: 36, w: 112, h: 2 } },
			{ terrainId: "stone_wall", rect: { x: 8, y: 14, w: 2, h: 22 } },
			{ terrainId: "stone_wall", rect: { x: 118, y: 14, w: 2, h: 22 } },

			// Gate — south wall center (passable gap)
			{ terrainId: "dirt", rect: { x: 56, y: 36, w: 8, h: 2 } },

			// Drainage grate — south wall east (stealth water entry)
			{ terrainId: "water", rect: { x: 96, y: 36, w: 6, h: 2 } },

			// Motor pool — concrete pad (northwest interior)
			{ terrainId: "concrete", rect: { x: 14, y: 16, w: 40, h: 6 } },

			// Prison block — fortified building area (northeast interior)
			{ terrainId: "concrete", rect: { x: 68, y: 16, w: 48, h: 6 } },

			// Barracks yard — packed earth (southwest interior)
			{ terrainId: "dirt", rect: { x: 14, y: 26, w: 40, h: 8 } },

			// Officer quarters — nicer ground (southeast interior)
			{ terrainId: "dirt", rect: { x: 68, y: 26, w: 48, h: 8 } },

			// Drainage canal — water channel from compound wall to jungle
			{
				terrainId: "water",
				river: {
					points: [
						[99, 38],
						[100, 44],
						[98, 50],
						[96, 56],
						[94, 62],
						[92, 68],
					],
					width: 3,
				},
			},

			// Jungle paths — concealed dirt approaches (west approach)
			{
				terrainId: "dirt",
				river: {
					points: [
						[32, 80],
						[28, 72],
						[24, 64],
						[20, 56],
						[24, 48],
						[28, 44],
						[40, 40],
						[56, 38],
					],
					width: 3,
				},
			},

			// Jungle paths — east approach (to drainage canal)
			{
				terrainId: "dirt",
				river: {
					points: [
						[80, 80],
						[84, 72],
						[88, 64],
						[92, 56],
						[96, 50],
						[99, 44],
					],
					width: 2,
				},
			},

			// Staging area clearing (player start)
			{ terrainId: "dirt", rect: { x: 16, y: 74, w: 32, h: 12 } },

			// Observation post clearing (enemy lookout east)
			{ terrainId: "dirt", circle: { cx: 88, cy: 78, r: 6 } },

			// Exfil zone — muddy riverbank (south edge)
			{ terrainId: "mud", rect: { x: 8, y: 88, w: 112, h: 8 } },
		],
		overrides: [],
	},

	// ─── Zones ───────────────────────────────────────────────────────────────
	zones: {
		exfil_zone: { x: 8, y: 88, width: 112, height: 8 },
		staging_area: { x: 8, y: 72, width: 48, height: 16 },
		observation_post: { x: 64, y: 72, width: 56, height: 16 },
		jungle_west: { x: 8, y: 56, width: 48, height: 16 },
		jungle_east: { x: 64, y: 56, width: 56, height: 16 },
		jungle_approach: { x: 8, y: 40, width: 48, height: 16 },
		drainage_canal: { x: 64, y: 40, width: 56, height: 16 },
		compound_wall_s: { x: 8, y: 36, width: 112, height: 4 },
		barracks_yard: { x: 8, y: 24, width: 48, height: 12 },
		officer_quarters: { x: 64, y: 24, width: 56, height: 12 },
		motor_pool: { x: 8, y: 16, width: 48, height: 8 },
		prison_block: { x: 64, y: 16, width: 56, height: 8 },
		compound_wall_n: { x: 8, y: 12, width: 112, height: 4 },
		jungle_north: { x: 8, y: 0, width: 48, height: 12 },
		watchtower_ne: { x: 64, y: 0, width: 56, height: 12 },
	},

	// ─── Placements ──────────────────────────────────────────────────────────
	placements: [
		// ── Player commando squad (staging_area) ──
		// NO LODGE — commando mission, no reinforcements
		{ type: "mudfoot", faction: "ura", x: 24, y: 76 },
		{ type: "mudfoot", faction: "ura", x: 28, y: 78 },
		{ type: "mudfoot", faction: "ura", x: 32, y: 76 },
		{ type: "shellcracker", faction: "ura", x: 20, y: 78 },

		// ── Neutral items ──
		// Medkits (single-use heal)
		{ type: "medkit", faction: "neutral", x: 24, y: 56 },
		{ type: "medkit", faction: "neutral", x: 92, y: 50 },
		{ type: "medkit", faction: "neutral", x: 40, y: 30 },
		// Intel documents (bonus objective — officer quarters)
		{ type: "intel_document", faction: "neutral", x: 80, y: 28 },
		{ type: "intel_document", faction: "neutral", x: 86, y: 30 },
		// Fuel drums (explosive — motor pool)
		{ type: "fuel_drum", faction: "neutral", x: 28, y: 18 },
		{ type: "fuel_drum", faction: "neutral", x: 44, y: 18 },

		// ── Observation post (outer perimeter) ──
		{ type: "skink", faction: "scale_guard", x: 86, y: 76 },
		{ type: "skink", faction: "scale_guard", x: 92, y: 80 },

		// ── Jungle patrols (roaming) ──
		// East jungle patrol
		{
			type: "gator",
			faction: "scale_guard",
			x: 80,
			y: 60,
			patrol: [
				[80, 60],
				[88, 56],
				[96, 60],
				[88, 64],
			],
		},
		{
			type: "gator",
			faction: "scale_guard",
			x: 82,
			y: 62,
			patrol: [
				[82, 62],
				[90, 58],
				[98, 62],
				[90, 66],
			],
		},
		// West jungle patrol
		{
			type: "skink",
			faction: "scale_guard",
			x: 20,
			y: 52,
			patrol: [
				[20, 52],
				[28, 48],
				[36, 52],
				[28, 56],
			],
		},
		// North jungle patrol
		{
			type: "gator",
			faction: "scale_guard",
			x: 32,
			y: 4,
			patrol: [
				[32, 4],
				[48, 8],
				[32, 12],
				[16, 8],
			],
		},

		// ── Compound gate guards (south wall center) ──
		{ type: "gator", faction: "scale_guard", x: 56, y: 38 },
		{ type: "gator", faction: "scale_guard", x: 62, y: 38 },
		// Searchlight at gate
		{ type: "searchlight", faction: "scale_guard", x: 60, y: 36 },

		// ── Barracks yard ──
		// Off-duty guards (stationary, lower detection — dozing)
		{ type: "gator", faction: "scale_guard", x: 20, y: 28 },
		{ type: "gator", faction: "scale_guard", x: 28, y: 30 },
		{ type: "gator", faction: "scale_guard", x: 36, y: 28 },
		// Yard patrol
		{
			type: "skink",
			faction: "scale_guard",
			x: 24,
			y: 26,
			patrol: [
				[24, 26],
				[40, 26],
				[40, 34],
				[24, 34],
			],
		},

		// ── Motor pool ──
		{ type: "gator", faction: "scale_guard", x: 20, y: 18 },
		{ type: "gator", faction: "scale_guard", x: 36, y: 20 },

		// ── Officer quarters ──
		// Viper officer (high-value target)
		{ type: "viper", faction: "scale_guard", x: 76, y: 28 },
		// Guards
		{ type: "gator", faction: "scale_guard", x: 72, y: 30 },
		{ type: "gator", faction: "scale_guard", x: 84, y: 30 },

		// ── Prison block ──
		// Prison guards (high alert)
		{ type: "gator", faction: "scale_guard", x: 72, y: 18 },
		{ type: "gator", faction: "scale_guard", x: 80, y: 20 },
		{ type: "viper", faction: "scale_guard", x: 88, y: 18 },
		// Interior patrol
		{
			type: "skink",
			faction: "scale_guard",
			x: 76,
			y: 18,
			patrol: [
				[76, 18],
				[92, 18],
				[92, 22],
				[76, 22],
			],
		},
		// Prisoner (rescue target)
		{ type: "prisoner", faction: "ura", x: 84, y: 16 },
		// Cell door
		{ type: "cell_door", faction: "scale_guard", x: 84, y: 17 },

		// ── Watchtower NE ──
		// Elevated tower guard
		{ type: "gator", faction: "scale_guard", x: 80, y: 4 },
		// Searchlight (sweeps south over compound approach)
		{ type: "searchlight", faction: "scale_guard", x: 80, y: 6 },
	],

	// ─── Resources & Pop ─────────────────────────────────────────────────────
	// No resources — commando mission, no economy
	startResources: { fish: 0, timber: 0, salvage: 0 },
	startPopCap: 5,

	// ─── Objectives ──────────────────────────────────────────────────────────
	objectives: {
		primary: [
			objective("neutralize-obs-post", "Neutralize the observation post"),
			objective("infiltrate-compound", "Infiltrate the compound"),
			objective("reach-prison", "Reach the prison block"),
			objective("rescue-whiskers", "Free Gen. Whiskers"),
			objective("escort-whiskers", "Escort Gen. Whiskers to the exfil zone"),
		],
		bonus: [
			objective("bonus-intel", "Collect intel documents from officer quarters"),
			objective("no-alarm", "Complete without triggering the alarm"),
		],
	},

	// ─── Triggers ────────────────────────────────────────────────────────────
	triggers: [
		// ════════════════════════════════════════════════════════════════════
		// PHASE 1: INSERTION
		// ════════════════════════════════════════════════════════════════════

		trigger("phase:insertion:start", on.timer(1), act.startPhase("insertion")),

		// Timed briefing beats
		trigger(
			"phase:insertion:bubbles-briefing",
			on.timer(5),
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Captain, this is a knife-in-the-dark op. No lodge, no base, no reinforcements. Four of our best — that's all you get.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Gen. Whiskers is being held in the prison block, north side of the compound. Get in, get him out, get to exfil. Simple plan.",
				},
			]),
		),

		trigger(
			"phase:insertion:foxhound-stealth",
			on.timer(15),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Stealth is everything here. If they sound the alarm, the entire garrison wakes up and reinforcements pour in. You will be overwhelmed.",
				},
				{
					speaker: "FOXHOUND",
					text: "Your team can perform stealth kills — get behind a target, take them out silently. Stay out of detection cones and searchlight beams.",
				},
			]),
		),

		trigger(
			"phase:insertion:foxhound-approach",
			on.timer(30),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Two ways in. The main gate is guarded and has a searchlight — possible but risky. There's a drainage canal on the east side that runs under the wall. Tight squeeze, but unguarded.",
				},
				{
					speaker: "FOXHOUND",
					text: "Enemy observation post to the east of your position. Take it out first or they'll spot you moving through the jungle.",
				},
			]),
		),

		// Observation post approach
		trigger(
			"phase:insertion:obs-post-approach",
			on.areaEntered("ura", "observation_post"),
			act.dialogue(
				"foxhound",
				"Observation post ahead. Two Skinks. Quiet kills only — if they radio in, the compound goes on alert.",
			),
		),

		// Obs post cleared (silently — no alarm)
		trigger("phase:insertion:obs-post-cleared", on.unitCount("scale_guard", "skink", "eq", 0), [
			act.completeObjective("neutralize-obs-post"),
			act.dialogue("sgt_bubbles", "Observation post is dark. Good work. Move on the compound."),
			act.revealZone("jungle_east"),
			act.revealZone("drainage_canal"),
			act.revealZone("jungle_approach"),
			act.revealZone("compound_wall_s"),
		]),

		// Compound entered via gate (south)
		trigger("phase:insertion:compound-entered-gate", on.areaEntered("ura", "barracks_yard"), [
			act.completeObjective("infiltrate-compound"),
			act.dialogue(
				"foxhound",
				"You're inside the compound. Prison block is northeast. Stay quiet.",
			),
			act.revealZone("barracks_yard"),
			act.revealZone("motor_pool"),
			act.revealZone("officer_quarters"),
			act.revealZone("prison_block"),
			act.startPhase("inside-the-wire"),
		]),

		// Compound entered via drainage canal
		trigger(
			"phase:insertion:compound-entered-canal",
			on.areaEntered("ura", "drainage_canal"),
			act.dialogue(
				"foxhound",
				"In the drainage canal. Stay low — this feeds into the east side of the compound near the prison block.",
			),
		),

		// Canal exit into prison block area
		trigger("phase:insertion:canal-exit", on.areaEntered("ura", "prison_block"), [
			act.completeObjective("infiltrate-compound"),
			act.dialogue(
				"foxhound",
				"You're inside, east wall. Prison block is right there. Nice and quiet.",
			),
			act.revealZone("barracks_yard"),
			act.revealZone("motor_pool"),
			act.revealZone("officer_quarters"),
			act.revealZone("prison_block"),
			act.startPhase("inside-the-wire"),
		]),

		// ════════════════════════════════════════════════════════════════════
		// PHASE 2: INSIDE THE WIRE
		// ════════════════════════════════════════════════════════════════════

		trigger(
			"phase:inside-the-wire:briefing",
			on.objectiveComplete("infiltrate-compound"),
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Prison block is northeast. Barracks yard is between you and it — off-duty guards. Move carefully.",
				},
				{
					speaker: "FOXHOUND",
					text: "Motor pool to the northwest has fuel drums. You could blow them as a distraction, but the explosion will trigger the alarm. Last resort.",
				},
			]),
		),

		// Motor pool approach
		trigger(
			"phase:inside-the-wire:motor-pool-fuel",
			on.areaEntered("ura", "motor_pool"),
			act.dialogue(
				"foxhound",
				"Fuel drums. One shot and they blow — massive distraction, but it'll bring the whole garrison down on you. Your call, Captain.",
			),
		),

		// Barracks approach
		trigger(
			"phase:inside-the-wire:barracks-approach",
			on.areaEntered("ura", "barracks_yard"),
			act.dialogue(
				"foxhound",
				"Barracks yard. Off-duty guards — sleepy but they'll wake fast if you make noise. Stealth kills only.",
			),
		),

		// Officer quarters approach
		trigger(
			"phase:inside-the-wire:officer-quarters",
			on.areaEntered("ura", "officer_quarters"),
			act.dialogue(
				"foxhound",
				"Officer quarters. Viper commander inside. Intel documents on the desk — grab them if you can, but the officer is dangerous.",
			),
		),

		// Intel documents collected (bonus objective)
		trigger(
			"phase:inside-the-wire:intel-collected",
			on.unitCount("neutral", "intel_document", "eq", 0),
			[
				act.completeObjective("bonus-intel"),
				act.dialogue(
					"foxhound",
					"Intel secured. Scale-Guard deployment maps — this will be valuable to HQ.",
				),
			],
		),

		// Prison block approach
		trigger("phase:inside-the-wire:prison-block-approach", on.areaEntered("ura", "prison_block"), [
			act.completeObjective("reach-prison"),
			act.dialogue(
				"foxhound",
				"Prison block. Heavy guard — two Gators, a Viper, and a Skink on interior patrol. Gen. Whiskers's cell is in the center.",
			),
		]),

		// Cell door opened — rescue Gen. Whiskers
		trigger("phase:inside-the-wire:cell-door-opened", on.buildingDestroyed("cell_door"), [
			act.completeObjective("rescue-whiskers"),
			act.exchange([
				{
					speaker: "Gen. Whiskers",
					text: "Captain! I knew OEF would come. I can move — let's get out of here.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Whiskers is free. Now get him to exfil — south wall, through the jungle, to the extraction point.",
				},
			]),
			act.spawn("gen_whiskers", "ura", 84, 18, 1),
			act.startPhase("exfiltration"),
		]),

		// ════════════════════════════════════════════════════════════════════
		// ALARM SYSTEM (can fire in any phase)
		// ════════════════════════════════════════════════════════════════════

		// Alarm triggered — wave 1 (immediate reinforcements from barracks)
		trigger(
			"phase:alarm:triggered",
			on.timer(900),
			[
				act.dialogue(
					"foxhound",
					"ALARM! Compound is on full alert! Every Scale-Guard in the area is converging on your position!",
				),
				act.dialogue(
					"sgt_bubbles",
					"Mission is compromised! Grab Whiskers and fight your way out — speed is everything now!",
				),
				act.spawn("gator", "scale_guard", 24, 26, 6),
				act.spawn("skink", "scale_guard", 32, 28, 2),
				act.enableTrigger("phase:alarm:reinforcements-2"),
				act.enableTrigger("phase:alarm:reinforcements-3"),
			],
			{ enabled: false },
		),

		// Alarm wave 2 — 30 seconds after alarm (from north)
		trigger(
			"phase:alarm:reinforcements-2",
			on.timer(930),
			[
				act.spawn("gator", "scale_guard", 32, 4, 4),
				act.spawn("viper", "scale_guard", 40, 8, 2),
				act.spawn("skink", "scale_guard", 24, 6, 2),
				act.dialogue("foxhound", "More hostiles from the north! They keep coming!"),
			],
			{ enabled: false },
		),

		// Alarm wave 3 — 60 seconds after alarm (from all directions)
		trigger(
			"phase:alarm:reinforcements-3",
			on.timer(960),
			[
				act.spawn("gator", "scale_guard", 12, 40, 4),
				act.spawn("gator", "scale_guard", 108, 44, 4),
				act.spawn("skink", "scale_guard", 60, 4, 2),
				act.spawn("viper", "scale_guard", 64, 8, 2),
				act.dialogue("foxhound", "Third wave inbound from all directions! Move NOW!"),
			],
			{ enabled: false },
		),

		// ════════════════════════════════════════════════════════════════════
		// PHASE 3: EXFILTRATION
		// ════════════════════════════════════════════════════════════════════

		trigger("phase:exfiltration:briefing", on.objectiveComplete("rescue-whiskers"), [
			act.addObjective("escort-whiskers", "Escort Gen. Whiskers to the exfil zone", "primary"),
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Whiskers is with you. Guards near the cell heard the door — they're investigating. You have maybe thirty seconds before they reach the block.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Fastest route out is back the way you came. If the alarm goes off, just run for it — don't stop to fight.",
				},
			]),
			act.enableTrigger("phase:exfiltration:guards-investigate"),
			act.enableTrigger("phase:exfiltration:empty-cell-discovered"),
		]),

		// Guards investigate cell — 30s after rescue (if no alarm yet)
		trigger(
			"phase:exfiltration:guards-investigate",
			on.timer(60),
			act.dialogue(
				"foxhound",
				"Guards moving toward the prison block. They'll find the empty cell any second. Move, Captain.",
			),
			{ enabled: false },
		),

		// Empty cell discovered — 60s after rescue, triggers alarm
		trigger(
			"phase:exfiltration:empty-cell-discovered",
			on.timer(90),
			[
				act.dialogue("foxhound", "They found the empty cell! Alarm is up — full compound alert!"),
				act.dialogue("sgt_bubbles", "RUN! Get to exfil! Extraction boat is waiting!"),
				act.enableTrigger("phase:alarm:triggered"),
			],
			{ enabled: false },
		),

		// Compound exit south — encouragement
		trigger(
			"phase:exfiltration:compound-exit",
			on.areaEntered("ura", "jungle_approach"),
			act.dialogue(
				"foxhound",
				"You're outside the compound wall. Jungle cover ahead — keep moving south to the exfil point.",
			),
		),

		// Whiskers health warnings
		trigger(
			"phase:exfiltration:whiskers-damaged",
			on.healthThreshold("gen_whiskers", 75, "below"),
			act.dialogue("gen_whiskers", "I'm hit! Keep going — don't stop for me!"),
		),

		trigger(
			"phase:exfiltration:whiskers-critical",
			on.healthThreshold("gen_whiskers", 30, "below"),
			act.dialogue("sgt_bubbles", "Whiskers is in bad shape! Get him to exfil immediately!"),
		),

		// ════════════════════════════════════════════════════════════════════
		// FAIL CONDITIONS
		// ════════════════════════════════════════════════════════════════════

		// Gen. Whiskers killed after rescue
		trigger("phase:exfiltration:whiskers-killed", on.unitCount("ura", "gen_whiskers", "eq", 0), [
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "Whiskers is down. He's gone, Captain.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Mission failed. We lost him. Pull your team out — there's nothing more we can do here.",
				},
			]),
			act.failMission("Gen. Whiskers was killed"),
		]),

		// All commando units killed
		trigger("phase:fail:all-commandos-killed", on.unitCount("ura", "mudfoot", "eq", 0), [
			act.exchange([
				{
					speaker: "FOXHOUND",
					text: "All commando units lost. We've got nothing left in there.",
				},
				{
					speaker: "Col. Bubbles",
					text: "The team is gone. Mission is over. God help Whiskers.",
				},
			]),
			act.failMission("All commando units were lost"),
		]),

		// ════════════════════════════════════════════════════════════════════
		// VICTORY
		// ════════════════════════════════════════════════════════════════════

		// Exfil zone reached with Gen. Whiskers
		trigger("phase:exfiltration:exfil-reached", on.areaEntered("ura", "exfil_zone"), [
			act.completeObjective("escort-whiskers"),
		]),

		// Stealth bonus — completed without alarm
		trigger("phase:victory:stealth-bonus", on.objectiveComplete("escort-whiskers"), [
			act.completeObjective("no-alarm"),
			act.dialogue(
				"gen_whiskers",
				"Not a single alarm raised. Your team is a ghost, Captain. Command is impressed.",
			),
		]),

		// Mission complete — all primary objectives done
		trigger("phase:victory:mission-complete", on.allPrimaryComplete(), [
			act.exchange([
				{
					speaker: "Col. Bubbles",
					text: "Whiskers is on the boat. Your team is clear. Outstanding work, Captain — textbook extraction.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "Gen. Whiskers has invaluable intelligence on Scale-Guard operations in the Reach. You've changed the shape of this campaign.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "Your commando team has proven that OEF can strike anywhere. I'm authorizing two new specialist units — Sappers for demolitions and engineering, and Divers for stealth waterborne ops.",
				},
				{
					speaker: "Gen. Whiskers",
					text: "You'll also have access to Armory construction and Minefield deployment. Scale-Guard won't know what hit them.",
				},
				{
					speaker: "Col. Bubbles",
					text: "Chapter One complete, Captain. First Landing is secured. But the Reach is vast, and Scale-Guard is digging in deeper inland. Rest up — we move at dawn. HQ out.",
				},
			]),
			act.victory(),
		]),
	],

	// ─── Unlocks ─────────────────────────────────────────────────────────────
	unlocks: {
		units: ["sapper", "diver"],
		buildings: ["armory", "minefield"],
		heroes: ["gen_whiskers"],
	},

	// ─── Par Time ────────────────────────────────────────────────────────────
	parTime: 1080,

	// ─── Difficulty Scaling ──────────────────────────────────────────────────
	difficulty: {
		support: {
			enemyDamageMultiplier: 0.7,
			enemyHpMultiplier: 0.7,
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
			enemyDamageMultiplier: 1.4,
			enemyHpMultiplier: 1.3,
			resourceMultiplier: 1.0,
			xpMultiplier: 1.5,
		},
	},
};
