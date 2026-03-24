import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GOLDEN_REFERENCE_ENTITY_IDS } from "@/entities/asset-contracts";
import { ASSET_FAMILIES, getAssetFamilyForEntity } from "@/entities/asset-families";
import { ALL_BUILDINGS, ALL_HEROES, ALL_PORTRAITS, ALL_UNITS } from "@/entities/registry";

function readFamilyManifest() {
	return JSON.parse(
		readFileSync(path.resolve(process.cwd(), "public/assets/asset-families.json"), "utf8"),
	) as Array<{
		familyId: string;
		referenceEntityId: string;
		referenceContractId: string | null;
		memberIds: string[];
		outputCategory: "units" | "buildings" | "portraits";
		canonicalDimensions: { width: number; height: number; size: number };
	}>;
}

describe("asset family coverage", () => {
	it("covers every canonical unit, hero, building, and portrait exactly once", () => {
		const ids = [
			...Object.keys(ALL_UNITS).map((id) => ["unit", id] as const),
			...Object.keys(ALL_HEROES).map((id) => ["hero", id] as const),
			...Object.keys(ALL_BUILDINGS).map((id) => ["building", id] as const),
			...Object.keys(ALL_PORTRAITS).map((id) => ["portrait", id] as const),
		];
		const seen = new Set<string>();

		for (const [entityType, id] of ids) {
			const key = `${entityType}:${id}`;
			const family = getAssetFamilyForEntity(entityType, id);
			expect(family).toBeDefined();
			expect(seen.has(key)).toBe(false);
			seen.add(key);
		}

		expect(seen.size).toBe(ids.length);
	});

	it("keeps golden references anchored inside canonical families", () => {
		const typedGoldenReferences = [
			["unit", "mudfoot"],
			["unit", "gator"],
			["building", "barracks"],
			["building", "spawning_pool"],
			["portrait", "sgt_bubbles"],
		] as const satisfies ReadonlyArray<readonly ["unit" | "building" | "portrait", string]>;

		expect(typedGoldenReferences.map(([, entityId]) => entityId)).toEqual(
			GOLDEN_REFERENCE_ENTITY_IDS,
		);

		for (const [entityType, entityId] of typedGoldenReferences) {
			const family = getAssetFamilyForEntity(entityType, entityId);
			expect(family).toBeDefined();
			expect(family?.memberIds).toContain(entityId);
		}
	});

	it("emits a family manifest with canonical dimensions and reference linkage", () => {
		const manifest = readFamilyManifest();

		expect(manifest).toHaveLength(ASSET_FAMILIES.length);
		expect(
			manifest.find((family) => family.familyId === "oef-line-infantry")?.referenceContractId,
		).toBe("mudfoot");
		expect(
			manifest.find((family) => family.familyId === "oef-command-production")?.canonicalDimensions,
		).toEqual({ width: 32, height: 32, size: 32 });
		expect(
			manifest.find((family) => family.familyId === "oef-command-portraits")?.canonicalDimensions,
		).toEqual({ width: 64, height: 96, size: 64 });
	});
});
