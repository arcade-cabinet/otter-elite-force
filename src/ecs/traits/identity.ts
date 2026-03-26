import { trait } from "koota";

/** Unit type identifier: 'mudfoot', 'river_rat', 'gator', etc. */
export const UnitType = trait({ type: "" });

/** Faction identifier: 'ura', 'scale_guard', 'neutral' */
export const Faction = trait({ id: "" });

/** Tag: entity is a hero unit */
export const IsHero = trait();

/** Tag: entity is a building */
export const IsBuilding = trait();

/** Tag: entity is a projectile */
export const IsProjectile = trait();

/** Tag: entity is a resource node (fish spot, tree, wreckage) */
export const IsResource = trait();

/** Tag: entity is a village (liberation target) */
export const IsVillage = trait();

/** Tag: entity is a siphon (Scale-Guard area denial structure) */
export const IsSiphon = trait();

/** Stable authored runtime identity for mission scripting. */
export const ScriptTag = trait({ id: "" });

/** Unit category: 'worker', 'infantry', 'ranged', 'siege', 'special' */
export const Category = trait({ category: "" });

/** Tag: entity is currently selected by the player */
export const Selected = trait();
