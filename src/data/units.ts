/**
 * Unit data definitions for Otter: Elite Force RTS.
 *
 * All stat values sourced from the design spec §4 (Factions).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FactionId = "ura" | "scale_guard";
export type DamageType = "melee" | "ranged";
export type ResourceCost = Partial<Record<"fish" | "timber" | "salvage", number>>;

export interface UnitDef {
	id: string;
	name: string;
	faction: FactionId;
	role: string;
	cost: ResourceCost;
	hp: number;
	armor: number;
	damage: number;
	/** Bonus damage vs buildings (Sapper-specific). */
	damageVsBuildings?: number;
	damageType: DamageType;
	/** Attack range in tiles. 1 = melee. */
	range: number;
	speed: number;
	/** Population slots consumed. Heroes cost 0. */
	pop: number;
	/** Mission number where this unit becomes available. */
	unlock: number;
	/** Building id where this unit is trained. */
	trainAt: string;
	/** True if this unit is a hero (unique, not trainable via queue). */
	isHero?: boolean;
	/** Special ability description. */
	special?: string;
}

export interface HeroDef {
	id: string;
	name: string;
	faction: FactionId;
	hp: number;
	speed: number;
	/** Mission number where this hero is unlocked / rescued. */
	unlock: number;
	special: string;
	pop: 0;
	isHero: true;
}

// ---------------------------------------------------------------------------
// URA Hero Units
// ---------------------------------------------------------------------------

export const URA_HEROES: Record<string, HeroDef> = {
	sgt_bubbles: {
		id: "sgt_bubbles",
		name: "Sgt. Bubbles",
		faction: "ura",
		hp: 120,
		speed: 14,
		unlock: 1,
		special: "Rambo-style warrior-leader. Available every mission.",
		pop: 0,
		isHero: true,
	},
	gen_whiskers: {
		id: "gen_whiskers",
		name: "Gen. Whiskers",
		faction: "ura",
		hp: 200,
		speed: 10,
		unlock: 4,
		special: "Becomes briefing officer. Playable in Mission 15-16.",
		pop: 0,
		isHero: true,
	},
	cpl_splash: {
		id: "cpl_splash",
		name: "Cpl. Splash",
		faction: "ura",
		hp: 80,
		speed: 18,
		unlock: 8,
		special: "Underwater capability. Unlocks Diver scouts.",
		pop: 0,
		isHero: true,
	},
	sgt_fang: {
		id: "sgt_fang",
		name: "Sgt. Fang",
		faction: "ura",
		hp: 150,
		speed: 12,
		unlock: 12,
		special: "Siege specialist. Bonus damage vs buildings.",
		pop: 0,
		isHero: true,
	},
	medic_marina: {
		id: "medic_marina",
		name: "Medic Marina",
		faction: "ura",
		hp: 80,
		speed: 16,
		unlock: 10,
		special: "Heals nearby units. Unlocks Field Hospital upgrade.",
		pop: 0,
		isHero: true,
	},
	pvt_muskrat: {
		id: "pvt_muskrat",
		name: "Pvt. Muskrat",
		faction: "ura",
		hp: 120,
		speed: 11,
		unlock: 14,
		special: "Demolition expert. Plants timed charges.",
		pop: 0,
		isHero: true,
	},
};

// ---------------------------------------------------------------------------
// URA Trainable Units
// ---------------------------------------------------------------------------

export const URA_UNITS: Record<string, UnitDef> = {
	river_rat: {
		id: "river_rat",
		name: "River Rat",
		faction: "ura",
		role: "Worker — gathers, builds, repairs",
		cost: { fish: 50 },
		hp: 40,
		armor: 0,
		damage: 5,
		damageType: "melee",
		range: 1,
		speed: 10,
		pop: 1,
		unlock: 1,
		trainAt: "command_post",
	},
	mudfoot: {
		id: "mudfoot",
		name: "Mudfoot",
		faction: "ura",
		role: "Melee infantry — front line",
		cost: { fish: 80, salvage: 20 },
		hp: 80,
		armor: 2,
		damage: 12,
		damageType: "melee",
		range: 1,
		speed: 8,
		pop: 1,
		unlock: 1,
		trainAt: "barracks",
	},
	shellcracker: {
		id: "shellcracker",
		name: "Shellcracker",
		faction: "ura",
		role: "Ranged infantry — DPS",
		cost: { fish: 70, salvage: 30 },
		hp: 50,
		armor: 0,
		damage: 10,
		damageType: "ranged",
		range: 5,
		speed: 9,
		pop: 1,
		unlock: 3,
		trainAt: "barracks",
	},
	sapper: {
		id: "sapper",
		name: "Sapper",
		faction: "ura",
		role: "Anti-building siege",
		cost: { fish: 100, salvage: 50 },
		hp: 60,
		armor: 1,
		damage: 8,
		damageVsBuildings: 30,
		damageType: "melee",
		range: 1,
		speed: 7,
		pop: 1,
		unlock: 5,
		trainAt: "armory",
	},
	raftsman: {
		id: "raftsman",
		name: "Raftsman",
		faction: "ura",
		role: "Water transport (carries 4)",
		cost: { timber: 60, salvage: 20 },
		hp: 100,
		armor: 3,
		damage: 0,
		damageType: "melee",
		range: 0,
		speed: 6,
		pop: 1,
		unlock: 7,
		trainAt: "dock",
	},
	mortar_otter: {
		id: "mortar_otter",
		name: "Mortar Otter",
		faction: "ura",
		role: "Long range AoE",
		cost: { fish: 80, salvage: 60 },
		hp: 45,
		armor: 0,
		damage: 20,
		damageType: "ranged",
		range: 7,
		speed: 5,
		pop: 1,
		unlock: 9,
		trainAt: "armory",
		special: "2-tile splash radius",
	},
	diver: {
		id: "diver",
		name: "Diver",
		faction: "ura",
		role: "Underwater scout",
		cost: { fish: 60, salvage: 40 },
		hp: 35,
		armor: 0,
		damage: 8,
		damageType: "melee",
		range: 1,
		speed: 12,
		pop: 1,
		unlock: 9,
		trainAt: "dock",
		special: "Requires Mission 8 completion",
	},
};

