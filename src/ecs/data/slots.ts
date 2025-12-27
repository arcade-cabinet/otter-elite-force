/**
 * ECS Slot Definitions
 *
 * Single source of truth for all slot types in the game.
 * These are used by:
 * - Equipment system (character loadout)
 * - Weapon attachments
 * - Build mode categories
 * - Canteen shop categories
 */

// =============================================================================
// EQUIPMENT SLOTS (Character Loadout)
// =============================================================================

/**
 * All equipment slots a character can have
 */
export const EQUIPMENT_SLOTS = [
	"PRIMARY_WEAPON",
	"SECONDARY_WEAPON",
	"HEADGEAR",
	"VEST",
	"BACKPACK",
	"GADGET_1",
	"GADGET_2",
] as const;

export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];

/**
 * Equipment slot metadata
 */
export interface EquipmentSlotDef {
	id: EquipmentSlot;
	name: string;
	description: string;
	maxItems: number;
	acceptsCategories: string[];
}

export const EQUIPMENT_SLOT_DEFS: EquipmentSlotDef[] = [
	{
		id: "PRIMARY_WEAPON",
		name: "Primary Weapon",
		description: "Main combat weapon",
		maxItems: 1,
		acceptsCategories: ["RIFLE", "SHOTGUN", "SMG", "LMG", "LAUNCHER"],
	},
	{
		id: "SECONDARY_WEAPON",
		name: "Secondary Weapon",
		description: "Backup sidearm",
		maxItems: 1,
		acceptsCategories: ["PISTOL"],
	},
	{
		id: "HEADGEAR",
		name: "Headgear",
		description: "Head protection and visibility",
		maxItems: 1,
		acceptsCategories: ["HELMET", "BERET", "BANDANA"],
	},
	{
		id: "VEST",
		name: "Tactical Vest",
		description: "Body armor and ammo storage",
		maxItems: 1,
		acceptsCategories: ["VEST"],
	},
	{
		id: "BACKPACK",
		name: "Backpack",
		description: "Supply and equipment storage",
		maxItems: 1,
		acceptsCategories: ["BACKPACK"],
	},
	{
		id: "GADGET_1",
		name: "Gadget Slot 1",
		description: "Tactical equipment",
		maxItems: 1,
		acceptsCategories: ["GRENADE", "MINE", "FLARE", "MEDKIT", "RADIO"],
	},
	{
		id: "GADGET_2",
		name: "Gadget Slot 2",
		description: "Secondary tactical equipment",
		maxItems: 1,
		acceptsCategories: ["GRENADE", "MINE", "FLARE", "MEDKIT", "RADIO"],
	},
];

// =============================================================================
// WEAPON ATTACHMENT SLOTS
// =============================================================================

/**
 * All attachment slots a weapon can have
 */
export const ATTACHMENT_SLOTS = [
	"OPTIC",
	"BARREL",
	"GRIP",
	"MAGAZINE",
	"STOCK",
	"UNDERBARREL",
] as const;

export type AttachmentSlot = (typeof ATTACHMENT_SLOTS)[number];

/**
 * Attachment slot metadata
 */
export interface AttachmentSlotDef {
	id: AttachmentSlot;
	name: string;
	description: string;
	position: { x: number; y: number; z: number }; // Relative to receiver
}

export const ATTACHMENT_SLOT_DEFS: AttachmentSlotDef[] = [
	{
		id: "OPTIC",
		name: "Optic",
		description: "Sights and scopes",
		position: { x: 0, y: 0.04, z: 0 },
	},
	{
		id: "BARREL",
		name: "Barrel",
		description: "Barrel attachments (suppressor, compensator)",
		position: { x: 0, y: 0.02, z: 0.15 },
	},
	{
		id: "GRIP",
		name: "Grip",
		description: "Handle modifications",
		position: { x: 0, y: -0.04, z: -0.02 },
	},
	{
		id: "MAGAZINE",
		name: "Magazine",
		description: "Ammo capacity modifications",
		position: { x: 0, y: -0.05, z: 0 },
	},
	{
		id: "STOCK",
		name: "Stock",
		description: "Recoil control and stability",
		position: { x: 0, y: 0, z: -0.12 },
	},
	{
		id: "UNDERBARREL",
		name: "Underbarrel",
		description: "Foregrips and launchers",
		position: { x: 0, y: -0.03, z: 0.05 },
	},
];

