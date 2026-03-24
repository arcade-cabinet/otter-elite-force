import { describe, it, expect } from "vitest";
import { PALETTE } from "@/entities/palette";

describe("PALETTE", () => {
	it("has at least 20 entries", () => {
		expect(Object.keys(PALETTE).length).toBeGreaterThanOrEqual(20);
	});

	it("maps '.' to 'transparent'", () => {
		expect(PALETTE["."]).toBe("transparent");
	});

	it("every non-transparent entry is a valid 7-char hex color", () => {
		const hexPattern = /^#[0-9a-fA-F]{6}$/;
		for (const [key, value] of Object.entries(PALETTE)) {
			if (value === "transparent") continue;
			expect(value, `PALETTE['${key}'] = '${value}' is not valid hex`).toMatch(hexPattern);
		}
	});

	it("has entries for all documented palette characters", () => {
		const required = [
			".",
			"#",
			"S",
			"s",
			"B",
			"b",
			"R",
			"r",
			"G",
			"g",
			"W",
			"w",
			"Y",
			"y",
			"C",
			"c",
			"M",
			"T",
			"t",
			"O",
			"o",
			"P",
			"p",
		];
		for (const ch of required) {
			expect(PALETTE, `Missing palette key '${ch}'`).toHaveProperty(ch);
		}
	});

	it("has no duplicate color values (except transparent)", () => {
		const seen = new Map<string, string>();
		for (const [key, value] of Object.entries(PALETTE)) {
			if (value === "transparent") continue;
			expect(
				seen.has(value),
				`PALETTE['${key}'] duplicates PALETTE['${seen.get(value)}'] (${value})`,
			).toBe(false);
			seen.set(value, key);
		}
	});
});
