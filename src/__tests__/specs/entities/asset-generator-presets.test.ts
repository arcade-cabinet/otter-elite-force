import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ASSET_FAMILIES, type AssetFamilyEntityType } from "@/entities/asset-families";
import {
	ASSET_GENERATOR_PRESETS,
	getAssetGeneratorPreset,
} from "@/entities/asset-generator-presets";
import { ALL_BUILDINGS, ALL_HEROES, ALL_PORTRAITS, ALL_UNITS } from "@/entities/registry";
import { getCategoryDimensions } from "@/entities/sprite-materialization";
import type { SPDSLSprite, SpriteDef } from "@/entities/types";

function readPresetManifest() {
	return JSON.parse(
		readFileSync(path.resolve(process.cwd(), "public/assets/asset-generator-presets.json"), "utf8"),
	) as Array<{
		familyId: string;
		referenceEntityId: string;
		referencePalette: string;
		referenceContractId: string | null;
		qualityProfile: {
			requiredLayerIds: string[];
			requiredAnimations: string[];
			requireExactLayerOrder: boolean;
			requireProceduralTeamColors: boolean;
		};
	}>;
}

function isSPDSLSprite(sprite: SpriteDef | SPDSLSprite): sprite is SPDSLSprite {
	return "layers" in sprite && "palette" in sprite;
}

function getSprite(entityType: AssetFamilyEntityType, entityId: string): SPDSLSprite {
	const source =
		entityType === "unit"
			? ALL_UNITS[entityId]?.sprite
			: entityType === "hero"
				? ALL_HEROES[entityId]?.sprite
				: entityType === "building"
					? ALL_BUILDINGS[entityId]?.sprite
					: ALL_PORTRAITS[entityId]?.sprite;

	if (!source || !isSPDSLSprite(source)) {
		throw new Error(`Missing SP-DSL sprite for ${entityType}:${entityId}`);
	}

	return source;
}

describe("asset generator presets", () => {
	it("creates a preset for every asset family", () => {
		expect(ASSET_GENERATOR_PRESETS).toHaveLength(ASSET_FAMILIES.length);
		expect(getAssetGeneratorPreset("oef-command-hero-units")).toBeDefined();
		expect(getAssetGeneratorPreset("oef-specialist-hero-units")).toBeDefined();
	});

	it("keeps family members aligned to preset palettes and canonical output classes", () => {
		for (const preset of ASSET_GENERATOR_PRESETS) {
			expect(preset.canonicalDimensions).toEqual(getCategoryDimensions(preset.outputCategory));

			for (const memberId of preset.memberIds) {
				const sprite = getSprite(preset.entityType, memberId);
				expect(sprite.palette).toBe(preset.referencePalette);
			}
		}
	});

	it("anchors each reference sprite to its quality profile", () => {
		for (const preset of ASSET_GENERATOR_PRESETS) {
			const sprite = getSprite(preset.entityType, preset.referenceEntityId);
			const layerIds = sprite.layers.map((layer) => layer.id);
			const animationIds = Object.keys(sprite.animations ?? { idle: [{}] });

			if (preset.qualityProfile.requireExactLayerOrder) {
				expect(layerIds).toEqual(preset.qualityProfile.requiredLayerIds);
			} else {
				for (const layerId of preset.qualityProfile.requiredLayerIds) {
					expect(layerIds).toContain(layerId);
				}
			}

			for (const animationId of preset.qualityProfile.requiredAnimations) {
				expect(animationIds).toContain(animationId);
			}

			if (preset.qualityProfile.requireProceduralTeamColors) {
				expect(sprite.procedural?.teamColorLayers?.length ?? 0).toBeGreaterThan(0);
			}
		}
	});

	it("emits a preset manifest for the build pipeline", () => {
		const manifest = readPresetManifest();

		expect(manifest).toHaveLength(ASSET_GENERATOR_PRESETS.length);
		expect(
			manifest.find((preset) => preset.familyId === "oef-line-infantry")?.referenceContractId,
		).toBe("mudfoot");
		expect(
			manifest.find((preset) => preset.familyId === "oef-command-hero-units")?.qualityProfile
				.requiredAnimations,
		).toEqual(getAssetGeneratorPreset("oef-command-hero-units")?.qualityProfile.requiredAnimations);
		expect(
			manifest.find((preset) => preset.familyId === "scale-guard-predator-support")?.qualityProfile
				.requiredAnimations,
		).toEqual(
			getAssetGeneratorPreset("scale-guard-predator-support")?.qualityProfile.requiredAnimations,
		);
	});
});
