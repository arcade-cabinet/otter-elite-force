/**
 * Unit Registry — every unit type in the game with complete stats.
 *
 * Wraps the entity definitions from src/entities/ and provides a flat,
 * engine-friendly lookup map. NO FALLBACKS: if a unit type is not in
 * the registry, getUnitDef() throws.
 */

export interface ContentUnitDef {
	id: string;
	name: string;
	faction: "ura" | "scale_guard" | "neutral";
	category:
		| "worker"
		| "infantry"
		| "ranged"
		| "heavy"
		| "scout"
		| "engineer"
		| "medic"
		| "hero"
		| "siege"
		| "transport"
		| "support";
	animal: string;
	rankBadge: number;
	hp: number;
	armor: number;
	speed: number;
	attackDamage: number;
	attackRange: number;
	attackCooldownMs: number;
	visionRadius: number;
	popCost: number;
	canSwim: boolean;
	canStealth: boolean;
	description: string;
	trainedAt: string;
	trainCost: { fish: number; timber: number; salvage: number };
	trainTimeMs: number;
	unlocksAtMission: number;
}

// ---------------------------------------------------------------------------
// URA (Otter Elite Force) Units
// ---------------------------------------------------------------------------

const riverRat: ContentUnitDef = {
	id: "river_rat",
	name: "River Rat",
	faction: "ura",
	category: "worker",
	animal: "otter",
	rankBadge: 0,
	hp: 40,
	armor: 0,
	speed: 80,
	attackDamage: 5,
	attackRange: 32,
	attackCooldownMs: 1500,
	visionRadius: 6,
	popCost: 1,
	canSwim: true,
	canStealth: false,
	description:
		"OEF workhorse. Harvests fish, timber, and salvage. Builds structures. Weak combatant.",
	trainedAt: "command_post",
	trainCost: { fish: 50, timber: 0, salvage: 0 },
	trainTimeMs: 15000,
	unlocksAtMission: 1,
};

const mudfoot: ContentUnitDef = {
	id: "mudfoot",
	name: "Mudfoot",
	faction: "ura",
	category: "infantry",
	animal: "otter",
	rankBadge: 1,
	hp: 80,
	armor: 2,
	speed: 64,
	attackDamage: 12,
	attackRange: 32,
	attackCooldownMs: 1200,
	visionRadius: 5,
	popCost: 1,
	canSwim: false,
	canStealth: false,
	description:
		"Standard OEF infantry. Reliable in melee, decent HP. The backbone of any assault force.",
	trainedAt: "barracks",
	trainCost: { fish: 80, timber: 0, salvage: 20 },
	trainTimeMs: 20000,
	unlocksAtMission: 1,
};

const shellcracker: ContentUnitDef = {
	id: "shellcracker",
	name: "Shellcracker",
	faction: "ura",
	category: "heavy",
	animal: "otter",
	rankBadge: 2,
	hp: 150,
	armor: 5,
	speed: 48,
	attackDamage: 18,
	attackRange: 32,
	attackCooldownMs: 1800,
	visionRadius: 4,
	popCost: 2,
	canSwim: false,
	canStealth: false,
	description:
		"Heavy infantry. High HP and armor, devastating melee. Slow but nearly unstoppable in close quarters.",
	trainedAt: "barracks",
	trainCost: { fish: 120, timber: 0, salvage: 60 },
	trainTimeMs: 30000,
	unlocksAtMission: 2,
};

const sapper: ContentUnitDef = {
	id: "sapper",
	name: "Sapper",
	faction: "ura",
	category: "engineer",
	animal: "otter",
	rankBadge: 1,
	hp: 50,
	armor: 1,
	speed: 64,
	attackDamage: 8,
	attackRange: 32,
	attackCooldownMs: 1400,
	visionRadius: 5,
	popCost: 1,
	canSwim: false,
	canStealth: false,
	description:
		"Demolitions specialist. +200% damage to buildings. Can lay explosive charges and clear obstacles.",
	trainedAt: "armory",
	trainCost: { fish: 75, timber: 0, salvage: 50 },
	trainTimeMs: 25000,
	unlocksAtMission: 4,
};

