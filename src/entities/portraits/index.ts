export { foxhound } from "./foxhound";
export { sgtBubbles } from "./sgt-bubbles";
export { genWhiskers } from "./gen-whiskers";
export { cplSplash } from "./cpl-splash";
export { sgtFang } from "./sgt-fang";
export { medicMarina } from "./medic-marina";
export { pvtMuskrat } from "./pvt-muskrat";

import type { PortraitDef } from "../types";
import { foxhound } from "./foxhound";
import { sgtBubbles } from "./sgt-bubbles";
import { genWhiskers } from "./gen-whiskers";
import { cplSplash } from "./cpl-splash";
import { sgtFang } from "./sgt-fang";
import { medicMarina } from "./medic-marina";
import { pvtMuskrat } from "./pvt-muskrat";

export const ALL_PORTRAIT_ENTITIES: Record<string, PortraitDef> = {
	foxhound,
	sgtBubbles,
	genWhiskers,
	cplSplash,
	sgtFang,
	medicMarina,
	pvtMuskrat,
};
