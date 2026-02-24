/**
 * ECS Slots Tests
 *
 * Tests for slot definitions (equipment, attachments, build categories, etc.)
 */

import {
	ATTACHMENT_SLOT_DEFS,
	ATTACHMENT_SLOTS,
	BUILD_CATEGORIES,
	BUILD_CATEGORY_DEFS,
	canWeaponFitSlot,
	EQUIPMENT_SLOT_DEFS,
	EQUIPMENT_SLOTS,
	GADGET_TYPE_DEFS,
	GADGET_TYPES,
	getAttachmentSlotDef,
	getBuildCategoryDef,
	getDefaultSlotForWeapon,
	getEquipmentSlotDef,
	getGadgetTypeDef,
	getWeaponCategoryDef,
	SHOP_CATEGORIES,
	SHOP_CATEGORY_DEFS,
	WEAPON_CATEGORIES,
	WEAPON_CATEGORY_DEFS,
} from "../slots";

describe("ECS Slots", () => {
	describe("EQUIPMENT_SLOTS", () => {
		it("should define all equipment slots", () => {
			expect(EQUIPMENT_SLOTS).toContain("PRIMARY_WEAPON");
			expect(EQUIPMENT_SLOTS).toContain("SECONDARY_WEAPON");
			expect(EQUIPMENT_SLOTS).toContain("HEADGEAR");
			expect(EQUIPMENT_SLOTS).toContain("VEST");
			expect(EQUIPMENT_SLOTS).toContain("BACKPACK");
			expect(EQUIPMENT_SLOTS).toContain("GADGET_1");
			expect(EQUIPMENT_SLOTS).toContain("GADGET_2");
		});

		it("should have 7 equipment slots", () => {
			expect(EQUIPMENT_SLOTS).toHaveLength(7);
		});

		it("should have matching slot definitions", () => {
			for (const slot of EQUIPMENT_SLOTS) {
				const def = EQUIPMENT_SLOT_DEFS.find((d) => d.id === slot);
				expect(def).toBeDefined();
				expect(def?.name).toBeTruthy();
				expect(def?.description).toBeTruthy();
				expect(def?.maxItems).toBeGreaterThan(0);
				expect(def?.acceptsCategories).toBeDefined();
			}
		});
	});

	describe("ATTACHMENT_SLOTS", () => {
		it("should define all attachment slots", () => {
			expect(ATTACHMENT_SLOTS).toContain("OPTIC");
			expect(ATTACHMENT_SLOTS).toContain("BARREL");
			expect(ATTACHMENT_SLOTS).toContain("GRIP");
			expect(ATTACHMENT_SLOTS).toContain("MAGAZINE");
			expect(ATTACHMENT_SLOTS).toContain("STOCK");
			expect(ATTACHMENT_SLOTS).toContain("UNDERBARREL");
		});

		it("should have 6 attachment slots", () => {
			expect(ATTACHMENT_SLOTS).toHaveLength(6);
		});

		it("should have matching slot definitions with positions", () => {
			for (const slot of ATTACHMENT_SLOTS) {
				const def = ATTACHMENT_SLOT_DEFS.find((d) => d.id === slot);
				expect(def).toBeDefined();
				expect(def?.name).toBeTruthy();
				expect(def?.description).toBeTruthy();
				expect(def?.position).toBeDefined();
				expect(typeof def?.position.x).toBe("number");
				expect(typeof def?.position.y).toBe("number");
				expect(typeof def?.position.z).toBe("number");
			}
		});
	});

	describe("WEAPON_CATEGORIES", () => {
		it("should define all weapon categories", () => {
			expect(WEAPON_CATEGORIES).toContain("PISTOL");
			expect(WEAPON_CATEGORIES).toContain("RIFLE");
			expect(WEAPON_CATEGORIES).toContain("SHOTGUN");
			expect(WEAPON_CATEGORIES).toContain("SMG");
			expect(WEAPON_CATEGORIES).toContain("LMG");
			expect(WEAPON_CATEGORIES).toContain("LAUNCHER");
		});

		it("should have 6 weapon categories", () => {
			expect(WEAPON_CATEGORIES).toHaveLength(6);
		});

		it("should have matching category definitions", () => {
			for (const category of WEAPON_CATEGORIES) {
				const def = WEAPON_CATEGORY_DEFS.find((c) => c.id === category);
				expect(def).toBeDefined();
				expect(def?.name).toBeTruthy();
				expect(def?.description).toBeTruthy();
				expect(def?.defaultSlot).toBeDefined();
			}
		});
	});

	describe("BUILD_CATEGORIES", () => {
		it("should define all build categories", () => {
			expect(BUILD_CATEGORIES).toContain("FOUNDATION");
			expect(BUILD_CATEGORIES).toContain("WALLS");
			expect(BUILD_CATEGORIES).toContain("ROOF");
			expect(BUILD_CATEGORIES).toContain("DEFENSE");
			expect(BUILD_CATEGORIES).toContain("UTILITY");
			expect(BUILD_CATEGORIES).toContain("COMFORT");
		});

		it("should have 6 build categories", () => {
			expect(BUILD_CATEGORIES).toHaveLength(6);
		});

		it("should have matching category definitions with icons", () => {
			for (const category of BUILD_CATEGORIES) {
				const def = BUILD_CATEGORY_DEFS.find((c) => c.id === category);
				expect(def).toBeDefined();
				expect(def?.name).toBeTruthy();
				expect(def?.description).toBeTruthy();
				expect(def?.icon).toBeTruthy();
			}
		});
	});

	describe("SHOP_CATEGORIES", () => {
		it("should define all shop categories", () => {
			expect(SHOP_CATEGORIES).toContain("WEAPON");
			expect(SHOP_CATEGORIES).toContain("ATTACHMENT");
			expect(SHOP_CATEGORIES).toContain("GEAR");
			expect(SHOP_CATEGORIES).toContain("UPGRADE");
			expect(SHOP_CATEGORIES).toContain("CONSUMABLE");
		});

		it("should have 5 shop categories", () => {
			expect(SHOP_CATEGORIES).toHaveLength(5);
		});

		it("should have matching category definitions", () => {
			for (const category of SHOP_CATEGORIES) {
				const def = SHOP_CATEGORY_DEFS.find((c) => c.id === category);
				expect(def).toBeDefined();
				expect(def?.name).toBeTruthy();
				expect(def?.description).toBeTruthy();
			}
		});
	});

	describe("GADGET_TYPES", () => {
		it("should define all gadget types", () => {
			expect(GADGET_TYPES).toContain("GRENADE");
			expect(GADGET_TYPES).toContain("MINE");
			expect(GADGET_TYPES).toContain("FLARE");
			expect(GADGET_TYPES).toContain("MEDKIT");
			expect(GADGET_TYPES).toContain("RADIO");
			expect(GADGET_TYPES).toContain("CLAYMORE_CLAM");
		});

		it("should have 6 gadget types", () => {
			expect(GADGET_TYPES).toHaveLength(6);
		});

		it("should have matching type definitions with gameplay values", () => {
			for (const gadgetType of GADGET_TYPES) {
				const def = GADGET_TYPE_DEFS.find((g) => g.id === gadgetType);
				expect(def).toBeDefined();
				expect(def?.name).toBeTruthy();
				expect(def?.description).toBeTruthy();
				expect(def?.maxCarry).toBeGreaterThan(0);
				expect(typeof def?.cooldown).toBe("number");
			}
		});
	});

	describe("Helper Functions", () => {
		describe("getEquipmentSlotDef", () => {
			it("should return slot definition for valid slot", () => {
				const def = getEquipmentSlotDef("PRIMARY_WEAPON");
				expect(def).toBeDefined();
				expect(def?.id).toBe("PRIMARY_WEAPON");
			});

			it("should return undefined for invalid slot", () => {
				const def = getEquipmentSlotDef("INVALID_SLOT" as any);
				expect(def).toBeUndefined();
			});
		});

		describe("getAttachmentSlotDef", () => {
			it("should return slot definition for valid slot", () => {
				const def = getAttachmentSlotDef("OPTIC");
				expect(def).toBeDefined();
				expect(def?.id).toBe("OPTIC");
			});

			it("should return undefined for invalid slot", () => {
				const def = getAttachmentSlotDef("INVALID_SLOT" as any);
				expect(def).toBeUndefined();
			});
		});

		describe("getWeaponCategoryDef", () => {
			it("should return category definition for valid category", () => {
				const def = getWeaponCategoryDef("RIFLE");
				expect(def).toBeDefined();
				expect(def?.id).toBe("RIFLE");
			});

			it("should return undefined for invalid category", () => {
				const def = getWeaponCategoryDef("INVALID_CATEGORY" as any);
				expect(def).toBeUndefined();
			});
		});

		describe("getBuildCategoryDef", () => {
			it("should return category definition for valid category", () => {
				const def = getBuildCategoryDef("FOUNDATION");
				expect(def).toBeDefined();
				expect(def?.id).toBe("FOUNDATION");
			});

			it("should return undefined for invalid category", () => {
				const def = getBuildCategoryDef("INVALID_CATEGORY" as any);
				expect(def).toBeUndefined();
			});
		});

		describe("getGadgetTypeDef", () => {
			it("should return gadget definition for valid type", () => {
				const def = getGadgetTypeDef("GRENADE");
				expect(def).toBeDefined();
				expect(def?.id).toBe("GRENADE");
			});

			it("should return undefined for invalid type", () => {
				const def = getGadgetTypeDef("INVALID_TYPE" as any);
				expect(def).toBeUndefined();
			});
		});

		describe("canWeaponFitSlot", () => {
			it("should allow pistols in secondary weapon slot", () => {
				expect(canWeaponFitSlot("PISTOL", "SECONDARY_WEAPON")).toBe(true);
			});

			it("should allow rifles in primary weapon slot", () => {
				expect(canWeaponFitSlot("RIFLE", "PRIMARY_WEAPON")).toBe(true);
			});

			it("should not allow rifles in secondary weapon slot", () => {
				expect(canWeaponFitSlot("RIFLE", "SECONDARY_WEAPON")).toBe(false);
			});

			it("should not allow weapons in non-weapon slots", () => {
				expect(canWeaponFitSlot("PISTOL", "HEADGEAR")).toBe(false);
				expect(canWeaponFitSlot("RIFLE", "VEST")).toBe(false);
			});

			it("should handle invalid slots gracefully", () => {
				expect(canWeaponFitSlot("PISTOL", "INVALID_SLOT" as any)).toBe(false);
			});
		});

		describe("getDefaultSlotForWeapon", () => {
			it("should return SECONDARY_WEAPON for pistols", () => {
				expect(getDefaultSlotForWeapon("PISTOL")).toBe("SECONDARY_WEAPON");
			});

			it("should return PRIMARY_WEAPON for rifles", () => {
				expect(getDefaultSlotForWeapon("RIFLE")).toBe("PRIMARY_WEAPON");
			});

			it("should return PRIMARY_WEAPON for shotguns", () => {
				expect(getDefaultSlotForWeapon("SHOTGUN")).toBe("PRIMARY_WEAPON");
			});

			it("should return PRIMARY_WEAPON for SMGs", () => {
				expect(getDefaultSlotForWeapon("SMG")).toBe("PRIMARY_WEAPON");
			});

			it("should return PRIMARY_WEAPON for LMGs", () => {
				expect(getDefaultSlotForWeapon("LMG")).toBe("PRIMARY_WEAPON");
			});

			it("should return PRIMARY_WEAPON for launchers", () => {
				expect(getDefaultSlotForWeapon("LAUNCHER")).toBe("PRIMARY_WEAPON");
			});

			it("should default to PRIMARY_WEAPON for unknown categories", () => {
				expect(getDefaultSlotForWeapon("UNKNOWN" as any)).toBe("PRIMARY_WEAPON");
			});
		});
	});
});
