import type { CharacterGear, CharacterTraits, WeaponData } from "./types";

export const WEAPONS: Record<string, WeaponData> = {
	"service-pistol": {
		id: "service-pistol",
		name: "SERVICE PISTOL",
		type: "PISTOL",
		damage: 2,
		fireRate: 0.4,
		bulletSpeed: 60,
		recoil: 0.02,
		range: 30,
		visualType: "PISTOL_GRIP",
	},
	"fish-cannon": {
		id: "fish-cannon",
		name: "HEAVY FISH-CANNON",
		type: "MACHINE_GUN",
		damage: 1,
		fireRate: 0.1,
		bulletSpeed: 90,
		recoil: 0.05,
		range: 50,
		visualType: "FISH_CANNON",
	},
	"bubble-gun": {
		id: "bubble-gun",
		name: "BUBBLE SNIPER",
		type: "RIFLE",
		damage: 5,
		fireRate: 0.8,
		bulletSpeed: 120,
		recoil: 0.08,
		range: 80,
		visualType: "BUBBLE_GUN",
	},
};

export const CHARACTERS: Record<string, { traits: CharacterTraits; gear: CharacterGear }> = {
	bubbles: {
		traits: {
			id: "bubbles",
			name: "SGT. BUBBLES",
			furColor: "#5D4037",
			eyeColor: "#111",
			whiskerLength: 0.3,
			grizzled: false,
			baseSpeed: 14,
			baseHealth: 100,
			climbSpeed: 10,
		},
		gear: {
			headgear: "bandana",
			vest: "tactical",
			backgear: "radio",
			weaponId: "service-pistol",
		},
	},
	whiskers: {
		traits: {
			id: "whiskers",
			name: "GEN. WHISKERS",
			furColor: "#8D6E63",
			eyeColor: "#222",
			whiskerLength: 0.8,
			grizzled: true,
			baseSpeed: 10,
			baseHealth: 200,
			climbSpeed: 6,
			unlockRequirement: "Rescue from Prison Camp (Coordinate 5, 5)",
		},
		gear: {
			headgear: "beret",
			vest: "heavy",
			backgear: "none",
			weaponId: "fish-cannon",
		},
	},
	splash: {
		traits: {
			id: "splash",
			name: "CPL. SPLASH",
			furColor: "#4E342E",
			eyeColor: "#00ccff",
			whiskerLength: 0.2,
			grizzled: false,
			baseSpeed: 18,
			baseHealth: 80,
			climbSpeed: 15,
			unlockRequirement: "Secure the Silt-shadow Crossing",
		},
		gear: {
			headgear: "helmet",
			vest: "tactical",
			backgear: "scuba",
			weaponId: "bubble-gun",
		},
	},
	fang: {
		traits: {
			id: "fang",
			name: "SGT. FANG",
			furColor: "#333",
			eyeColor: "#ff0000",
			whiskerLength: 0.4,
			grizzled: true,
			baseSpeed: 12,
			baseHealth: 150,
			climbSpeed: 8,
			unlockRequirement: "Recover the Ancestral Clam",
		},
		gear: {
			headgear: "none",
			vest: "heavy",
			backgear: "none",
			weaponId: "fish-cannon",
		},
	},
};

export const UPGRADE_COSTS = {
	speed: 200,
	health: 200,
	damage: 300,
};

export const CHAR_PRICES: Record<string, number> = {
	bubbles: 0,
	whiskers: 1000,
	splash: 500,
	fang: 750,
};
