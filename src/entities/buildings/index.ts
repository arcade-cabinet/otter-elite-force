export { URA_BUILDING_ENTITIES } from "./ura";
export { SCALE_GUARD_BUILDING_ENTITIES } from "./scale_guard";

import { URA_BUILDING_ENTITIES } from "./ura";
import { SCALE_GUARD_BUILDING_ENTITIES } from "./scale_guard";

import type { BuildingDef } from "../types";

/** All 17 building entity definitions keyed by id. */
export const ALL_BUILDING_ENTITIES: Record<string, BuildingDef> = {
	...URA_BUILDING_ENTITIES,
	...SCALE_GUARD_BUILDING_ENTITIES,
};
