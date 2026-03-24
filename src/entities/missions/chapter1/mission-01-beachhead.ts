// Mission 1: Beachhead — Tutorial / Build
//
// The URA deploys to the Copper-Silt Reach. Sgt. Bubbles leads the first wave.
// Player starts with 3 River Rats and nothing built.
// Teaches: resource gathering, building, training.
// Win: Build Command Post + Barracks, train 4 Mudfoots.
// Par time: 8 min (tutorial pace).

import type { MissionDef } from "../../types";

export const mission01Beachhead: MissionDef = {
	id: "mission_1",
	chapter: 1,
	mission: 1,
	name: "Beachhead",
	subtitle: "Establish a forward operating base",

	briefing: {
		portraitId: "foxhound",
		lines: [
			{
				speaker: "FOXHOUND",
				text: "Sgt. Bubbles, this is FOXHOUND. Welcome to the Copper-Silt Reach. Intelligence suggests minimal Scale-Guard presence at this landing site.",
			},
			{
				speaker: "FOXHOUND",
				text: "Your priority is establishing a forward operating base. Gather resources, construct a Command Post and Barracks, then get boots on the ground.",
			},
			{
				speaker: "FOXHOUND",
				text: "You have three River Rats for labor. Fish from the river, timber from the mangroves, salvage from the wreckage to the northeast. Move it, Sergeant.",
			},
		],
	},

	terrain: {
		width: 48,
		height: 44,
		regions: [
			// Base layer
			{ terrainId: "grass", fill: true },
			// Beach along the southern edge (landing zone)
			{ terrainId: "beach", rect: { x: 0, y: 36, w: 48, h: 8 } },
			// River running east-west through the middle
			{
				terrainId: "water",
				river: {
					points: [
						[0, 20],
						[16, 18],
						[32, 22],
						[48, 20],
					],
					width: 3,
				},
			},
			// Mud banks along the river
			{ terrainId: "mud", rect: { x: 0, y: 16, w: 48, h: 2 } },
			{ terrainId: "mud", rect: { x: 0, y: 24, w: 48, h: 2 } },
			// Mangrove grove (timber source) in the west
			{ terrainId: "mangrove", rect: { x: 2, y: 28, w: 12, h: 8 } },
			// Dirt clearing for base placement
			{ terrainId: "dirt", rect: { x: 8, y: 36, w: 10, h: 6 } },
		],
		overrides: [
			// Bridge crossing at the river
			{ x: 24, y: 18, terrainId: "bridge" },
			{ x: 24, y: 19, terrainId: "bridge" },
			{ x: 24, y: 20, terrainId: "bridge" },
			{ x: 24, y: 21, terrainId: "bridge" },
			{ x: 24, y: 22, terrainId: "bridge" },
		],
	},

	zones: {
		ura_start: { x: 8, y: 37, width: 8, height: 5 },
		timber_grove: { x: 2, y: 28, width: 12, height: 8 },
		fish_spot: { x: 12, y: 17, width: 4, height: 3 },
		salvage_area: { x: 38, y: 6, width: 6, height: 6 },
		base_clearing: { x: 8, y: 36, width: 10, height: 6 },
		enemy_approach: { x: 20, y: 2, width: 10, height: 5 },
	},

	placements: [
		// Player starting units
		{ type: "river_rat", faction: "ura", zone: "ura_start", count: 3 },

		// Resources
		{ type: "fish_spot", faction: "neutral", x: 14, y: 18 },
		{ type: "fish_spot", faction: "neutral", x: 10, y: 19 },
		{ type: "mangrove_tree", faction: "neutral", zone: "timber_grove", count: 15 },
		{ type: "salvage_cache", faction: "neutral", x: 40, y: 8 },
		{ type: "salvage_cache", faction: "neutral", x: 42, y: 10 },
	],

	startResources: { fish: 100, timber: 50, salvage: 0 },
	startPopCap: 4,

	objectives: {
		primary: [
			{
				id: "build-command-post",
				description: "Build a Command Post",
				type: "build",
				target: "command_post",
				count: 1,
			},
			{
				id: "build-barracks",
				description: "Build a Barracks",
				type: "build",
				target: "barracks",
				count: 1,
			},
			{
				id: "train-mudfoots",
				description: "Train 4 Mudfoots",
				type: "build",
				target: "mudfoot",
				count: 4,
			},
		],
		bonus: [
			{
				id: "gather-salvage",
				description: "Gather 50 salvage from the northeast cache",
				type: "collect",
				target: "salvage",
				count: 50,
			},
		],
	},

	triggers: [
		// Tutorial welcome
		{
			id: "tutorial-welcome",
			condition: "timer:3",
			action:
				"dialogue:foxhound:Select your River Rats and right-click on the timber grove to start gathering. We need lumber for construction.",
			once: true,
		},
		// Build hint
		{
			id: "tutorial-build-hint",
			condition: "timer:60",
			action:
				"dialogue:foxhound:You've got enough resources to start building. Select a River Rat and open the build menu to place a Command Post.",
			once: true,
		},
		// Command Post built
		{
			id: "command-post-built",
			condition: "building_count:ura:command_post:gte:1",
			action:
				"complete_objective:build-command-post|dialogue:foxhound:Command Post is up! Now build a Barracks — we need infantry.",
			once: true,
		},
		// Barracks built
		{
			id: "barracks-built",
			condition: "building_count:ura:barracks:gte:1",
			action:
				"complete_objective:build-barracks|dialogue:foxhound:Barracks operational. Start training Mudfoots — we need four for a patrol squad.",
			once: true,
		},
		// Mudfoots trained
		{
			id: "mudfoots-trained",
			condition: "unit_count:ura:mudfoot:gte:4",
			action: "complete_objective:train-mudfoots",
			once: true,
		},
		// Enemy scout at 5 minutes (the memorable moment)
		{
			id: "enemy-scout-arrival",
			condition: "timer:300",
			action:
				"dialogue:foxhound:Heads up — Scale-Guard scouts spotted near your position. Stay sharp, Bubbles.|spawn:scout_lizard:scale_guard:25:2:2",
			once: true,
		},
		// Salvage area entered
		{
			id: "salvage-found",
			condition: "area_entered:ura:salvage_area",
			action: "dialogue:foxhound:Good find! That wreckage has usable salvage. Strip it clean.",
			once: true,
		},
		// Mission complete
		{
			id: "mission-complete",
			condition: "all_primary_complete",
			action:
				"dialogue:foxhound:Beachhead secured, Sergeant. The Copper-Silt Reach campaign begins. FOXHOUND out.|victory",
			once: true,
		},
	],

	unlocks: {
		units: ["river_rat", "mudfoot"],
		buildings: ["command_post", "barracks", "watchtower", "fish_trap", "burrow", "sandbag_wall"],
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
