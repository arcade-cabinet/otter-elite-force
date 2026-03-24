import { trait } from "koota";

/** Tile coordinates */
export const Position = trait({ x: 0, y: 0 });

/** Movement vector */
export const Velocity = trait({ x: 0, y: 0 });

/** Direction the entity faces */
export const FacingDirection = trait({ angle: 0 });
