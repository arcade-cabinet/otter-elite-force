/**
 * Weapon Templates - ECS Entity Definitions
 *
 * These define weapon entities that get spawned into the ECS world.
 * The old constants approach is replaced with proper ECS entities.
 */

// =============================================================================
// WEAPON COMPONENT TYPES
// =============================================================================

export interface WeaponStats {
	damage: number;
	fireRate: number;
	accuracy: number;
	recoil: number;
	range: number;
	magazineSize: number;
	bulletSpeed: number;
}

export interface WeaponTemplate {
	id: string;
	name: string;
	category: "PISTOL" | "RIFLE" | "SHOTGUN" | "SMG" | "LMG" | "LAUNCHER";
	stats: WeaponStats;
	meshParts: {
		receiver: string;
		barrel: string;
		stock: string | null;
		grip: string;
		magazine: string;
	};
	attachmentSlots: Array<"OPTIC" | "BARREL" | "GRIP" | "MAGAZINE">;
	cost: number;
	unlockRequirement: string | null;
}

// =============================================================================
// WEAPON TEMPLATES (Spawn definitions)
// =============================================================================

export const WEAPON_TEMPLATES: WeaponTemplate[] = [
	// === PISTOLS ===
	{
		id: "fish-cannon",
		name: "Fish Cannon",
		category: "PISTOL",
		stats: {
			damage: 8,
			fireRate: 0.3,
			accuracy: 0.7,
			recoil: 0.15,
			range: 25,
			magazineSize: 12,
			bulletSpeed: 40,
		},
		meshParts: {
			receiver: "RECEIVER_PISTOL",
			barrel: "BARREL_SHORT",
			stock: null,
			grip: "GRIP_PISTOL",
			magazine: "MAGAZINE_BOX",
		},
		attachmentSlots: ["BARREL", "MAGAZINE"],
		cost: 0, // Starting weapon
		unlockRequirement: null,
	},
	{
		id: "silt-needle",
		name: "Silt Needle",
		category: "PISTOL",
		stats: {
			damage: 3,
			fireRate: 0.25,
			accuracy: 0.95,
			recoil: 0.01,
			range: 50,
			magazineSize: 20,
			bulletSpeed: 60,
		},
		meshParts: {
			receiver: "RECEIVER_PISTOL",
			barrel: "BARREL_LONG",
			stock: null,
			grip: "GRIP_PISTOL",
			magazine: "MAGAZINE_BOX",
		},
		attachmentSlots: ["BARREL", "OPTIC", "MAGAZINE"],
		cost: 200,
		unlockRequirement: "Rescue Medic Marina",
	},

	// === RIFLES ===
	{
		id: "mud-rifle",
		name: "Mud Rifle",
		category: "RIFLE",
		stats: {
			damage: 15,
			fireRate: 0.5,
			accuracy: 0.85,
			recoil: 0.25,
			range: 60,
			magazineSize: 20,
			bulletSpeed: 55,
		},
		meshParts: {
			receiver: "RECEIVER_RIFLE",
			barrel: "BARREL_LONG",
			stock: "STOCK_WOOD",
			grip: "GRIP_VERTICAL",
			magazine: "MAGAZINE_BOX",
		},
		attachmentSlots: ["OPTIC", "BARREL", "GRIP", "MAGAZINE"],
		cost: 150,
		unlockRequirement: null,
	},
	{
		id: "reed-sniper",
		name: "Reed Sniper",
		category: "RIFLE",
		stats: {
			damage: 45,
			fireRate: 1.2,
			accuracy: 0.98,
			recoil: 0.4,
			range: 100,
			magazineSize: 5,
			bulletSpeed: 80,
		},
		meshParts: {
			receiver: "RECEIVER_RIFLE",
			barrel: "BARREL_LONG",
			stock: "STOCK_TACTICAL",
			grip: "GRIP_VERTICAL",
			magazine: "MAGAZINE_BOX",
		},
		attachmentSlots: ["OPTIC", "BARREL"],
		cost: 400,
		unlockRequirement: "Secure 3 Territories",
	},

	// === SHOTGUNS ===
	{
		id: "scatter-shell",
		name: "Scatter Shell",
		category: "SHOTGUN",
		stats: {
			damage: 25,
			fireRate: 0.8,
			accuracy: 0.5,
			recoil: 0.5,
			range: 15,
			magazineSize: 6,
			bulletSpeed: 30,
		},
		meshParts: {
			receiver: "RECEIVER_SHOTGUN",
			barrel: "BARREL_DOUBLE",
			stock: "STOCK_WOOD",
			grip: "GRIP_PISTOL",
			magazine: "MAGAZINE_BOX",
		},
		attachmentSlots: ["BARREL", "GRIP"],
		cost: 200,
		unlockRequirement: null,
	},

	// === SMGs ===
	{
		id: "delta-spray",
		name: "Delta Spray",
		category: "SMG",
		stats: {
			damage: 6,
			fireRate: 0.08,
			accuracy: 0.6,
			recoil: 0.2,
			range: 30,
			magazineSize: 35,
			bulletSpeed: 45,
		},
		meshParts: {
			receiver: "RECEIVER_PISTOL",
			barrel: "BARREL_SHORT",
			stock: "STOCK_TACTICAL",
			grip: "GRIP_VERTICAL",
			magazine: "MAGAZINE_BOX",
		},
		attachmentSlots: ["OPTIC", "BARREL", "GRIP", "MAGAZINE"],
		cost: 250,
		unlockRequirement: "Rescue Sapper Muskrat",
	},

	// === LMGs ===
	{
		id: "swamp-suppressor",
		name: "Swamp Suppressor",
		category: "LMG",
		stats: {
			damage: 10,
			fireRate: 0.1,
			accuracy: 0.55,
			recoil: 0.12,
			range: 45,
			magazineSize: 100,
			bulletSpeed: 50,
		},
		meshParts: {
			receiver: "RECEIVER_RIFLE",
			barrel: "BARREL_LONG",
			stock: "STOCK_TACTICAL",
			grip: "GRIP_VERTICAL",
			magazine: "MAGAZINE_DRUM",
		},
		attachmentSlots: ["BARREL", "OPTIC", "GRIP"],
		cost: 500,
		unlockRequirement: "Secure 5 Territories",
	},

	// === LAUNCHERS ===
	{
		id: "clam-mortar",
		name: "Clam Mortar",
		category: "LAUNCHER",
		stats: {
			damage: 80,
			fireRate: 2.0,
			accuracy: 0.4,
			recoil: 0.8,
			range: 40,
			magazineSize: 1,
			bulletSpeed: 25,
		},
		meshParts: {
			receiver: "RECEIVER_SHOTGUN",
			barrel: "BARREL_SHORT",
			stock: "STOCK_WOOD",
			grip: "GRIP_PISTOL",
			magazine: "MAGAZINE_BOX",
		},
		attachmentSlots: ["OPTIC"],
		cost: 600,
		unlockRequirement: "Destroy The Great Siphon",
	},
];

