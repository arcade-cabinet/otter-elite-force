/**
 * ECS Data - Entity Templates and Definitions
 *
 * This module contains all entity templates that can be spawned into the ECS world.
 * These replace the old constants-based approach with proper ECS-centric definitions.
 */

// Buildable structure templates and queries
export {
	BUILDABLE_TEMPLATES,
	type BuildableTemplate,
	type CalculatedSnapPoint,
	canAffordBuildable,
	deductBuildableCost,
	getBuildablesByCategory,
	getBuildableTemplate,
	getSnapPointsForTemplate,
	getUnlockedBuildables,
	type ResourceCost,
	type SnapRule,
} from "./buildableTemplates";

// Slot definitions (single source of truth for all slot types)
export {
	// Attachment slots
	ATTACHMENT_SLOT_DEFS,
	ATTACHMENT_SLOTS,
	type AttachmentSlot,
	type AttachmentSlotDef,
	// Build categories
	BUILD_CATEGORIES,
	BUILD_CATEGORY_DEFS,
	type BuildCategory,
	type BuildCategoryDef,
	canWeaponFitSlot,
	// Equipment slots
	EQUIPMENT_SLOT_DEFS,
	EQUIPMENT_SLOTS,
	type EquipmentSlot,
	type EquipmentSlotDef,
	// Gadget types
	GADGET_TYPE_DEFS,
	GADGET_TYPES,
	type GadgetType,
	type GadgetTypeDef,
	getAttachmentSlotDef,
	getBuildCategoryDef,
	getDefaultSlotForWeapon,
	getEquipmentSlotDef,
	getGadgetTypeDef,
	getWeaponCategoryDef,
	// Shop categories
	SHOP_CATEGORIES,
	SHOP_CATEGORY_DEFS,
	type ShopCategory,
	type ShopCategoryDef,
	// Weapon categories
	WEAPON_CATEGORIES,
	WEAPON_CATEGORY_DEFS,
	type WeaponCategory,
	type WeaponCategoryDef,
} from "./slots";

// Weapon templates and queries
export {
	ATTACHMENT_TEMPLATES,
	type AttachmentTemplate,
	calculateFinalStats,
	EQUIPMENT_TEMPLATES,
	type EquipmentTemplate,
	getAttachmentTemplate,
	getCompatibleAttachments,
	getEquipmentTemplate,
	getUnlockedWeapons,
	getWeaponTemplate,
	WEAPON_TEMPLATES,
	type WeaponStats,
	type WeaponTemplate,
} from "./weaponTemplates";
