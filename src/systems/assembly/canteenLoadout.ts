/**
 * Canteen Loadout System
 *
 * Handles equipment and weapon customization:
 * 1. Modular weapon assembly (barrel + receiver + stock + attachments)
 * 2. Character equipment slots
 * 3. Loadout presets
 * 4. Shop inventory
 */

import * as THREE from "three";
import { type Faction, instantiateMesh, MESH_LIBRARY, type MeshId } from "./componentLibrary";
import type { Attachment, AttachmentSlot, CanteenItem, EquipmentSlot, Loadout } from "./types";

// =============================================================================
// WEAPON DEFINITIONS (Modular Assembly)
// =============================================================================

/**
 * Base weapon receiver types - the core of each weapon
 */
export type WeaponReceiverType = "PISTOL" | "RIFLE" | "SHOTGUN" | "SMG" | "LMG" | "LAUNCHER";

/**
 * Modular weapon definition
 * Weapons are assembled from SEPARATE mesh parts
 */
export interface WeaponDefinition {
	id: string;
	name: string;
	receiverType: WeaponReceiverType;
	receiverMesh: MeshId;
	defaultBarrel: MeshId;
	defaultStock: MeshId | null;
	defaultGrip: MeshId;
	defaultMagazine: MeshId | null;
	attachmentSlots: AttachmentSlot[];
	stats: {
		damage: number;
		fireRate: number;
		accuracy: number;
		recoil: number;
		range: number;
		magazineSize: number;
	};
	cost: number;
	unlockRequirement?: string;
}

/**
 * All weapons - modular assembly!
 */
