/**
 * Chapter 2: "Turning Tide" — Expansion & Specialization
 *
 * The URA pushes deeper into the Copper-Silt Reach. Siphons are destroyed,
 * monsoons are weathered, rivers are crossed, and Cpl. Splash is rescued.
 * 4 missions introducing advanced mechanics: full base economy, weather,
 * water traversal, and hero-driven stealth operations.
 */

export { mission05SiphonValley } from "./mission05";
export { mission06MonsoonAmbush } from "./mission06";
export { mission07RiverRats } from "./mission07";
export { mission08UnderwaterCache } from "./mission08";

import type { Scenario } from "../../types";
import { mission05SiphonValley } from "./mission05";
import { mission06MonsoonAmbush } from "./mission06";
import { mission07RiverRats } from "./mission07";
import { mission08UnderwaterCache } from "./mission08";

/** All Chapter 2 scenarios in order */
export const chapter2Missions: Scenario[] = [
	mission05SiphonValley,
	mission06MonsoonAmbush,
	mission07RiverRats,
	mission08UnderwaterCache,
];
