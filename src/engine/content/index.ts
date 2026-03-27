/**
 * Content barrel — exports all game content registries.
 *
 * Import from '@/engine/content' to access units, buildings, balance,
 * research, and sprite mappings.
 */

export type { DifficultyLevel } from "./balance";
export { BALANCE } from "./balance";
export type { ContentBuildingDef } from "./buildings";
export { BUILDING_REGISTRY, getBuildingDef } from "./buildings";
export type { CategoryId, CategoryName, FactionId, FactionName } from "./ids";
export { CATEGORY_IDS, FACTION_IDS, resolveCategoryId, resolveFactionId } from "./ids";
export type { ContentResearchDef } from "./research";
export { getResearchDef, RESEARCH_REGISTRY } from "./research";
export type { SpriteMapping } from "./spriteMapping";
export {
	getSpriteForBuilding,
	getSpriteForUnit,
	hasBuildingSprite,
	hasUnitSprite,
} from "./spriteMapping";
export type { ContentUnitDef } from "./units";
export { getUnitDef, UNIT_REGISTRY } from "./units";