export const WEAPON_DEFINITIONS: WeaponDefinition[] = [
	// Pistols
	{
		id: "fish-cannon",
		name: "Fish Cannon",
		receiverType: "PISTOL",
		receiverMesh: "RECEIVER_PISTOL",
		defaultBarrel: "BARREL_SHORT",
		defaultStock: null,
		defaultGrip: "GRIP_PISTOL",
		defaultMagazine: "MAGAZINE_BOX",
		attachmentSlots: ["BARREL", "MAGAZINE"],
		stats: { damage: 8, fireRate: 0.3, accuracy: 0.7, recoil: 0.15, range: 25, magazineSize: 12 },
		cost: 0, // Starting weapon
	},
	{
		id: "silt-needle",
		name: "Silt Needle",
		receiverType: "PISTOL",
		receiverMesh: "RECEIVER_PISTOL",
		defaultBarrel: "BARREL_LONG",
		defaultStock: null,
		defaultGrip: "GRIP_PISTOL",
		defaultMagazine: "MAGAZINE_BOX",
		attachmentSlots: ["BARREL", "OPTIC", "MAGAZINE"],
		stats: { damage: 3, fireRate: 0.25, accuracy: 0.95, recoil: 0.01, range: 50, magazineSize: 20 },
		cost: 200,
		unlockRequirement: "Rescue Medic Marina",
	},

	// Rifles
	{
		id: "bubble-rifle",
		name: "Bubble Rifle",
		receiverType: "RIFLE",
		receiverMesh: "RECEIVER_RIFLE",
		defaultBarrel: "BARREL_LONG",
		defaultStock: "STOCK_WOOD",
		defaultGrip: "GRIP_PISTOL",
		defaultMagazine: "MAGAZINE_BOX",
		attachmentSlots: ["BARREL", "OPTIC", "STOCK", "GRIP", "MAGAZINE"],
		stats: { damage: 12, fireRate: 0.4, accuracy: 0.85, recoil: 0.08, range: 60, magazineSize: 30 },
		cost: 150,
	},
	{
		id: "reed-sniper",
		name: "Reed Sniper",
		receiverType: "RIFLE",
		receiverMesh: "RECEIVER_RIFLE",
		defaultBarrel: "BARREL_LONG",
		defaultStock: "STOCK_TACTICAL",
		defaultGrip: "GRIP_PISTOL",
		defaultMagazine: "MAGAZINE_BOX",
		attachmentSlots: ["BARREL", "OPTIC", "STOCK", "MAGAZINE"],
		stats: { damage: 35, fireRate: 1.5, accuracy: 0.98, recoil: 0.2, range: 100, magazineSize: 5 },
		cost: 400,
		unlockRequirement: "Destroy 10 Siphons",
	},

	// Shotguns
	{
		id: "scatter-shell",
		name: "Scatter Shell",
		receiverType: "SHOTGUN",
		receiverMesh: "RECEIVER_SHOTGUN",
		defaultBarrel: "BARREL_DOUBLE",
		defaultStock: "STOCK_WOOD",
		defaultGrip: "GRIP_PISTOL",
		defaultMagazine: null,
		attachmentSlots: ["BARREL", "STOCK", "GRIP"],
		stats: { damage: 8, fireRate: 1.2, accuracy: 0.5, recoil: 0.15, range: 15, magazineSize: 2 },
		cost: 250,
		unlockRequirement: "Rescue Pvt. Muskrat",
	},

	// SMG
	{
		id: "stream-sprayer",
		name: "Stream Sprayer",
		receiverType: "SMG",
		receiverMesh: "RECEIVER_RIFLE",
		defaultBarrel: "BARREL_SHORT",
		defaultStock: "STOCK_TACTICAL",
		defaultGrip: "GRIP_VERTICAL",
		defaultMagazine: "MAGAZINE_BOX",
		attachmentSlots: ["BARREL", "OPTIC", "STOCK", "GRIP", "MAGAZINE"],
		stats: { damage: 5, fireRate: 0.08, accuracy: 0.6, recoil: 0.05, range: 30, magazineSize: 40 },
		cost: 300,
	},

	// LMG
	{
		id: "delta-devastator",
		name: "Delta Devastator",
		receiverType: "LMG",
		receiverMesh: "RECEIVER_RIFLE",
		defaultBarrel: "BARREL_LONG",
		defaultStock: "STOCK_TACTICAL",
		defaultGrip: "GRIP_VERTICAL",
		defaultMagazine: "MAGAZINE_DRUM",
		attachmentSlots: ["BARREL", "OPTIC", "GRIP"],
		stats: {
			damage: 10,
			fireRate: 0.1,
			accuracy: 0.55,
			recoil: 0.12,
			range: 45,
			magazineSize: 100,
		},
		cost: 500,
		unlockRequirement: "Secure 5 Territories",
	},

	// Launcher
	{
		id: "clam-mortar",
		name: "Clam Mortar",
		receiverType: "LAUNCHER",
		receiverMesh: "RECEIVER_SHOTGUN",
		defaultBarrel: "BARREL_SHORT",
		defaultStock: "STOCK_WOOD",
		defaultGrip: "GRIP_PISTOL",
		defaultMagazine: null,
		attachmentSlots: ["OPTIC"],
		stats: { damage: 25, fireRate: 2.5, accuracy: 0.4, recoil: 0.2, range: 40, magazineSize: 1 },
		cost: 600,
		unlockRequirement: "Destroy The Great Siphon",
	},
];

// =============================================================================
// ATTACHMENT DEFINITIONS
// =============================================================================

