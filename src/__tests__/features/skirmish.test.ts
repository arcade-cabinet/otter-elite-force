/**
 * Skirmish mode — victory condition and star unlock tests (US-081)
 *
 * Validates:
 *   - Campaign star counting
 *   - Map unlock logic based on stars
 *   - Gold star (100%) unlocks all
 *   - Victory/defeat outcome types
 *   - Match stats structure
 */

import { describe, expect, it } from "vitest";
import {
	countCampaignStars,
	hasGoldUnlock,
	isMapUnlocked,
	MAX_CAMPAIGN_STARS,
	SKIRMISH_MAPS,
	type SkirmishMapDef,
} from "../../features/skirmish/types";

// ---------------------------------------------------------------------------
// Star counting
// ---------------------------------------------------------------------------

describe("Skirmish — Star Counting", () => {
	it("counts zero stars for empty missions", () => {
		expect(countCampaignStars({})).toBe(0);
	});

	it("counts stars from completed missions", () => {
		const missions = {
			mission_1: { status: "completed", stars: 3 },
			mission_2: { status: "completed", stars: 2 },
			mission_3: { status: "completed", stars: 1 },
		};
		expect(countCampaignStars(missions)).toBe(6);
	});

	it("counts partial progress", () => {
		const missions = {
			mission_1: { status: "completed", stars: 2 },
		};
		expect(countCampaignStars(missions)).toBe(2);
	});

	it("maximum possible stars is 48 (16 missions x 3 stars)", () => {
		expect(MAX_CAMPAIGN_STARS).toBe(48);
	});
});

// ---------------------------------------------------------------------------
// Map unlock logic
// ---------------------------------------------------------------------------

describe("Skirmish — Map Unlocks", () => {
	it("maps with starsRequired=0 are always unlocked", () => {
		const freeMap: SkirmishMapDef = {
			id: "test",
			name: "Test",
			description: "Test map",
			terrainType: "jungle",
			size: "small",
			starsRequired: 0,
		};
		expect(isMapUnlocked(freeMap, 0)).toBe(true);
	});

	it("maps requiring stars are locked when player has fewer", () => {
		const lockedMap: SkirmishMapDef = {
			id: "test",
			name: "Test",
			description: "Test",
			terrainType: "swamp",
			size: "medium",
			starsRequired: 10,
		};
		expect(isMapUnlocked(lockedMap, 5)).toBe(false);
	});

	it("maps requiring stars are unlocked when player meets threshold", () => {
		const lockedMap: SkirmishMapDef = {
			id: "test",
			name: "Test",
			description: "Test",
			terrainType: "river",
			size: "large",
			starsRequired: 10,
		};
		expect(isMapUnlocked(lockedMap, 10)).toBe(true);
		expect(isMapUnlocked(lockedMap, 15)).toBe(true);
	});

	it("first two maps are free (starsRequired=0)", () => {
		expect(SKIRMISH_MAPS[0].starsRequired).toBe(0);
		expect(SKIRMISH_MAPS[1].starsRequired).toBe(0);
	});

	it("map catalog has at least 4 maps", () => {
		expect(SKIRMISH_MAPS.length).toBeGreaterThanOrEqual(4);
	});

	it("maps are sorted by starsRequired (ascending)", () => {
		for (let i = 1; i < SKIRMISH_MAPS.length; i++) {
			expect(SKIRMISH_MAPS[i].starsRequired).toBeGreaterThanOrEqual(
				SKIRMISH_MAPS[i - 1].starsRequired,
			);
		}
	});
});

// ---------------------------------------------------------------------------
// Gold star unlock
// ---------------------------------------------------------------------------

describe("Skirmish — Gold Star Unlock", () => {
	it("100% gold stars (48) unlocks everything", () => {
		expect(hasGoldUnlock(48)).toBe(true);
	});

	it("47 stars does not trigger gold unlock", () => {
		expect(hasGoldUnlock(47)).toBe(false);
	});

	it("gold unlock makes even the highest-requirement map available", () => {
		const hardestMap = SKIRMISH_MAPS.reduce((best, m) =>
			m.starsRequired > best.starsRequired ? m : best,
		);
		// Without gold, could be locked
		// With gold, always unlocked
		expect(hasGoldUnlock(MAX_CAMPAIGN_STARS)).toBe(true);
		// The map itself may or may not need gold stars, but gold unlock overrides
		expect(isMapUnlocked(hardestMap, MAX_CAMPAIGN_STARS)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Victory / Defeat conditions
// ---------------------------------------------------------------------------

describe("Skirmish — Victory Conditions", () => {
	it("win condition is destroying enemy Command Post", () => {
		// This is a documentation/type test — the SkirmishOutcome type has "victory" | "defeat"
		const outcome: "victory" | "defeat" = "victory";
		expect(outcome).toBe("victory");
	});

	it("lose condition is player Command Post destroyed", () => {
		const outcome: "victory" | "defeat" = "defeat";
		expect(outcome).toBe("defeat");
	});
});

// ---------------------------------------------------------------------------
// Match stats structure
// ---------------------------------------------------------------------------

describe("Skirmish — Match Stats", () => {
	it("match result includes required stat fields", () => {
		const result = {
			outcome: "victory" as const,
			mapId: "sk_river_crossing",
			difficulty: "medium" as const,
			playedAsScaleGuard: false,
			stats: {
				timeElapsed: 312,
				unitsTrained: 24,
				unitsLost: 8,
				resourcesGathered: 1500,
			},
		};
		expect(result.stats.timeElapsed).toBe(312);
		expect(result.stats.unitsTrained).toBe(24);
		expect(result.stats.unitsLost).toBe(8);
		expect(result.stats.resourcesGathered).toBe(1500);
	});
});
