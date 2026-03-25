/**
 * Chapter 4: "The Great Siphon" — Culmination
 *
 * The final push. Every mechanic converges.
 * 4 missions bringing together multi-base logistics, demolition,
 * all-out warfare, and the 3-phase Great Siphon boss encounter.
 */

export { mission13SupplyLines } from "./mission13";
export { mission14GasDepot } from "./mission14";
export { mission15SacredSludge } from "./mission15";
export { mission16TheReckoning } from "./mission16";

import type { Scenario } from "../../types";
import { mission13SupplyLines } from "./mission13";
import { mission14GasDepot } from "./mission14";
import { mission15SacredSludge } from "./mission15";
import { mission16TheReckoning } from "./mission16";

/** All Chapter 4 scenarios in order */
export const chapter4Missions: Scenario[] = [
	mission13SupplyLines,
	mission14GasDepot,
	mission15SacredSludge,
	mission16TheReckoning,
];
