import { getAssetReferenceContract } from "./asset-contracts";
import {
	ASSET_FAMILIES,
	type AssetFamilyDefinition,
	type AssetFamilyEntityType,
} from "./asset-families";
import { ALL_BUILDINGS, ALL_HEROES, ALL_PORTRAITS, ALL_UNITS } from "./registry";
import { getCategoryDimensions } from "./sprite-materialization";
import type { SPDSLSprite, SpriteDef } from "./types";

export type AssetPaletteStrategy = "shared-family-palette";

export interface AssetQualityProfile {
	requiredLayerIds: string[];
	requiredAnimations: string[];
	requireExactLayerOrder: boolean;
	requireProceduralTeamColors: boolean;
	requireSharedPalette: boolean;
}

export interface AssetGeneratorPreset {
	familyId: string;
	archetypeId: string;
	lane: AssetFamilyDefinition["lane"];
	entityType: AssetFamilyEntityType;
	outputCategory: AssetFamilyDefinition["outputCategory"];
	faction: AssetFamilyDefinition["faction"];
	referenceEntityId: string;
	referenceContractId: string | null;
	memberIds: string[];
	canonicalDimensions: { width: number; height: number; size: number };
	paletteStrategy: AssetPaletteStrategy;
	referencePalette: string;
	promptRecipe: {
		roleIntent: string;
		visualIntent: string;
		silhouette: string;
		materialCues: string[];
		semanticAxes: string[];
	};
	qualityProfile: AssetQualityProfile;
}

function isSPDSLSprite(sprite: SpriteDef | SPDSLSprite): sprite is SPDSLSprite {
	return "layers" in sprite && "palette" in sprite;
}

function getEntitySprite(entityType: AssetFamilyEntityType, entityId: string): SPDSLSprite {
	const source =
		entityType === "unit"
			? ALL_UNITS[entityId]?.sprite
			: entityType === "hero"
				? ALL_HEROES[entityId]?.sprite
				: entityType === "building"
					? ALL_BUILDINGS[entityId]?.sprite
					: ALL_PORTRAITS[entityId]?.sprite;

	if (!source || !isSPDSLSprite(source)) {
		throw new Error(`Asset generator presets require SP-DSL sprites for ${entityType}:${entityId}`);
	}

	return source;
}

function intersectArrays(values: string[][]) {
	if (values.length === 0) {
		return [];
	}

	const [head, ...rest] = values;
	return head.filter((value) => rest.every((list) => list.includes(value)));
}

function resolveQualityProfile(
	family: AssetFamilyDefinition,
	referenceSprite: SPDSLSprite,
): AssetQualityProfile {
	const familySprites = family.memberIds.map((memberId) =>
		getEntitySprite(family.entityType, memberId),
	);
	const sharedLayerIds = intersectArrays(
		familySprites.map((sprite) => sprite.layers.map((layer) => layer.id)),
	);
	const sharedAnimations = intersectArrays(
		familySprites.map((sprite) => Object.keys(sprite.animations ?? { idle: [{}] })),
	);
	const requireTeamColors = familySprites.every(
		(sprite) => (sprite.procedural?.teamColorLayers?.length ?? 0) > 0,
	);

	if (family.outputCategory === "portraits") {
		return {
			requiredLayerIds: referenceSprite.layers.map((layer) => layer.id),
			requiredAnimations: Object.keys(referenceSprite.animations ?? { idle: [{}] }),
			requireExactLayerOrder: true,
			requireProceduralTeamColors: false,
			requireSharedPalette: true,
		};
	}

	if (family.outputCategory === "buildings") {
		return {
			requiredLayerIds: sharedLayerIds,
			requiredAnimations: sharedAnimations,
			requireExactLayerOrder: false,
			requireProceduralTeamColors: false,
			requireSharedPalette: true,
		};
	}

	return {
		requiredLayerIds: sharedLayerIds,
		requiredAnimations: sharedAnimations,
		requireExactLayerOrder: false,
		requireProceduralTeamColors: requireTeamColors,
		requireSharedPalette: true,
	};
}

export const ASSET_GENERATOR_PRESETS = ASSET_FAMILIES.map((family) => {
	const referenceSprite = getEntitySprite(family.entityType, family.referenceEntityId);
	const contract = getAssetReferenceContract(family.referenceEntityId);

	return {
		familyId: family.familyId,
		archetypeId: family.archetypeId,
		lane: family.lane,
		entityType: family.entityType,
		outputCategory: family.outputCategory,
		faction: family.faction,
		referenceEntityId: family.referenceEntityId,
		referenceContractId: contract?.entityId ?? null,
		memberIds: family.memberIds,
		canonicalDimensions: getCategoryDimensions(family.outputCategory),
		paletteStrategy: "shared-family-palette",
		referencePalette: referenceSprite.palette,
		promptRecipe: {
			roleIntent: family.roleIntent,
			visualIntent: contract?.visualIntent ?? family.roleIntent,
			silhouette: contract?.silhouette ?? family.generatorHints.silhouette,
			materialCues: Array.from(
				new Set([...(contract?.materialCues ?? []), ...family.generatorHints.materialCues]),
			),
			semanticAxes: family.generatorHints.semanticAxes,
		},
		qualityProfile: resolveQualityProfile(family, referenceSprite),
	} satisfies AssetGeneratorPreset;
});

export const ASSET_GENERATOR_PRESET_BY_FAMILY_ID = Object.fromEntries(
	ASSET_GENERATOR_PRESETS.map((preset) => [preset.familyId, preset]),
) as Record<string, AssetGeneratorPreset>;

export function getAssetGeneratorPreset(familyId: string): AssetGeneratorPreset | undefined {
	return ASSET_GENERATOR_PRESET_BY_FAMILY_ID[familyId];
}
