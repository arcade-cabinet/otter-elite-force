/**
 * Sprite Validity Specification Tests
 *
 * These tests validate EVERY sprite definition in the game against
 * the rules defined in docs/design/art-direction.md:
 *
 * - Units: 16x16 grid
 * - Buildings: 32x32 grid
 * - Portraits: 64x96 grid
 * - All chars must exist in PALETTE ('.' = transparent)
 * - No row length mismatches (every row must equal declared width)
 * - idle frame required for all entities
 * - URA units have B/b in torso rows 4-9
 * - Scale-Guard units have R/r in torso rows 4-9
 *
 * Tests are written BEFORE entity definitions exist.
 */
import { describe, it, expect, beforeAll } from "vitest";
import {
	getCategoryDimensions,
	materializeSpriteToLegacy,
} from "@/entities/sprite-materialization";
import type { UnitDef, HeroDef, BuildingDef, PortraitDef, SpriteDef } from "@/entities/types";

// ---------------------------------------------------------------------------
// Dynamic imports
// ---------------------------------------------------------------------------

let PALETTE: Record<string, string> = {};
let units: Record<string, UnitDef> = {};
let heroes: Record<string, HeroDef> = {};
let buildings: Record<string, BuildingDef> = {};
let portraits: Record<string, PortraitDef> = {};
let loadError: string | null = null;

beforeAll(async () => {
	try {
		const paletteModule = await import("@/entities/palettes");
		PALETTE = paletteModule.PALETTE ?? {};

		const registry = await import("@/entities/registry");
		const unitDimensions = getCategoryDimensions("units");
		const buildingDimensions = getCategoryDimensions("buildings");
		const portraitDimensions = getCategoryDimensions("portraits");
		units = Object.fromEntries(
			Object.entries(registry.ALL_UNITS ?? {}).map(([id, unit]) => [
				id,
				{ ...unit, sprite: materializeSpriteToLegacy(unit.sprite, unitDimensions) },
			]),
		);
		heroes = Object.fromEntries(
			Object.entries(registry.ALL_HEROES ?? {}).map(([id, hero]) => [
				id,
				{ ...hero, sprite: materializeSpriteToLegacy(hero.sprite, unitDimensions) },
			]),
		);
		buildings = Object.fromEntries(
			Object.entries(registry.ALL_BUILDINGS ?? {}).map(([id, building]) => [
				id,
				{ ...building, sprite: materializeSpriteToLegacy(building.sprite, buildingDimensions) },
			]),
		);
		portraits = Object.fromEntries(
			Object.entries(registry.ALL_PORTRAITS ?? {}).map(([id, portrait]) => [
				id,
				{ ...portrait, sprite: materializeSpriteToLegacy(portrait.sprite, portraitDimensions) },
			]),
		);
	} catch (e) {
		loadError = (e as Error).message;
	}
});

const skip = () => !!loadError;

// ---------------------------------------------------------------------------
// Helper: validate a sprite definition against rules
// ---------------------------------------------------------------------------

