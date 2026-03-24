export { fishSpot } from "./fish-spot";
export { mangroveTree } from "./mangrove-tree";
export { salvageCache } from "./salvage-cache";

import { fishSpot } from "./fish-spot";
import { mangroveTree } from "./mangrove-tree";
import { salvageCache } from "./salvage-cache";

import type { ResourceDef } from "../types";

/** All resource definitions keyed by id. */
export const ALL_RESOURCES: Record<string, ResourceDef> = {
	fish_spot: fishSpot,
	mangrove_tree: mangroveTree,
	salvage_cache: salvageCache,
};
