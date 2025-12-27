/**
 * Canteen Loadout System
 *
 * Handles equipment and weapon customization:
 * 1. Modular weapon assembly (barrel + receiver + stock + attachments)
 * 2. Character equipment slots
 * 3. Loadout presets
 * 4. Shop inventory
 *
 * NOTE: Data definitions have been moved to src/ecs/data/weaponTemplates.ts
 * This file now contains ONLY mesh assembly and UI utility functions.
 */

import * as THREE from "three";
import {
	ATTACHMENT_TEMPLATES,
	type AttachmentTemplate,
	calculateFinalStats,
	EQUIPMENT_TEMPLATES,
	type EquipmentTemplate,
	getAttachmentTemplate,
	getWeaponTemplate,
	WEAPON_TEMPLATES,
	type WeaponTemplate,
} from "../../ecs/data/weaponTemplates";
import { type Faction, instantiateMesh, MESH_LIBRARY, type MeshId } from "./componentLibrary";
import type { AttachmentSlot, CanteenItem, Loadout } from "./types";

// Re-export from ECS for backwards compatibility
export {
	ATTACHMENT_TEMPLATES as ATTACHMENTS,
	EQUIPMENT_TEMPLATES as EQUIPMENT_DEFINITIONS,
	WEAPON_TEMPLATES as WEAPON_DEFINITIONS,
} from "../../ecs/data/weaponTemplates";
export type { AttachmentTemplate, EquipmentTemplate, WeaponTemplate };
export type WeaponReceiverType = WeaponTemplate["category"];
export type WeaponDefinition = WeaponTemplate;
export type EquipmentDefinition = EquipmentTemplate;

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
			PRIMARY: {
				OPTIC: null,
				BARREL: null,
				GRIP: null,
				MAGAZINE: null,
				STOCK: null,
				UNDERBARREL: null,
			},
			SECONDARY: {
				OPTIC: null,
				BARREL: null,
				GRIP: null,
				MAGAZINE: null,
				STOCK: null,
				UNDERBARREL: null,
			},
		},
	};
}

/**
 * Calculate weapon stats with attachments applied
 * Delegates to ECS data templates
 */
export function calculateWeaponStats(
	weaponId: string,
	attachments: Record<AttachmentSlot, string | null>,
): WeaponTemplate["stats"] {
	const attachmentIds = Object.values(attachments).filter((id): id is string => id !== null);
	const stats = calculateFinalStats(weaponId, attachmentIds);

	if (!stats) {
		return {
			damage: 0,
			fireRate: 0,
			accuracy: 0,
			recoil: 0,
			range: 0,
			magazineSize: 0,
			bulletSpeed: 0,
		};
	}

	return stats;
}

// =============================================================================
// WEAPON MESH ASSEMBLY
// =============================================================================

/**
 * Assemble a complete weapon mesh from modular parts
 * Uses the component library for DRY mesh creation
 */
export function assembleWeaponMesh(
	weaponId: string,
	faction: Faction,
	attachments?: Record<AttachmentSlot, string | null>,
): THREE.Group {
	const weapon = getWeaponTemplate(weaponId);
	if (!weapon) {
		return new THREE.Group();
	}

	const group = new THREE.Group();
	group.name = `weapon-${weaponId}`;

	// Get mesh definitions
	const receiverDef = MESH_LIBRARY[weapon.meshParts.receiver as MeshId];
	const barrelDef = MESH_LIBRARY[weapon.meshParts.barrel as MeshId];
	const gripDef = MESH_LIBRARY[weapon.meshParts.grip as MeshId];
	const magazineDef = weapon.meshParts.magazine
		? MESH_LIBRARY[weapon.meshParts.magazine as MeshId]
		: null;
	const stockDef = weapon.meshParts.stock ? MESH_LIBRARY[weapon.meshParts.stock as MeshId] : null;

	// Create receiver (main body)
	if (receiverDef) {
		const receiverMesh = instantiateMesh(weapon.meshParts.receiver as MeshId, faction, "METAL");
		receiverMesh.name = "receiver";
		group.add(receiverMesh);

		// Add barrel at attachment point
		if (barrelDef && receiverDef.attachmentPoints) {
			const barrelPoint = receiverDef.attachmentPoints.find((p) => p.name === "BARREL");
			const barrelMesh = instantiateMesh(weapon.meshParts.barrel as MeshId, faction, "METAL");
			barrelMesh.name = "barrel";
			if (barrelPoint) {
				barrelMesh.position.copy(barrelPoint.position);
				barrelMesh.rotation.copy(barrelPoint.rotation);
			} else {
				barrelMesh.position.set(0, 0.02, 0.1);
			}
			group.add(barrelMesh);
		}

		// Add grip
		if (gripDef && receiverDef.attachmentPoints) {
			const gripPoint = receiverDef.attachmentPoints.find((p) => p.name === "GRIP");
			const gripMesh = instantiateMesh(weapon.meshParts.grip as MeshId, faction, "WOOD");
			gripMesh.name = "grip";
			if (gripPoint) {
				gripMesh.position.copy(gripPoint.position);
			} else {
				gripMesh.position.set(0, -0.04, -0.02);
			}
			group.add(gripMesh);
		}

		// Add magazine
		if (magazineDef && receiverDef.attachmentPoints) {
			const magPoint = receiverDef.attachmentPoints.find((p) => p.name === "MAGAZINE");
			const magMesh = instantiateMesh(weapon.meshParts.magazine as MeshId, faction, "METAL");
			magMesh.name = "magazine";
			if (magPoint) {
				magMesh.position.copy(magPoint.position);
			} else {
				magMesh.position.set(0, -0.05, 0);
			}
			group.add(magMesh);
		}

		// Add stock if present
		if (stockDef && receiverDef.attachmentPoints) {
			const stockPoint = receiverDef.attachmentPoints.find((p) => p.name === "STOCK");
			const stockMesh = instantiateMesh(weapon.meshParts.stock as MeshId, faction, "WOOD");
			stockMesh.name = "stock";
			if (stockPoint) {
				stockMesh.position.copy(stockPoint.position);
			} else {
				stockMesh.position.set(0, 0, -0.12);
			}
			group.add(stockMesh);
		}

		// Add optic attachment if present
		if (attachments?.OPTIC) {
			const opticDef = getAttachmentTemplate(attachments.OPTIC);
			if (opticDef) {
				const opticPoint = receiverDef.attachmentPoints?.find((p) => p.name === "OPTIC");
				const opticMesh = instantiateMesh(opticDef.meshId as MeshId, faction, "METAL");
				opticMesh.name = "optic";
				if (opticPoint) {
					opticMesh.position.copy(opticPoint.position);
				} else {
					opticMesh.position.set(0, 0.04, 0);
				}
				group.add(opticMesh);
			}
		}
	}

	// Add grip point for character attachment
	const gripPoint = new THREE.Object3D();
	gripPoint.name = "GRIP_POINT";
	gripPoint.position.set(0, -0.02, -0.01);
	group.add(gripPoint);

	return group;
}

