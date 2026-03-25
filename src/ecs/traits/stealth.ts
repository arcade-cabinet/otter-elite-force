import { trait } from "koota";

/** Tag: entity is in a concealment zone */
export const Concealed = trait();

/** Tag: entity is voluntarily crouching/stealthed */
export const Crouching = trait();

/** Detection radius for spotting hidden units */
export const DetectionRadius = trait({ radius: 6 });