export const ATTACHMENTS: Attachment[] = [
	// Optics
	{
		id: "iron-sights",
		name: "Iron Sights",
		slot: "OPTIC",
		compatibleWeapons: ["*"], // All weapons
		stats: {},
		cost: 0,
	},
	{
		id: "red-dot",
		name: "Red Dot Sight",
		slot: "OPTIC",
		compatibleWeapons: ["bubble-rifle", "stream-sprayer", "delta-devastator", "reed-sniper"],
		stats: { accuracy: 0.05 },
		cost: 50,
	},
	{
		id: "scope-2x",
		name: "2x Scope",
		slot: "OPTIC",
		compatibleWeapons: ["bubble-rifle", "reed-sniper"],
		stats: { accuracy: 0.1, range: 10 },
		cost: 100,
	},
	{
		id: "scope-4x",
		name: "4x Scope",
		slot: "OPTIC",
		compatibleWeapons: ["reed-sniper"],
		stats: { accuracy: 0.15, range: 20 },
		cost: 200,
		unlockRequirement: "50 Headshot Kills",
	},

	// Barrels
	{
		id: "suppressor",
		name: "Suppressor",
		slot: "BARREL",
		compatibleWeapons: ["fish-cannon", "silt-needle", "bubble-rifle", "stream-sprayer"],
		stats: { damage: -1, range: -5 },
		cost: 75,
	},
	{
		id: "extended-barrel",
		name: "Extended Barrel",
		slot: "BARREL",
		compatibleWeapons: ["bubble-rifle", "reed-sniper", "delta-devastator"],
		stats: { range: 15, accuracy: 0.05 },
		cost: 80,
	},
	{
		id: "choke",
		name: "Choke",
		slot: "BARREL",
		compatibleWeapons: ["scatter-shell"],
		stats: { accuracy: 0.15, range: 5 },
		cost: 60,
	},

	// Grips
	{
		id: "vertical-grip",
		name: "Vertical Grip",
		slot: "GRIP",
		compatibleWeapons: ["bubble-rifle", "stream-sprayer", "delta-devastator"],
		stats: { recoil: -0.03, accuracy: 0.02 },
		cost: 40,
	},
	{
		id: "angled-grip",
		name: "Angled Grip",
		slot: "GRIP",
		compatibleWeapons: ["bubble-rifle", "stream-sprayer"],
		stats: { recoil: -0.02 },
		cost: 35,
	},

	// Magazines
	{
		id: "extended-mag",
		name: "Extended Magazine",
		slot: "MAGAZINE",
		compatibleWeapons: ["fish-cannon", "silt-needle", "bubble-rifle", "stream-sprayer"],
		stats: {}, // magazineSize handled separately
		cost: 45,
	},
	{
		id: "drum-mag",
		name: "Drum Magazine",
		slot: "MAGAZINE",
		compatibleWeapons: ["stream-sprayer"],
		stats: {},
		cost: 100,
	},

	// Stocks
	{
		id: "tactical-stock",
		name: "Tactical Stock",
		slot: "STOCK",
		compatibleWeapons: ["bubble-rifle", "reed-sniper", "scatter-shell"],
		stats: { recoil: -0.04, accuracy: 0.03 },
		cost: 60,
	},
	{
		id: "padded-stock",
		name: "Padded Stock",
		slot: "STOCK",
		compatibleWeapons: ["scatter-shell", "delta-devastator"],
		stats: { recoil: -0.06 },
		cost: 50,
	},
];

// =============================================================================
// EQUIPMENT DEFINITIONS
// =============================================================================

export interface EquipmentDefinition {
	id: string;
	name: string;
	slot: EquipmentSlot;
	meshId: MeshId;
	stats: {
		health?: number;
		speed?: number;
		armor?: number;
		carryCapacity?: number;
	};
	cost: number;
	unlockRequirement?: string;
}

export const EQUIPMENT_DEFINITIONS: EquipmentDefinition[] = [
	// Headgear
	{
		id: "standard-helmet",
		name: "Standard Helmet",
		slot: "HEADGEAR",
		meshId: "HELMET_STANDARD",
		stats: { armor: 5 },
		cost: 0,
	},
	{
		id: "bandana",
		name: "Tactical Bandana",
		slot: "HEADGEAR",
		meshId: "HELMET_BANDANA",
		stats: { speed: 0.5 },
		cost: 30,
	},

	// Vests
	{
		id: "light-vest",
		name: "Light Vest",
		slot: "VEST",
		meshId: "VEST_LIGHT",
		stats: { armor: 10, speed: -0.2 },
		cost: 0,
	},
	{
		id: "tactical-vest",
		name: "Tactical Vest",
		slot: "VEST",
		meshId: "VEST_TACTICAL",
		stats: { armor: 20, speed: -0.5, carryCapacity: 2 },
		cost: 150,
	},

	// Backpacks
	{
		id: "radio-pack",
		name: "Radio Pack",
		slot: "BACKPACK",
		meshId: "BACKPACK_RADIO",
		stats: { carryCapacity: 1 },
		cost: 0,
	},
	{
		id: "medic-pack",
		name: "Medic Pack",
		slot: "BACKPACK",
		meshId: "BACKPACK_MEDIC",
		stats: { carryCapacity: 2, health: 10 },
		cost: 100,
		unlockRequirement: "Rescue Medic Marina",
	},
	{
		id: "scuba-tank",
		name: "Scuba Tank",
		slot: "BACKPACK",
		meshId: "BACKPACK_SCUBA",
		stats: {},
		cost: 200,
		unlockRequirement: "Rescue Splash",
	},
];