// =============================================================================
// WEAPON CATEGORIES
// =============================================================================

/**
 * All weapon categories
 */
export const WEAPON_CATEGORIES = ["PISTOL", "RIFLE", "SHOTGUN", "SMG", "LMG", "LAUNCHER"] as const;

export type WeaponCategory = (typeof WEAPON_CATEGORIES)[number];

/**
 * Weapon category metadata
 */
export interface WeaponCategoryDef {
	id: WeaponCategory;
	name: string;
	description: string;
	defaultSlot: EquipmentSlot;
}

export const WEAPON_CATEGORY_DEFS: WeaponCategoryDef[] = [
	{
		id: "PISTOL",
		name: "Pistol",
		description: "Compact sidearms",
		defaultSlot: "SECONDARY_WEAPON",
	},
	{
		id: "RIFLE",
		name: "Rifle",
		description: "Versatile primary weapons",
		defaultSlot: "PRIMARY_WEAPON",
	},
	{
		id: "SHOTGUN",
		name: "Shotgun",
		description: "Close-range devastation",
		defaultSlot: "PRIMARY_WEAPON",
	},
	{
		id: "SMG",
		name: "SMG",
		description: "High rate of fire",
		defaultSlot: "PRIMARY_WEAPON",
	},
	{
		id: "LMG",
		name: "LMG",
		description: "Suppression and sustained fire",
		defaultSlot: "PRIMARY_WEAPON",
	},
	{
		id: "LAUNCHER",
		name: "Launcher",
		description: "Explosive ordnance",
		defaultSlot: "PRIMARY_WEAPON",
	},
];

// =============================================================================
// BUILD CATEGORIES
// =============================================================================

/**
 * All build mode categories
 */
export const BUILD_CATEGORIES = [
	"FOUNDATION",
	"WALLS",
	"ROOF",
	"DEFENSE",
	"UTILITY",
	"COMFORT",
] as const;

export type BuildCategory = (typeof BUILD_CATEGORIES)[number];

/**
 * Build category metadata
 */
export interface BuildCategoryDef {
	id: BuildCategory;
	name: string;
	description: string;
	icon: string;
}

export const BUILD_CATEGORY_DEFS: BuildCategoryDef[] = [
	{
		id: "FOUNDATION",
		name: "Foundation",
		description: "Floors, stilts, and base structures",
		icon: "🏗️",
	},
	{
		id: "WALLS",
		name: "Walls",
		description: "Wall sections and openings",
		icon: "🧱",
	},
	{
		id: "ROOF",
		name: "Roof",
		description: "Roof pieces and cover",
		icon: "🏠",
	},
	{
		id: "DEFENSE",
		name: "Defense",
		description: "Barricades, railings, and fortifications",
		icon: "🛡️",
	},
	{
		id: "UTILITY",
		name: "Utility",
		description: "Storage and crafting stations",
		icon: "📦",
	},
	{
		id: "COMFORT",
		name: "Comfort",
		description: "Lighting and decorations",
		icon: "💡",
	},
];

// =============================================================================
// SHOP CATEGORIES
// =============================================================================

/**
 * All canteen shop categories
 */
export const SHOP_CATEGORIES = ["WEAPON", "ATTACHMENT", "GEAR", "UPGRADE", "CONSUMABLE"] as const;

export type ShopCategory = (typeof SHOP_CATEGORIES)[number];

/**
 * Shop category metadata
 */
