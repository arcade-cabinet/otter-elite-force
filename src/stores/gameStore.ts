/**
 * Game State Store
 * Central state management using Zustand
 */

import { create } from "zustand";
import { LEVELS, RANKS, STORAGE_KEY } from "../utils/constants";

export type GameMode = "MENU" | "CUTSCENE" | "GAME" | "GAMEOVER" | "CANTEEN";

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

export interface CharacterGear {
	headgear?: "bandana" | "beret" | "helmet" | "none";
	vest?: "tactical" | "heavy" | "none";
	backgear?: "radio" | "scuba" | "none";
	weaponId: string;
}

export interface WeaponData {
	id: string;
	name: string;
	type: "PISTOL" | "RIFLE" | "MACHINE_GUN" | "SHOTGUN";
	damage: number;
	fireRate: number;
	bulletSpeed: number;
	recoil: number;
	range: number;
	visualType: "FISH_CANNON" | "BUBBLE_GUN" | "PISTOL_GRIP";
}

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
			weaponId: "service-pistol", // Starts with a pistol now
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
		},
		gear: {
			headgear: "none",
			vest: "heavy",
			backgear: "none",
			weaponId: "fish-cannon",
		},
	},
};

export interface ChunkData {
	id: string; // "x,z"
	x: number;
	z: number;
	seed: number;
	terrainType: "RIVER" | "MARSH" | "DENSE_JUNGLE";
	secured: boolean;
	entities: {
		id: string;
		type:
			| "GATOR"
			| "SNAKE"
			| "SNAPPER"
			| "PLATFORM"
			| "CLIMBABLE"
			| "SIPHON"
			| "OIL_SLICK"
			| "MUD_PIT"
			| "VILLAGER"
			| "HEALER"
			| "HUT"
			| "GAS_STOCKPILE"
			| "CLAM_BASKET"
			| "EXTRACTION_POINT"
			| "RAFT";
		position: [number, number, number];
		isHeavy?: boolean;
		objectiveId?: string;
		hp?: number;
		suppression?: number;
		captured?: boolean;
	}[];
	decorations: {
		id: string;
		type: "REED" | "LILYPAD" | "DEBRIS" | "BURNT_TREE" | "MANGROVE" | "DRUM";
		count: number;
	}[];
}

interface SaveData {
	rank: number;
	xp: number;
	medals: number;
	unlocked: number;
	unlockedCharacters: string[];
	unlockedWeapons: string[];
	coins: number;
	discoveredChunks: Record<string, ChunkData>;
	territoryScore: number;
	strategicObjectives: {
		siphonsDismantled: number;
		villagesLiberated: number;
		gasStockpilesCaptured: number;
	};
	spoilsOfWar: {
		creditsEarned: number;
		clamsHarvested: number;
		upgradesUnlocked: number;
	};
	upgrades: {
		speedBoost: number;
		healthBoost: number;
		damageBoost: number;
		weaponLvl: Record<string, number>;
	};
}

interface GameState {
	// Game mode
	mode: GameMode;
	setMode: (mode: GameMode) => void;

	// Player stats
	health: number;
	maxHealth: number;
	kills: number;
	mudAmount: number;
	isCarryingClam: boolean;
	isPilotingRaft: boolean;
	raftId: string | null;
	playerPos: [number, number, number];
	
	takeDamage: (amount: number) => void;
	heal: (amount: number) => void;
	addKill: () => void;
	resetStats: () => void;
	setMud: (amount: number) => void;
	setPlayerPos: (pos: [number, number, number]) => void;
	setCarryingClam: (isCarrying: boolean) => void;
	setPilotingRaft: (isPiloting: boolean, raftId?: string | null) => void;

	// World management
	currentChunkId: string;
	discoverChunk: (x: number, z: number) => ChunkData;
	getNearbyChunks: (x: number, z: number) => ChunkData[];
	secureChunk: (chunkId: string) => void;

	// Character management
	selectedCharacterId: string;
	selectCharacter: (id: string) => void;

