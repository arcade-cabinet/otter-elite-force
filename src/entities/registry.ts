/**
 * Entity Registry — single import point for ALL entity definitions.
 *
 * Aggregates buildings, units, heroes, resources, props, terrain, research,
 * and portraits into unified lookup maps. Provides helper functions for
 * type-safe entity retrieval by id.
 *
 * Usage:
 *   import { getUnit, getBuilding, ALL_UNITS } from '@/entities/registry';
 *   const mudfoot = getUnit('mudfoot');
 *   const barracks = getBuilding('barracks');
 */

import type {
	BuildingDef,
	HeroDef,
	PortraitDef,
	ResearchDef,
	ResourceDef,
	TerrainTileDef,
	UnitDef,
} from "./types";

// ─── Buildings (COMPLETE: 21/21) ───

import { ALL_BUILDING_ENTITIES } from "./buildings";

export { ALL_BUILDING_ENTITIES };

/** Alias for tests. */
export const ALL_BUILDINGS = ALL_BUILDING_ENTITIES;

// ─── Research (COMPLETE: 9/9) ───

import { ALL_RESEARCH_ENTITIES } from "./research";

export { ALL_RESEARCH_ENTITIES };
export const ALL_RESEARCH = ALL_RESEARCH_ENTITIES;

// ─── Resources (COMPLETE: 5/5) ───

import { ALL_RESOURCES } from "./resources";

export { ALL_RESOURCES };

// ─── Props (COMPLETE: 2/2) ───

import type { PropDef } from "./props";
import { ALL_PROPS } from "./props";

export { ALL_PROPS };

// ─── Terrain (COMPLETE) ───

import { TERRAIN_TILES } from "./terrain/tiles";

export { TERRAIN_TILES };

// ─── URA Units (COMPLETE: 7/7) ───

import { diver } from "./units/ura/diver";
import { mortarOtter } from "./units/ura/mortar-otter";
import { mudfoot } from "./units/ura/mudfoot";
import { raftsman } from "./units/ura/raftsman";
import { riverRat } from "./units/ura/river-rat";
import { sapper } from "./units/ura/sapper";
import { shellcracker } from "./units/ura/shellcracker";

const URA_UNIT_ENTITIES: Record<string, UnitDef> = {
	river_rat: riverRat,
	mudfoot,
	shellcracker,
	sapper,
	raftsman,
	mortar_otter: mortarOtter,
	diver,
};

// ─── Scale-Guard Units (COMPLETE: 8/8) ───

import { crocChampion } from "./units/scale-guard/croc-champion";
import { gator } from "./units/scale-guard/gator";
import { scoutLizard } from "./units/scale-guard/scout-lizard";
import { serpentKing } from "./units/scale-guard/serpent-king";
import { siphonDrone } from "./units/scale-guard/siphon-drone";
import { skink } from "./units/scale-guard/skink";
import { snapper } from "./units/scale-guard/snapper";
import { viper } from "./units/scale-guard/viper";

const SCALE_GUARD_UNIT_ENTITIES: Record<string, UnitDef> = {
	skink,
	gator,
	viper,
	snapper,
	scout_lizard: scoutLizard,
	croc_champion: crocChampion,
	siphon_drone: siphonDrone,
	serpent_king: serpentKing,
};

/** All 15 unit definitions (7 URA + 8 Scale-Guard) keyed by id. */
export const ALL_UNIT_ENTITIES: Record<string, UnitDef> = {
	...URA_UNIT_ENTITIES,
	...SCALE_GUARD_UNIT_ENTITIES,
};

/** Alias for tests. */
export const ALL_UNITS = ALL_UNIT_ENTITIES;

// ─── Heroes (COMPLETE: 6/6) ───

import { cplSplash } from "./heroes/cpl-splash";
import { genWhiskers } from "./heroes/gen-whiskers";
import { medicMarina } from "./heroes/medic-marina";
import { pvtMuskrat } from "./heroes/pvt-muskrat";
import { sgtBubbles } from "./heroes/sgt-bubbles";
import { sgtFang } from "./heroes/sgt-fang";

