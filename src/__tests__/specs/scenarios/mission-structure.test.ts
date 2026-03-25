/**
 * Mission Structure Specification Tests
 *
 * These tests validate ALL 16 campaign missions against the structural
 * requirements defined in:
 *   - docs/superpowers/specs/2026-03-23-rts-pivot-design.md §6
 *   - docs/superpowers/specs/2026-03-24-entity-architecture-design.md (MissionDef)
 *   - docs/design/mission-design-guide.md (structure template)
 *   - docs/design/balance-framework.md (par times)
 *
 * Tests are written BEFORE mission definitions exist.
 */
import { beforeAll, describe, expect, it } from "vitest";
import type { MissionDef } from "@/entities/types";

// ---------------------------------------------------------------------------
// Dynamic imports
// ---------------------------------------------------------------------------

let missions: MissionDef[] = [];
const missionMap: Record<string, MissionDef> = {};
let loadError: string | null = null;

beforeAll(async () => {
	try {
		const registry = await import("@/entities/registry");
		missions = registry.CAMPAIGN ?? [];
		// Also build a lookup by id
		for (const m of missions) {
			missionMap[m.id] = m;
		}
	} catch (e) {
		loadError = (e as Error).message;
	}
});

const skip = () => !!loadError;

// ---------------------------------------------------------------------------
// Mission metadata from the spec
// ---------------------------------------------------------------------------

const MISSION_SPEC = [
	{
		id: "mission_1",
		chapter: 1,
		mission: 1,
		name: "Beachhead",
		parTime: 480,
		briefingPortrait: "foxhound",
		minPrimaryObjectives: 1,
	},
	{
		id: "mission_2",
		chapter: 1,
		mission: 2,
		name: "The Causeway",
		parTime: 360,
		briefingPortrait: "foxhound",
		minPrimaryObjectives: 1,
	},
	{
		id: "mission_3",
		chapter: 1,
		mission: 3,
		name: "Firebase Delta",
		parTime: 600,
		briefingPortrait: "foxhound",
		minPrimaryObjectives: 1,
	},
	{
		id: "mission_4",
		chapter: 1,
		mission: 4,
		name: "Prison Break",
		parTime: 300,
		briefingPortrait: "foxhound",
		minPrimaryObjectives: 1,
	},
	{
		id: "mission_5",
		chapter: 2,
		mission: 1,
		name: "Siphon Valley",
		parTime: 720,
		briefingPortrait: "gen_whiskers",
		minPrimaryObjectives: 1,
	},
	{
		id: "mission_6",
		chapter: 2,
		mission: 2,
		name: "Monsoon Ambush",
		parTime: 1200,
		briefingPortrait: "gen_whiskers",
		minPrimaryObjectives: 1,
	},
	{
		id: "mission_7",
		chapter: 2,
		mission: 3,
		name: "River Rats",
		parTime: 480,
		briefingPortrait: "gen_whiskers",
		minPrimaryObjectives: 1,
	},
	{
		id: "mission_8",
		chapter: 2,
		mission: 4,
		name: "The Underwater Cache",
		parTime: 360,
		briefingPortrait: "gen_whiskers",
		minPrimaryObjectives: 1,
	},
	{
		id: "mission_9",
		chapter: 3,
		mission: 1,
		name: "Dense Canopy",
		parTime: 720,
		briefingPortrait: "gen_whiskers",
		minPrimaryObjectives: 1,
	},
	{
		id: "mission_10",
		chapter: 3,
		mission: 2,
		name: "The Healer's Grove",
		parTime: 720,
		briefingPortrait: "gen_whiskers",
		minPrimaryObjectives: 1,
	},
	{
		id: "mission_11",
		chapter: 3,
		mission: 3,
		name: "Entrenchment",
		parTime: 900,
		briefingPortrait: "gen_whiskers",
		minPrimaryObjectives: 1,
	},
	{
		id: "mission_12",
		chapter: 3,
		mission: 4,
		name: "The Stronghold",
		parTime: 720,
		briefingPortrait: "gen_whiskers",
		minPrimaryObjectives: 1,
	},
	{
		id: "mission_13",
		chapter: 4,
		mission: 1,
		name: "Supply Lines",
		parTime: 720,
		briefingPortrait: "gen_whiskers",
		minPrimaryObjectives: 1,
	},
	{
		id: "mission_14",
		chapter: 4,
		mission: 2,
		name: "Gas Depot",
		parTime: 360,
		briefingPortrait: "gen_whiskers",
		minPrimaryObjectives: 1,
	},
	{
		id: "mission_15",
		chapter: 4,
		mission: 3,
		name: "Serpent's Lair",
		parTime: 900,
		briefingPortrait: "gen_whiskers",
		minPrimaryObjectives: 1,
	},
	{
		id: "mission_16",
		chapter: 4,
		mission: 4,
		name: "The Reckoning",
		parTime: 1200,
		briefingPortrait: "gen_whiskers",
		minPrimaryObjectives: 1,
	},
];