	// Economy & Upgrades
	addCoins: (amount: number) => void;
	spendCoins: (amount: number) => boolean;
	buyUpgrade: (type: "speed" | "health" | "damage", cost: number) => void;

	// Save data
	saveData: SaveData;
	loadData: () => void;
	saveGame: () => void;
	resetData: () => void;
	gainXP: (amount: number) => void;
	unlockCharacter: (id: string) => void;
	unlockWeapon: (id: string) => void;
	upgradeWeapon: (id: string, cost: number) => void;

	// UI state
	isZoomed: boolean;
	toggleZoom: () => void;
}

export const CHUNK_SIZE = 100;

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

const DEFAULT_SAVE_DATA: SaveData = {
	rank: 0,
	xp: 0,
	medals: 0,
	unlocked: 1,
	unlockedCharacters: ["bubbles"],
	unlockedWeapons: ["service-pistol"],
	coins: 0,
	discoveredChunks: {},
	territoryScore: 0,
	strategicObjectives: {
		siphonsDismantled: 0,
		villagesLiberated: 0,
		gasStockpilesCaptured: 0,
	},
	spoilsOfWar: {
		creditsEarned: 0,
		clamsHarvested: 0,
		upgradesUnlocked: 0,
	},
	upgrades: {
		speedBoost: 0,
		healthBoost: 0,
		damageBoost: 0,
		weaponLvl: {
			"service-pistol": 1,
			"fish-cannon": 1,
			"bubble-gun": 1,
		},
	},
};

