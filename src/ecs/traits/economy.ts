import { trait } from "koota";

export const Gatherer = trait({ carrying: "", amount: 0, capacity: 10 });

export const ResourceNode = trait({ type: "", remaining: 100 });

/** Production queue for buildings that train units — AoS for array data */
export const ProductionQueue = trait(
	() =>
		[] as Array<{
			unitType: string;
			progress: number;
			buildTime: number;
		}>,
);

export const PopulationCost = trait({ cost: 1 });

/** Building under construction: progress 0..100, buildTime in seconds */
export const ConstructionProgress = trait({ progress: 0, buildTime: 30 });

/** Shape of an active research slot. */
export interface ResearchSlotData {
	researchId: string;
	progress: number;
	researchTime: number;
}

/**
 * Active research at a building — one at a time, AoS for nullable object.
 *
 * Koota's AoS factory requires `() => Record<string, any>` but ResearchSlot
 * is null when no research is active. The cast bridges the type constraint.
 */
const researchSlotFactory: () => ResearchSlotData | null = () => null;
export const ResearchSlot = trait(researchSlotFactory as unknown as () => ResearchSlotData);

/** Tag: entity is a Command Post (primary or secondary base) */
export const IsCommandPost = trait();

/** Resource collection radius — workers within this radius deposit at this CP */
export const CollectionRadius = trait({ radius: 10 });

/** Supply caravan data — AoS for mutable route/cargo state.
 * Route stores Entity references (not numeric IDs) so we can call .has()/.get() on them.
 * Entity in Koota v0.2.3 is a Number with prototype methods — plain numbers lack those methods.
 */
export const SupplyCaravan = trait(() => ({
	/** Ordered waypoint CPs the caravan cycles through (entity refs) */
	route: [] as unknown[],
	/** Index of the current destination in the route */
	routeIndex: 0,
	/** Resource type currently being carried */
	carrying: "" as string,
	/** Amount of resources currently loaded */
	amount: 0,
	/** Max resources per trip */
	capacity: 20,
	/** Speed in tiles per second */
	speed: 3,
}));