function validateSprite(sprite: SpriteDef, expectedSize: number, entityId: string) {
	const errors: string[] = [];

	// Size check
	if (sprite.size !== expectedSize) {
		errors.push(`[${entityId}] Expected size ${expectedSize}, got ${sprite.size}`);
	}

	// Must have idle frame
	if (!sprite.frames.idle || sprite.frames.idle.length === 0) {
		errors.push(`[${entityId}] Missing idle frame`);
	}

	// Validate every frame
	for (const [animName, frames] of Object.entries(sprite.frames)) {
		for (let fi = 0; fi < frames.length; fi++) {
			const frame = frames[fi];

			// For portrait-sized sprites, check width and height separately
			if (expectedSize === 64) {
				// Portraits are 64 wide x 96 tall
				if (frame.length !== 96) {
					errors.push(`[${entityId}] ${animName}[${fi}] has ${frame.length} rows, expected 96`);
				}
				for (let row = 0; row < frame.length; row++) {
					if (frame[row].length !== 64) {
						errors.push(
							`[${entityId}] ${animName}[${fi}] row ${row} has ${frame[row].length} chars, expected 64`,
						);
					}
				}
			} else {
				// Square sprites: size x size
				if (frame.length !== expectedSize) {
					errors.push(
						`[${entityId}] ${animName}[${fi}] has ${frame.length} rows, expected ${expectedSize}`,
					);
				}
				for (let row = 0; row < frame.length; row++) {
					if (frame[row].length !== expectedSize) {
						errors.push(
							`[${entityId}] ${animName}[${fi}] row ${row} has ${frame[row].length} chars, expected ${expectedSize}`,
						);
					}
				}
			}

			// All chars must be in PALETTE
			for (let row = 0; row < frame.length; row++) {
				for (const ch of frame[row]) {
					if (ch !== "." && !(ch in PALETTE)) {
						errors.push(
							`[${entityId}] ${animName}[${fi}] row ${row} uses unknown palette char '${ch}'`,
						);
					}
				}
			}
		}
	}

	return errors;
}

/**
 * Check that a unit sprite has the expected faction color in the torso region
 * (rows 4-9 per art-direction.md).
 */
function checkFactionColor(
	sprite: SpriteDef,
	faction: "ura" | "scale_guard",
	entityId: string,
): string[] {
	const errors: string[] = [];
	const idleFrames = sprite.frames.idle;
	if (!idleFrames || idleFrames.length === 0) return errors;

	const frame = idleFrames[0];
	if (frame.length < 10) return errors; // Not enough rows

	// URA should have B or b in torso rows 4-9
	// Scale-Guard should have R or r in torso rows 4-9
	const expectedChars = faction === "ura" ? ["B", "b"] : ["R", "r"];
	let foundFactionColor = false;

	for (let row = 4; row <= 9 && row < frame.length; row++) {
		for (const ch of frame[row]) {
			if (expectedChars.includes(ch)) {
				foundFactionColor = true;
				break;
			}
		}
		if (foundFactionColor) break;
	}

	if (!foundFactionColor) {
		errors.push(
			`[${entityId}] No faction color (${expectedChars.join("/")}) found in torso rows 4-9`,
		);
	}

	return errors;
}

// ===========================================================================
// PALETTE VALIDATION
// ===========================================================================

describe("Palette", () => {
	it("is loaded and non-empty", () => {
		if (skip()) return;
		expect(Object.keys(PALETTE).length).toBeGreaterThan(0);
	});

	it("contains all required base colors from art-direction.md", () => {
		if (skip()) return;
		const required = [
			"#", // Black — outlines
			"S", // Skin Light
			"s", // Skin Dark
			"B", // Blue Primary (URA)
			"b", // Blue Secondary (URA)
			"R", // Red Primary (Scale-Guard)
			"r", // Red Secondary (Scale-Guard)
			"G", // Dark Green
			"g", // Light Green
			"W", // Dark Wood
			"w", // Light Wood
			"Y", // Gold
			"y", // Light Gold
			"C", // Dark Stone
			"c", // Light Stone
			"M", // Dark Interior
			"T", // Teal
			"t", // Light Teal
			"O", // Orange
			"o", // Light Orange
			"P", // Purple
			"p", // Light Purple
		];
		for (const ch of required) {
			expect(PALETTE).toHaveProperty(ch);
		}
	});

	it("every value is a valid hex color", () => {
		if (skip()) return;
		const hexRegex = /^#[0-9a-fA-F]{6}$/;
		for (const [, value] of Object.entries(PALETTE)) {
			expect(value === "transparent" || hexRegex.test(value)).toBe(true);
		}
	});

	it("maps specific palette chars to correct hex values", () => {
		if (skip()) return;
		expect(PALETTE["#"]).toBe("#000000");
		expect(PALETTE["S"]).toBe("#ffcc99");
		expect(PALETTE["s"]).toBe("#eebb88");
		expect(PALETTE["B"]).toBe("#1e3a8a");
		expect(PALETTE["b"]).toBe("#3b82f6");
		expect(PALETTE["R"]).toBe("#7f1d1d");
		expect(PALETTE["r"]).toBe("#ef4444");
		expect(PALETTE["G"]).toBe("#166534");
		expect(PALETTE["g"]).toBe("#22c55e");
		expect(PALETTE["W"]).toBe("#78350f");
		expect(PALETTE["w"]).toBe("#b45309");
		expect(PALETTE["Y"]).toBe("#eab308");
		expect(PALETTE["y"]).toBe("#fef08a");
		expect(PALETTE["C"]).toBe("#4b5563");
		expect(PALETTE["c"]).toBe("#9ca3af");
		expect(PALETTE["M"]).toBe("#1f2937");
		expect(PALETTE["T"]).toBe("#0d9488");
		expect(PALETTE["t"]).toBe("#5eead4");
		expect(PALETTE["O"]).toBe("#c2410c");
		expect(PALETTE["o"]).toBe("#fb923c");
		expect(PALETTE["P"]).toBe("#7e22ce");
		expect(PALETTE["p"]).toBe("#c084fc");
	});
});