export const useGameStore = create<GameState>((set, get) => ({
	// Initial state
	mode: "MENU",
	health: 100,
	maxHealth: 100,
	kills: 0,
	mudAmount: 0,
	isCarryingClam: false,
	isPilotingRaft: false,
	raftId: null,
	selectedCharacterId: "bubbles",
	playerPos: [0, 0, 0],
	saveData: { ...DEFAULT_SAVE_DATA },
	isZoomed: false,
	currentChunkId: "0,0",

	// Mode management
	setMode: (mode) => set({ mode }),

	// Player stats
	takeDamage: (amount) =>
		set((state) => ({
			health: Math.max(0, state.health - amount),
		})),

	heal: (amount) =>
		set((state) => ({
			health: Math.min(state.maxHealth, state.health + amount),
		})),

	addKill: () => set((state) => ({ kills: state.kills + 1 })),

	resetStats: () => set({ health: 100, kills: 0, mudAmount: 0, isCarryingClam: false }),

	setMud: (amount) => set({ mudAmount: amount }),

	setPlayerPos: (pos) => set({ playerPos: pos }),

	setCarryingClam: (isCarrying) => set({ isCarryingClam: isCarrying }),

	setPilotingRaft: (isPiloting, raftId = null) => set({ isPilotingRaft: isPiloting, raftId }),

	// World management
	discoverChunk: (x, z) => {
		const id = `${x},${z}`;
		const { saveData } = get();

		if (saveData.discoveredChunks[id]) {
			return saveData.discoveredChunks[id];
		}

		// Generate new chunk
		const seed = Math.abs(x * 31 + z * 17);
		const pseudoRandom = () => {
			let s = seed;
			return () => {
				s = (s * 9301 + 49297) % 233280;
				return s / 233280;
			};
		};
		const rand = pseudoRandom();

		const terrainTypes: ChunkData["terrainType"][] = ["RIVER", "MARSH", "DENSE_JUNGLE"];
		const terrainType = terrainTypes[Math.floor(rand() * terrainTypes.length)];

		const entities: ChunkData["entities"] = [];
		
		// Add Predators
		const entityCount = Math.floor(rand() * 5) + 2;
		for (let i = 0; i < entityCount; i++) {
			const type = rand() > 0.7 ? (rand() > 0.5 ? "SNAPPER" : "SNAKE") : "GATOR";
			entities.push({
				id: `e-${id}-${i}`,
				type,
				position: [(rand() - 0.5) * CHUNK_SIZE, type === "SNAKE" ? 5 : 0, (rand() - 0.5) * CHUNK_SIZE],
				isHeavy: rand() > 0.8,
				hp: type === "SNAPPER" ? 20 : (type === "GATOR" ? 10 : 2),
				suppression: 0,
			});
		}

		// Add Platforms
		const platformCount = Math.floor(rand() * 3) + 1;
		for (let i = 0; i < platformCount; i++) {
			entities.push({
				id: `p-${id}-${i}`,
				type: "PLATFORM",
				position: [(rand() - 0.5) * (CHUNK_SIZE - 20), 0.5, (rand() - 0.5) * (CHUNK_SIZE - 20)],
			});
		}

		// Add Climbables
		const climbableCount = Math.floor(rand() * 2) + 1;
		for (let i = 0; i < climbableCount; i++) {
			entities.push({
				id: `c-${id}-${i}`,
				type: "CLIMBABLE",
				position: [(rand() - 0.5) * (CHUNK_SIZE - 30), 5, (rand() - 0.5) * (CHUNK_SIZE - 30)],
			});
		}

		// Add Siphons
		if (rand() > 0.8) {
			entities.push({
				id: `siphon-${id}`,
				type: "SIPHON",
				position: [(rand() - 0.5) * 40, 0, (rand() - 0.5) * 40],
				hp: 50,
			});
		}

		// Add Gas Stockpiles (Strategic Objectives)
		if (rand() > 0.85) {
			entities.push({
				id: `gas-${id}`,
				type: "GAS_STOCKPILE",
				position: [(rand() - 0.5) * 40, 0.5, (rand() - 0.5) * 40],
				hp: 30,
			});
		}

		// Add Clam Baskets (Spoils / Booby Traps)
		if (rand() > 0.75) {
			entities.push({
				id: `basket-${id}`,
				type: "CLAM_BASKET",
				position: [(rand() - 0.5) * 35, 0.2, (rand() - 0.5) * 35],
				isHeavy: rand() > 0.5, // 50% chance to be a booby trap
			});
		}

		// Add Villagers/Huts
		if (rand() > 0.7) {
			const villageX = (rand() - 0.5) * 30;
			const villageZ = (rand() - 0.5) * 30;
			entities.push({ id: `hut-${id}`, type: "HUT", position: [villageX, 0, villageZ] });
			entities.push({ id: `vil-${id}`, type: "VILLAGER", position: [villageX + 3, 0, villageZ + 2] });
		}

		// Add Hazards
		const hazardCount = Math.floor(rand() * 2) + 1;
		for (let i = 0; i < hazardCount; i++) {
			entities.push({
				id: `h-${id}-${i}`,
				type: rand() > 0.5 ? "OIL_SLICK" : "MUD_PIT",
				position: [(rand() - 0.5) * (CHUNK_SIZE - 20), 0.05, (rand() - 0.5) * (CHUNK_SIZE - 20)],
			});
		}

		// Extraction Point at 0,0 or rare
		if (id === "0,0" || rand() > 0.98) {
			entities.push({ id: `extract-${id}`, type: "EXTRACTION_POINT", position: [0, 0, 0] });
		}

		// Add Rafts
		if (terrainType === "RIVER" && rand() > 0.8) {
			entities.push({
				id: `raft-${id}`,
				type: "RAFT",
				position: [(rand() - 0.5) * 40, 0.2, (rand() - 0.5) * 40],
			});
		}

		const newChunk: ChunkData = {
			id, x, z, seed, terrainType, secured: false, entities,
			decorations: [
				{ id: `${id}-dec-0`, type: "REED", count: Math.floor(rand() * 20) + 10 },
				{ id: `${id}-dec-1`, type: "LILYPAD", count: Math.floor(rand() * 15) + 5 },
				{ id: `${id}-dec-2`, type: "DEBRIS", count: Math.floor(rand() * 5) },
				{ id: `${id}-dec-3`, type: "BURNT_TREE", count: terrainType === "DENSE_JUNGLE" ? 15 : 5 },
				{ id: `${id}-dec-4`, type: "MANGROVE", count: terrainType === "DENSE_JUNGLE" ? 20 : 10 },
				{ id: `${id}-dec-5`, type: "DRUM", count: Math.floor(rand() * 3) },
			],
		};

		set((state) => ({
			saveData: {
				...state.saveData,
				discoveredChunks: { ...state.saveData.discoveredChunks, [id]: newChunk },
			},
		}));
		get().saveGame();
		return newChunk;
	},

	getNearbyChunks: (x, z) => {
		const nearby: ChunkData[] = [];
		for (let dx = -1; dx <= 1; dx++) {
			for (let dz = -1; dz <= 1; dz++) {
				nearby.push(get().discoverChunk(x + dx, z + dz));
			}
		}
		return nearby;
	},

	secureChunk: (chunkId) => {
		set((state) => {
			const chunk = state.saveData.discoveredChunks[chunkId];
			if (!chunk || chunk.secured) return state;
			return {
				saveData: {
					...state.saveData,
					territoryScore: state.saveData.territoryScore + 1,
					discoveredChunks: {
						...state.saveData.discoveredChunks,
						[chunkId]: { ...chunk, secured: true },
					},
				},
			};
		});
		get().saveGame();
	},

	selectCharacter: (id) => set({ selectedCharacterId: id }),

	unlockCharacter: (id) => {
		set((state) => ({
			saveData: {
				...state.saveData,
				unlockedCharacters: state.saveData.unlockedCharacters.includes(id)
					? state.saveData.unlockedCharacters
					: [...state.saveData.unlockedCharacters, id],
			},
		}));
		get().saveGame();
	},

	unlockWeapon: (id) => {
		set((state) => ({
			saveData: {
				...state.saveData,
				unlockedWeapons: state.saveData.unlockedWeapons.includes(id)
					? state.saveData.unlockedWeapons
					: [...state.saveData.unlockedWeapons, id],
			},
		}));
		get().saveGame();
	},

	upgradeWeapon: (id, cost) => {
		if (get().spendCoins(cost)) {
			set((state) => ({
				saveData: {
					...state.saveData,
					upgrades: {
						...state.saveData.upgrades,
						weaponLvl: {
							...state.saveData.upgrades.weaponLvl,
							[id]: (state.saveData.upgrades.weaponLvl[id] || 1) + 1,
						},
					},
				},
			}));
			get().saveGame();
		}
	},

	addCoins: (amount) => {
		set((state) => ({ saveData: { ...state.saveData, coins: state.saveData.coins + amount } }));
		get().saveGame();
	},

	spendCoins: (amount) => {
		const { saveData } = get();
		if (saveData.coins >= amount) {
			set((state) => ({ saveData: { ...state.saveData, coins: state.saveData.coins - amount } }));
			get().saveGame();
			return true;
		}
		return false;
	},

	buyUpgrade: (type, cost) => {
		if (get().spendCoins(cost)) {
			set((state) => ({
				saveData: {
					...state.saveData,
					upgrades: {
						...state.saveData.upgrades,
						[`${type}Boost`]: (state.saveData.upgrades as any)[`${type}Boost`] + 1,
					},
				},
			}));
			get().saveGame();
		}
	},

	loadData: () => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) set({ saveData: JSON.parse(saved) });
		} catch (e) { console.error("Load failed", e); }
	},

	saveGame: () => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(get().saveData));
		} catch (e) { console.error("Save failed", e); }
	},

	resetData: () => {
		localStorage.removeItem(STORAGE_KEY);
		set({ saveData: { ...DEFAULT_SAVE_DATA } });
		window.location.reload();
	},

	gainXP: (amount) => {
		set((state) => {
			const newXP = state.saveData.xp + amount;
			const requiredXP = (state.saveData.rank + 1) * 200;
			const newRank = newXP >= requiredXP ? Math.min(state.saveData.rank + 1, RANKS.length - 1) : state.saveData.rank;
			return { saveData: { ...state.saveData, xp: newXP, rank: newRank } };
		});
		get().saveGame();
	},

	toggleZoom: () => set((state) => ({ isZoomed: !state.isZoomed })),
}));
