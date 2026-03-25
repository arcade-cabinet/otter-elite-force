export { fishSpot } from "./fish-spot";
export { intelMarker } from "./intel-marker";
export { mangroveTree } from "./mangrove-tree";
export { salvageCache } from "./salvage-cache";
export { supplyCrate } from "./supply-crate";

import type { ResourceDef } from "../types";
import { fishSpot } from "./fish-spot";
import { intelMarker } from "./intel-marker";
import { mangroveTree } from "./mangrove-tree";
import { salvageCache } from "./salvage-cache";
import { supplyCrate } from "./supply-crate";

/** All resource definitions keyed by id. */
export const ALL_RESOURCES: Record<string, ResourceDef> = {
	fish_spot: fishSpot,
	intel_marker: intelMarker,
	mangrove_tree: mangroveTree,
	salvage_cache: salvageCache,
	supply_crate: supplyCrate,
};
