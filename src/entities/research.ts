/**
 * Research / tech tree entity definitions for Otter: Elite Force RTS.
 *
 * All 9 research items per design spec §12.
 * Researched at the Armory. Permanent within a campaign save.
 */

import type { ResearchDef } from "./types";

// ---------------------------------------------------------------------------
// Research Definitions
// ---------------------------------------------------------------------------

export const hardshellArmor: ResearchDef = {
	id: "hardshell_armor",
	name: "Hardshell Armor",
	description: "+20 HP to all Mudfoots (80 -> 100)",
	cost: { salvage: 150 },
	researchTime: 20,
	researchedAt: "armory",
	unlockedAt: "mission_5",
	effect: {
		type: "stat_boost",
		target: "mudfoot",
		stat: "hp",
		value: 20,
	},
};

export const fishOilArrows: ResearchDef = {
	id: "fish_oil_arrows",
	name: "Fish Oil Arrows",
	description: "+3 damage to Shellcrackers (10 -> 13)",
	cost: { salvage: 100 },
	researchTime: 15,
	researchedAt: "armory",
	unlockedAt: "mission_5",
	effect: {
		type: "stat_boost",
		target: "shellcracker",
		stat: "damage",
		value: 3,
	},
};

export const fortifiedWalls: ResearchDef = {
	id: "fortified_walls",
	name: "Fortified Walls",
	description: "Unlocks Stone Walls (150 -> 400 HP)",
	cost: { salvage: 200 },
	researchTime: 25,
	researchedAt: "armory",
	unlockedAt: "mission_9",
	effect: {
		type: "unlock_building",
		unlocks: "stone_wall",
	},
};

export const gunEmplacements: ResearchDef = {
	id: "gun_emplacements",
	name: "Gun Emplacements",
	description: "Unlocks Gun Towers (6 -> 12 dmg)",
	cost: { salvage: 250 },
	researchTime: 30,
	researchedAt: "armory",
	unlockedAt: "mission_9",
	effect: {
		type: "unlock_building",
		unlocks: "gun_tower",
	},
};

export const demolitionTraining: ResearchDef = {
	id: "demolition_training",
	name: "Demolition Training",
	description: "+50% Sapper damage vs buildings (30 -> 45)",
	cost: { salvage: 150 },
	researchTime: 20,
	researchedAt: "armory",
	unlockedAt: "mission_9",
	effect: {
		type: "stat_boost",
		target: "sapper",
		stat: "damageVsBuildings",
		value: 15,
	},
};

export const advancedRafts: ResearchDef = {
	id: "advanced_rafts",
	name: "Advanced Rafts",
	description: "+30% Raftsman speed, +2 carry capacity (4 -> 6)",
	cost: { salvage: 100 },
	researchTime: 15,
	researchedAt: "armory",
	unlockedAt: "mission_7",
	effect: {
		type: "stat_boost",
		target: "raftsman",
		stat: "carryCapacity",
		value: 2,
	},
};

export const mortarPrecision: ResearchDef = {
	id: "mortar_precision",
	name: "Mortar Precision",
	description: "-30% Mortar Otter scatter radius",
	cost: { salvage: 200 },
	researchTime: 25,
	researchedAt: "armory",
	unlockedAt: "mission_9",
	effect: {
		type: "stat_boost",
		target: "mortar_otter",
		stat: "scatter",
		value: -30,
	},
};

export const combatMedics: ResearchDef = {
	id: "combat_medics",
	name: "Combat Medics",
	description: "Field Hospital heal rate +50% (+2 -> +3 HP/s)",
	cost: { salvage: 150 },
	researchTime: 20,
	researchedAt: "armory",
	unlockedAt: "mission_10",
	effect: {
		type: "stat_boost",
		target: "field_hospital",
		stat: "healRate",
		value: 1,
	},
};

export const divingGear: ResearchDef = {
	id: "diving_gear",
	name: "Diving Gear",
	description: "Divers can attack while submerged",
	cost: { salvage: 100 },
	researchTime: 15,
	researchedAt: "armory",
	unlockedAt: "mission_9",
	effect: {
		type: "unlock_ability",
		target: "diver",
		unlocks: "submerged_attack",
	},
};