// ---------------------------------------------------------------------------
// Scale-Guard Units
// ---------------------------------------------------------------------------

export const SCALE_GUARD_UNITS: Record<string, UnitDef> = {
	skink: {
		id: "skink",
		name: "Skink",
		faction: "scale_guard",
		role: "Worker",
		cost: {},
		hp: 30,
		armor: 0,
		damage: 4,
		damageType: "melee",
		range: 1,
		speed: 10,
		pop: 1,
		unlock: 1,
		trainAt: "sludge_pit",
	},
	gator: {
		id: "gator",
		name: "Gator",
		faction: "scale_guard",
		role: "Melee tank",
		cost: {},
		hp: 120,
		armor: 4,
		damage: 18,
		damageType: "melee",
		range: 1,
		speed: 5,
		pop: 1,
		unlock: 1,
		trainAt: "spawning_pool",
		special: "Can submerge briefly for ambush",
	},
	viper: {
		id: "viper",
		name: "Viper",
		faction: "scale_guard",
		role: "Ranged poison",
		cost: {},
		hp: 35,
		armor: 0,
		damage: 8,
		damageType: "ranged",
		range: 5,
		speed: 8,
		pop: 1,
		unlock: 1,
		trainAt: "spawning_pool",
		special: "+4 DoT over 3s",
	},
	snapper: {
		id: "snapper",
		name: "Snapper",
		faction: "scale_guard",
		role: "Turret",
		cost: {},
		hp: 80,
		armor: 3,
		damage: 14,
		damageType: "ranged",
		range: 6,
		speed: 0,
		pop: 1,
		unlock: 1,
		trainAt: "spawning_pool",
		special: "Anchored, cannot move",
	},
	scout_lizard: {
		id: "scout_lizard",
		name: "Scout Lizard",
		faction: "scale_guard",
		role: "Recon",
		cost: {},
		hp: 25,
		armor: 0,
		damage: 3,
		damageType: "melee",
		range: 1,
		speed: 14,
		pop: 1,
		unlock: 1,
		trainAt: "spawning_pool",
		special: "Reveals fog, calls reinforcements on sight",
	},
	croc_champion: {
		id: "croc_champion",
		name: "Croc Champion",
		faction: "scale_guard",
		role: "Elite",
		cost: {},
		hp: 200,
		armor: 5,
		damage: 25,
		damageType: "melee",
		range: 1,
		speed: 6,
		pop: 1,
		unlock: 9,
		trainAt: "spawning_pool",
		special: "Mini-boss, heavy armor + damage",
	},
	siphon_drone: {
		id: "siphon_drone",
		name: "Siphon Drone",
		faction: "scale_guard",
		role: "Harass",
		cost: {},
		hp: 40,
		armor: 1,
		damage: 0,
		damageType: "ranged",
		range: 3,
		speed: 7,
		pop: 1,
		unlock: 5,
		trainAt: "spawning_pool",
		special: "Drains 2 fish/sec from nearest player building within range",
	},
};

// ---------------------------------------------------------------------------
// Aggregate Lookups
// ---------------------------------------------------------------------------

/** All URA units (trainable + heroes mapped to UnitDef shape). */
export const ALL_URA_UNITS = { ...URA_UNITS };

/** All Scale-Guard units. */
export const ALL_SCALE_GUARD_UNITS = { ...SCALE_GUARD_UNITS };

/** Every unit definition keyed by id. */
export const ALL_UNITS: Record<string, UnitDef> = {
	...URA_UNITS,
	...SCALE_GUARD_UNITS,
};

/** Every hero definition keyed by id. */
export const ALL_HEROES: Record<string, HeroDef> = { ...URA_HEROES };