// =============================================================================
// SHOP INVENTORY
// =============================================================================

/**
 * Generate shop inventory from ECS templates
 */
export function generateShopInventory(
	ownedItems: Set<string>,
	unlockedRequirements: Set<string>,
	_coins: number,
): CanteenItem[] {
	const items: CanteenItem[] = [];

	// Weapons
	for (const weapon of WEAPON_TEMPLATES) {
		const unlocked =
			!weapon.unlockRequirement || unlockedRequirements.has(weapon.unlockRequirement);
		items.push({
			id: weapon.id,
			name: weapon.name,
			category: "WEAPON",
			description: `Damage: ${weapon.stats.damage} | Rate: ${weapon.stats.fireRate} | Range: ${weapon.stats.range}`,
			price: weapon.cost,
			unlocked,
			owned: ownedItems.has(weapon.id),
			maxOwned: 1,
		});
	}

	// Attachments
	for (const attachment of ATTACHMENT_TEMPLATES) {
		const unlocked =
			!attachment.unlockRequirement || unlockedRequirements.has(attachment.unlockRequirement);
		const statDesc = Object.entries(attachment.statModifiers)
			.map(([k, v]) => `${k}: ${v > 0 ? "+" : ""}${v}`)
			.join(", ");

		items.push({
			id: attachment.id,
			name: attachment.name,
			category: "ATTACHMENT",
			description: statDesc || "No stat changes",
			price: attachment.cost,
			unlocked,
			owned: ownedItems.has(attachment.id),
			maxOwned: 1,
		});
	}

	// Equipment
	for (const equipment of EQUIPMENT_TEMPLATES) {
		const unlocked =
			!equipment.unlockRequirement || unlockedRequirements.has(equipment.unlockRequirement);
		const statDesc = Object.entries(equipment.statModifiers)
			.filter(([_, v]) => v !== undefined)
			.map(([k, v]) => `${k}: ${v! > 0 ? "+" : ""}${v}`)
			.join(", ");

		items.push({
			id: equipment.id,
			name: equipment.name,
			category: "GEAR",
			description: statDesc || "Standard issue",
			price: equipment.cost,
			unlocked,
			owned: ownedItems.has(equipment.id),
			maxOwned: 1,
		});
	}

	return items;
}

/**
 * Attempt to purchase an item
 */
export function purchaseItem(
	itemId: string,
	coins: number,
	ownedItems: Set<string>,
): { success: boolean; newCoins: number; error?: string } {
	// Find item in templates
	const weapon = WEAPON_TEMPLATES.find((w) => w.id === itemId);
	const attachment = ATTACHMENT_TEMPLATES.find((a) => a.id === itemId);
	const equipment = EQUIPMENT_TEMPLATES.find((e) => e.id === itemId);

	const item = weapon || attachment || equipment;

	if (!item) {
		return { success: false, newCoins: coins, error: "Item not found" };
	}

	if (ownedItems.has(itemId)) {
		return { success: false, newCoins: coins, error: "Already owned" };
	}

	if (coins < item.cost) {
		return { success: false, newCoins: coins, error: "Insufficient coins" };
	}

	const newOwnedItems = new Set(ownedItems);
	newOwnedItems.add(itemId);

	return {
		success: true,
		newCoins: coins - item.cost,
	};
}
