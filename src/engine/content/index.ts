/**
 * Content barrel — exports all game content types and accessors.
 *
 * Game data lives in JSON files under public/data/ and is loaded at runtime
 * via loadTemplates(). TypeScript types and accessor functions live here.
 */

// IDs — faction/category numeric IDs for bitECS components
export type { CategoryId, CategoryName, FactionId, FactionName } from "./ids";
export { CATEGORY_IDS, FACTION_IDS, resolveCategoryId, resolveFactionId } from "./ids";
// Template loader — async load + synchronous accessors
export {
	_injectTemplatesForTest,
	getAbilityDef,
	getBalance,
	getBuildingRegistry,
	getBuildingTemplate,
	getMissionData,
	getResearchRegistry,
	getResearchTemplate,
	getTemplates,
	getUnitRegistry,
	getUnitTemplate,
	loadMission,
	loadTemplates,
} from "./templateLoader";
// Template resolver (mostly internal, but exported for tests)
export { deepMerge, resolveAllTemplates, resolveTemplate } from "./templateResolver";
// Template types
export type {
	AbilityDef,
	BalanceConfig,
	BuildingStatBlock,
	BuildingTemplate,
	BuildingVisualConfig,
	ConstructionConfig,
	DifficultyConfig,
	GameTemplates,
	MissionData,
	PassiveIncome,
	ResearchDef,
	ResearchEffect,
	ResourceCost,
	StatBlock,
	TrainingConfig,
	UnitTemplate,
	VisualConfig,
} from "./templateTypes";
