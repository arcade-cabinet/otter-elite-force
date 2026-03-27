/**
 * Template Loader — fetches JSON data files and produces typed, resolved templates.
 *
 * All game content is loaded from public/data/ at runtime.
 * NO FALLBACKS: missing data = thrown error.
 *
 * Usage:
 *   await loadTemplates();          // call once at app startup
 *   const unit = getUnitTemplate("mudfoot");  // synchronous after load
 */

import { resolveAllTemplates } from "./templateResolver";
import type {
	AbilityDef,
	BalanceConfig,
	BuildingTemplate,
	BuildingTemplateRaw,
	GameTemplates,
	MissionData,
	ResearchDef,
	UnitTemplate,
	UnitTemplateRaw,
} from "./templateTypes";

// ---------------------------------------------------------------------------
// Module-level cache
// ---------------------------------------------------------------------------

let loaded: GameTemplates | null = null;

function ensureLoaded(): GameTemplates {
	if (!loaded) {
		throw new Error(
			"Templates not loaded. Call loadTemplates() before accessing game data.",
		);
	}
	return loaded;
}

// ---------------------------------------------------------------------------
// JSON fetching
// ---------------------------------------------------------------------------

const BASE = import.meta.url ? new URL(".", import.meta.url).href : "./";

function resolveDataUrl(path: string): string {
	// In Vite dev, files under public/ are served at root.
	// In production build, they're relative to base.
	// Use a simple relative path from the web root.
	return `${typeof window !== "undefined" ? "" : BASE}data/${path}`;
}

