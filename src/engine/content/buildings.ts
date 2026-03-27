/**
 * Building Registry — every building type in the game with complete stats.
 *
 * NO FALLBACKS: if a building type is not in the registry, getBuildingDef() throws.
 */

export interface ContentBuildingDef {
	id: string;
	name: string;
	faction: "ura" | "scale_guard" | "neutral";
	hp: number;
	armor: number;
	buildCost: { fish: number; timber: number; salvage: number };
	buildTimeMs: number;
	produces: string[];
	passiveIncome?: { resource: "fish" | "timber" | "salvage"; amount: number; intervalMs: number };
	visionRadius: number;
	unlocksAtMission: number;
	description: string;
	isHQ: boolean;
	populationCapacity: number;
	attackDamage: number;
	attackRange: number;
	attackCooldownMs: number;
	healRate: number;
	healRadius: number;
}

// ---------------------------------------------------------------------------
// URA Buildings
// ---------------------------------------------------------------------------

const burrow: ContentBuildingDef = {
	id: "burrow",
	name: "Lodge",
	faction: "ura",
	hp: 1000,
	armor: 2,
	buildCost: { fish: 0, timber: 0, salvage: 0 },
	buildTimeMs: 0,
	produces: ["river_rat"],
	visionRadius: 8,
	unlocksAtMission: 1,
	description:
		"The Captain's field HQ. Trains River Rats. Provides 10 population capacity. If destroyed, the mission fails.",
	isHQ: true,
	populationCapacity: 10,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	healRate: 0,
	healRadius: 0,
};

const commandPost: ContentBuildingDef = {
	id: "command_post",
	name: "Command Post",
	faction: "ura",
	hp: 800,
	armor: 1,
	buildCost: { fish: 200, timber: 100, salvage: 0 },
	buildTimeMs: 30000,
	produces: ["river_rat"],
	visionRadius: 8,
	unlocksAtMission: 1,
	description:
		"Upgraded logistics hub. Trains River Rats. Provides 20 population capacity. Upgrade path for tech.",
	isHQ: true,
	populationCapacity: 20,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	healRate: 0,
	healRadius: 0,
};

const barracks: ContentBuildingDef = {
	id: "barracks",
	name: "Barracks",
	faction: "ura",
	hp: 600,
	armor: 1,
	buildCost: { fish: 150, timber: 200, salvage: 0 },
	buildTimeMs: 25000,
	produces: ["mudfoot", "shellcracker"],
	visionRadius: 5,
	unlocksAtMission: 1,
	description: "Military training facility. Trains Mudfoots and Shellcrackers.",
	isHQ: false,
	populationCapacity: 0,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	healRate: 0,
	healRadius: 0,
};

const armory: ContentBuildingDef = {
	id: "armory",
	name: "Armory",
	faction: "ura",
	hp: 600,
	armor: 2,
	buildCost: { fish: 200, timber: 150, salvage: 100 },
	buildTimeMs: 35000,
	produces: ["sapper", "mortar_otter"],
	visionRadius: 5,
	unlocksAtMission: 3,
	description:
		"Advanced military production. Trains Sappers and Mortar Otters. Researches upgrades.",
	isHQ: false,
	populationCapacity: 0,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	healRate: 0,
	healRadius: 0,
};

const watchtower: ContentBuildingDef = {
	id: "watchtower",
	name: "Watchtower",
	faction: "ura",
	hp: 400,
	armor: 1,
	buildCost: { fish: 50, timber: 100, salvage: 0 },
	buildTimeMs: 15000,
	produces: [],
	visionRadius: 10,
	unlocksAtMission: 1,
	description:
		"Defensive observation tower. Extended vision range. Fires arrows at nearby enemies.",
	isHQ: false,
	populationCapacity: 0,
	attackDamage: 6,
	attackRange: 128,
	attackCooldownMs: 2000,
	healRate: 0,
	healRadius: 0,
};

const fishTrap: ContentBuildingDef = {
	id: "fish_trap",
	name: "Fish Trap",
	faction: "ura",
	hp: 200,
	armor: 0,
	buildCost: { fish: 75, timber: 50, salvage: 0 },
	buildTimeMs: 15000,
	produces: [],
	passiveIncome: { resource: "fish", amount: 3, intervalMs: 10000 },
	visionRadius: 3,
	unlocksAtMission: 1,
	description: "Passive economy. Generates +3 fish every 10 seconds without worker attention.",
	isHQ: false,
	populationCapacity: 0,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	healRate: 0,
	healRadius: 0,
};

const dock: ContentBuildingDef = {
	id: "dock",
	name: "Dock",
	faction: "ura",
	hp: 400,
	armor: 1,
	buildCost: { fish: 200, timber: 150, salvage: 50 },
	buildTimeMs: 30000,
	produces: ["raftsman", "diver"],
	visionRadius: 6,
	unlocksAtMission: 6,
	description: "Naval production facility. Trains Raftsmen and Divers. Must be placed near water.",
	isHQ: false,
	populationCapacity: 0,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	healRate: 0,
	healRadius: 0,
};

