import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	DEFAULT_SAVE_DATA,
	deepClone,
	deepMerge,
	isValidSaveData,
	loadFromLocalStorage,
	migrateSchema,
	saveToLocalStorage,
} from "../../stores/persistence";
import { STORAGE_KEY } from "../../utils/constants";

describe("Persistence Module", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	describe("deepClone", () => {
		it("should create a deep copy of an object", () => {
			const obj = { a: 1, b: { c: 2 } };
			const clone = deepClone(obj);
			expect(clone).toEqual(obj);
			expect(clone).not.toBe(obj);
			expect(clone.b).not.toBe(obj.b);
		});
	});

	describe("deepMerge", () => {
		it("should merge two objects correctly", () => {
			const target = { a: 1, b: { c: 2 } };
			const source = { b: { d: 3 }, e: 4 };
			const merged = deepMerge(target as any, source as any);
			expect(merged).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
		});
	});

	describe("isValidSaveData", () => {
		it("should return true for valid save data", () => {
			expect(isValidSaveData(DEFAULT_SAVE_DATA)).toBe(true);
		});

		it("should return false for missing fields", () => {
			const invalid = { version: 8 };
			expect(isValidSaveData(invalid)).toBe(false);
		});

		it("should return false for non-objects", () => {
			expect(isValidSaveData(null)).toBe(false);
			expect(isValidSaveData("string")).toBe(false);
		});
	});

	describe("migrateSchema", () => {
		it("should migrate old version to version 8", () => {
			const oldData = { version: 7, coins: 100 };
			const migrated = migrateSchema(oldData as any);
			expect(migrated.version).toBe(8);
			expect(migrated).toHaveProperty("strategicObjectives");
		});
	});

	describe("localStorage operations", () => {
		it("should save and load from localStorage", () => {
			saveToLocalStorage(DEFAULT_SAVE_DATA);
			const loaded = loadFromLocalStorage();
			expect(loaded).toEqual(DEFAULT_SAVE_DATA);
		});

		it("should return null if nothing is in localStorage", () => {
			expect(loadFromLocalStorage()).toBeNull();
		});

		it("should return null for invalid data in localStorage", () => {
			localStorage.setItem(STORAGE_KEY, "invalid-json");
			expect(loadFromLocalStorage()).toBeNull();
		});
	});
});
