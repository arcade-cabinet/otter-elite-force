/**
 * US-052: Mission Briefing via CommandTransmissionPanel
 *
 * Validates that all 16 missions have authored briefing text with:
 * - A speaker portrait (foxhound early, gen_whiskers later)
 * - Multiple briefing lines
 * - Non-empty text and speaker fields
 */

import { describe, expect, it } from "vitest";
import { CAMPAIGN } from "@/entities/missions";

describe("US-052: Mission briefing data", () => {
	it("all 16 missions have briefing blocks", () => {
		expect(CAMPAIGN).toHaveLength(16);
		for (const mission of CAMPAIGN) {
			expect(mission.briefing).toBeDefined();
			expect(mission.briefing.portraitId).toBeTruthy();
			expect(mission.briefing.lines.length).toBeGreaterThanOrEqual(2);
		}
	});

	it("every briefing line has a non-empty speaker and text", () => {
		for (const mission of CAMPAIGN) {
			for (const line of mission.briefing.lines) {
				expect(line.speaker.length).toBeGreaterThan(0);
				expect(line.text.length).toBeGreaterThan(0);
			}
		}
	});

	it("chapter 1 missions use FOXHOUND as portrait", () => {
		const ch1 = CAMPAIGN.filter((m) => m.chapter === 1);
		expect(ch1).toHaveLength(4);
		for (const mission of ch1) {
			expect(mission.briefing.portraitId).toBe("foxhound");
		}
	});

	it("chapter 2-4 missions use Gen. Whiskers as portrait", () => {
		const later = CAMPAIGN.filter((m) => m.chapter >= 2);
		expect(later).toHaveLength(12);
		for (const mission of later) {
			expect(mission.briefing.portraitId).toBe("gen_whiskers");
		}
	});

	it("each mission has at least 3 briefing lines", () => {
		for (const mission of CAMPAIGN) {
			expect(
				mission.briefing.lines.length,
				`${mission.id} has only ${mission.briefing.lines.length} lines`,
			).toBeGreaterThanOrEqual(3);
		}
	});
});