const fieldHospital: ContentBuildingDef = {
	id: "field_hospital",
	name: "Field Hospital",
	faction: "ura",
	hp: 400,
	armor: 0,
	buildCost: { fish: 250, timber: 100, salvage: 0 },
	buildTimeMs: 25000,
	produces: [],
	visionRadius: 5,
	unlocksAtMission: 6,
	description: "Heals nearby friendly units for 2 HP per second within a 128px radius.",
	isHQ: false,
	populationCapacity: 0,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	healRate: 2,
	healRadius: 128,
};

const sandbagWall: ContentBuildingDef = {
	id: "sandbag_wall",
	name: "Sandbag Wall",
	faction: "ura",
	hp: 300,
	armor: 2,
	buildCost: { fish: 0, timber: 25, salvage: 0 },
	buildTimeMs: 8000,
	produces: [],
	visionRadius: 0,
	unlocksAtMission: 1,
	description: "Basic defensive barrier. Blocks movement. Cheap and fast to build.",
	isHQ: false,
	populationCapacity: 0,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	healRate: 0,
	healRadius: 0,
};

const stoneWall: ContentBuildingDef = {
	id: "stone_wall",
	name: "Stone Wall",
	faction: "ura",
	hp: 500,
	armor: 4,
	buildCost: { fish: 0, timber: 50, salvage: 25 },
	buildTimeMs: 12000,
	produces: [],
	visionRadius: 0,
	unlocksAtMission: 3,
	description:
		"Reinforced defensive wall. Higher HP and armor than sandbags. Requires Fortified Walls research.",
	isHQ: false,
	populationCapacity: 0,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	healRate: 0,
	healRadius: 0,
};

const gunTower: ContentBuildingDef = {
	id: "gun_tower",
	name: "Gun Tower",
	faction: "ura",
	hp: 500,
	armor: 3,
	buildCost: { fish: 150, timber: 100, salvage: 75 },
	buildTimeMs: 25000,
	produces: [],
	visionRadius: 8,
	unlocksAtMission: 3,
	description:
		"Heavy defensive emplacement. High damage at range. Requires Gun Emplacements research.",
	isHQ: false,
	populationCapacity: 0,
	attackDamage: 12,
	attackRange: 160,
	attackCooldownMs: 1500,
	healRate: 0,
	healRadius: 0,
};

const minefield: ContentBuildingDef = {
	id: "minefield",
	name: "Minefield",
	faction: "ura",
	hp: 50,
	armor: 0,
	buildCost: { fish: 50, timber: 0, salvage: 50 },
	buildTimeMs: 10000,
	produces: [],
	visionRadius: 0,
	unlocksAtMission: 4,
	description: "Hidden explosive trap. Detonates when an enemy unit walks over it. Single-use.",
	isHQ: false,
	populationCapacity: 0,
	attackDamage: 80,
	attackRange: 48,
	attackCooldownMs: 0,
	healRate: 0,
	healRadius: 0,
};

// ---------------------------------------------------------------------------
// Scale-Guard Buildings
// ---------------------------------------------------------------------------

const flagPost: ContentBuildingDef = {
	id: "flag_post",
	name: "Flag Post",
	faction: "scale_guard",
	hp: 500,
	armor: 1,
	buildCost: { fish: 0, timber: 0, salvage: 0 },
	buildTimeMs: 0,
	produces: [],
	visionRadius: 6,
	unlocksAtMission: 1,
	description: "Scale-Guard command structure. Destroy it to neutralize the outpost.",
	isHQ: true,
	populationCapacity: 0,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	healRate: 0,
	healRadius: 0,
};

const spawningPool: ContentBuildingDef = {
	id: "spawning_pool",
	name: "Spawning Pool",
	faction: "scale_guard",
	hp: 600,
	armor: 2,
	buildCost: { fish: 0, timber: 0, salvage: 0 },
	buildTimeMs: 0,
	produces: ["skink", "gator", "viper", "snapper", "scout_lizard", "croc_champion"],
	visionRadius: 5,
	unlocksAtMission: 1,
	description: "Scale-Guard unit production. Spawns all reptilian combat units.",
	isHQ: false,
	populationCapacity: 0,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	healRate: 0,
	healRadius: 0,
};

const fuelTank: ContentBuildingDef = {
	id: "fuel_tank",
	name: "Fuel Tank",
	faction: "scale_guard",
	hp: 400,
	armor: 1,
	buildCost: { fish: 0, timber: 0, salvage: 0 },
	buildTimeMs: 0,
	produces: [],
	visionRadius: 3,
	unlocksAtMission: 5,
	description:
		"Scale-Guard siphon core. Destroy it to shut down the siphon installation. Explodes on destruction.",
	isHQ: false,
	populationCapacity: 0,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	healRate: 0,
	healRadius: 0,
};