// ── Balance doc canonical research (10 items) ──

export const improvedArmor: ResearchDef = {
	id: "improved_armor",
	name: "Improved Armor",
	description: "+2 armor to all friendly units",
	cost: { fish: 100, salvage: 200 },
	researchTime: 30,
	researchedAt: "armory",
	unlockedAt: "mission_5",
	effect: {
		type: "stat_boost",
		target: "all_ura_units",
		stat: "armor",
		value: 2,
	},
};

export const sharpenedClaws: ResearchDef = {
	id: "sharpened_claws",
	name: "Sharpened Claws",
	description: "+3 attack damage to all melee units",
	cost: { fish: 100, salvage: 150 },
	researchTime: 25,
	researchedAt: "armory",
	unlockedAt: "mission_5",
	effect: {
		type: "stat_boost",
		target: "mudfoot,shellcracker,sapper,river_rat",
		stat: "attackDamage",
		value: 3,
	},
};

export const extendedRange: ResearchDef = {
	id: "extended_range",
	name: "Extended Range",
	description: "+20% attack range for all ranged units and buildings",
	cost: { fish: 150, salvage: 200 },
	researchTime: 30,
	researchedAt: "armory",
	unlockedAt: "mission_5",
	effect: {
		type: "stat_boost",
		target: "mortar_otter,watchtower,gun_tower",
		stat: "attackRange",
		value: 20,
	},
};

export const swiftCurrent: ResearchDef = {
	id: "swift_current",
	name: "Swift Current",
	description: "+15% movement speed for all friendly units",
	cost: { fish: 150, timber: 100, salvage: 150 },
	researchTime: 35,
	researchedAt: "armory",
	unlockedAt: "mission_7",
	effect: {
		type: "stat_boost",
		target: "all_ura_units",
		stat: "speed",
		value: 15,
	},
};

export const advancedFishing: ResearchDef = {
	id: "advanced_fishing",
	name: "Advanced Fishing",
	description: "+50% fish gathering rate",
	cost: { fish: 200, timber: 100 },
	researchTime: 25,
	researchedAt: "armory",
	unlockedAt: "mission_5",
	effect: {
		type: "stat_boost",
		target: "river_rat",
		stat: "gatherRate",
		value: 50,
	},
};

export const salvageExpertise: ResearchDef = {
	id: "salvage_expertise",
	name: "Salvage Expertise",
	description: "+75% salvage gathering rate",
	cost: { fish: 100, salvage: 100 },
	researchTime: 20,
	researchedAt: "armory",
	unlockedAt: "mission_5",
	effect: {
		type: "stat_boost",
		target: "river_rat",
		stat: "salvageGather",
		value: 75,
	},
};

export const nightVision: ResearchDef = {
	id: "night_vision",
	name: "Night Vision",
	description: "+2 vision radius for all friendly units",
	cost: { fish: 100, salvage: 250 },
	researchTime: 30,
	researchedAt: "armory",
	unlockedAt: "mission_9",
	effect: {
		type: "stat_boost",
		target: "all_ura_units",
		stat: "visionRadius",
		value: 2,
	},
};

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

/** All 16 research definitions keyed by id (9 legacy + 7 balance doc additions). */
export const ALL_RESEARCH_ENTITIES: Record<string, ResearchDef> = {
	hardshell_armor: hardshellArmor,
	fish_oil_arrows: fishOilArrows,
	fortified_walls: fortifiedWalls,
	gun_emplacements: gunEmplacements,
	demolition_training: demolitionTraining,
	advanced_rafts: advancedRafts,
	mortar_precision: mortarPrecision,
	combat_medics: combatMedics,
	diving_gear: divingGear,
	improved_armor: improvedArmor,
	sharpened_claws: sharpenedClaws,
	extended_range: extendedRange,
	swift_current: swiftCurrent,
	advanced_fishing: advancedFishing,
	salvage_expertise: salvageExpertise,
	night_vision: nightVision,
};
