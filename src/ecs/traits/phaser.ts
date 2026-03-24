import { trait } from "koota";

/** Phaser sprite reference — AoS callback, null until Phaser scene creates it */
// @ts-expect-error Koota AoS trait with null initial value
export const PhaserSprite = trait(() => null as any);
