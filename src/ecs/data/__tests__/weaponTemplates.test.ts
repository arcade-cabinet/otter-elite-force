/**
 * Weapon Templates Tests
 *
 * Tests for ECS-integrated weapon definitions
 */

import {
	ATTACHMENT_TEMPLATES,
	calculateFinalStats,
	EQUIPMENT_TEMPLATES,
	getAttachmentTemplate,
	getCompatibleAttachments,
	getEquipmentTemplate,
	getUnlockedWeapons,
	getWeaponTemplate,
	WEAPON_TEMPLATES,
} from "../weaponTemplates";

describe("Weapon Templates", () => {
	describe("WEAPON_TEMPLATES", () => {
		it("should have at least 5 weapons", () => {
			expect(WEAPON_TEMPLATES.length).toBeGreaterThanOrEqual(5);
		});

		it("should have unique IDs", () => {
			const ids = WEAPON_TEMPLATES.map((w) => w.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(ids.length);
		});

		it("should have valid stats for all weapons", () => {
			for (const weapon of WEAPON_TEMPLATES) {
				expect(weapon.stats.damage).toBeGreaterThan(0);
				expect(weapon.stats.fireRate).toBeGreaterThan(0);
				expect(weapon.stats.accuracy).toBeGreaterThanOrEqual(0);
				expect(weapon.stats.accuracy).toBeLessThanOrEqual(1);
				expect(weapon.stats.range).toBeGreaterThan(0);
				expect(weapon.stats.magazineSize).toBeGreaterThan(0);
				expect(weapon.stats.bulletSpeed).toBeGreaterThan(0);
			}
		});

		it("should have mesh parts defined", () => {
			for (const weapon of WEAPON_TEMPLATES) {
				expect(weapon.meshParts.receiver).toBeDefined();
				expect(weapon.meshParts.barrel).toBeDefined();
				expect(weapon.meshParts.grip).toBeDefined();
				expect(weapon.meshParts.magazine).toBeDefined();
			}
		});

		it("should have a starting weapon (cost 0)", () => {
			const starterWeapons = WEAPON_TEMPLATES.filter((w) => w.cost === 0);
			expect(starterWeapons.length).toBeGreaterThan(0);
		});
	});

	describe("ATTACHMENT_TEMPLATES", () => {
		it("should have attachments for all slot types", () => {
			const slots = new Set(ATTACHMENT_TEMPLATES.map((a) => a.slot));
			expect(slots.has("OPTIC")).toBe(true);
			expect(slots.has("BARREL")).toBe(true);
			expect(slots.has("GRIP")).toBe(true);
			expect(slots.has("MAGAZINE")).toBe(true);
		});

		it("should have valid stat modifiers", () => {
			for (const attachment of ATTACHMENT_TEMPLATES) {
				expect(attachment.statModifiers).toBeDefined();
			}
		});

		it("should have compatible categories defined", () => {
			for (const attachment of ATTACHMENT_TEMPLATES) {
				expect(attachment.compatibleCategories.length).toBeGreaterThan(0);
			}
		});
	});

	describe("EQUIPMENT_TEMPLATES", () => {
		it("should have all slot types", () => {
			const slots = new Set(EQUIPMENT_TEMPLATES.map((e) => e.slot));
			expect(slots.has("HEADGEAR")).toBe(true);
			expect(slots.has("VEST")).toBe(true);
			expect(slots.has("BACKPACK")).toBe(true);
		});

		it("should have meshIds defined", () => {
			for (const equipment of EQUIPMENT_TEMPLATES) {
				expect(equipment.meshId).toBeDefined();
			}
		});
	});

	describe("getWeaponTemplate", () => {
		it("should find weapon by ID", () => {
			const weapon = getWeaponTemplate("fish-cannon");
			expect(weapon).toBeDefined();
			expect(weapon?.name).toBe("Fish Cannon");
		});

		it("should return undefined for unknown ID", () => {
			const weapon = getWeaponTemplate("unknown-weapon");
			expect(weapon).toBeUndefined();
		});
	});

	describe("getAttachmentTemplate", () => {
		it("should find attachment by ID", () => {
			const attachment = getAttachmentTemplate("red-dot");
			expect(attachment).toBeDefined();
			expect(attachment?.name).toBe("Red Dot Sight");
		});
	});

	describe("getEquipmentTemplate", () => {
		it("should find equipment by ID", () => {
			const equipment = getEquipmentTemplate("tactical-vest");
			expect(equipment).toBeDefined();
			expect(equipment?.name).toBe("Tactical Vest");
		});
	});

	describe("getUnlockedWeapons", () => {
		it("should return starter weapons when no requirements met", () => {
			const unlocked = getUnlockedWeapons(new Set());
			expect(unlocked.length).toBeGreaterThan(0);

			// All returned weapons should have no unlock requirement
			for (const weapon of unlocked) {
				expect(weapon.unlockRequirement).toBeNull();
			}
		});

		it("should include more weapons when requirements are met", () => {
			const noRequirements = getUnlockedWeapons(new Set());
			const withRequirements = getUnlockedWeapons(new Set(["Secure 3 Territories"]));

			expect(withRequirements.length).toBeGreaterThanOrEqual(noRequirements.length);
		});
	});

	describe("getCompatibleAttachments", () => {
		it("should return attachments compatible with rifle", () => {
			const attachments = getCompatibleAttachments("RIFLE");
			expect(attachments.length).toBeGreaterThan(0);
		});

		it("should filter by slot", () => {
			const optics = getCompatibleAttachments("RIFLE", "OPTIC");
			for (const attachment of optics) {
				expect(attachment.slot).toBe("OPTIC");
			}
		});
	});

	describe("calculateFinalStats", () => {
		it("should return base stats when no attachments", () => {
			const stats = calculateFinalStats("fish-cannon", []);
			const weapon = getWeaponTemplate("fish-cannon");

			expect(stats?.damage).toBe(weapon?.stats.damage);
			expect(stats?.accuracy).toBe(weapon?.stats.accuracy);
		});

		it("should apply attachment modifiers", () => {
			const baseStats = calculateFinalStats("mud-rifle", []);
			const withRedDot = calculateFinalStats("mud-rifle", ["red-dot"]);

			expect(withRedDot?.accuracy).toBeGreaterThan(baseStats?.accuracy ?? 0);
		});

		it("should return null for unknown weapon", () => {
			const stats = calculateFinalStats("unknown", []);
			expect(stats).toBeNull();
		});

		it("should clamp accuracy to 0-1 range", () => {
			// Add multiple accuracy boosting attachments
			const stats = calculateFinalStats("mud-rifle", ["red-dot", "scope-4x"]);
			expect(stats?.accuracy).toBeLessThanOrEqual(1);
			expect(stats?.accuracy).toBeGreaterThanOrEqual(0);
		});
	});
});