// =============================================================================
// LOADOUT MANAGEMENT
// =============================================================================

/**
 * Creates a default loadout for a character
 */
export function createDefaultLoadout(characterId: string): Loadout {
	return {
		id: `loadout-${characterId}-default`,
		name: "Default",
		characterId,
		equipment: {
			PRIMARY_WEAPON: "fish-cannon",
			SECONDARY_WEAPON: null,
			HEADGEAR: "standard-helmet",
			VEST: "light-vest",
			BACKPACK: "radio-pack",
			GADGET_1: null,
			GADGET_2: null,
		},
		weaponAttachments: {
			"fish-cannon": {
				OPTIC: "iron-sights",
				BARREL: null,
				GRIP: null,
				MAGAZINE: null,
				STOCK: null,
			},
		},
	};
}

/**
 * Applies attachment stats to base weapon stats
 */
export function calculateWeaponStats(
	weaponId: string,
	attachments: Record<AttachmentSlot, string | null>,
): WeaponDefinition["stats"] {
	const weapon = WEAPON_DEFINITIONS.find((w) => w.id === weaponId);
	if (!weapon) {
		return { damage: 0, fireRate: 0, accuracy: 0, recoil: 0, range: 0, magazineSize: 0 };
	}

	const stats = { ...weapon.stats };

	for (const [_slot, attachmentId] of Object.entries(attachments)) {
		if (!attachmentId) continue;

		const attachment = ATTACHMENTS.find((a) => a.id === attachmentId);
		if (!attachment) continue;

		// Apply stat modifiers
		if (attachment.stats.damage) stats.damage += attachment.stats.damage;
		if (attachment.stats.accuracy) stats.accuracy += attachment.stats.accuracy;
		if (attachment.stats.recoil) stats.recoil += attachment.stats.recoil;
		if (attachment.stats.range) stats.range += attachment.stats.range;
		if (attachment.stats.fireRate) stats.fireRate += attachment.stats.fireRate;
	}

	// Clamp values
	stats.accuracy = Math.min(1, Math.max(0, stats.accuracy));
	stats.recoil = Math.max(0, stats.recoil);

	return stats;
}

// =============================================================================
// WEAPON MESH ASSEMBLY
// =============================================================================

/**
 * Assembles a weapon mesh from modular parts
 * Same mesh for player AND enemies!
 */
export function assembleWeaponMesh(
	weaponId: string,
	faction: Faction,
	attachments?: Record<AttachmentSlot, string | null>,
): THREE.Group {
	const weapon = WEAPON_DEFINITIONS.find((w) => w.id === weaponId);
	if (!weapon) {
		return new THREE.Group();
	}

	const group = new THREE.Group();

	// Receiver (core of the weapon)
	const receiver = instantiateMesh(weapon.receiverMesh, faction, "METAL");
	group.add(receiver);

	// Get attachment points from receiver
	const receiverDef = MESH_LIBRARY[weapon.receiverMesh];
	const attachmentPoints = receiverDef.attachmentPoints || [];

	// Barrel
	const barrelPoint = attachmentPoints.find((p) => p.name === "BARREL");
	if (barrelPoint) {
		const barrelMesh = instantiateMesh(weapon.defaultBarrel, faction, "METAL");
		barrelMesh.position.copy(barrelPoint.position);
		barrelMesh.rotation.copy(barrelPoint.rotation);
		group.add(barrelMesh);
	}

	// Stock
	if (weapon.defaultStock) {
		const stockPoint = attachmentPoints.find((p) => p.name === "STOCK");
		if (stockPoint) {
			const stockMesh = instantiateMesh(weapon.defaultStock, faction, "WOOD");
			stockMesh.position.copy(stockPoint.position);
			stockMesh.rotation.copy(stockPoint.rotation);
			group.add(stockMesh);
		}
	}

	// Grip
	const gripPoint = attachmentPoints.find((p) => p.name === "GRIP");
	if (gripPoint) {
		const gripMesh = instantiateMesh(weapon.defaultGrip, faction, "WOOD");
		gripMesh.position.copy(gripPoint.position);
		gripMesh.rotation.copy(gripPoint.rotation);
		group.add(gripMesh);
	}

	// Magazine
	if (weapon.defaultMagazine) {
		const magPoint = attachmentPoints.find((p) => p.name === "MAGAZINE");
		if (magPoint) {
			const magMesh = instantiateMesh(weapon.defaultMagazine, faction, "METAL");
			magMesh.position.copy(magPoint.position);
			magMesh.rotation.copy(magPoint.rotation);
			group.add(magMesh);
		}
	}

	// Optic (if equipped)
	if (attachments?.OPTIC && attachments.OPTIC !== "iron-sights") {
		const opticPoint = attachmentPoints.find((p) => p.name === "OPTIC");
		if (opticPoint) {
			const opticMesh = instantiateMesh("SCOPE_RED_DOT", faction, "METAL");
			opticMesh.position.copy(opticPoint.position);
			opticMesh.rotation.copy(opticPoint.rotation);
			group.add(opticMesh);
		}
	}

	// Add grip attachment point for character hands
	const gripAttachment = new THREE.Object3D();
	gripAttachment.name = "GRIP_POINT";
	gripAttachment.position.set(0, -0.03, -0.02);
	group.add(gripAttachment);

	return group;
}

