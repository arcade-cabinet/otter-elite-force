/**
 * Chapter 1: "First Landing" — Korea / Inchon-Inspired
 *
 * The URA deploys to the Copper-Silt Reach. Sgt. Bubbles leads the first wave.
 * 4 missions introducing core mechanics: gathering, building, combat,
 * escort, multi-front warfare, and stealth.
 */

export { mission01Beachhead } from "./mission01";
export { mission02Causeway } from "./mission02";
export { mission03FirebaseDelta } from "./mission03";
export { mission04PrisonBreak } from "./mission04";

import type { Scenario } from "../../types";
import { mission01Beachhead } from "./mission01";
import { mission02Causeway } from "./mission02";
import { mission03FirebaseDelta } from "./mission03";
import { mission04PrisonBreak } from "./mission04";

/** All Chapter 1 scenarios in order */
export const chapter1Missions: Scenario[] = [
	mission01Beachhead,
	mission02Causeway,
	mission03FirebaseDelta,
	mission04PrisonBreak,
];
