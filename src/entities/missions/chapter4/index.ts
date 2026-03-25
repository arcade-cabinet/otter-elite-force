// Chapter 4: "Iron Delta" (Final Campaign)
// Teaches: combined arms, boss battles, culmination of all mechanics.

export { mission13GreatSiphon } from "./mission-13-great-siphon";
export { mission14IronDelta } from "./mission-14-iron-delta";
export { mission15SerpentKing } from "./mission-15-serpent-king";
export { mission16LastStand } from "./mission-16-last-stand";

import type { MissionDef } from "../../types";
import { mission13GreatSiphon } from "./mission-13-great-siphon";
import { mission14IronDelta } from "./mission-14-iron-delta";
import { mission15SerpentKing } from "./mission-15-serpent-king";
import { mission16LastStand } from "./mission-16-last-stand";

export const chapter4Missions: MissionDef[] = [
	mission13GreatSiphon,
	mission14IronDelta,
	mission15SerpentKing,
	mission16LastStand,
];
