export { sludgePit } from "./sludge-pit";
export { spawningPool } from "./spawning-pool";
export { venomSpire } from "./venom-spire";
export { siphon } from "./siphon";
export { scaleWall } from "./scale-wall";

import { sludgePit } from "./sludge-pit";
import { spawningPool } from "./spawning-pool";
import { venomSpire } from "./venom-spire";
import { siphon } from "./siphon";
import { scaleWall } from "./scale-wall";

import type { BuildingDef } from "../../types";

/** All 5 Scale-Guard building definitions keyed by id. */
export const SCALE_GUARD_BUILDING_ENTITIES: Record<string, BuildingDef> = {
	sludge_pit: sludgePit,
	spawning_pool: spawningPool,
	venom_spire: venomSpire,
	siphon,
	scale_wall: scaleWall,
};
