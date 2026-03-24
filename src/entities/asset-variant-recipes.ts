import type { AssetFamilyEntityType } from "./asset-families";
import { ASSET_GENERATOR_PRESETS, type AssetGeneratorPreset } from "./asset-generator-presets";
import { ALL_BUILDINGS, ALL_HEROES, ALL_PORTRAITS, ALL_UNITS } from "./registry";
import type { BuildingDef, HeroDef, PortraitDef, SPDSLSprite, SpriteDef, UnitDef } from "./types";

type AssetEntityDef = UnitDef | HeroDef | BuildingDef | PortraitDef;

export interface AssetVariantRecipe {
	entityKey: string;
	entityId: string;
	entityType: AssetFamilyEntityType;
	entityName: string;
	familyId: string;
	archetypeId: string;
	outputCategory: AssetGeneratorPreset["outputCategory"];
	faction: AssetGeneratorPreset["faction"];
	referenceEntityId: string;
	referenceContractId: string | null;
	palette: string;
	layerIds: string[];
	animationIds: string[];
	sourceFrameKeys: string[];
	teamColorLayerIds: string[];
	canonicalDimensions: AssetGeneratorPreset["canonicalDimensions"];
	variantDescriptors: string[];
	generatedVariants: GeneratedAssetVariant[];
	promptRecipe: AssetGeneratorPreset["promptRecipe"] & {
		entityName: string;
		variantDescriptors: string[];
	};
}

export interface GeneratedAssetVariant {
	variantId: "hitflash";
	variantKind: "hitflash";
	frameSuffix: "__proc_hitflash";
	overlayColor: string;
	sourceFrameKeys: string[];
	generatedFrameKeys: string[];
}

export interface AssetValidationIssue {
	entityKey: string;
	familyId: string;
	message: string;
}

function isSPDSLSprite(sprite: SpriteDef | SPDSLSprite): sprite is SPDSLSprite {
	return "layers" in sprite && "palette" in sprite;
}

export function toAssetEntityKey(entityType: AssetFamilyEntityType, entityId: string): string {
	return `${entityType}:${entityId}`;
}

export function getAssetEntityDefinition(
	entityType: AssetFamilyEntityType,
	entityId: string,
): AssetEntityDef | undefined {
	return entityType === "unit"
		? ALL_UNITS[entityId]
		: entityType === "hero"
			? ALL_HEROES[entityId]
			: entityType === "building"
				? ALL_BUILDINGS[entityId]
				: ALL_PORTRAITS[entityId];
}

export function getAssetEntitySprite(
	entityType: AssetFamilyEntityType,
	entityId: string,
): SPDSLSprite {
	const entity = getAssetEntityDefinition(entityType, entityId);
	if (!entity || !isSPDSLSprite(entity.sprite)) {
		throw new Error(`Expected SP-DSL asset for ${entityType}:${entityId}`);
	}
	return entity.sprite;
}

function getVariantDescriptors(
	entityType: AssetFamilyEntityType,
	entity: AssetEntityDef,
): string[] {
	if (entityType === "portrait") {
		const portrait = entity as PortraitDef;
		return [portrait.dialogueColor, "portrait"];
	}

	if (entityType === "building") {
		const building = entity as BuildingDef;
		return [building.category, ...building.tags];
	}

	const unit = entity as UnitDef | HeroDef;
	const heroDescriptors = entityType === "hero" ? ["hero", (unit as HeroDef).unlockMission] : [];
	return [unit.category, ...unit.tags, ...heroDescriptors].filter(Boolean);
}

export function buildSourceFrameKeys(entityId: string, sprite: SPDSLSprite): string[] {
	const frameKeys = [entityId];

	for (const [animationId, frames] of Object.entries(sprite.animations ?? {})) {
		for (let index = 0; index < frames.length; index++) {
			frameKeys.push(`${entityId}_${animationId}_${index}`);
		}
	}

	return Array.from(new Set(frameKeys));
}

function resolveHitFlashColor(faction: AssetGeneratorPreset["faction"]) {
	if (faction === "scale_guard") return "#fb923c";
	if (faction === "ura") return "#fef08a";
	return "#f8fafc";
}

