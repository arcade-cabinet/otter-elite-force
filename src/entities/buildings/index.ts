export { SCALE_GUARD_BUILDING_ENTITIES } from "./scale_guard";
export { URA_BUILDING_ENTITIES } from "./ura";

import type { BuildingDef } from "../types";
import { SCALE_GUARD_BUILDING_ENTITIES } from "./scale_guard";
import { URA_BUILDING_ENTITIES } from "./ura";

/** All 21 building entity definitions keyed by id. */
export const ALL_BUILDING_ENTITIES: Record<string, BuildingDef> = {
	...URA_BUILDING_ENTITIES,
	...SCALE_GUARD_BUILDING_ENTITIES,
};