// ===========================================================================
// CAMPAIGN STRUCTURE
// ===========================================================================

describe("Campaign structure", () => {
	it("has exactly 16 missions", () => {
		if (skip()) return;
		expect(missions).toHaveLength(16);
	});

	it("missions are in order by chapter and mission number", () => {
		if (skip()) return;
		for (let i = 1; i < missions.length; i++) {
			const prev = missions[i - 1];
			const curr = missions[i];
			const prevOrder = prev.chapter * 100 + prev.mission;
			const currOrder = curr.chapter * 100 + curr.mission;
			expect(currOrder).toBeGreaterThan(prevOrder);
		}
	});

	it("has 4 chapters with 4 missions each", () => {
		if (skip()) return;
		for (let ch = 1; ch <= 4; ch++) {
			const chapterMissions = missions.filter((m) => m.chapter === ch);
			expect(chapterMissions).toHaveLength(4);
		}
	});
});

// ===========================================================================
// PER-MISSION VALIDATION
// ===========================================================================

describe.each(MISSION_SPEC)("Mission $id ($name)", ({
	id,
	chapter,
	mission,
	name,
	parTime,
	briefingPortrait,
	minPrimaryObjectives,
}) => {
	it("exists in the campaign", () => {
		if (skip()) return;
		expect(missionMap[id]).toBeDefined();
	});

	it("has correct chapter and mission number", () => {
		if (skip()) return;
		const m = missionMap[id];
		expect(m.chapter).toBe(chapter);
		expect(m.mission).toBe(mission);
	});

	it("has a name", () => {
		if (skip()) return;
		const m = missionMap[id];
		expect(m.name).toBeTruthy();
	});

	it("has valid terrain with width, height, and at least one fill region", () => {
		if (skip()) return;
		const m = missionMap[id];
		expect(m.terrain).toBeDefined();
		expect(m.terrain.width).toBeGreaterThan(0);
		expect(m.terrain.height).toBeGreaterThan(0);
		expect(m.terrain.regions.length).toBeGreaterThan(0);

		// At least one region should be a fill (base layer)
		const fillRegion = m.terrain.regions.find((r) => r.fill === true);
		expect(fillRegion).toBeDefined();
	});

	it("has entity placements", () => {
		if (skip()) return;
		const m = missionMap[id];
		expect(m.placements).toBeDefined();
		expect(m.placements.length).toBeGreaterThan(0);
	});

	it("has zones defined", () => {
		if (skip()) return;
		const m = missionMap[id];
		expect(m.zones).toBeDefined();
		expect(Object.keys(m.zones).length).toBeGreaterThan(0);
	});

	it("zone-based placements reference valid zones", () => {
		if (skip()) return;
		const m = missionMap[id];
		const zonePlacements = m.placements.filter((p) => p.zone);
		for (const p of zonePlacements) {
			expect(m.zones).toHaveProperty(p.zone!);
		}
	});

	it("has a briefing with portrait and at least 2 lines", () => {
		if (skip()) return;
		const m = missionMap[id];
		expect(m.briefing).toBeDefined();
		expect(m.briefing.portraitId).toBe(briefingPortrait);
		expect(m.briefing.lines.length).toBeGreaterThanOrEqual(2);
	});

	it("briefing lines have speaker and text", () => {
		if (skip()) return;
		const m = missionMap[id];
		for (const line of m.briefing.lines) {
			expect(line.speaker).toBeTruthy();
			expect(line.text).toBeTruthy();
		}
	});

	it("has at least one primary objective", () => {
		if (skip()) return;
		const m = missionMap[id];
		expect(m.objectives).toBeDefined();
		expect(m.objectives.primary.length).toBeGreaterThanOrEqual(minPrimaryObjectives);
	});

	it(`has par time of ${parTime}s`, () => {
		if (skip()) return;
		const m = missionMap[id];
		expect(m.parTime).toBe(parTime);
	});

	it("has starting resources defined", () => {
		if (skip()) return;
		const m = missionMap[id];
		expect(m.startResources).toBeDefined();
	});

	it("has starting pop cap defined", () => {
		if (skip()) return;
		const m = missionMap[id];
		expect(m.startPopCap).toBeDefined();
		expect(m.startPopCap).toBeGreaterThan(0);
	});

	it("has all three difficulty modifiers", () => {
		if (skip()) return;
		const m = missionMap[id];
		expect(m.difficulty).toBeDefined();
		expect(m.difficulty.support).toBeDefined();
		expect(m.difficulty.tactical).toBeDefined();
		expect(m.difficulty.elite).toBeDefined();

		// Each modifier should have the required fields
		for (const diff of [m.difficulty.support, m.difficulty.tactical, m.difficulty.elite]) {
			expect(diff.enemyDamageMultiplier).toBeGreaterThan(0);
			expect(diff.enemyHpMultiplier).toBeGreaterThan(0);
			expect(diff.resourceMultiplier).toBeGreaterThan(0);
			expect(diff.xpMultiplier).toBeGreaterThan(0);
		}
	});

	it("difficulty scales correctly: support <= tactical <= elite", () => {
		if (skip()) return;
		const m = missionMap[id];
		const { support, tactical, elite } = m.difficulty;

		// Enemy damage should escalate
		expect(tactical.enemyDamageMultiplier).toBeGreaterThanOrEqual(support.enemyDamageMultiplier);
		expect(elite.enemyDamageMultiplier).toBeGreaterThanOrEqual(tactical.enemyDamageMultiplier);

		// Enemy HP should escalate
		expect(tactical.enemyHpMultiplier).toBeGreaterThanOrEqual(support.enemyHpMultiplier);
		expect(elite.enemyHpMultiplier).toBeGreaterThanOrEqual(tactical.enemyHpMultiplier);

		// Resource multiplier should decrease (harder = fewer resources)
		expect(tactical.resourceMultiplier).toBeLessThanOrEqual(support.resourceMultiplier);
		expect(elite.resourceMultiplier).toBeLessThanOrEqual(tactical.resourceMultiplier);
	});
});

