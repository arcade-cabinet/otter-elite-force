/**
 * Skirmish mode types (US-078, US-081)
 *
 * Defines map definitions, difficulty tiers, match results, and star-based
 * unlock requirements for the skirmish system.
 */

import type { SkirmishDifficulty } from "@/ai/skirmishAI";
import type { SeedBundle } from "@/engine";
import type { SkirmishMapSize, SkirmishTerrainType } from "@/maps/skirmishMapGenerator";

// ---------------------------------------------------------------------------
// Skirmish map catalog
// ---------------------------------------------------------------------------

export interface SkirmishMapDef {
	id: string;
	name: string;
	description: string;
	/** Terrain biome type. */
	terrainType: SkirmishTerrainType;
	/** Map size. */
	size: SkirmishMapSize;
	/** Campaign stars required to unlock this map. 0 = always available. */
	starsRequired: number;
	/** Preview image key (for future use). */
	previewKey?: string;
}

// ---------------------------------------------------------------------------
// Difficulty tiers exposed to the UI
// ---------------------------------------------------------------------------

export interface SkirmishDifficultyOption {
	id: SkirmishDifficulty;
	label: string;
	note: string;
}

export type SkirmishPreset = "macro" | "meso" | "micro";

export interface SkirmishPresetOption {
	id: SkirmishPreset;
	label: string;
	note: string;
}

export const SKIRMISH_PRESETS: SkirmishPresetOption[] = [
	{ id: "macro", label: "Macro", note: "Economy, expansion, and long-form pressure." },
	{ id: "meso", label: "Meso", note: "Mid-scale encounter and objective flow validation." },
	{ id: "micro", label: "Micro", note: "Tight control, pathing, and combat interaction checks." },
];

export const SKIRMISH_DIFFICULTIES: SkirmishDifficultyOption[] = [
	{ id: "easy", label: "Easy", note: "Slow AI, small armies, predictable attacks." },
	{ id: "medium", label: "Medium", note: "Standard challenge with scouting AI." },
	{ id: "hard", label: "Hard", note: "Fast AI, optimized build orders, aggressive." },
	{ id: "brutal", label: "Brutal", note: "Instant decisions, multi-prong attacks, no mercy." },
];

// ---------------------------------------------------------------------------
// Skirmish match result (US-081)
// ---------------------------------------------------------------------------

export type SkirmishOutcome = "victory" | "defeat";

export interface SkirmishMatchStats {
	/** Total match time in seconds. */
	timeElapsed: number;
	/** Number of units the player trained. */
	unitsTrained: number;
	/** Number of player units lost. */
	unitsLost: number;
	/** Total resources gathered by the player. */
	resourcesGathered: number;
}

export interface SkirmishMatchResult {
	outcome: SkirmishOutcome;
	mapId: string;
	difficulty: SkirmishDifficulty;
	playedAsScaleGuard: boolean;
	stats: SkirmishMatchStats;
}

export interface SkirmishSessionConfig {
	mapId: string;
	mapName: string;
	difficulty: SkirmishDifficulty;
	playAsScaleGuard: boolean;
	preset: SkirmishPreset;
	seed: SeedBundle;
	startingResources: {
		fish: number;
		timber: number;
		salvage: number;
	};
}

// ---------------------------------------------------------------------------
// Map catalog
// ---------------------------------------------------------------------------

export const SKIRMISH_MAPS: SkirmishMapDef[] = [
	{
		id: "sk_river_crossing",
		name: "River Crossing",
		description: "A contested ford with jungle flanks.",
		terrainType: "river",
		size: "small",
		starsRequired: 0,
	},
	{
		id: "sk_mudflat_basin",
		name: "Mudflat Basin",
		description: "Wide swamp with scattered chokepoints.",
		terrainType: "swamp",
		size: "medium",
		starsRequired: 0,
	},
	{
		id: "sk_canopy_war",
		name: "Canopy War",
		description: "Dense jungle with tight lanes and ambush spots.",
		terrainType: "jungle",
		size: "medium",
		starsRequired: 4,
	},
	{
		id: "sk_delta_siege",
		name: "Delta Siege",
		description: "Large river delta with multiple islands and bridges.",
		terrainType: "river",
		size: "large",
		starsRequired: 8,
	},
	{
		id: "sk_sludge_pit",
		name: "Sludge Pit",
		description: "Toxic terrain with narrow safe paths.",
		terrainType: "swamp",
		size: "small",
		starsRequired: 12,
	},
	{
		id: "sk_iron_jungle",
		name: "Iron Jungle",
		description: "Massive jungle theater with resources everywhere.",
		terrainType: "jungle",
		size: "large",
		starsRequired: 20,
	},
];

// ---------------------------------------------------------------------------
// Star / unlock helpers
// ---------------------------------------------------------------------------

/** Count total campaign stars earned from CampaignProgress missions record. */
export function countCampaignStars(
	missions: Record<string, { status: string; stars: number }>,
): number {
	return Object.values(missions).reduce((sum, m) => sum + (m.stars ?? 0), 0);
}

/** Maximum possible stars (3 per mission, 16 missions = 48 gold stars). */
export const MAX_CAMPAIGN_STARS = 48;

/** Check if a map is unlocked given the player's star count. */
export function isMapUnlocked(map: SkirmishMapDef, totalStars: number): boolean {
	return totalStars >= map.starsRequired;
}

/** 100% gold star (all 48) unlocks all maps regardless of requirement. */
export function hasGoldUnlock(totalStars: number): boolean {
	return totalStars >= MAX_CAMPAIGN_STARS;
}
