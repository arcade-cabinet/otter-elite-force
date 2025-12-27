/**
 * Game Store / State Management
 * Shared configurations for characters, weapons, and game state
 */

export interface CharacterGear {
	headgear: "none" | "bandana" | "beret" | "helmet";
	vest: "tactical" | "heavy";
	backgear: "none" | "radio" | "scuba";
	weaponId: string;
}

export interface CharacterTraits {
	id: string;
	name: string;
	furColor: string;
	eyeColor: string;
	whiskerLength: number;
	grizzled: boolean;
	baseSpeed: number;
	baseHealth: number;
	climbSpeed: number;
}

export interface WeaponConfig {
	id: string;
	name: string;
	visualType: "PISTOL_GRIP" | "FISH_CANNON" | "BUBBLE_GUN";
	damage: number;
	fireRate: number;
	bulletSpeed: number;
}

export const WEAPONS: Record<string, WeaponConfig> = {
	"service-pistol": {
		id: "service-pistol",
		name: "Service Pistol",
		visualType: "PISTOL_GRIP",
		damage: 1,
		fireRate: 0.5,
		bulletSpeed: 20,
	},
	"fish-cannon": {
		id: "fish-cannon",
		name: "Fish Cannon",
		visualType: "FISH_CANNON",
		damage: 5,
		fireRate: 2,
		bulletSpeed: 10,
	},
	"bubble-gun": {
		id: "bubble-gun",
		name: "Bubble Gun",
		visualType: "BUBBLE_GUN",
		damage: 0.5,
		fireRate: 0.1,
		bulletSpeed: 15,
	},
};