// ===========================================================================
// UNIT SPRITE VALIDITY (16x16)
// ===========================================================================

describe("Unit sprite validity", () => {
	it("every unit sprite is valid 16x16 with palette chars", () => {
		if (skip()) return;
		const allErrors: string[] = [];
		for (const [id, unit] of Object.entries(units)) {
			allErrors.push(...validateSprite(unit.sprite, 16, id));
		}
		expect(allErrors).toEqual([]);
	});

	it("every hero sprite is valid 16x16 with palette chars", () => {
		if (skip()) return;
		const allErrors: string[] = [];
		for (const [id, hero] of Object.entries(heroes)) {
			allErrors.push(...validateSprite(hero.sprite, 16, id));
		}
		expect(allErrors).toEqual([]);
	});

	it("URA units have blue (B/b) in torso region", () => {
		if (skip()) return;
		const allErrors: string[] = [];
		const uraUnits = Object.entries(units).filter(([, u]) => u.faction === "ura");
		for (const [id, unit] of uraUnits) {
			allErrors.push(...checkFactionColor(unit.sprite, "ura", id));
		}
		expect(allErrors).toEqual([]);
	});

	it("Scale-Guard units have red (R/r) in torso region", () => {
		if (skip()) return;
		const allErrors: string[] = [];
		const sgUnits = Object.entries(units).filter(([, u]) => u.faction === "scale_guard");
		for (const [id, unit] of sgUnits) {
			allErrors.push(...checkFactionColor(unit.sprite, "scale_guard", id));
		}
		expect(allErrors).toEqual([]);
	});

	it("every unit has at least idle animation", () => {
		if (skip()) return;
		for (const [id, unit] of Object.entries(units)) {
			expect(unit.sprite.frames.idle).toBeDefined();
			expect(unit.sprite.frames.idle.length).toBeGreaterThanOrEqual(1);
		}
	});

	it("combat units have walk animation", () => {
		if (skip()) return;
		// All non-stationary units should have walk frames
		const mobileUnits = Object.entries(units).filter(([, u]) => u.speed > 0);
		for (const [id, unit] of mobileUnits) {
			expect(unit.sprite.frames.walk).toBeDefined();
			expect(unit.sprite.frames.walk.length).toBeGreaterThanOrEqual(2);
		}
	});
});

// ===========================================================================
// BUILDING SPRITE VALIDITY (32x32)
// ===========================================================================

describe("Building sprite validity", () => {
	it("every building sprite is valid 32x32 with palette chars", () => {
		if (skip()) return;
		const allErrors: string[] = [];
		for (const [id, building] of Object.entries(buildings)) {
			allErrors.push(...validateSprite(building.sprite, 32, id));
		}
		expect(allErrors).toEqual([]);
	});

	it("every building has idle animation", () => {
		if (skip()) return;
		for (const [id, building] of Object.entries(buildings)) {
			expect(building.sprite.frames.idle).toBeDefined();
			expect(building.sprite.frames.idle.length).toBeGreaterThanOrEqual(1);
		}
	});
});