// =============================================================================
// CANTEEN SHOP
// =============================================================================

/**
 * Generates the shop inventory
 */
export function generateShopInventory(
	ownedItems: Set<string>,
	unlockedRequirements: Set<string>,
	_coins: number,
): CanteenItem[] {
	const items: CanteenItem[] = [];

	// Weapons
	for (const weapon of WEAPON_DEFINITIONS) {
		const unlocked =
			!weapon.unlockRequirement || unlockedRequirements.has(weapon.unlockRequirement);
		items.push({
			id: weapon.id,
			name: weapon.name,
			description: `${weapon.receiverType} - DMG: ${weapon.stats.damage}, RNG: ${weapon.stats.range}`,
			category: "WEAPON",
			price: weapon.cost,
			unlocked,
			owned: ownedItems.has(weapon.id) || weapon.cost === 0,
			maxOwned: 1,
		});
	}

	// Attachments
	for (const attachment of ATTACHMENTS) {
		const unlocked =
			!attachment.unlockRequirement || unlockedRequirements.has(attachment.unlockRequirement);
		const statDesc = Object.entries(attachment.stats)
			.map(([k, v]) => `${k}: ${v > 0 ? "+" : ""}${v}`)
			.join(", ");

		items.push({
			id: attachment.id,
			name: attachment.name,
			description: statDesc || "Standard equipment",
			category: "ATTACHMENT",
			price: attachment.cost,
			unlocked,
			owned: ownedItems.has(attachment.id) || attachment.cost === 0,
			maxOwned: 1,
		});
	}

	// Equipment
	for (const equipment of EQUIPMENT_DEFINITIONS) {
		const unlocked =
			!equipment.unlockRequirement || unlockedRequirements.has(equipment.unlockRequirement);
		const statDesc = Object.entries(equipment.stats)
			.map(([k, v]) => `${k}: ${v > 0 ? "+" : ""}${v}`)
			.join(", ");

		items.push({
			id: equipment.id,
			name: equipment.name,
			description: statDesc || "Standard gear",
			category: "GEAR",
			price: equipment.cost,
			unlocked,
			owned: ownedItems.has(equipment.id) || equipment.cost === 0,
			maxOwned: 1,
		});
	}

	return items;
}

/**
 * Attempts to purchase an item
 */
export function purchaseItem(
	itemId: string,
	coins: number,
	ownedItems: Set<string>,
): { success: boolean; newCoins: number; error?: string } {
	const allItems = [...WEAPON_DEFINITIONS, ...ATTACHMENTS, ...EQUIPMENT_DEFINITIONS];
	const item = allItems.find((i) => i.id === itemId);

	if (!item) {
		return { success: false, newCoins: coins, error: "Item not found" };
	}

	if (ownedItems.has(itemId)) {
		return { success: false, newCoins: coins, error: "Already owned" };
	}

	if (coins < item.cost) {
		return { success: false, newCoins: coins, error: "Insufficient funds" };
	}

	return { success: true, newCoins: coins - item.cost };
}
