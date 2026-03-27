/**
 * Research / Upgrade Registry — tech tree items unlockable via the Armory.
 *
 * Each upgrade has a cost, research time, effect description, and prerequisites.
 * These are the engine-facing definitions that systems use to apply stat changes.
 */

export interface ContentResearchDef {
	id: string;
	name: string;
	description: string;
	cost: { fish: number; timber: number; salvage: number };
	researchTimeMs: number;
	researchedAt: string;
	prerequisite: string | null;
	unlocksAtMission: number;
	effect: {
		type: "stat_boost" | "unlock_building" | "unlock_ability";
		targets: string[];
		stat?: string;
		value?: number;
		unlocks?: string;
	};
}

// ---------------------------------------------------------------------------
// Research Definitions
// ---------------------------------------------------------------------------

const improvedArmor: ContentResearchDef = {
	id: "improved_armor",
	name: "Improved Armor",
	description:
		"+2 armor to all friendly units. Hardened shell plating from salvaged Scale-Guard materials.",
	cost: { fish: 100, timber: 0, salvage: 200 },
	researchTimeMs: 30000,
	researchedAt: "armory",
	prerequisite: null,
	unlocksAtMission: 5,
	effect: {
		type: "stat_boost",
		targets: [
			"mudfoot",
			"shellcracker",
			"sapper",
			"raftsman",
			"mortar_otter",
			"diver",
			"river_rat",
		],
		stat: "armor",
		value: 2,
	},
};

const sharpenedClaws: ContentResearchDef = {
	id: "sharpened_claws",
	name: "Sharpened Claws",
	description: "+3 attack damage to all melee units. Bone-tipped gauntlets for close combat.",
	cost: { fish: 100, timber: 0, salvage: 150 },
	researchTimeMs: 25000,
	researchedAt: "armory",
	prerequisite: null,
	unlocksAtMission: 5,
	effect: {
		type: "stat_boost",
		targets: ["mudfoot", "shellcracker", "sapper", "river_rat"],
		stat: "attackDamage",
		value: 3,
	},
};

const extendedRange: ContentResearchDef = {
	id: "extended_range",
	name: "Extended Range",
	description:
		"+20% attack range for all ranged units and buildings. Improved optics and sighting.",
	cost: { fish: 150, timber: 0, salvage: 200 },
	researchTimeMs: 30000,
	researchedAt: "armory",
	prerequisite: null,
	unlocksAtMission: 5,
	effect: {
		type: "stat_boost",
		targets: ["mortar_otter", "watchtower", "gun_tower"],
		stat: "attackRange",
		value: 20, // percent
	},
};

const swiftCurrent: ContentResearchDef = {
	id: "swift_current",
	name: "Swift Current",
	description: "+15% movement speed for all friendly units. Streamlined equipment and river boots.",
	cost: { fish: 150, timber: 100, salvage: 150 },
	researchTimeMs: 35000,
	researchedAt: "armory",
	prerequisite: null,
	unlocksAtMission: 7,
	effect: {
		type: "stat_boost",
		targets: [
			"mudfoot",
			"shellcracker",
			"sapper",
			"raftsman",
			"mortar_otter",
			"diver",
			"river_rat",
		],
		stat: "speed",
		value: 15, // percent
	},
};

const fortifiedWalls: ContentResearchDef = {
	id: "fortified_walls",
	name: "Fortified Walls",
	description:
		"+200 HP to all buildings. Reinforced construction techniques from captured Scale-Guard blueprints.",
	cost: { fish: 100, timber: 200, salvage: 150 },
	researchTimeMs: 40000,
	researchedAt: "armory",
	prerequisite: null,
	unlocksAtMission: 9,
	effect: {
		type: "stat_boost",
		targets: [
			"burrow",
			"command_post",
			"barracks",
			"armory",
			"watchtower",
			"fish_trap",
			"dock",
			"field_hospital",
			"sandbag_wall",
			"stone_wall",
			"gun_tower",
		],
		stat: "hp",
		value: 200,
	},
};