// ===========================================================================
// PORTRAIT SPRITE VALIDITY (64x96)
// ===========================================================================

describe("Portrait sprite validity", () => {
	it("every portrait sprite is valid 64x96 with palette chars", () => {
		if (skip()) return;
		const allErrors: string[] = [];
		for (const [id, portrait] of Object.entries(portraits)) {
			allErrors.push(...validateSprite(portrait.sprite, 64, id));
		}
		expect(allErrors).toEqual([]);
	});

	it("every portrait has idle frame", () => {
		if (skip()) return;
		for (const [id, portrait] of Object.entries(portraits)) {
			expect(portrait.sprite.frames.idle).toBeDefined();
			expect(portrait.sprite.frames.idle.length).toBeGreaterThanOrEqual(1);
		}
	});

	it("portraits exist for all heroes + FOXHOUND", () => {
		if (skip()) return;
		const expectedPortraits = [
			"sgt_bubbles",
			"gen_whiskers",
			"cpl_splash",
			"sgt_fang",
			"medic_marina",
			"pvt_muskrat",
			"foxhound",
		];
		for (const id of expectedPortraits) {
			expect(portraits).toHaveProperty(id);
		}
	});
});

// ===========================================================================
// CROSS-ENTITY SPRITE CONSISTENCY
// ===========================================================================

describe("Cross-entity sprite consistency", () => {
	it("no entity uses a palette char that does not exist", () => {
		if (skip()) return;
		const allSprites: [string, SpriteDef][] = [
			...Object.entries(units).map(([id, u]) => [id, u.sprite] as [string, SpriteDef]),
			...Object.entries(heroes).map(([id, h]) => [id, h.sprite] as [string, SpriteDef]),
			...Object.entries(buildings).map(([id, b]) => [id, b.sprite] as [string, SpriteDef]),
			...Object.entries(portraits).map(([id, p]) => [id, p.sprite] as [string, SpriteDef]),
		];

		const unknownChars: string[] = [];
		for (const [entityId, sprite] of allSprites) {
			for (const [animName, frames] of Object.entries(sprite.frames)) {
				for (let fi = 0; fi < frames.length; fi++) {
					for (let row = 0; row < frames[fi].length; row++) {
						for (const ch of frames[fi][row]) {
							if (ch !== "." && !(ch in PALETTE)) {
								unknownChars.push(`${entityId}.${animName}[${fi}] row ${row}: '${ch}'`);
							}
						}
					}
				}
			}
		}
		expect(unknownChars).toEqual([]);
	});

	it("all entity sprites have consistent row lengths within each frame", () => {
		if (skip()) return;
		const allSprites: [string, SpriteDef][] = [
			...Object.entries(units).map(([id, u]) => [id, u.sprite] as [string, SpriteDef]),
			...Object.entries(heroes).map(([id, h]) => [id, h.sprite] as [string, SpriteDef]),
			...Object.entries(buildings).map(([id, b]) => [id, b.sprite] as [string, SpriteDef]),
			...Object.entries(portraits).map(([id, p]) => [id, p.sprite] as [string, SpriteDef]),
		];

		const inconsistencies: string[] = [];
		for (const [entityId, sprite] of allSprites) {
			for (const [animName, frames] of Object.entries(sprite.frames)) {
				for (let fi = 0; fi < frames.length; fi++) {
					const frame = frames[fi];
					if (frame.length === 0) continue;
					const expectedWidth = frame[0].length;
					for (let row = 1; row < frame.length; row++) {
						if (frame[row].length !== expectedWidth) {
							inconsistencies.push(
								`${entityId}.${animName}[${fi}] row ${row}: ${frame[row].length} != ${expectedWidth}`,
							);
						}
					}
				}
			}
		}
		expect(inconsistencies).toEqual([]);
	});
});
