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
		stat: "speed",
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

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

/** All 9 research definitions keyed by id. */
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
};
