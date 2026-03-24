/**
 * Research / tech tree definitions for Otter: Elite Force RTS.
 *
 * All values sourced from the design spec §12 (Tech Tree / Research).
 * Researched at the Armory. Each upgrade is permanent within a campaign save.
 */

import type { ResourceCost } from "./units";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResearchDef {
	id: string;
	name: string;
	cost: ResourceCost;
	/** Research time in seconds. */
	time: number;
	/** Human-readable description of the effect. */
	effect: string;
	/** Mission number where this research becomes available. */
	unlock: number;
	/** Building id where this research is performed. */
	researchAt: string;
}

// ---------------------------------------------------------------------------
// Research Definitions
// ---------------------------------------------------------------------------

export const RESEARCH: Record<string, ResearchDef> = {
	hardshell_armor: {
		id: "hardshell_armor",
		name: "Hardshell Armor",
		cost: { salvage: 150 },
		time: 20,
		effect: "+20 HP to all Mudfoots (80 -> 100)",
		unlock: 5,
		researchAt: "armory",
	},
	fish_oil_arrows: {
		id: "fish_oil_arrows",
		name: "Fish Oil Arrows",
		cost: { salvage: 100 },
		time: 15,
		effect: "+3 damage to Shellcrackers (10 -> 13)",
		unlock: 5,
		researchAt: "armory",
	},
	fortified_walls: {
		id: "fortified_walls",
		name: "Fortified Walls",
		cost: { salvage: 200 },
		time: 25,
		effect: "Unlocks Stone Walls (150 -> 400 HP)",
		unlock: 9,
		researchAt: "armory",
	},
	gun_emplacements: {
		id: "gun_emplacements",
		name: "Gun Emplacements",
		cost: { salvage: 250 },
		time: 30,
		effect: "Unlocks Gun Towers (6 -> 12 dmg)",
		unlock: 9,
		researchAt: "armory",
	},
	demolition_training: {
		id: "demolition_training",
		name: "Demolition Training",
		cost: { salvage: 150 },
		time: 20,
		effect: "+50% Sapper damage vs buildings (30 -> 45)",
		unlock: 9,
		researchAt: "armory",
	},
	advanced_rafts: {
		id: "advanced_rafts",
		name: "Advanced Rafts",
		cost: { salvage: 100 },
		time: 15,
		effect: "+30% Raftsman speed, +2 carry capacity (4 -> 6)",
		unlock: 7,
		researchAt: "armory",
	},
	mortar_precision: {
		id: "mortar_precision",
		name: "Mortar Precision",
		cost: { salvage: 200 },
		time: 25,
		effect: "-30% Mortar Otter scatter radius",
		unlock: 9,
		researchAt: "armory",
	},
	combat_medics: {
		id: "combat_medics",
		name: "Combat Medics",
		cost: { salvage: 150 },
		time: 20,
		effect: "Field Hospital heal rate +50% (+2 -> +3 HP/s)",
		unlock: 10,
		researchAt: "armory",
	},
	diving_gear: {
		id: "diving_gear",
		name: "Diving Gear",
		cost: { salvage: 100 },
		time: 15,
		effect: "Divers can attack while submerged",
		unlock: 9,
		researchAt: "armory",
	},
};

export const ALL_RESEARCH: Record<string, ResearchDef> = { ...RESEARCH };
