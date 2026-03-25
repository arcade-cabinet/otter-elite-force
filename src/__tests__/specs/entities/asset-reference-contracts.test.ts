import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	ASSET_REFERENCE_CONTRACTS,
	GOLDEN_REFERENCE_ENTITY_IDS,
	getAssetReferenceContract,
} from "@/entities/asset-contracts";
import { ALL_BUILDINGS, ALL_PORTRAITS, ALL_UNITS } from "@/entities/registry";

function readContractManifest() {
	return JSON.parse(
		readFileSync(path.resolve(process.cwd(), "public/assets/asset-contracts.json"), "utf8"),
	) as Array<{
		entityId: string;
		outputCategory: "units" | "buildings" | "portraits";
		palette: string | null;
		primaryFrameKey: string;
		canonicalDimensions: { width: number; height: number; size: number };
	}>;
}

describe("asset reference contracts", () => {
	it("defines the golden slice expected by Phase 3", () => {
		expect(GOLDEN_REFERENCE_ENTITY_IDS).toEqual([
			"mudfoot",
			"gator",
			"barracks",
			"spawning_pool",
			"sgt_bubbles",
		]);
		expect(ASSET_REFERENCE_CONTRACTS).toHaveLength(5);
	});

	it("maps every contract to a real entity in the canonical registries", () => {
		for (const contract of ASSET_REFERENCE_CONTRACTS) {
			if (contract.entityType === "unit") {
				const entity = ALL_UNITS[contract.entityId];
				expect(entity).toBeDefined();
				expect(entity.faction).toBe(contract.faction);
				continue;
			}

			if (contract.entityType === "building") {
				const entity = ALL_BUILDINGS[contract.entityId];
				expect(entity).toBeDefined();
				expect(entity.faction).toBe(contract.faction);
				continue;
			}

			const entity = ALL_PORTRAITS[contract.entityId];
			expect(entity).toBeDefined();
			expect(getAssetReferenceContract(contract.entityId)?.outputCategory).toBe("portraits");
		}
	});

	it("emits a build manifest with canonical dimensions and frame keys", () => {
		const manifest = readContractManifest();

		for (const entityId of GOLDEN_REFERENCE_ENTITY_IDS) {
			const entry = manifest.find((item) => item.entityId === entityId);
			expect(entry).toBeDefined();
			expect(entry?.primaryFrameKey).toBe(entityId);
		}

		expect(manifest.find((item) => item.entityId === "mudfoot")?.canonicalDimensions).toEqual({
			width: 16,
			height: 16,
			size: 16,
		});
		expect(manifest.find((item) => item.entityId === "barracks")?.canonicalDimensions).toEqual({
			width: 32,
			height: 32,
			size: 32,
		});
		expect(manifest.find((item) => item.entityId === "sgt_bubbles")?.canonicalDimensions).toEqual({
			width: 64,
			height: 96,
			size: 64,
		});
	});
});