export interface ShopCategoryDef {
	id: ShopCategory;
	name: string;
	description: string;
}

export const SHOP_CATEGORY_DEFS: ShopCategoryDef[] = [
	{
		id: "WEAPON",
		name: "Weapons",
		description: "Primary and secondary weapons",
	},
	{
		id: "ATTACHMENT",
		name: "Attachments",
		description: "Weapon modifications",
	},
	{
		id: "GEAR",
		name: "Gear",
		description: "Equipment and armor",
	},
	{
		id: "UPGRADE",
		name: "Upgrades",
		description: "Permanent character upgrades",
	},
	{
		id: "CONSUMABLE",
		name: "Consumables",
		description: "Single-use items",
	},
];

// =============================================================================
// GADGET TYPES
// =============================================================================

/**
 * All gadget types that can go in gadget slots
 */
export const GADGET_TYPES = [
	"GRENADE",
	"MINE",
	"FLARE",
	"MEDKIT",
	"RADIO",
	"CLAYMORE_CLAM",
] as const;

export type GadgetType = (typeof GADGET_TYPES)[number];

/**
 * Gadget type metadata
 */
export interface GadgetTypeDef {
	id: GadgetType;
	name: string;
	description: string;
	maxCarry: number;
	cooldown: number;
}

export const GADGET_TYPE_DEFS: GadgetTypeDef[] = [
	{
		id: "GRENADE",
		name: "Frag Grenade",
		description: "Explosive thrown weapon",
		maxCarry: 4,
		cooldown: 0,
	},
	{
		id: "MINE",
		name: "Proximity Mine",
		description: "Triggered explosive",
		maxCarry: 2,
		cooldown: 5,
	},
	{
		id: "FLARE",
		name: "Signal Flare",
		description: "Marks location for extraction",
		maxCarry: 2,
		cooldown: 30,
	},
	{
		id: "MEDKIT",
		name: "Field Medkit",
		description: "Heals self or allies",
		maxCarry: 2,
		cooldown: 10,
	},
	{
		id: "RADIO",
		name: "Tactical Radio",
		description: "Calls in support",
		maxCarry: 1,
		cooldown: 60,
	},
	{
		id: "CLAYMORE_CLAM",
		name: "Claymore Clam",
		description: "Directional explosive trap",
		maxCarry: 2,
		cooldown: 5,
	},
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getEquipmentSlotDef(slot: EquipmentSlot): EquipmentSlotDef | undefined {
	return EQUIPMENT_SLOT_DEFS.find((s) => s.id === slot);
}

export function getAttachmentSlotDef(slot: AttachmentSlot): AttachmentSlotDef | undefined {
	return ATTACHMENT_SLOT_DEFS.find((s) => s.id === slot);
}

export function getWeaponCategoryDef(category: WeaponCategory): WeaponCategoryDef | undefined {
	return WEAPON_CATEGORY_DEFS.find((c) => c.id === category);
}

export function getBuildCategoryDef(category: BuildCategory): BuildCategoryDef | undefined {
	return BUILD_CATEGORY_DEFS.find((c) => c.id === category);
}

export function getGadgetTypeDef(type: GadgetType): GadgetTypeDef | undefined {
	return GADGET_TYPE_DEFS.find((g) => g.id === type);
}

/**
 * Check if a weapon category fits in an equipment slot
 */
export function canWeaponFitSlot(category: WeaponCategory, slot: EquipmentSlot): boolean {
	const slotDef = getEquipmentSlotDef(slot);
	if (!slotDef) return false;
	return slotDef.acceptsCategories.includes(category);
}

/**
 * Get the default slot for a weapon category
 */
export function getDefaultSlotForWeapon(category: WeaponCategory): EquipmentSlot {
	const categoryDef = getWeaponCategoryDef(category);
	return categoryDef?.defaultSlot ?? "PRIMARY_WEAPON";
}