const raftsman: ContentUnitDef = {
	id: "raftsman",
	name: "Raftsman",
	faction: "ura",
	category: "transport",
	animal: "otter",
	rankBadge: 0,
	hp: 60,
	armor: 0,
	speed: 72,
	attackDamage: 4,
	attackRange: 32,
	attackCooldownMs: 2000,
	visionRadius: 6,
	popCost: 1,
	canSwim: true,
	canStealth: false,
	description:
		"Water transport specialist. Builds rafts that carry up to 4 units across water. Can board enemy barges.",
	trainedAt: "dock",
	trainCost: { fish: 100, timber: 0, salvage: 50 },
	trainTimeMs: 20000,
	unlocksAtMission: 5,
};

const mortarOtter: ContentUnitDef = {
	id: "mortar_otter",
	name: "Mortar Otter",
	faction: "ura",
	category: "siege",
	animal: "otter",
	rankBadge: 2,
	hp: 45,
	armor: 0,
	speed: 48,
	attackDamage: 25,
	attackRange: 192,
	attackCooldownMs: 3000,
	visionRadius: 7,
	popCost: 2,
	canSwim: false,
	canStealth: false,
	description:
		"Long-range artillery. Lobs mortar shells that deal splash damage. Fragile in close combat.",
	trainedAt: "armory",
	trainCost: { fish: 100, timber: 50, salvage: 80 },
	trainTimeMs: 35000,
	unlocksAtMission: 3,
};

const diver: ContentUnitDef = {
	id: "diver",
	name: "Diver",
	faction: "ura",
	category: "scout",
	animal: "otter",
	rankBadge: 1,
	hp: 50,
	armor: 0,
	speed: 72,
	attackDamage: 10,
	attackRange: 32,
	attackCooldownMs: 1300,
	visionRadius: 6,
	popCost: 1,
	canSwim: true,
	canStealth: true,
	description:
		"Stealth water operative. Invisible while submerged. Fast in water, can ambush from below.",
	trainedAt: "dock",
	trainCost: { fish: 75, timber: 0, salvage: 75 },
	trainTimeMs: 25000,
	unlocksAtMission: 4,
};

// ---------------------------------------------------------------------------
// URA Heroes
// ---------------------------------------------------------------------------

const colBubbles: ContentUnitDef = {
	id: "col_bubbles",
	name: "Col. Bubbles",
	faction: "ura",
	category: "hero",
	animal: "otter",
	rankBadge: 3,
	hp: 200,
	armor: 4,
	speed: 64,
	attackDamage: 20,
	attackRange: 32,
	attackCooldownMs: 1000,
	visionRadius: 8,
	popCost: 0,
	canSwim: false,
	canStealth: false,
	description:
		"HQ tactical officer. Strong melee fighter with command aura that boosts nearby unit morale.",
	trainedAt: "none",
	trainCost: { fish: 0, timber: 0, salvage: 0 },
	trainTimeMs: 0,
	unlocksAtMission: 12,
};

const genWhiskers: ContentUnitDef = {
	id: "gen_whiskers",
	name: "Gen. Whiskers",
	faction: "ura",
	category: "hero",
	animal: "otter",
	rankBadge: 3,
	hp: 120,
	armor: 2,
	speed: 56,
	attackDamage: 10,
	attackRange: 32,
	attackCooldownMs: 1500,
	visionRadius: 10,
	popCost: 0,
	canSwim: false,
	canStealth: false,
	description:
		"Strategic command. Extended vision range and reveals hidden enemies. Rescued in Mission 4.",
	trainedAt: "none",
	trainCost: { fish: 0, timber: 0, salvage: 0 },
	trainTimeMs: 0,
	unlocksAtMission: 4,
};

const cplSplash: ContentUnitDef = {
	id: "cpl_splash",
	name: "Cpl. Splash",
	faction: "ura",
	category: "hero",
	animal: "otter",
	rankBadge: 2,
	hp: 100,
	armor: 1,
	speed: 80,
	attackDamage: 14,
	attackRange: 32,
	attackCooldownMs: 1100,
	visionRadius: 8,
	popCost: 0,
	canSwim: true,
	canStealth: true,
	description:
		"Water specialist hero. Invisible while submerged, +50% swim speed, reveals submerged objects.",
	trainedAt: "none",
	trainCost: { fish: 0, timber: 0, salvage: 0 },
	trainTimeMs: 0,
	unlocksAtMission: 8,
};