async function fetchJson<T>(path: string): Promise<T> {
	const url = resolveDataUrl(path);
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to load template data from '${url}': ${response.status} ${response.statusText}`);
	}
	return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateUnitTemplate(id: string, t: Record<string, unknown>): void {
	const required = ["base", "name", "faction", "category", "visual", "stats", "abilities", "flags", "training"];
	for (const field of required) {
		if (t[field] === undefined) {
			throw new Error(`Unit template '${id}' missing required field '${field}'`);
		}
	}
	const stats = t.stats as Record<string, unknown>;
	if (typeof stats.hp !== "number" || stats.hp <= 0) {
		throw new Error(`Unit template '${id}' must have stats.hp > 0, got ${stats.hp}`);
	}
}

function validateBuildingTemplate(id: string, t: Record<string, unknown>): void {
	const required = ["name", "faction", "category", "visual", "stats", "flags", "construction", "produces"];
	for (const field of required) {
		if (t[field] === undefined) {
			throw new Error(`Building template '${id}' missing required field '${field}'`);
		}
	}
	const stats = t.stats as Record<string, unknown>;
	if (typeof stats.hp !== "number" || stats.hp <= 0) {
		throw new Error(`Building template '${id}' must have stats.hp > 0, got ${stats.hp}`);
	}
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/**
 * Load all game templates from JSON files. Call once at startup.
 * Resolves all `extends` chains and validates required fields.
 */
export async function loadTemplates(): Promise<GameTemplates> {
	const [rawUnits, rawBuildings, rawAbilities, rawResearch, balance] = await Promise.all([
		fetchJson<Record<string, UnitTemplateRaw>>("templates/units.json"),
		fetchJson<Record<string, BuildingTemplateRaw>>("templates/buildings.json"),
		fetchJson<Record<string, Omit<AbilityDef, "id">>>("templates/abilities.json"),
		fetchJson<Record<string, Omit<ResearchDef, "id">>>("templates/research.json"),
		fetchJson<BalanceConfig>("templates/balance.json"),
	]);

	// Resolve extends chains
	const resolvedUnits = resolveAllTemplates(rawUnits as Record<string, Record<string, unknown> & { extends?: string }>);
	const resolvedBuildings = resolveAllTemplates(rawBuildings as Record<string, Record<string, unknown> & { extends?: string }>);

	// Stamp IDs and validate units
	const units = new Map<string, UnitTemplate>();
	for (const [id, raw] of resolvedUnits) {
		const t = raw as unknown as UnitTemplate;
		t.id = id;
		validateUnitTemplate(id, raw);
		units.set(id, t);
	}

	// Stamp IDs and validate buildings
	const buildings = new Map<string, BuildingTemplate>();
	for (const [id, raw] of resolvedBuildings) {
		const t = raw as unknown as BuildingTemplate;
		t.id = id;
		validateBuildingTemplate(id, raw);
		buildings.set(id, t);
	}

	// Stamp IDs on abilities
	const abilities = new Map<string, AbilityDef>();
	for (const [id, raw] of Object.entries(rawAbilities)) {
		abilities.set(id, { ...raw, id });
	}

	// Stamp IDs on research
	const research = new Map<string, ResearchDef>();
	for (const [id, raw] of Object.entries(rawResearch)) {
		research.set(id, { ...raw, id } as ResearchDef);
	}

	loaded = {
		units,
		buildings,
		abilities,
		research,
		balance,
		missions: new Map(),
	};

	return loaded;
}

/**
 * Load mission-specific data. Can be called after loadTemplates().
 */
export async function loadMission(missionId: string): Promise<MissionData> {
	const templates = ensureLoaded();

	const cached = templates.missions.get(missionId);
	if (cached) return cached;

	const data = await fetchJson<MissionData>(`missions/${missionId}.json`);
	templates.missions.set(missionId, data);
	return data;
}

// ---------------------------------------------------------------------------
// Synchronous accessors (call only after loadTemplates())
// ---------------------------------------------------------------------------

/**
 * Get a unit template by ID. Throws if not found.
 */
export function getUnitTemplate(id: string): UnitTemplate {
	const templates = ensureLoaded();
	const t = templates.units.get(id);
	if (!t) {
		throw new Error(
			`getUnitTemplate: unknown unit ID '${id}'. Available: ${[...templates.units.keys()].join(", ")}`,
		);
	}
	return t;
}

/**
 * Get a building template by ID. Throws if not found.
 */
export function getBuildingTemplate(id: string): BuildingTemplate {
	const templates = ensureLoaded();
	const t = templates.buildings.get(id);
	if (!t) {
		throw new Error(
			`getBuildingTemplate: unknown building ID '${id}'. Available: ${[...templates.buildings.keys()].join(", ")}`,
		);
	}
	return t;
}

/**
 * Get an ability definition by ID. Throws if not found.
 */
export function getAbilityDef(id: string): AbilityDef {
	const templates = ensureLoaded();
	const t = templates.abilities.get(id);
	if (!t) {
		throw new Error(
			`getAbilityDef: unknown ability ID '${id}'. Available: ${[...templates.abilities.keys()].join(", ")}`,
		);
	}
	return t;
}

/**
 * Get a research definition by ID. Throws if not found.
 */
export function getResearchTemplate(id: string): ResearchDef {
	const templates = ensureLoaded();
	const t = templates.research.get(id);
	if (!t) {
		throw new Error(
			`getResearchTemplate: unknown research ID '${id}'. Available: ${[...templates.research.keys()].join(", ")}`,
		);
	}
	return t;
}

/**
 * Get mission data by ID. Throws if not loaded.
 */
export function getMissionData(id: string): MissionData {
	const templates = ensureLoaded();
	const t = templates.missions.get(id);
	if (!t) {
		throw new Error(
			`getMissionData: mission '${id}' not loaded. Call loadMission('${id}') first.`,
		);
	}
	return t;
}

/**
 * Get the full balance config.
 */
export function getBalance(): BalanceConfig {
	return ensureLoaded().balance;
}

/**
 * Get the full templates object. Throws if not loaded.
 */
export function getTemplates(): GameTemplates {
	return ensureLoaded();
}

// ---------------------------------------------------------------------------
// Convenience accessors for registries (backward compat)
// ---------------------------------------------------------------------------

/**
 * Get the unit registry Map. Throws if templates not loaded.
 */
export function getUnitRegistry(): Map<string, UnitTemplate> {
	return ensureLoaded().units;
}

/**
 * Get the building registry Map. Throws if templates not loaded.
 */
export function getBuildingRegistry(): Map<string, BuildingTemplate> {
	return ensureLoaded().buildings;
}

/**
 * Get the research registry Map. Throws if templates not loaded.
 */
export function getResearchRegistry(): Map<string, ResearchDef> {
	return ensureLoaded().research;
}

// ---------------------------------------------------------------------------
// Testing support
// ---------------------------------------------------------------------------

/**
 * Inject pre-built templates for testing (bypasses fetch).
 * Call with null to clear.
 */
export function _injectTemplatesForTest(templates: GameTemplates | null): void {
	loaded = templates;
}
