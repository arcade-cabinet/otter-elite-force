/**
 * Procedural Assembly System
 *
 * DRY component-based system for:
 * - Structure generation (huts, platforms, towers)
 * - Settlement layout (villages, outposts, camps)
 * - Build mode (player base construction)
 * - Loadout assembly (modular weapons + equipment)
 *
 * KEY PRINCIPLES:
 * 1. Meshes defined ONCE in componentLibrary
 * 2. Materials swapped by faction
 * 3. Universal skeleton shared by all characters
 * 4. Weapons detached from characters
 * 5. Same components for player AND enemies
 */

// Build Mode
export {
	BUILDABLE_ITEMS,
	canAfford,
	createBuildModeState,
	createGhostMesh,
	deductCost,
	findNearestSnapPoint,
	getItemsByCategory,
	getUnlockedItems,
	type PlacedStructure,
	updateGhostColor,
	validatePlacement,
} from "./buildMode";
// Canteen / Loadout
export {
	ATTACHMENTS,
	assembleWeaponMesh,
	calculateWeaponStats,
	createDefaultLoadout,
	EQUIPMENT_DEFINITIONS,
	type EquipmentDefinition,
	generateShopInventory,
	purchaseItem,
	WEAPON_DEFINITIONS,
	type WeaponDefinition,
	type WeaponReceiverType,
} from "./canteenLoadout";
// Component Library (DRY meshes, materials, skeleton)
export {
	// Factories
	createGeometry,
	createMaterial,
	// Faction palettes
	FACTION_PALETTES,
	type Faction,
	type FactionPalette,
	instantiateMesh,
	type JointDef,
	type JointName,
	// Mesh library
	MESH_LIBRARY,
	type MeshDef,
	type MeshId,
	reskinnedMesh,
	// Universal skeleton
	UNIVERSAL_SKELETON,
} from "./componentLibrary";
// Settlement Assembler
export {
	assembleElevatedNetwork,
	assembleSettlement,
	SETTLEMENT_CONFIGS,
	type Settlement,
	type SettlementInhabitant,
	type SettlementStructure,
} from "./settlementAssembler";
// Structure Assembler
export {
	assembleHut,
	assemblePlatform,
	assemblePlatformNetwork,
	assembleWatchtower,
	DEFAULT_ASSEMBLY_CONFIG,
} from "./structureAssembler";

// Types
export type {
	AssemblyConfig,
	Attachment,
	AttachmentSlot,
	BuildableItem,
	BuildCategory,
	BuildModeState,
	CanteenItem,
	EquipmentSlot,
	InteractionPoint,
	Loadout,
	PathSegment,
	PlatformSection,
	SettlementConfig,
	SettlementType,
	SnapPoint,
	SnapRule,
	StructureArchetype,
	StructureComponent,
	StructureComponentType,
	StructureTemplate,
} from "./types";