const sgtFang: ContentUnitDef = {
	id: "sgt_fang",
	name: "Sgt. Fang",
	faction: "ura",
	category: "hero",
	animal: "otter",
	rankBadge: 2,
	hp: 250,
	armor: 6,
	speed: 48,
	attackDamage: 30,
	attackRange: 32,
	attackCooldownMs: 1600,
	visionRadius: 5,
	popCost: 0,
	canSwim: false,
	canStealth: false,
	description:
		"Heavy melee siege specialist. Breach Charge ability destroys walls. Rescued in Mission 12.",
	trainedAt: "none",
	trainCost: { fish: 0, timber: 0, salvage: 0 },
	trainTimeMs: 0,
	unlocksAtMission: 12,
};

const medicMarina: ContentUnitDef = {
	id: "medic_marina",
	name: "Medic Marina",
	faction: "ura",
	category: "hero",
	animal: "otter",
	rankBadge: 2,
	hp: 80,
	armor: 1,
	speed: 64,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	visionRadius: 6,
	popCost: 0,
	canSwim: false,
	canStealth: false,
	description:
		"Field medic hero. Heals nearby units for 3 HP/second. Cannot attack. Invaluable in sustained fights.",
	trainedAt: "none",
	trainCost: { fish: 0, timber: 0, salvage: 0 },
	trainTimeMs: 0,
	unlocksAtMission: 6,
};

const pvtMuskrat: ContentUnitDef = {
	id: "pvt_muskrat",
	name: "Pvt. Muskrat",
	faction: "ura",
	category: "hero",
	animal: "otter",
	rankBadge: 1,
	hp: 60,
	armor: 0,
	speed: 72,
	attackDamage: 35,
	attackRange: 48,
	attackCooldownMs: 2500,
	visionRadius: 5,
	popCost: 0,
	canSwim: false,
	canStealth: false,
	description:
		"Demolitions hero. Throws explosive charges at range. Massive damage to buildings and groups.",
	trainedAt: "none",
	trainCost: { fish: 0, timber: 0, salvage: 0 },
	trainTimeMs: 0,
	unlocksAtMission: 9,
};

// ---------------------------------------------------------------------------
// Scale-Guard Units
// ---------------------------------------------------------------------------

const skink: ContentUnitDef = {
	id: "skink",
	name: "Skink",
	faction: "scale_guard",
	category: "scout",
	animal: "snake",
	rankBadge: 0,
	hp: 30,
	armor: 0,
	speed: 88,
	attackDamage: 6,
	attackRange: 32,
	attackCooldownMs: 1200,
	visionRadius: 7,
	popCost: 1,
	canSwim: false,
	canStealth: false,
	description: "Scale-Guard scout. Fast and fragile. Reports OEF positions to Scale-Guard command.",
	trainedAt: "spawning_pool",
	trainCost: { fish: 30, timber: 0, salvage: 0 },
	trainTimeMs: 10000,
	unlocksAtMission: 1,
};

const gator: ContentUnitDef = {
	id: "gator",
	name: "Gator",
	faction: "scale_guard",
	category: "infantry",
	animal: "crocodile",
	rankBadge: 0,
	hp: 90,
	armor: 2,
	speed: 56,
	attackDamage: 14,
	attackRange: 32,
	attackCooldownMs: 1300,
	visionRadius: 5,
	popCost: 1,
	canSwim: true,
	canStealth: false,
	description:
		"Standard Scale-Guard infantry. Tough, hits hard, swims naturally. The backbone of enemy forces.",
	trainedAt: "spawning_pool",
	trainCost: { fish: 70, timber: 0, salvage: 0 },
	trainTimeMs: 18000,
	unlocksAtMission: 1,
};