const venomSpire: ContentBuildingDef = {
	id: "venom_spire",
	name: "Venom Spire",
	faction: "scale_guard",
	hp: 350,
	armor: 2,
	buildCost: { fish: 0, timber: 0, salvage: 0 },
	buildTimeMs: 0,
	produces: [],
	visionRadius: 8,
	unlocksAtMission: 5,
	description: "Scale-Guard defensive tower. Fires poison projectiles at range. Slows targets hit.",
	isHQ: false,
	populationCapacity: 0,
	attackDamage: 10,
	attackRange: 144,
	attackCooldownMs: 2500,
	healRate: 0,
	healRadius: 0,
};

const scaleWall: ContentBuildingDef = {
	id: "scale_wall",
	name: "Scale Wall",
	faction: "scale_guard",
	hp: 600,
	armor: 5,
	buildCost: { fish: 0, timber: 0, salvage: 0 },
	buildTimeMs: 0,
	produces: [],
	visionRadius: 0,
	unlocksAtMission: 1,
	description: "Scale-Guard fortification. Heavy stone wall segment. Blocks movement.",
	isHQ: false,
	populationCapacity: 0,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	healRate: 0,
	healRadius: 0,
};

const siphon: ContentBuildingDef = {
	id: "siphon",
	name: "Siphon",
	faction: "scale_guard",
	hp: 300,
	armor: 1,
	buildCost: { fish: 0, timber: 0, salvage: 0 },
	buildTimeMs: 0,
	produces: ["siphon_drone"],
	visionRadius: 4,
	unlocksAtMission: 5,
	description:
		"Scale-Guard resource extraction. Drains nearby water resources. Produces Siphon Drones.",
	isHQ: false,
	populationCapacity: 0,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	healRate: 0,
	healRadius: 0,
};

const sludgePit: ContentBuildingDef = {
	id: "sludge_pit",
	name: "Sludge Pit",
	faction: "scale_guard",
	hp: 250,
	armor: 0,
	buildCost: { fish: 0, timber: 0, salvage: 0 },
	buildTimeMs: 0,
	produces: [],
	visionRadius: 3,
	unlocksAtMission: 5,
	description:
		"Scale-Guard area denial. Creates toxic sludge zone that damages all non-reptilian units.",
	isHQ: false,
	populationCapacity: 0,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	healRate: 0,
	healRadius: 0,
};

const greatSiphon: ContentBuildingDef = {
	id: "great_siphon",
	name: "Great Siphon",
	faction: "scale_guard",
	hp: 1500,
	armor: 5,
	buildCost: { fish: 0, timber: 0, salvage: 0 },
	buildTimeMs: 0,
	produces: [],
	visionRadius: 8,
	unlocksAtMission: 13,
	description:
		"Scale-Guard mega-structure. Multi-section boss building. Must destroy all 3 sections to win.",
	isHQ: true,
	populationCapacity: 0,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	healRate: 0,
	healRadius: 0,
};

const shieldGenerator: ContentBuildingDef = {
	id: "shield_generator",
	name: "Shield Generator",
	faction: "scale_guard",
	hp: 500,
	armor: 3,
	buildCost: { fish: 0, timber: 0, salvage: 0 },
	buildTimeMs: 0,
	produces: [],
	visionRadius: 5,
	unlocksAtMission: 13,
	description:
		"Scale-Guard defensive tech. Projects a damage-absorbing shield over nearby buildings.",
	isHQ: false,
	populationCapacity: 0,
	attackDamage: 0,
	attackRange: 0,
	attackCooldownMs: 0,
	healRate: 0,
	healRadius: 0,
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const BUILDING_REGISTRY: Map<string, ContentBuildingDef> = new Map([
	// URA
	[burrow.id, burrow],
	[commandPost.id, commandPost],
	[barracks.id, barracks],
	[armory.id, armory],
	[watchtower.id, watchtower],
	[fishTrap.id, fishTrap],
	[dock.id, dock],
	[fieldHospital.id, fieldHospital],
	[sandbagWall.id, sandbagWall],
	[stoneWall.id, stoneWall],
	[gunTower.id, gunTower],
	[minefield.id, minefield],
	// Scale-Guard
	[flagPost.id, flagPost],
	[spawningPool.id, spawningPool],
	[fuelTank.id, fuelTank],
	[venomSpire.id, venomSpire],
	[scaleWall.id, scaleWall],
	[siphon.id, siphon],
	[sludgePit.id, sludgePit],
	[greatSiphon.id, greatSiphon],
	[shieldGenerator.id, shieldGenerator],
]);

/**
 * Look up a building definition by ID.
 * Throws if the ID is not found -- NO FALLBACK.
 */
export function getBuildingDef(id: string): ContentBuildingDef {
	const def = BUILDING_REGISTRY.get(id);
	if (!def) {
		throw new Error(
			`getBuildingDef: unknown building ID '${id}'. ` +
				`Available: ${[...BUILDING_REGISTRY.keys()].join(", ")}`,
		);
	}
	return def;
}
