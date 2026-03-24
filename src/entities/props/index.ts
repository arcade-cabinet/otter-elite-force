export { tallGrass } from "./tall-grass";
export { toxicSludge } from "./toxic-sludge";
export type { PropDef } from "./tall-grass";

import { tallGrass } from "./tall-grass";
import { toxicSludge } from "./toxic-sludge";

import type { PropDef } from "./tall-grass";

/** All prop definitions keyed by id. */
export const ALL_PROPS: Record<string, PropDef> = {
	tall_grass: tallGrass,
	toxic_sludge: toxicSludge,
};
