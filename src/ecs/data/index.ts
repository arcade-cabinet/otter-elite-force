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