const viper: ContentUnitDef = {
	id: "viper",
	name: "Viper",
	faction: "scale_guard",
	category: "ranged",
	animal: "snake",
	rankBadge: 1,
	hp: 50,
	armor: 0,
	speed: 64,
	attackDamage: 16,
	attackRange: 128,
	attackCooldownMs: 2000,
	visionRadius: 7,
	popCost: 1,
	canSwim: false,
	canStealth: false,
	description:
		"Scale-Guard ranged striker. Venomous spit at range. Low HP but deadly if uncontested.",
	trainedAt: "spawning_pool",
	trainCost: { fish: 60, timber: 0, salvage: 30 },
	trainTimeMs: 22000,
	unlocksAtMission: 1,
};

const snapper: ContentUnitDef = {
	id: "snapper",
	name: "Snapper",
	faction: "scale_guard",
	category: "heavy",
	animal: "crocodile",
	rankBadge: 2,
	hp: 200,
	armor: 6,
	speed: 40,
	attackDamage: 22,
	attackRange: 32,
	attackCooldownMs: 2000,
	visionRadius: 4,
	popCost: 2,
	canSwim: true,
	canStealth: false,
	description:
		"Scale-Guard heavy. Massive HP and armor. Slow but devastating in melee. Requires focused fire to stop.",
	trainedAt: "spawning_pool",
	trainCost: { fish: 150, timber: 0, salvage: 80 },
	trainTimeMs: 35000,
	unlocksAtMission: 6,
};

const scoutLizard: ContentUnitDef = {
	id: "scout_lizard",
	name: "Scout Lizard",
	faction: "scale_guard",
	category: "scout",
	animal: "cobra",
	rankBadge: 0,
	hp: 35,
	armor: 0,
	speed: 96,
	attackDamage: 4,
	attackRange: 32,
	attackCooldownMs: 1500,
	visionRadius: 9,
	popCost: 1,
	canSwim: false,
	canStealth: true,
	description:
		"Scale-Guard recon. Fastest enemy unit with extended vision. Can stealth in tall grass.",
	trainedAt: "spawning_pool",
	trainCost: { fish: 40, timber: 0, salvage: 20 },
	trainTimeMs: 12000,
	unlocksAtMission: 3,
};

const crocChampion: ContentUnitDef = {
	id: "croc_champion",
	name: "Croc Champion",
	faction: "scale_guard",
	category: "heavy",
	animal: "crocodile",
	rankBadge: 3,
	hp: 300,
	armor: 8,
	speed: 48,
	attackDamage: 28,
	attackRange: 32,
	attackCooldownMs: 1800,
	visionRadius: 5,
	popCost: 3,
	canSwim: true,
	canStealth: false,
	description:
		"Scale-Guard elite. Extremely dangerous in melee with heavy armor. Commands nearby units.",
	trainedAt: "spawning_pool",
	trainCost: { fish: 200, timber: 0, salvage: 120 },
	trainTimeMs: 45000,
	unlocksAtMission: 5,
};

const siphonDrone: ContentUnitDef = {
	id: "siphon_drone",
	name: "Siphon Drone",
	faction: "scale_guard",
	category: "support",
	animal: "cobra",
	rankBadge: 0,
	hp: 60,
	armor: 1,
	speed: 56,
	attackDamage: 8,
	attackRange: 64,
	attackCooldownMs: 2500,
	visionRadius: 5,
	popCost: 1,
	canSwim: false,
	canStealth: false,
	description:
		"Scale-Guard tech unit. Drains resources from nearby nodes. Moderate combat ability.",
	trainedAt: "siphon",
	trainCost: { fish: 80, timber: 0, salvage: 40 },
	trainTimeMs: 20000,
	unlocksAtMission: 5,
};

const serpentKing: ContentUnitDef = {
	id: "serpent_king",
	name: "Serpent King",
	faction: "scale_guard",
	category: "hero",
	animal: "cobra",
	rankBadge: 3,
	hp: 500,
	armor: 10,
	speed: 40,
	attackDamage: 40,
	attackRange: 64,
	attackCooldownMs: 2000,
	visionRadius: 8,
	popCost: 0,
	canSwim: false,
	canStealth: false,
	description:
		"Scale-Guard boss unit. Massive HP, devastating attacks, poison aura. Appears in late-game missions.",
	trainedAt: "none",
	trainCost: { fish: 0, timber: 0, salvage: 0 },
	trainTimeMs: 0,
	unlocksAtMission: 6,
};

