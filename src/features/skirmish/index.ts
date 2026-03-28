/**
 * Skirmish mode — barrel export
 */

export {
	applySkirmishConfigToWorld,
	createDefaultSkirmishConfig,
	loadSkirmishConfig,
	saveSkirmishConfig,
	updateSkirmishSeedPhrase,
} from "./persistence";
export {
	countCampaignStars,
	hasGoldUnlock,
	isMapUnlocked,
	MAX_CAMPAIGN_STARS,
	SKIRMISH_DIFFICULTIES,
	SKIRMISH_MAPS,
	SKIRMISH_PRESETS,
	type SkirmishDifficultyOption,
	type SkirmishMapDef,
	type SkirmishMatchResult,
	type SkirmishMatchStats,
	type SkirmishOutcome,
	type SkirmishPreset,
	type SkirmishSessionConfig,
} from "./types";
