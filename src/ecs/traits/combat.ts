import { trait } from "koota";

export const Health = trait({ current: 100, max: 100 });

export const Attack = trait({ damage: 10, range: 1, cooldown: 1.0, timer: 0 });

export const Armor = trait({ value: 0 });

export const VisionRadius = trait({ radius: 5 });
