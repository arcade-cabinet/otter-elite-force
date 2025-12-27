/**
 * Canteen Loadout Tests
 *
 * Tests for weapon assembly, attachments, and equipment customization
 */

import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
	ATTACHMENTS,
	assembleWeaponMesh,
	calculateWeaponStats,
	createDefaultLoadout,
	EQUIPMENT_DEFINITIONS,
	generateShopInventory,
	purchaseItem,
	WEAPON_DEFINITIONS,
} from "../canteenLoadout";

describe("Canteen Loadout", () => {
	describe("WEAPON_DEFINITIONS", () => {
		it("should have at least 5 weapons defined", () => {
			expect(WEAPON_DEFINITIONS.length).toBeGreaterThanOrEqual(5);
		});

		it("should have valid stats for all weapons", () => {
			for (const weapon of WEAPON_DEFINITIONS) {
				expect(weapon.stats.damage).toBeGreaterThan(0);
				expect(weapon.stats.fireRate).toBeGreaterThan(0);
				expect(weapon.stats.accuracy).toBeGreaterThanOrEqual(0);
				expect(weapon.stats.accuracy).toBeLessThanOrEqual(1);
				expect(weapon.stats.range).toBeGreaterThan(0);
				expect(weapon.stats.magazineSize).toBeGreaterThan(0);
			}
		});

		it("should have unique IDs for all weapons", () => {
			const ids = WEAPON_DEFINITIONS.map((w) => w.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(ids.length);
		});

		it("should have receiver defined for all weapons", () => {
			for (const weapon of WEAPON_DEFINITIONS) {
				expect(weapon.receiver).toBeDefined();
			}
		});

		it("should have attachment slots defined", () => {
			for (const weapon of WEAPON_DEFINITIONS) {
				expect(weapon.attachmentSlots).toBeDefined();
				expect(Array.isArray(weapon.attachmentSlots)).toBe(true);
			}
		});
	});

	describe("ATTACHMENTS", () => {
		it("should have optics attachments", () => {
			const optics = ATTACHMENTS.filter((a) => a.slot === "OPTIC");
			expect(optics.length).toBeGreaterThan(0);
		});

		it("should have barrel attachments", () => {
			const barrels = ATTACHMENTS.filter((a) => a.slot === "BARREL");
			expect(barrels.length).toBeGreaterThan(0);
		});

		it("should have valid stat modifiers", () => {
			for (const attachment of ATTACHMENTS) {
				expect(attachment.stats).toBeDefined();
				// Stats should be numbers (can be positive or negative)
				for (const value of Object.values(attachment.stats)) {
					expect(typeof value).toBe("number");
				}
			}
		});

		it("should have compatible weapons list", () => {
			for (const attachment of ATTACHMENTS) {
				expect(attachment.compatibleWeapons).toBeDefined();
				expect(attachment.compatibleWeapons.length).toBeGreaterThan(0);
			}
		});
	});

	describe("EQUIPMENT_DEFINITIONS", () => {
		it("should have headgear options", () => {
			const headgear = EQUIPMENT_DEFINITIONS.filter((e) => e.slot === "HEADGEAR");
			expect(headgear.length).toBeGreaterThan(0);
		});

		it("should have vest options", () => {
			const vests = EQUIPMENT_DEFINITIONS.filter((e) => e.slot === "VEST");
			expect(vests.length).toBeGreaterThan(0);
		});

		it("should have backpack options", () => {
			const backpacks = EQUIPMENT_DEFINITIONS.filter((e) => e.slot === "BACKPACK");
			expect(backpacks.length).toBeGreaterThan(0);
		});

		it("should have valid mesh IDs", () => {
			for (const equipment of EQUIPMENT_DEFINITIONS) {
				expect(equipment.meshId).toBeDefined();
			}
		});
	});

	describe("createDefaultLoadout", () => {
		it("should create a valid loadout", () => {
			const loadout = createDefaultLoadout("bubbles");

			expect(loadout.characterId).toBe("bubbles");
			expect(loadout.equipment).toBeDefined();
		});

		it("should have primary weapon assignment", () => {
			const loadout = createDefaultLoadout("bubbles");

			expect(loadout.equipment.PRIMARY_WEAPON).toBeDefined();
		});

		it("should have equipment slots", () => {
			const loadout = createDefaultLoadout("bubbles");

			expect(loadout.equipment.HEADGEAR).toBeDefined();
			expect(loadout.equipment.VEST).toBeDefined();
			expect(loadout.equipment.BACKPACK).toBeDefined();
		});
	});

	describe("calculateWeaponStats", () => {
		it("should return base stats when no attachments", () => {
			const weapon = WEAPON_DEFINITIONS[0];
			const emptyAttachments = {
				OPTIC: null,
				BARREL: null,
				GRIP: null,
				MAGAZINE: null,
			};
			const stats = calculateWeaponStats(weapon.id, emptyAttachments);

			expect(stats.damage).toBe(weapon.stats.damage);
			expect(stats.fireRate).toBe(weapon.stats.fireRate);
		});

		it("should apply attachment modifiers", () => {
			const weapon = WEAPON_DEFINITIONS.find((w) => w.attachmentSlots.includes("OPTIC"));
			if (!weapon) return;

			const optic = ATTACHMENTS.find(
				(a) => a.slot === "OPTIC" && a.compatibleWeapons.includes(weapon.id),
			);
			if (!optic) return;

			const noAttachments = {
				OPTIC: null,
				BARREL: null,
				GRIP: null,
				MAGAZINE: null,
			};
			const withOptic = {
				OPTIC: optic.id,
				BARREL: null,
				GRIP: null,
				MAGAZINE: null,
			};

			const baseStats = calculateWeaponStats(weapon.id, noAttachments);
			const modifiedStats = calculateWeaponStats(weapon.id, withOptic);

			// At least one stat should be different
			const statsDifferent =
				baseStats.damage !== modifiedStats.damage ||
				baseStats.accuracy !== modifiedStats.accuracy ||
				baseStats.range !== modifiedStats.range;

			expect(statsDifferent).toBe(true);
		});

		it("should return zero stats for unknown weapon", () => {
			const stats = calculateWeaponStats("unknown-weapon", {
				OPTIC: null,
				BARREL: null,
				GRIP: null,
				MAGAZINE: null,
			});

			expect(stats.damage).toBe(0);
		});
	});

	describe("assembleWeaponMesh", () => {
		it("should create a THREE.Group", () => {
			const weapon = WEAPON_DEFINITIONS[0];
			const mesh = assembleWeaponMesh(weapon.id, "URA");

			expect(mesh).toBeInstanceOf(THREE.Group);
		});

		it("should have child meshes for valid weapon", () => {
			const weapon = WEAPON_DEFINITIONS[0];
			const mesh = assembleWeaponMesh(weapon.id, "URA");

			expect(mesh.children.length).toBeGreaterThan(0);
		});

		it("should support different factions", () => {
			const weapon = WEAPON_DEFINITIONS[0];

			const uraMesh = assembleWeaponMesh(weapon.id, "URA");
			const scaleGuardMesh = assembleWeaponMesh(weapon.id, "SCALE_GUARD");

			// Both should be valid groups
			expect(uraMesh).toBeInstanceOf(THREE.Group);
			expect(scaleGuardMesh).toBeInstanceOf(THREE.Group);
		});

		it("should return empty group for unknown weapon", () => {
			const mesh = assembleWeaponMesh("unknown-weapon", "URA");

			expect(mesh).toBeInstanceOf(THREE.Group);
			expect(mesh.children.length).toBe(0);
		});
	});

	describe("generateShopInventory", () => {
		it("should include weapons", () => {
			const inventory = generateShopInventory(new Set(), new Set(), 1000);

			const weapons = inventory.filter((i) => i.type === "WEAPON");
			expect(weapons.length).toBeGreaterThan(0);
		});

		it("should include attachments", () => {
			const inventory = generateShopInventory(new Set(), new Set(), 1000);

			const attachments = inventory.filter((i) => i.type === "ATTACHMENT");
			expect(attachments.length).toBeGreaterThan(0);
		});

		it("should include equipment", () => {
			const inventory = generateShopInventory(new Set(), new Set(), 1000);

			const equipment = inventory.filter((i) => i.type === "EQUIPMENT");
			expect(equipment.length).toBeGreaterThan(0);
		});

		it("should mark owned items correctly", () => {
			const weaponId = WEAPON_DEFINITIONS[0].id;
			const ownedItems = new Set([weaponId]);
			const inventory = generateShopInventory(ownedItems, new Set(), 1000);

			const ownedItem = inventory.find((i) => i.id === weaponId);
			expect(ownedItem?.owned).toBe(true);
		});
	});

	describe("purchaseItem", () => {
		it("should return success when can afford", () => {
			const weapon = WEAPON_DEFINITIONS[0];
			const result = purchaseItem(weapon.id, weapon.cost + 100, new Set());

			expect(result.success).toBe(true);
			expect(result.newCoins).toBe(100);
		});

		it("should return failure when cannot afford", () => {
			const weapon = WEAPON_DEFINITIONS[0];
			const result = purchaseItem(weapon.id, weapon.cost - 10, new Set());

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});

		it("should return failure when already owned", () => {
			const weapon = WEAPON_DEFINITIONS[0];
			const result = purchaseItem(weapon.id, weapon.cost + 100, new Set([weapon.id]));

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});

		it("should return failure for unknown item", () => {
			const result = purchaseItem("unknown-item", 1000, new Set());

			expect(result.success).toBe(false);
			expect(result.error).toBe("Item not found");
		});
	});
});
