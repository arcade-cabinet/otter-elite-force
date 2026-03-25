/**
 * Faction definitions for Otter: Elite Force RTS.
 *
 * Sourced from design spec §4 (Factions).
 */

import { SCALE_GUARD_BUILDINGS, URA_BUILDINGS } from "./buildings";
import { RESEARCH } from "./research";
import type { FactionId } from "./units";
import { SCALE_GUARD_UNITS, URA_HEROES, URA_UNITS } from "./units";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FactionDef {
	id: FactionId;
	name: string;
	doctrine: string;
	unitIds: string[];
	heroIds: string[];
	buildingIds: string[];
	researchIds: string[];
}

// ---------------------------------------------------------------------------
// Faction Definitions
// ---------------------------------------------------------------------------

export const URA_FACTION: FactionDef = {
	id: "ura",
	name: "Otter Elite Force",
	doctrine: "Liberation through combined arms. Build, gather, train, liberate.",
	unitIds: Object.keys(URA_UNITS),
	heroIds: Object.keys(URA_HEROES),
	buildingIds: Object.keys(URA_BUILDINGS),
	researchIds: Object.keys(RESEARCH),
};

export const SCALE_GUARD_FACTION: FactionDef = {
	id: "scale_guard",
	name: "Scale-Guard Militia",
	doctrine: "Ambush, area-denial, attrition. Entrenched occupation.",
	unitIds: Object.keys(SCALE_GUARD_UNITS),
	heroIds: [],
	buildingIds: Object.keys(SCALE_GUARD_BUILDINGS),
	researchIds: [],
};

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

export const FACTIONS: Record<FactionId, FactionDef> = {
	ura: URA_FACTION,
	scale_guard: SCALE_GUARD_FACTION,
};