// =============================================================================
// ATTACHMENT TEMPLATES
// =============================================================================

export interface AttachmentTemplate {
	id: string;
	name: string;
	slot: "OPTIC" | "BARREL" | "GRIP" | "MAGAZINE";
	statModifiers: Partial<WeaponStats>;
	meshId: string;
	compatibleCategories: WeaponTemplate["category"][];
	cost: number;
	unlockRequirement: string | null;
}

export const ATTACHMENT_TEMPLATES: AttachmentTemplate[] = [
	// Optics
	{
		id: "iron-sights",
		name: "Iron Sights",
		slot: "OPTIC",
		statModifiers: {},
		meshId: "SCOPE_IRON",
		compatibleCategories: ["PISTOL", "RIFLE", "SHOTGUN", "SMG", "LMG"],
		cost: 0,
		unlockRequirement: null,
	},
	{
		id: "red-dot",
		name: "Red Dot Sight",
		slot: "OPTIC",
		statModifiers: { accuracy: 0.1 },
		meshId: "SCOPE_RED_DOT",
		compatibleCategories: ["RIFLE", "SMG", "LMG"],
		cost: 75,
		unlockRequirement: null,
	},
	{
		id: "scope-4x",
		name: "4x Scope",
		slot: "OPTIC",
		statModifiers: { accuracy: 0.15, range: 20 },
		meshId: "SCOPE_RED_DOT",
		compatibleCategories: ["RIFLE"],
		cost: 150,
		unlockRequirement: null,
	},

	// Barrels
	{
		id: "suppressor",
		name: "Suppressor",
		slot: "BARREL",
		statModifiers: { damage: -2, range: -5 },
		meshId: "BARREL_LONG",
		compatibleCategories: ["PISTOL", "RIFLE", "SMG"],
		cost: 100,
		unlockRequirement: null,
	},
	{
		id: "extended-barrel",
		name: "Extended Barrel",
		slot: "BARREL",
		statModifiers: { range: 10, accuracy: 0.05 },
		meshId: "BARREL_LONG",
		compatibleCategories: ["PISTOL", "RIFLE", "SHOTGUN", "SMG"],
		cost: 80,
		unlockRequirement: null,
	},

	// Grips
	{
		id: "foregrip",
		name: "Foregrip",
		slot: "GRIP",
		statModifiers: { recoil: -0.1, accuracy: 0.05 },
		meshId: "GRIP_VERTICAL",
		compatibleCategories: ["RIFLE", "SMG", "LMG"],
		cost: 60,
		unlockRequirement: null,
	},

	// Magazines
	{
		id: "extended-mag",
		name: "Extended Magazine",
		slot: "MAGAZINE",
		statModifiers: { magazineSize: 10 },
		meshId: "MAGAZINE_BOX",
		compatibleCategories: ["PISTOL", "RIFLE", "SMG"],
		cost: 50,
		unlockRequirement: null,
	},
	{
		id: "drum-mag",
		name: "Drum Magazine",
		slot: "MAGAZINE",
		statModifiers: { magazineSize: 30, recoil: 0.05 },
		meshId: "MAGAZINE_DRUM",
		compatibleCategories: ["RIFLE", "SMG", "LMG"],
		cost: 120,
		unlockRequirement: "Secure 2 Territories",
	},
];