/** All 6 hero definitions keyed by id. */
export const ALL_HERO_ENTITIES: Record<string, HeroDef> = {
	sgt_bubbles: sgtBubbles,
	gen_whiskers: genWhiskers,
	cpl_splash: cplSplash,
	sgt_fang: sgtFang,
	medic_marina: medicMarina,
	pvt_muskrat: pvtMuskrat,
};

/** Alias for tests. */
export const ALL_HEROES = ALL_HERO_ENTITIES;

// ─── Portraits (COMPLETE: 7/7) ───

import { cplSplash as cplSplashPortrait } from "./portraits/cpl-splash";
import { foxhound } from "./portraits/foxhound";
import { genWhiskers as genWhiskersPortrait } from "./portraits/gen-whiskers";
import { medicMarina as medicMarinaPortrait } from "./portraits/medic-marina";
import { pvtMuskrat as pvtMuskratPortrait } from "./portraits/pvt-muskrat";
import { sgtBubbles as sgtBubblesPortrait } from "./portraits/sgt-bubbles";
import { sgtFang as sgtFangPortrait } from "./portraits/sgt-fang";

/** All 7 portrait definitions keyed by id. */
export const ALL_PORTRAIT_ENTITIES: Record<string, PortraitDef> = {
	foxhound,
	sgt_bubbles: sgtBubblesPortrait,
	gen_whiskers: genWhiskersPortrait,
	cpl_splash: cplSplashPortrait,
	sgt_fang: sgtFangPortrait,
	medic_marina: medicMarinaPortrait,
	pvt_muskrat: pvtMuskratPortrait,
};

/** Alias for tests. */
export const ALL_PORTRAITS = ALL_PORTRAIT_ENTITIES;

// ─── Lookup Helpers ───

/** Get a unit definition by id. Returns undefined if not found. */
export function getUnit(id: string): UnitDef | undefined {
	if (id === "scout_otter") return ALL_UNIT_ENTITIES.diver;
	return ALL_UNIT_ENTITIES[id];
}

/** Get a hero definition by id. Returns undefined if not found. */
export function getHero(id: string): HeroDef | undefined {
	return ALL_HERO_ENTITIES[id];
}

/** Get a building definition by id. Returns undefined if not found. */
export function getBuilding(id: string): BuildingDef | undefined {
	return ALL_BUILDING_ENTITIES[id];
}

/** Get a resource definition by id. Returns undefined if not found. */
export function getResource(id: string): ResourceDef | undefined {
	return ALL_RESOURCES[id];
}

/** Get a research definition by id. Returns undefined if not found. */
export function getResearch(id: string): ResearchDef | undefined {
	return ALL_RESEARCH_ENTITIES[id];
}

/** Get a terrain tile definition by id. Returns undefined if not found. */
export function getTerrain(id: string): TerrainTileDef | undefined {
	return TERRAIN_TILES[id];
}

/** Get a prop definition by id. Returns undefined if not found. */
export function getProp(id: string): PropDef | undefined {
	return ALL_PROPS[id];
}

/** Get a portrait definition by id. Returns undefined if not found. */
export function getPortrait(id: string): PortraitDef | undefined {
	return ALL_PORTRAIT_ENTITIES[id];
}

// ─── Missions (COMPLETE: 16/16) ───

import { CAMPAIGN, getMission, getMissionById } from "./missions";

export { CAMPAIGN, getMission, getMissionById };

/**
 * Get any entity by id — searches units, heroes, buildings, resources.
 * Returns the definition and its category, or undefined.
 */
export function getEntity(
	id: string,
): { def: UnitDef | HeroDef | BuildingDef | ResourceDef; category: string } | undefined {
	const unit = getUnit(id);
	if (unit) return { def: unit, category: "unit" };

	const hero = getHero(id);
	if (hero) return { def: hero, category: "hero" };

	const building = getBuilding(id);
	if (building) return { def: building, category: "building" };

	const resource = getResource(id);
	if (resource) return { def: resource, category: "resource" };

	return undefined;
}