// ---------------------------------------------------------------------------
// Neutral Units
// ---------------------------------------------------------------------------

const civilianOtter: ContentUnitDef = {
	id: "civilian_otter",
	name: "Civilian Otter",
	faction: "neutral",
	category: "worker",
	animal: "otter",
	rankBadge: 0,
	hp: 20,
	armor: 0,
	speed: 64,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	visionRadius: 4,
	popCost: 0,
	canSwim: true,
	canStealth: false,
	description: "Non-combatant otter. Flees from danger. Rescue for bonus objectives.",
	trainedAt: "none",
	trainCost: { fish: 0, timber: 0, salvage: 0 },
	trainTimeMs: 0,
	unlocksAtMission: 1,
};

const wildBoar: ContentUnitDef = {
	id: "wild_boar",
	name: "Wild Boar",
	faction: "neutral",
	category: "infantry",
	animal: "boar",
	rankBadge: 0,
	hp: 60,
	armor: 3,
	speed: 72,
	attackDamage: 8,
	attackRange: 32,
	attackCooldownMs: 1500,
	visionRadius: 4,
	popCost: 0,
	canSwim: false,
	canStealth: false,
	description:
		"Territorial wildlife. Charges at any unit that enters its territory. Drops food on death.",
	trainedAt: "none",
	trainCost: { fish: 0, timber: 0, salvage: 0 },
	trainTimeMs: 0,
	unlocksAtMission: 1,
};

const scavengerVulture: ContentUnitDef = {
	id: "scavenger_vulture",
	name: "Scavenger Vulture",
	faction: "neutral",
	category: "scout",
	animal: "vulture",
	rankBadge: 0,
	hp: 25,
	armor: 0,
	speed: 96,
	attackDamage: 3,
	attackRange: 32,
	attackCooldownMs: 2000,
	visionRadius: 10,
	popCost: 0,
	canSwim: false,
	canStealth: false,
	description:
		"Airborne scavenger. Circles battlefields. Reveals corpse locations. Harmless but annoying.",
	trainedAt: "none",
	trainCost: { fish: 0, timber: 0, salvage: 0 },
	trainTimeMs: 0,
	unlocksAtMission: 1,
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const UNIT_REGISTRY: Map<string, ContentUnitDef> = new Map([
	// URA units
	[riverRat.id, riverRat],
	[mudfoot.id, mudfoot],
	[shellcracker.id, shellcracker],
	[sapper.id, sapper],
	[raftsman.id, raftsman],
	[mortarOtter.id, mortarOtter],
	[diver.id, diver],
	// URA heroes
	[colBubbles.id, colBubbles],
	[genWhiskers.id, genWhiskers],
	[cplSplash.id, cplSplash],
	[sgtFang.id, sgtFang],
	[medicMarina.id, medicMarina],
	[pvtMuskrat.id, pvtMuskrat],
	// Scale-Guard units
	[skink.id, skink],
	[gator.id, gator],
	[viper.id, viper],
	[snapper.id, snapper],
	[scoutLizard.id, scoutLizard],
	[crocChampion.id, crocChampion],
	[siphonDrone.id, siphonDrone],
	[serpentKing.id, serpentKing],
	// Neutral
	[civilianOtter.id, civilianOtter],
	[wildBoar.id, wildBoar],
	[scavengerVulture.id, scavengerVulture],
]);

/**
 * Look up a unit definition by ID.
 * Throws if the ID is not found -- NO FALLBACK.
 */
export function getUnitDef(id: string): ContentUnitDef {
	const def = UNIT_REGISTRY.get(id);
	if (!def) {
		throw new Error(
			`getUnitDef: unknown unit ID '${id}'. ` +
				`Available: ${[...UNIT_REGISTRY.keys()].join(", ")}`,
		);
	}
	return def;
}
