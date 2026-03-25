// Chapter 1: "First Landing" (Copper-Silt Reach)
// Korea / Inchon-inspired. Teaches core mechanics across 4 missions.

export { mission01Beachhead } from "./mission-01-beachhead";
export { mission02Causeway } from "./mission-02-causeway";
export { mission03FirebaseDelta } from "./mission-03-firebase-delta";
export { mission04PrisonBreak } from "./mission-04-prison-break";

import type { MissionDef } from "../../types";
import { mission01Beachhead } from "./mission-01-beachhead";
import { mission02Causeway } from "./mission-02-causeway";
import { mission03FirebaseDelta } from "./mission-03-firebase-delta";
import { mission04PrisonBreak } from "./mission-04-prison-break";

export const chapter1Missions: MissionDef[] = [
	mission01Beachhead,
	mission02Causeway,
	mission03FirebaseDelta,
	mission04PrisonBreak,
];