export function buildAssetVariantRecipes(): AssetVariantRecipe[] {
	return ASSET_GENERATOR_PRESETS.flatMap((preset) =>
		preset.memberIds.map((entityId) => {
			const entity = getAssetEntityDefinition(preset.entityType, entityId);
			if (!entity) {
				throw new Error(`Missing entity definition for ${preset.entityType}:${entityId}`);
			}

			const sprite = getAssetEntitySprite(preset.entityType, entityId);
			const variantDescriptors = getVariantDescriptors(preset.entityType, entity);
			const sourceFrameKeys = buildSourceFrameKeys(entityId, sprite);
			const generatedVariants: GeneratedAssetVariant[] = sprite.procedural?.hitFlash
				? [
						{
							variantId: "hitflash",
							variantKind: "hitflash",
							frameSuffix: "__proc_hitflash",
							overlayColor: resolveHitFlashColor(preset.faction),
							sourceFrameKeys,
							generatedFrameKeys: sourceFrameKeys.map((frameKey) => `${frameKey}__proc_hitflash`),
						},
					]
				: [];

			return {
				entityKey: toAssetEntityKey(preset.entityType, entityId),
				entityId,
				entityType: preset.entityType,
				entityName: entity.name,
				familyId: preset.familyId,
				archetypeId: preset.archetypeId,
				outputCategory: preset.outputCategory,
				faction: preset.faction,
				referenceEntityId: preset.referenceEntityId,
				referenceContractId: preset.referenceContractId,
				palette: sprite.palette,
				layerIds: sprite.layers.map((layer) => layer.id),
				animationIds: Object.keys(sprite.animations ?? { idle: [{}] }),
				sourceFrameKeys,
				teamColorLayerIds: sprite.procedural?.teamColorLayers ?? [],
				canonicalDimensions: preset.canonicalDimensions,
				variantDescriptors,
				generatedVariants,
				promptRecipe: {
					...preset.promptRecipe,
					entityName: entity.name,
					variantDescriptors,
				},
			} satisfies AssetVariantRecipe;
		}),
	);
}

export function validateAssetGeneratorPresets(): AssetValidationIssue[] {
	const issues: AssetValidationIssue[] = [];

	for (const preset of ASSET_GENERATOR_PRESETS) {
		for (const entityId of preset.memberIds) {
			const sprite = getAssetEntitySprite(preset.entityType, entityId);
			const entityKey = toAssetEntityKey(preset.entityType, entityId);
			const layerIds = sprite.layers.map((layer) => layer.id);
			const animationIds = Object.keys(sprite.animations ?? { idle: [{}] });

			if (
				preset.qualityProfile.requireSharedPalette &&
				sprite.palette !== preset.referencePalette
			) {
				issues.push({
					entityKey,
					familyId: preset.familyId,
					message: `Expected palette ${preset.referencePalette} but found ${sprite.palette}`,
				});
			}

			if (preset.qualityProfile.requireExactLayerOrder) {
				if (JSON.stringify(layerIds) !== JSON.stringify(preset.qualityProfile.requiredLayerIds)) {
					issues.push({
						entityKey,
						familyId: preset.familyId,
						message: `Expected exact layer order ${preset.qualityProfile.requiredLayerIds.join(", ")}`,
					});
				}
			} else {
				for (const requiredLayerId of preset.qualityProfile.requiredLayerIds) {
					if (!layerIds.includes(requiredLayerId)) {
						issues.push({
							entityKey,
							familyId: preset.familyId,
							message: `Missing required layer ${requiredLayerId}`,
						});
					}
				}
			}

			for (const requiredAnimation of preset.qualityProfile.requiredAnimations) {
				if (!animationIds.includes(requiredAnimation)) {
					issues.push({
						entityKey,
						familyId: preset.familyId,
						message: `Missing required animation ${requiredAnimation}`,
					});
				}
			}

			if (
				preset.qualityProfile.requireProceduralTeamColors &&
				(sprite.procedural?.teamColorLayers?.length ?? 0) === 0
			) {
				issues.push({
					entityKey,
					familyId: preset.familyId,
					message: "Expected procedural team color layers",
				});
			}
		}
	}

	return issues;
}

export function assertAssetGeneratorPresetsValid() {
	const issues = validateAssetGeneratorPresets();
	if (issues.length > 0) {
		throw new Error(
			[
				`Asset generator preset validation failed with ${issues.length} issue(s):`,
				...issues.map((issue) => `- ${issue.entityKey} [${issue.familyId}] ${issue.message}`),
			].join("\n"),
		);
	}
	return issues;
}

export const ASSET_VARIANT_RECIPES = buildAssetVariantRecipes();
