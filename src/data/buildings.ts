/**
 * Building data definitions for Otter: Elite Force RTS.
 *
 * All stat values sourced from the design spec §4 (Factions).
 */

import type { FactionId, ResourceCost } from "./units";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BuildingDef {
	id: string;
	name: string;
	faction: FactionId;
	role: string;
	cost: ResourceCost;
	hp: number;
	/** Build time in seconds. */
	buildTime: number;
	/** Mission number where this building becomes available. */
	unlock: number;
	/** Units this building can train (unit ids). */
	trains?: string[];
	/** Passive effect description, if any. */
	passive?: string;
	/** Damage dealt for defensive buildings (Watchtower, Gun Tower). */
	damage?: number;
	/** Attack range for defensive buildings. */
	range?: number;
	/** Whether this building must be placed on a water edge. */
	requiresWater?: boolean;
	/** Population cap bonus provided by this building. */
	popCapBonus?: number;
}

// ---------------------------------------------------------------------------
// URA Buildings
// ---------------------------------------------------------------------------

export const URA_BUILDINGS: Record<string, BuildingDef> = {
	command_post: {
		id: "command_post",
		name: "Command Post",
		faction: "ura",
		role: "Workers, resource depot. One per base.",
		cost: { timber: 400, salvage: 200 },
		hp: 600,
		buildTime: 60,
		unlock: 1,
		trains: ["river_rat"],
	},
	barracks: {
		id: "barracks",
		name: "Barracks",
		faction: "ura",
		role: "Trains Mudfoots, Shellcrackers",
		cost: { timber: 200 },
		hp: 350,
		buildTime: 30,
		unlock: 1,
		trains: ["mudfoot", "shellcracker"],
	},
	armory: {
		id: "armory",
		name: "Armory",
		faction: "ura",
		role: "Trains Sappers, Mortar Otters. Research.",
		cost: { timber: 300, salvage: 100 },
		hp: 400,
		buildTime: 40,
		unlock: 5,
		trains: ["sapper", "mortar_otter"],
	},
	watchtower: {
		id: "watchtower",
		name: "Watchtower",
		faction: "ura",
		role: "Detection radius (8 tiles), light ranged defense",
		cost: { timber: 150 },
		hp: 200,
		buildTime: 20,
		unlock: 1,
		damage: 6,
		range: 8,
	},
	fish_trap: {
		id: "fish_trap",
		name: "Fish Trap",
		faction: "ura",
		role: "Passive fish income (+3 fish/10s)",
		cost: { timber: 100 },
		hp: 80,
		buildTime: 15,
		unlock: 1,
		passive: "+3 fish per 10 seconds",
	},
	burrow: {
		id: "burrow",
		name: "Burrow",
		faction: "ura",
		role: "+6 population cap",
		cost: { timber: 80 },
		hp: 100,
		buildTime: 10,
		unlock: 1,
		popCapBonus: 6,
	},
	dock: {
		id: "dock",
		name: "Dock",
		faction: "ura",
		role: "Trains Raftsmen, Divers. Must be on water edge.",
		cost: { timber: 250, salvage: 50 },
		hp: 300,
		buildTime: 35,
		unlock: 7,
		trains: ["raftsman", "diver"],
		requiresWater: true,
	},
	field_hospital: {
		id: "field_hospital",
		name: "Field Hospital",
		faction: "ura",
		role: "Heals nearby units (+2 HP/s in 3-tile radius)",
		cost: { timber: 200, salvage: 100 },
		hp: 250,
		buildTime: 30,
		unlock: 10,
		passive: "+2 HP/s heal in 3-tile radius",
	},
	sandbag_wall: {
		id: "sandbag_wall",
		name: "Sandbag Wall",
		faction: "ura",
		role: "Barrier, blocks pathing",
		cost: { timber: 50 },
		hp: 150,
		buildTime: 5,
		unlock: 1,
	},
	stone_wall: {
		id: "stone_wall",
		name: "Stone Wall",
		faction: "ura",
		role: "Stronger barrier (requires Fortified Walls research)",
		cost: { timber: 100, salvage: 50 },
		hp: 400,
		buildTime: 10,
		unlock: 11,
	},
	gun_tower: {
		id: "gun_tower",
		name: "Gun Tower",
		faction: "ura",
		role: "Upgraded tower, 12 dmg ranged attack (requires research)",
		cost: { timber: 200, salvage: 100 },
		hp: 350,
		buildTime: 25,
		unlock: 11,
		damage: 12,
		range: 8,
	},
	minefield: {
		id: "minefield",
		name: "Minefield",
		faction: "ura",
		role: "One-time trap, 40 dmg to first unit that crosses",
		cost: { salvage: 80 },
		hp: 1,
		buildTime: 8,
		unlock: 11,
		damage: 40,
		passive: "Invisible, one-time detonation",
	},
};

// ---------------------------------------------------------------------------
// Scale-Guard Buildings (simplified — AI-controlled, not player-buildable)
// ---------------------------------------------------------------------------

export const SCALE_GUARD_BUILDINGS: Record<string, BuildingDef> = {
	sludge_pit: {
		id: "sludge_pit",
		name: "Sludge Pit",
		faction: "scale_guard",
		role: "Town hall",
		cost: {},
		hp: 500,
		buildTime: 0,
		unlock: 1,
		trains: ["skink"],
	},
	spawning_pool: {
		id: "spawning_pool",
		name: "Spawning Pool",
		faction: "scale_guard",
		role: "Barracks",
		cost: {},
		hp: 350,
		buildTime: 0,
		unlock: 1,
		trains: ["gator", "viper", "snapper", "scout_lizard", "croc_champion", "siphon_drone"],
	},
	venom_spire: {
		id: "venom_spire",
		name: "Venom Spire",
		faction: "scale_guard",
		role: "Tower",
		cost: {},
		hp: 250,
		buildTime: 0,
		unlock: 1,
		damage: 10,
		range: 7,
	},
	siphon: {
		id: "siphon",
		name: "Siphon",
		faction: "scale_guard",
		role: "Resource drain / objective",
		cost: {},
		hp: 300,
		buildTime: 0,
		unlock: 5,
		passive: "Drains nearby water / poisons terrain",
	},
	scale_wall: {
		id: "scale_wall",
		name: "Scale Wall",
		faction: "scale_guard",
		role: "Barrier",
		cost: {},
		hp: 300,
		buildTime: 0,
		unlock: 1,
	},
};

// ---------------------------------------------------------------------------
// Aggregate Lookups
// ---------------------------------------------------------------------------

export const ALL_BUILDINGS: Record<string, BuildingDef> = {
	...URA_BUILDINGS,
	...SCALE_GUARD_BUILDINGS,
};
