// Campaign Mission Index
// All 16 missions across 4 chapters, ordered for campaign progression.

export { chapter1Missions } from "./chapter1";
export { chapter2Missions } from "./chapter2";
export { chapter3Missions } from "./chapter3";
export { chapter4Missions } from "./chapter4";

import type { MissionDef } from "../types";
import { chapter1Missions } from "./chapter1";
import { chapter2Missions } from "./chapter2";
import { chapter3Missions } from "./chapter3";
import { chapter4Missions } from "./chapter4";

/** All 16 campaign missions in order. */
export const CAMPAIGN: MissionDef[] = [
	...chapter1Missions,
	...chapter2Missions,
	...chapter3Missions,
	...chapter4Missions,
];

/** Lookup a mission by its string ID. */
export function getMissionById(id: string): MissionDef | undefined {
	return CAMPAIGN.find((m) => m.id === id);
}

/** Lookup a mission by chapter + mission number. */
export function getMission(chapter: number, mission: number): MissionDef | undefined {
	return CAMPAIGN.find((m) => m.chapter === chapter && m.mission === mission);
}
