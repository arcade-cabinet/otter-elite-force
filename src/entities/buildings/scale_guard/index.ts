export { flagPost } from "./flag-post";
export { fuelTank } from "./fuel-tank";
export { greatSiphon } from "./great-siphon";
export { scaleWall } from "./scale-wall";
export { shieldGenerator } from "./shield-generator";
export { siphon } from "./siphon";
export { sludgePit } from "./sludge-pit";
export { spawningPool } from "./spawning-pool";
export { venomSpire } from "./venom-spire";

import type { BuildingDef } from "../../types";
import { flagPost } from "./flag-post";
import { fuelTank } from "./fuel-tank";
import { greatSiphon } from "./great-siphon";
import { scaleWall } from "./scale-wall";
import { shieldGenerator } from "./shield-generator";
import { siphon } from "./siphon";
import { sludgePit } from "./sludge-pit";
import { spawningPool } from "./spawning-pool";
import { venomSpire } from "./venom-spire";

/** All 9 Scale-Guard building definitions keyed by id. */
export const SCALE_GUARD_BUILDING_ENTITIES: Record<string, BuildingDef> = {
	flag_post: flagPost,
	fuel_tank: fuelTank,
	great_siphon: greatSiphon,
	sludge_pit: sludgePit,
	spawning_pool: spawningPool,
	venom_spire: venomSpire,
	siphon,
	scale_wall: scaleWall,
	shield_generator: shieldGenerator,
};
