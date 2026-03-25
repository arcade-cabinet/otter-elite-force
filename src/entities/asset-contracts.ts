import type { SpriteCategory } from "./sprite-materialization";

export type AssetLane = "gameplay-sprite" | "premium-portrait";
export type AssetEntityType = "unit" | "building" | "portrait";
export type AssetBenchmarkRole = "golden-reference";
export type ContractOutputCategory = Extract<SpriteCategory, "units" | "buildings" | "portraits">;

export interface AssetReferenceContract {
	entityId: string;
	lane: AssetLane;
	entityType: AssetEntityType;
	outputCategory: ContractOutputCategory;
	faction: "ura" | "scale_guard" | "neutral";
	archetypeId: string;
	referenceClass: string;
	benchmarkRole: AssetBenchmarkRole;
	visualIntent: string;
	silhouette: string;
	materialCues: string[];
	qualityGateTags: string[];
}

export const GOLDEN_REFERENCE_ASSET_CONTRACTS = [
	{
		entityId: "mudfoot",
		lane: "gameplay-sprite",
		entityType: "unit",
		outputCategory: "units",
		faction: "ura",
		archetypeId: "oef_line_infantry_otter",
		referenceClass: "golden/oef-line-infantry",
		benchmarkRole: "golden-reference",
		visualIntent:
			"Baseline Otter Elite Force rifle infantry silhouette for readable 16px RTS combat.",
		silhouette: "compact rifle infantry with forward-ready stance",
		materialCues: ["brown fur", "blue field uniform", "dark rifle metal"],
		qualityGateTags: ["unit-readable", "oef-identity", "combat-baseline"],
	},
	{
		entityId: "gator",
		lane: "gameplay-sprite",
		entityType: "unit",
		outputCategory: "units",
		faction: "scale_guard",
		archetypeId: "scale_guard_brute_infantry",
		referenceClass: "golden/scale-guard-brute-infantry",
		benchmarkRole: "golden-reference",
		visualIntent:
			"Baseline Scale-Guard front-line bruiser with unmistakable reptile mass and threat read.",
		silhouette: "broad-shouldered melee brute with heavy head mass",
		materialCues: ["croc hide", "red wargear", "claw-forward attack pose"],
		qualityGateTags: ["unit-readable", "scale-guard-identity", "melee-brute"],
	},
	{
		entityId: "barracks",
		lane: "gameplay-sprite",
		entityType: "building",
		outputCategory: "buildings",
		faction: "ura",
		archetypeId: "oef_forward_barracks",
		referenceClass: "golden/oef-production-structure",
		benchmarkRole: "golden-reference",
		visualIntent:
			"Baseline OEF production building with believable military roofline, shadow, and grounded mass.",
		silhouette: "fortified square barracks with roof and entry read",
		materialCues: ["stone shell", "wood door", "blue command accents"],
		qualityGateTags: ["building-readable", "oef-identity", "production-structure"],
	},
	{
		entityId: "spawning_pool",
		lane: "gameplay-sprite",
		entityType: "building",
		outputCategory: "buildings",
		faction: "scale_guard",
		archetypeId: "scale_guard_spawning_pool",
		referenceClass: "golden/scale-guard-production-structure",
		benchmarkRole: "golden-reference",
		visualIntent:
			"Baseline Scale-Guard production structure with organic menace and strong faction separation from OEF buildings.",
		silhouette: "organic pool structure with thick roof and hostile footprint",
		materialCues: ["croc-stone shell", "red-orange cresting", "murky brood basin"],
		qualityGateTags: ["building-readable", "scale-guard-identity", "production-structure"],
	},
	{
		entityId: "sgt_bubbles",
		lane: "premium-portrait",
		entityType: "portrait",
		outputCategory: "portraits",
		faction: "ura",
		archetypeId: "oef_hero_command_portrait",
		referenceClass: "golden/oef-hero-portrait",
		benchmarkRole: "golden-reference",
		visualIntent:
			"Hero portrait benchmark for painted-briefing tone, expression, and material separation.",
		silhouette: "hero bust with bandana, broad jaw, and command presence",
		materialCues: ["battle-worn fur", "red bandana", "military kit highlights"],
		qualityGateTags: ["portrait-premium", "hero-read", "briefing-tone"],
	},
] as const satisfies readonly AssetReferenceContract[];

export const ASSET_REFERENCE_CONTRACTS = GOLDEN_REFERENCE_ASSET_CONTRACTS;

export const ASSET_REFERENCE_CONTRACTS_BY_ID = Object.fromEntries(
	ASSET_REFERENCE_CONTRACTS.map((contract) => [contract.entityId, contract]),
) as Record<string, AssetReferenceContract>;

export const GOLDEN_REFERENCE_ENTITY_IDS = ASSET_REFERENCE_CONTRACTS.map(
	(contract) => contract.entityId,
);

export function getAssetReferenceContract(entityId: string): AssetReferenceContract | undefined {
	return ASSET_REFERENCE_CONTRACTS_BY_ID[entityId];
}
