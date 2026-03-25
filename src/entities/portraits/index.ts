export { cplSplash } from "./cpl-splash";
export { foxhound } from "./foxhound";
export { genWhiskers } from "./gen-whiskers";
export { medicMarina } from "./medic-marina";
export { pvtMuskrat } from "./pvt-muskrat";
export { sgtBubbles } from "./sgt-bubbles";
export { sgtFang } from "./sgt-fang";

import type { PortraitDef } from "../types";
import { cplSplash } from "./cpl-splash";
import { foxhound } from "./foxhound";
import { genWhiskers } from "./gen-whiskers";
import { medicMarina } from "./medic-marina";
import { pvtMuskrat } from "./pvt-muskrat";
import { sgtBubbles } from "./sgt-bubbles";
import { sgtFang } from "./sgt-fang";

export const ALL_PORTRAIT_ENTITIES: Record<string, PortraitDef> = {
	foxhound,
	sgtBubbles,
	genWhiskers,
	cplSplash,
	sgtFang,
	medicMarina,
	pvtMuskrat,
};
