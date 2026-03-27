const STORE_CAPACITY = 65536;

function createF32Store(): Float32Array {
	return new Float32Array(STORE_CAPACITY);
}

function createU8Store(): Uint8Array {
	return new Uint8Array(STORE_CAPACITY);
}

function createU16Store(): Uint16Array {
	return new Uint16Array(STORE_CAPACITY);
}

function createU32Store(): Uint32Array {
	return new Uint32Array(STORE_CAPACITY);
}

export const Position = {
	x: createF32Store(),
	y: createF32Store(),
};

export const Velocity = {
	x: createF32Store(),
	y: createF32Store(),
};

export const Facing = {
	radians: createF32Store(),
};

export const Health = {
	current: createF32Store(),
	max: createF32Store(),
};

export const Armor = {
	value: createF32Store(),
};

export const Attack = {
	damage: createF32Store(),
	range: createF32Store(),
	cooldown: createF32Store(),
	timer: createF32Store(),
};

export const Speed = {
	value: createF32Store(),
};

export const VisionRadius = {
	value: createF32Store(),
};

export const Faction = {
	id: createU8Store(),
};

export const Content = {
	unitId: createU16Store(),
	buildingId: createU16Store(),
	resourceId: createU16Store(),
	categoryId: createU8Store(),
};

export const Selection = {
	selected: createU8Store(),
};

export const Flags = {
	isBuilding: createU8Store(),
	isProjectile: createU8Store(),
	isResource: createU8Store(),
	canSwim: createU8Store(),
	submerged: createU8Store(),
	stealthed: createU8Store(),
};

export const Construction = {
	progress: createF32Store(),
	buildTime: createF32Store(),
};

export const TargetRef = {
	eid: createU32Store(),
};

export const ResourceRef = {
	eid: createU32Store(),
};

export const ContainerRef = {
	eid: createU32Store(),
};

export const SquadRef = {
	id: createU16Store(),
};

/**
 * Gatherer — worker carry state for resource gathering cycle.
 * amount: current carried resource quantity
 * capacity: max carry before returning to depot
 */
export const Gatherer = {
	amount: createF32Store(),
	capacity: createF32Store(),
};

/**
 * ResourceNode — remaining resource on a harvestable node.
 * remaining: how many gather ticks remain before depletion
 */
export const ResourceNode = {
	remaining: createF32Store(),
};

/**
 * DetectionCone — directional detection for stealth missions.
 * range: detection cone length
 * halfAngle: half-angle in degrees
 * suspicionTimer: seconds of accumulated suspicion
 * suspicionThreshold: seconds to reach alert
 * alertState: 0=idle, 1=suspicious, 2=alert
 */
export const DetectionCone = {
	range: createF32Store(),
	halfAngle: createF32Store(),
	suspicionTimer: createF32Store(),
	suspicionThreshold: createF32Store(),
	alertState: createU8Store(),
};

/**
 * SplashRadius — area-of-effect radius for projectiles (e.g. mortar).
 */
export const SplashRadius = {
	radius: createF32Store(),
};

/**
 * PopulationState — population tracking for the player faction.
 * Used on a singleton entity or tracked in session.
 */
export const PopulationState = {
	current: createU16Store(),
	max: createU16Store(),
};
