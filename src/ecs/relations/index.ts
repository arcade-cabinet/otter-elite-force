import { relation } from "koota";

/** Unit belongs to a squad entity */
export const BelongsToSquad = relation();

/** Unit or building is owned by a faction entity */
export const OwnedBy = relation();

/** Unit is targeting an enemy — exclusive: only one target at a time */
export const Targeting = relation({ exclusive: true });

/** Worker is gathering from a resource node */
export const GatheringFrom = relation();

/** Building is training a unit — stores progress and unit type */
export const TrainingAt = relation({ store: { progress: 0, unitType: "" } });

/** Unit is garrisoned inside a building */
export const GarrisonedIn = relation();

/** Worker is constructing a building — exclusive: one building at a time */
export const ConstructingAt = relation({ exclusive: true });
