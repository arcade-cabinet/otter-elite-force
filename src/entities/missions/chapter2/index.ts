// Chapter 2: "Copper-Silt Reach" (Deep Operations)
// Teaches: full base economy, weather, water traversal, hero rescues.

export { mission05SiphonValley } from "./mission-05-siphon-valley";
export { mission06MonsoonAmbush } from "./mission-06-monsoon-ambush";
export { mission07RiverRats } from "./mission-07-river-rats";
export { mission08UnderwaterCache } from "./mission-08-underwater-cache";

import type { MissionDef } from "../../types";
import { mission05SiphonValley } from "./mission-05-siphon-valley";
import { mission06MonsoonAmbush } from "./mission-06-monsoon-ambush";
import { mission07RiverRats } from "./mission-07-river-rats";
import { mission08UnderwaterCache } from "./mission-08-underwater-cache";

export const chapter2Missions: MissionDef[] = [
	mission05SiphonValley,
	mission06MonsoonAmbush,
	mission07RiverRats,
	mission08UnderwaterCache,
];
