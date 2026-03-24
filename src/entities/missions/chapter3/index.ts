// Chapter 3: "Blackmarsh" (Northern Campaign)
// Teaches: fog, fire/explosives, tidal siege, hero rescue.

export { mission09FogOfWar } from "./mission-09-fog-of-war";
export { mission10ScorchedEarth } from "./mission-10-scorched-earth";
export { mission11TidalFortress } from "./mission-11-tidal-fortress";
export { mission12FangRescue } from "./mission-12-fang-rescue";

import { mission09FogOfWar } from "./mission-09-fog-of-war";
import { mission10ScorchedEarth } from "./mission-10-scorched-earth";
import { mission11TidalFortress } from "./mission-11-tidal-fortress";
import { mission12FangRescue } from "./mission-12-fang-rescue";

import type { MissionDef } from "../../types";

export const chapter3Missions: MissionDef[] = [
	mission09FogOfWar,
	mission10ScorchedEarth,
	mission11TidalFortress,
	mission12FangRescue,
];
