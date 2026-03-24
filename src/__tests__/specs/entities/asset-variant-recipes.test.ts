import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ASSET_GENERATOR_PRESETS } from "@/entities/asset-generator-presets";
import {
	ASSET_VARIANT_RECIPES,
	toAssetEntityKey,
	validateAssetGeneratorPresets,
} from "@/entities/asset-variant-recipes";

function readVariantRecipeManifest() {
	return JSON.parse(
		readFileSync(path.resolve(process.cwd(), "public/assets/asset-variant-recipes.json"), "utf8"),
	) as Array<{
		entityKey: string;
		familyId: string;
		referenceEntityId: string;
		palette: string;
		generatedVariants: Array<{
			variantId: string;
			generatedFrameKeys: string[];
		}>;
		promptRecipe: { entityName: string; variantDescriptors: string[] };
	}>;
}

function readAtlas(filePath: string) {
	return JSON.parse(readFileSync(path.resolve(process.cwd(), filePath), "utf8")) as {
		frames: Record<string, { sourceSize: { w: number; h: number } }>;
	};
}

describe("asset variant recipes", () => {
	it("has no preset validation issues for the current catalog", () => {
		expect(validateAssetGeneratorPresets()).toEqual([]);
	});

	it("creates one typed recipe per family member", () => {
		const expectedCount = ASSET_GENERATOR_PRESETS.reduce(
			(total, preset) => total + preset.memberIds.length,
			0,
		);

		expect(ASSET_VARIANT_RECIPES).toHaveLength(expectedCount);
		expect(
			ASSET_VARIANT_RECIPES.find(
				(recipe) => recipe.entityKey === toAssetEntityKey("hero", "sgt_bubbles"),
			),
		).toBeDefined();
		expect(
			ASSET_VARIANT_RECIPES.find(
				(recipe) => recipe.entityKey === toAssetEntityKey("portrait", "sgt_bubbles"),
			),
		).toBeDefined();
		expect(
			ASSET_VARIANT_RECIPES.find(
				(recipe) => recipe.entityKey === toAssetEntityKey("unit", "mudfoot"),
			)?.generatedVariants[0]?.generatedFrameKeys,
		).toContain("mudfoot__proc_hitflash");
	});

	it("preserves prompt recipes and variant descriptors in the build manifest", () => {
		const manifest = readVariantRecipeManifest();

		expect(manifest).toHaveLength(ASSET_VARIANT_RECIPES.length);

		const heroRecipe = manifest.find(
			(recipe) => recipe.entityKey === toAssetEntityKey("hero", "sgt_bubbles"),
		);
		expect(heroRecipe?.familyId).toBe("oef-command-hero-units");
		expect(heroRecipe?.promptRecipe.entityName.toUpperCase()).toContain("BUBBLES");
		expect(heroRecipe?.promptRecipe.variantDescriptors).toContain("hero");
		expect(heroRecipe?.generatedVariants[0]?.variantId).toBe("hitflash");

		const portraitRecipe = manifest.find(
			(recipe) => recipe.entityKey === toAssetEntityKey("portrait", "foxhound"),
		);
		expect(portraitRecipe?.familyId).toBe("briefing-network-portraits");
		expect(portraitRecipe?.promptRecipe.variantDescriptors).toContain("portrait");
	});

	it("writes generated hit-flash frames into the atlases", () => {
		const unitAtlas = readAtlas("public/assets/units/units_1x.json");
		const buildingAtlas = readAtlas("public/assets/buildings/buildings_1x.json");
		const { frames: unitFrames } = unitAtlas;
		const { frames: buildingFrames } = buildingAtlas;

		expect(unitFrames.mudfoot__proc_hitflash.sourceSize).toEqual({ w: 16, h: 16 });
		expect(unitFrames.mudfoot_attack_1__proc_hitflash.sourceSize).toEqual({
			w: 16,
			h: 16,
		});
		expect(buildingFrames.spawning_pool__proc_hitflash.sourceSize).toEqual({
			w: 32,
			h: 32,
		});
	});
});