// =============================================================================
// EQUIPMENT TEMPLATES
// =============================================================================

export interface EquipmentTemplate {
	id: string;
	name: string;
	slot: "HEADGEAR" | "VEST" | "BACKPACK";
	statModifiers: {
		armor?: number;
		speed?: number;
		capacity?: number;
		health?: number;
	};
	meshId: string;
	cost: number;
	unlockRequirement: string | null;
}

export const EQUIPMENT_TEMPLATES: EquipmentTemplate[] = [
	// Headgear
	{
		id: "bandana",
		name: "Bandana",
		slot: "HEADGEAR",
		statModifiers: {},
		meshId: "HELMET_BANDANA",
		cost: 0,
		unlockRequirement: null,
	},
	{
		id: "standard-helmet",
		name: "Standard Helmet",
		slot: "HEADGEAR",
		statModifiers: { armor: 5 },
		meshId: "HELMET_STANDARD",
		cost: 50,
		unlockRequirement: null,
	},

	// Vests
	{
		id: "light-vest",
		name: "Light Vest",
		slot: "VEST",
		statModifiers: { armor: 10 },
		meshId: "VEST_LIGHT",
		cost: 0,
		unlockRequirement: null,
	},
	{
		id: "tactical-vest",
		name: "Tactical Vest",
		slot: "VEST",
		statModifiers: { armor: 25, speed: -0.1 },
		meshId: "VEST_TACTICAL",
		cost: 150,
		unlockRequirement: null,
	},

	// Backpacks
	{
		id: "radio-pack",
		name: "Radio Pack",
		slot: "BACKPACK",
		statModifiers: {},
		meshId: "BACKPACK_RADIO",
		cost: 0,
		unlockRequirement: null,
	},
	{
		id: "medic-pack",
		name: "Medic Pack",
		slot: "BACKPACK",
		statModifiers: { health: 25 },
		meshId: "BACKPACK_MEDIC",
		cost: 100,
		unlockRequirement: "Rescue Medic Marina",
	},
	{
		id: "scuba-pack",
		name: "Scuba Pack",
		slot: "BACKPACK",
		statModifiers: { speed: 0.2 },
		meshId: "BACKPACK_SCUBA",
		cost: 200,
		unlockRequirement: null,
	},
];

// =============================================================================
// TEMPLATE QUERIES (Replace old constant lookups)
// =============================================================================

export function getWeaponTemplate(id: string): WeaponTemplate | undefined {
	return WEAPON_TEMPLATES.find((w) => w.id === id);
}

export function getAttachmentTemplate(id: string): AttachmentTemplate | undefined {
	return ATTACHMENT_TEMPLATES.find((a) => a.id === id);
}

export function getEquipmentTemplate(id: string): EquipmentTemplate | undefined {
	return EQUIPMENT_TEMPLATES.find((e) => e.id === id);
}

export function getUnlockedWeapons(unlockedRequirements: Set<string>): WeaponTemplate[] {
	return WEAPON_TEMPLATES.filter(
		(w) => !w.unlockRequirement || unlockedRequirements.has(w.unlockRequirement),
	);
}

export function getCompatibleAttachments(
	weaponCategory: WeaponTemplate["category"],
	slot?: AttachmentTemplate["slot"],
): AttachmentTemplate[] {
	return ATTACHMENT_TEMPLATES.filter(
		(a) =>
			a.compatibleCategories.includes(weaponCategory) && (slot === undefined || a.slot === slot),
	);
}

// =============================================================================
// CALCULATE FINAL STATS (with attachments applied)
// =============================================================================

export function calculateFinalStats(weaponId: string, attachmentIds: string[]): WeaponStats | null {
	const weapon = getWeaponTemplate(weaponId);
	if (!weapon) return null;

	const stats = { ...weapon.stats };

	for (const attachmentId of attachmentIds) {
		const attachment = getAttachmentTemplate(attachmentId);
		if (!attachment) continue;

		// Apply modifiers
		for (const [key, value] of Object.entries(attachment.statModifiers)) {
			const statKey = key as keyof WeaponStats;
			if (statKey in stats && typeof value === "number") {
				stats[statKey] += value;
			}
		}
	}

	// Clamp values
	stats.accuracy = Math.max(0, Math.min(1, stats.accuracy));
	stats.recoil = Math.max(0, stats.recoil);
	stats.damage = Math.max(1, stats.damage);
	stats.magazineSize = Math.max(1, Math.floor(stats.magazineSize));

	return stats;
}