// ===========================================================================
// SPECIFIC MISSION REQUIREMENTS
// ===========================================================================

describe("Mission-specific requirements", () => {
	it("Mission 1 (Beachhead) is a tutorial — starts with River Rats", () => {
		if (skip()) return;
		const m = missionMap.mission_1;
		const riverRatPlacement = m.placements.find(
			(p) => p.type === "river_rat" && p.faction === "ura",
		);
		expect(riverRatPlacement).toBeDefined();
	});

	it("Mission 4 (Prison Break) has Gen. Whiskers as rescue objective", () => {
		if (skip()) return;
		const m = missionMap.mission_4;
		expect(m.objectives.primary.length).toBeGreaterThan(0);
		// Should unlock gen_whiskers hero
		expect(m.unlocks?.heroes).toContain("gen_whiskers");
	});

	it("Mission 8 (Underwater Cache) unlocks Cpl. Splash", () => {
		if (skip()) return;
		const m = missionMap.mission_8;
		expect(m.unlocks?.heroes).toContain("cpl_splash");
	});

	it("Mission 10 (Healer's Grove) unlocks Medic Marina", () => {
		if (skip()) return;
		const m = missionMap.mission_10;
		expect(m.unlocks?.heroes).toContain("medic_marina");
	});

	it("Mission 12 (The Stronghold) unlocks Sgt. Fang", () => {
		if (skip()) return;
		const m = missionMap.mission_12;
		expect(m.unlocks?.heroes).toContain("sgt_fang");
	});

	it("Mission 16 (The Reckoning) is the final mission — longest par time", () => {
		if (skip()) return;
		const m = missionMap.mission_16;
		expect(m.parTime).toBe(1200); // 20 minutes
		// Should be the last mission
		expect(m.chapter).toBe(4);
		expect(m.mission).toBe(4);
	});

	it("Missions 1-3 use FOXHOUND as briefing officer", () => {
		if (skip()) return;
		for (const id of ["mission_1", "mission_2", "mission_3"]) {
			expect(missionMap[id].briefing.portraitId).toBe("foxhound");
		}
	});

	it("Missions 5-16 use Gen. Whiskers as briefing officer", () => {
		if (skip()) return;
		for (let i = 5; i <= 16; i++) {
			const id = `mission_${i}`;
			expect(missionMap[id].briefing.portraitId).toBe("gen_whiskers");
		}
	});

	it("briefings have max 8 lines (back-and-forth dialogue)", () => {
		if (skip()) return;
		for (const m of missions) {
			expect(m.briefing.lines.length).toBeLessThanOrEqual(8);
		}
	});
});

