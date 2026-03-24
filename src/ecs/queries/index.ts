import { Not, cacheQuery, createChanged } from "koota";
import { Health } from "../traits/combat";
import { Gatherer } from "../traits/economy";
import { Faction, IsBuilding, UnitType } from "../traits/identity";
import { Position } from "../traits/spatial";
import { GatheringFrom, OwnedBy, TrainingAt } from "../relations";

/** All units with a position owned by someone */
export const playerUnits = cacheQuery(UnitType, Position, OwnedBy("*"));

/** All units with position, health, and faction — used for vision checks */
export const enemiesInVision = cacheQuery(UnitType, Position, Health, Faction);

/** Workers not currently gathering */
export const idleWorkers = cacheQuery(Gatherer, Not(GatheringFrom("*")));

/** Buildings that are actively training units */
export const buildingsTraining = cacheQuery(IsBuilding, TrainingAt("*"));

/** Units whose health has changed (for damage indicators, etc.) */
const Changed = createChanged();
export const damagedUnits = cacheQuery(Health, Changed(Health));
