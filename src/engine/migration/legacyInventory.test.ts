/**
 * Tests for Legacy Inventory — verifies that the legacy file lists are accurate
 * and that the migration tracking is consistent.
 *
 * Post-migration: Koota ECS and system files have been deleted.
 * The inventory lists now serve as a record of what was removed.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
	LEGACY_DEPS,
	LEGACY_KOOTA_FILES,
	LEGACY_REACT_FILES,
	LEGACY_SYSTEM_FILES,
} from "./legacyInventory";

const PROJECT_ROOT = resolve(__dirname, "../../..");

function fileExists(relativePath: string): boolean {
	return existsSync(resolve(PROJECT_ROOT, relativePath));
}

// ---------------------------------------------------------------------------
// Post-migration: Koota and systems files should be DELETED
// ---------------------------------------------------------------------------

describe("Legacy Inventory: post-migration deletion verification", () => {
	it("all LEGACY_KOOTA_FILES have been deleted", () => {
		const stillPresent: string[] = [];
		for (const filePath of LEGACY_KOOTA_FILES) {
			if (fileExists(filePath)) {
				stillPresent.push(filePath);
			}
		}
		expect(stillPresent).toEqual([]);
	});

	it("all LEGACY_SYSTEM_FILES have been deleted", () => {
		const stillPresent: string[] = [];
		for (const filePath of LEGACY_SYSTEM_FILES) {
			if (fileExists(filePath)) {
				stillPresent.push(filePath);
			}
		}
		expect(stillPresent).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// No engine/ files should be in legacy lists
// ---------------------------------------------------------------------------

describe("Legacy Inventory: no engine/ files in legacy lists", () => {
	it("LEGACY_REACT_FILES does not include any src/engine/ paths (except RuntimeHost)", () => {
		const engineFiles = LEGACY_REACT_FILES.filter(
			(f) => f.startsWith("src/engine/") && f !== "src/engine/runtime/RuntimeHost.tsx",
		);
		expect(engineFiles).toEqual([]);
	});

	it("LEGACY_KOOTA_FILES does not include any src/engine/ paths", () => {
		const engineFiles = LEGACY_KOOTA_FILES.filter((f) => f.startsWith("src/engine/"));
		expect(engineFiles).toEqual([]);
	});

	it("LEGACY_SYSTEM_FILES does not include any src/engine/ paths", () => {
		const engineFiles = LEGACY_SYSTEM_FILES.filter((f) => f.startsWith("src/engine/"));
		expect(engineFiles).toEqual([]);
	});

	it("no legacy list file points into src/solid/", () => {
		const allLegacy = [...LEGACY_REACT_FILES, ...LEGACY_KOOTA_FILES, ...LEGACY_SYSTEM_FILES];
		const solidFiles = allLegacy.filter((f) => f.startsWith("src/solid/"));
		expect(solidFiles).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// Dependency list completeness
// ---------------------------------------------------------------------------

describe("Legacy Inventory: dependency list", () => {
	it("includes react and react-dom", () => {
		expect(LEGACY_DEPS).toContain("react");
		expect(LEGACY_DEPS).toContain("react-dom");
	});

	it("includes React type packages", () => {
		expect(LEGACY_DEPS).toContain("@types/react");
		expect(LEGACY_DEPS).toContain("@types/react-dom");
	});

	it("includes the React Vite plugin", () => {
		expect(LEGACY_DEPS).toContain("@vitejs/plugin-react");
	});

	it("includes React testing library", () => {
		expect(LEGACY_DEPS).toContain("@testing-library/react");
	});

	it("includes koota", () => {
		expect(LEGACY_DEPS).toContain("koota");
	});

	it("includes React UI libraries (radix, base-ui)", () => {
		expect(LEGACY_DEPS).toContain("@base-ui/react");
		expect(LEGACY_DEPS).toContain("@radix-ui/react-dialog");
		expect(LEGACY_DEPS).toContain("@radix-ui/react-slot");
		expect(LEGACY_DEPS).toContain("@radix-ui/react-tooltip");
	});

	it("includes shadcn utility packages", () => {
		expect(LEGACY_DEPS).toContain("class-variance-authority");
		expect(LEGACY_DEPS).toContain("clsx");
		expect(LEGACY_DEPS).toContain("tailwind-merge");
		expect(LEGACY_DEPS).toContain("shadcn");
	});

	it("has no empty strings", () => {
		expect(LEGACY_DEPS.filter((d) => d.trim() === "")).toEqual([]);
	});

	it("has no duplicates", () => {
		const unique = new Set(LEGACY_DEPS);
		expect(unique.size).toBe(LEGACY_DEPS.length);
	});
});

// ---------------------------------------------------------------------------
// List sanity checks
// ---------------------------------------------------------------------------

describe("Legacy Inventory: sanity", () => {
	it("LEGACY_REACT_FILES has substantial count", () => {
		expect(LEGACY_REACT_FILES.length).toBeGreaterThanOrEqual(40);
	});

	it("LEGACY_KOOTA_FILES has the expected Koota trait files", () => {
		expect(LEGACY_KOOTA_FILES.length).toBeGreaterThanOrEqual(15);
		const traitFiles = LEGACY_KOOTA_FILES.filter((f) => f.includes("traits/"));
		expect(traitFiles.length).toBeGreaterThanOrEqual(10);
	});

	it("LEGACY_SYSTEM_FILES covers all src/systems/ implementations", () => {
		expect(LEGACY_SYSTEM_FILES.length).toBeGreaterThanOrEqual(25);
		expect(LEGACY_SYSTEM_FILES.every((f) => f.startsWith("src/systems/"))).toBe(true);
	});

	it("LEGACY_DEPS has substantial count", () => {
		expect(LEGACY_DEPS.length).toBeGreaterThanOrEqual(10);
	});

	it("no file appears in multiple legacy lists", () => {
		const allFiles = [...LEGACY_REACT_FILES, ...LEGACY_KOOTA_FILES, ...LEGACY_SYSTEM_FILES];
		const unique = new Set(allFiles);
		expect(unique.size).toBe(allFiles.length);
	});
});