const advancedFishing: ContentResearchDef = {
	id: "advanced_fishing",
	name: "Advanced Fishing",
	description: "+50% fish gathering rate. Improved nets and trapping techniques.",
	cost: { fish: 200, timber: 100, salvage: 0 },
	researchTimeMs: 25000,
	researchedAt: "armory",
	prerequisite: null,
	unlocksAtMission: 5,
	effect: {
		type: "stat_boost",
		targets: ["river_rat"],
		stat: "gatherRate",
		value: 50, // percent
	},
};

const salvageExpertise: ContentResearchDef = {
	id: "salvage_expertise",
	name: "Salvage Expertise",
	description: "+75% salvage gathering rate and +2 salvage per trip. Master scrounging techniques.",
	cost: { fish: 100, timber: 0, salvage: 100 },
	researchTimeMs: 20000,
	researchedAt: "armory",
	prerequisite: null,
	unlocksAtMission: 5,
	effect: {
		type: "stat_boost",
		targets: ["river_rat"],
		stat: "salvageGather",
		value: 75, // percent
	},
};

const nightVision: ContentResearchDef = {
	id: "night_vision",
	name: "Night Vision",
	description:
		"+2 vision radius for all friendly units. Bioluminescent goggles adapted from cave fungi.",
	cost: { fish: 100, timber: 0, salvage: 250 },
	researchTimeMs: 30000,
	researchedAt: "armory",
	prerequisite: null,
	unlocksAtMission: 9,
	effect: {
		type: "stat_boost",
		targets: [
			"mudfoot",
			"shellcracker",
			"sapper",
			"raftsman",
			"mortar_otter",
			"diver",
			"river_rat",
		],
		stat: "visionRadius",
		value: 2,
	},
};

const mortarPrecision: ContentResearchDef = {
	id: "mortar_precision",
	name: "Mortar Precision",
	description:
		"-30% mortar scatter radius. Stabilized firing platform and improved shell aerodynamics.",
	cost: { fish: 100, timber: 50, salvage: 200 },
	researchTimeMs: 25000,
	researchedAt: "armory",
	prerequisite: null,
	unlocksAtMission: 11,
	effect: {
		type: "stat_boost",
		targets: ["mortar_otter"],
		stat: "scatter",
		value: -30, // percent
	},
};

const combatMedics: ContentResearchDef = {
	id: "combat_medics",
	name: "Combat Medics",
	description: "Field Hospital heal rate +50%. Advanced battlefield triage.",
	cost: { fish: 150, timber: 0, salvage: 150 },
	researchTimeMs: 20000,
	researchedAt: "armory",
	prerequisite: null,
	unlocksAtMission: 10,
	effect: {
		type: "stat_boost",
		targets: ["field_hospital"],
		stat: "healRate",
		value: 1, // flat
	},
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const RESEARCH_REGISTRY: Map<string, ContentResearchDef> = new Map([
	[improvedArmor.id, improvedArmor],
	[sharpenedClaws.id, sharpenedClaws],
	[extendedRange.id, extendedRange],
	[swiftCurrent.id, swiftCurrent],
	[fortifiedWalls.id, fortifiedWalls],
	[advancedFishing.id, advancedFishing],
	[salvageExpertise.id, salvageExpertise],
	[nightVision.id, nightVision],
	[mortarPrecision.id, mortarPrecision],
	[combatMedics.id, combatMedics],
]);

/**
 * Look up a research definition by ID.
 * Throws if the ID is not found -- NO FALLBACK.
 */
export function getResearchDef(id: string): ContentResearchDef {
	const def = RESEARCH_REGISTRY.get(id);
	if (!def) {
		throw new Error(
			`getResearchDef: unknown research ID '${id}'. ` +
				`Available: ${[...RESEARCH_REGISTRY.keys()].join(", ")}`,
		);
	}
	return def;
}