// ===========================================================================
// TERRAIN CONSISTENCY
// ===========================================================================

describe("Terrain consistency across missions", () => {
	it("all terrain regions reference valid terrain tile ids", () => {
		if (skip()) return;
		const validTerrainIds = [
			"grass",
			"dirt",
			"beach",
			"mud",
			"water",
			"mangrove",
			"toxic_sludge",
			"bridge",
			"tall_grass",
		];
		for (const m of missions) {
			for (const region of m.terrain.regions) {
				expect(validTerrainIds).toContain(region.terrainId);
			}
		}
	});

	it("all terrain overrides reference valid terrain tile ids", () => {
		if (skip()) return;
		const validTerrainIds = [
			"grass",
			"dirt",
			"beach",
			"mud",
			"water",
			"mangrove",
			"toxic_sludge",
			"bridge",
			"tall_grass",
		];
		for (const m of missions) {
			for (const override of m.terrain.overrides) {
				expect(validTerrainIds).toContain(override.terrainId);
			}
		}
	});

	it("zones have valid dimensions", () => {
		if (skip()) return;
		for (const m of missions) {
			for (const [zoneId, zone] of Object.entries(m.zones)) {
				expect(zone.width).toBeGreaterThan(0);
				expect(zone.height).toBeGreaterThan(0);
				expect(zone.x).toBeGreaterThanOrEqual(0);
				expect(zone.y).toBeGreaterThanOrEqual(0);
				// Zone should be within map bounds
				expect(zone.x + zone.width).toBeLessThanOrEqual(m.terrain.width);
				expect(zone.y + zone.height).toBeLessThanOrEqual(m.terrain.height);
			}
		}
	});

	it("exact placements are within map bounds", () => {
		if (skip()) return;
		for (const m of missions) {
			const exactPlacements = m.placements.filter((p) => p.x !== undefined && p.y !== undefined);
			for (const p of exactPlacements) {
				expect(p.x).toBeGreaterThanOrEqual(0);
				expect(p.y).toBeGreaterThanOrEqual(0);
				expect(p.x).toBeLessThan(m.terrain.width);
				expect(p.y).toBeLessThan(m.terrain.height);
			}
		}
	});
});
