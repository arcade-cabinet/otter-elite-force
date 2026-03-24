/**
 * Chapter 3: "Heart of Darkness" — Burma / Malaya-Inspired
 *
 * Deep in Scale-Guard territory. The jungle itself is hostile.
 * 4 missions introducing advanced mechanics: recon + strike, village liberation,
 * defensive fortification, and full siege warfare.
 */

export { mission09DenseCanopy } from "./mission09";
export { mission10HealersGrove } from "./mission10";
export { mission11Entrenchment } from "./mission11";
export { mission12TheStronghold } from "./mission12";

import type { Scenario } from "../../types";
import { mission09DenseCanopy } from "./mission09";
import { mission10HealersGrove } from "./mission10";
import { mission11Entrenchment } from "./mission11";
import { mission12TheStronghold } from "./mission12";

/** All Chapter 3 scenarios in order */
export const chapter3Missions: Scenario[] = [
	mission09DenseCanopy,
	mission10HealersGrove,
	mission11Entrenchment,
	mission12TheStronghold,
];
