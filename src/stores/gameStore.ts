/**
 * Game State Store
 * Central state management using Zustand
 */

import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { RANKS } from "../utils/constants";
import {
	DEFAULT_SAVE_DATA,
	deepClone,
	loadFromLocalStorage,
	saveToLocalStorage,
} from "./persistence";
import type {
	ChunkData,
	DifficultyMode,
	GameMode,
	PlacedComponent,
	SaveData,
} from "./types";
import { CHUNK_SIZE, generateChunk } from "./worldGenerator";

/**
 * Constants for game balance and limits
 */
const MAX_CHUNK_CACHE = 50;
const MAX_UPGRADE_LEVEL = 10;
const HEALTH_LOW_THRESHOLD = 30;
const SAVE_DEBOUNCE_MS = 1000;

const WORLD_BOUNDS = 10000; // Example max coordinate

interface GameState {
	// Mode management
	mode: GameMode;
	setMode: (mode: GameMode) => void;
	setDifficulty: (difficulty: DifficultyMode) => void;

	// Player stats
	health: number;
	maxHealth: number;
	kills: number;
	mudAmount: number;
	isCarryingClam: boolean;
	isPilotingRaft: boolean;
	isEscortingVillager: boolean;
	isFallTriggered: boolean;
	raftId: string | null;
	playerPos: [number, number, number];

	takeDamage: (amount: number) => void;
	heal: (amount: number) => void;
	addKill: () => void;
	resetStats: () => void;
	setMud: (amount: number) => void;
	setPlayerPos: (pos: [number, number, number]) => void;
	setCarryingClam: (isCarrying: boolean) => void;
	setEscortingVillager: (isEscorting: boolean) => void;
	setPilotingRaft: (isPiloting: boolean, raftId?: string | null) => void;
	setFallTriggered: (active: boolean) => void;
	triggerFall: () => void; // Explicit trigger logic

	// World management
	currentChunkId: string;
	isBuildMode: boolean; // New UI state
	setBuildMode: (active: boolean) => void;
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
	saveGame: (immediate?: boolean) => void;
	resetData: () => void;
	gainXP: (amount: number) => void;
	unlockCharacter: (id: string) => void;
	rescueCharacter: (id: string) => void;
	unlockWeapon: (id: string) => void;
	upgradeWeapon: (id: string, cost: number) => void;
	collectSpoils: (type: "credit" | "clam") => void;
	completeStrategic: (type: "gas") => void;
	setLevel: (levelId: number) => void;

	// Save status
	saveTimeout: ReturnType<typeof setTimeout> | null;

	// Base Building
	secureLZ: () => void;
	placeComponent: (component: Omit<PlacedComponent, "id">) => void;
	removeComponent: (id: string) => void;

	// UI state
	isZoomed: boolean;
	toggleZoom: () => void;
}

const _saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useGameStore = create<GameState>((set, get) => ({
	// Initial state
	mode: "MENU",
	health: 100,
	maxHealth: 100,
	kills: 0,
	mudAmount: 0,
	isCarryingClam: false,
	isPilotingRaft: false,
	isEscortingVillager: false,
	isFallTriggered: false,
	raftId: null,
	selectedCharacterId: "bubbles",
	playerPos: [0, 0, 0],
	saveData: deepClone(DEFAULT_SAVE_DATA),
	isZoomed: false,
	isBuildMode: false,
	currentChunkId: "0,0",
	saveTimeout: null,

	/**
	 * Mode Management
	 */
	setMode: (mode) => set({ mode }),
	setBuildMode: (active) => set({ isBuildMode: active }),
	setDifficulty: (difficulty) => {
		const order: DifficultyMode[] = ["SUPPORT", "TACTICAL", "ELITE"];
		const current = get().saveData.difficultyMode;
		if (order.indexOf(difficulty) > order.indexOf(current)) {
			set((state) => ({
				saveData: {
					...state.saveData,
					difficultyMode: difficulty,
				},
			}));
			get().saveGame(true); // Save immediate for difficulty change
		}
	},

	/**
	 * Player Stats
	 */
	takeDamage: (amount) => {
		const { health, saveData, resetData, triggerFall, setMode } = get();
		const newHealth = Math.max(0, health - amount);

		if (newHealth <= 0) {
			if (saveData.difficultyMode === "ELITE") {
				resetData(); // Permadeath
				return;
			}
			set({ health: 0 });
			setMode("GAMEOVER");
			return;
		} else if (newHealth < HEALTH_LOW_THRESHOLD) {
			triggerFall();
		}

		set({ health: newHealth });
	},

	heal: (amount) =>
		set((state) => ({
			health: Math.min(state.maxHealth, state.health + amount),
		})),

	addKill: () => set((state) => ({ kills: state.kills + 1 })),

	resetStats: () =>
		set((state) => ({
			health: 100,
			kills: 0,
			mudAmount: 0,
			isCarryingClam: false,
			isFallTriggered: false,
			saveData: { ...state.saveData, isFallTriggered: false }, // Reset fall state on new run
		})),

	setMud: (amount) => set({ mudAmount: amount }),

	setPlayerPos: (pos) => {
		const [xPos, yPos, zPos] = pos;
		const clampedX = Math.max(-WORLD_BOUNDS, Math.min(WORLD_BOUNDS, xPos));
		const clampedZ = Math.max(-WORLD_BOUNDS, Math.min(WORLD_BOUNDS, zPos));

		const x = Math.floor(clampedX / CHUNK_SIZE);
		const z = Math.floor(clampedZ / CHUNK_SIZE);
		const currentChunkId = `${x},${z}`;
		set({ playerPos: [clampedX, yPos, clampedZ], currentChunkId });
	},

	setCarryingClam: (isCarrying) => set({ isCarryingClam: isCarrying }),

	setEscortingVillager: (isEscorting) =>
		set({ isEscortingVillager: isEscorting }),

	setPilotingRaft: (isPiloting, raftId = null) =>
		set({ isPilotingRaft: isPiloting, raftId }),

	setFallTriggered: (active) =>
		set((state) => ({
			isFallTriggered: active,
			saveData: { ...state.saveData, isFallTriggered: active },
		})),

	triggerFall: () => {
		const { saveData } = get();
		if (saveData.difficultyMode === "TACTICAL" && !saveData.isFallTriggered) {
			set((state) => ({
				isFallTriggered: true,
				saveData: { ...state.saveData, isFallTriggered: true },
			}));
			get().saveGame(true);
		}
	},

	/**
	 * World Management
	 */
	discoverChunk: (x, z) => {
		const id = `${x},${z}`;
		const { saveData } = get();

		if (saveData.discoveredChunks[id]) {
			return saveData.discoveredChunks[id];
		}

		const newChunk = generateChunk(x, z);

		set((state) => {
			const newDiscoveredChunks = {
				...state.saveData.discoveredChunks,
				[id]: newChunk,
			};

			// Chunk unloading: Keep only up to MAX_CHUNK_CACHE chunks
			const keys = Object.keys(newDiscoveredChunks);
			if (keys.length > MAX_CHUNK_CACHE) {
				const currentId = state.currentChunkId;
				const keysToRemove = keys.filter(
					(k) =>
						k !== "0,0" &&
						k !== id &&
						k !== currentId &&
						!newDiscoveredChunks[k].secured,
				);

				const excessCount = keys.length - MAX_CHUNK_CACHE;
				for (let i = 0; i < Math.min(excessCount, keysToRemove.length); i++) {
					delete newDiscoveredChunks[keysToRemove[i]];
				}
			}

			return {
				saveData: {
					...state.saveData,
					discoveredChunks: newDiscoveredChunks,
				},
			};
		});

		// Debounced save for discovery
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

			const newStrategic = { ...state.saveData.strategicObjectives };
			let peacekeepingGain = 0;

			if (chunk.entities.some((e) => e.type === "SIPHON"))
				newStrategic.siphonsDismantled++;
			if (chunk.entities.some((e) => e.type === "HUT")) {
				newStrategic.villagesLiberated++;
				peacekeepingGain += 10;
			}
			if (chunk.entities.some((e) => e.type === "HEALER")) {
				newStrategic.healersProtected++;
				peacekeepingGain += 20;
			}

			return {
				saveData: {
					...state.saveData,
					territoryScore: state.saveData.territoryScore + 1,
					peacekeepingScore:
						state.saveData.peacekeepingScore + peacekeepingGain,
					strategicObjectives: newStrategic,
					discoveredChunks: {
						...state.saveData.discoveredChunks,
						[chunkId]: { ...chunk, secured: true },
					},
				},
			};
		});
		get().saveGame(true);
	},

	/**
	 * Character Management
	 */
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
		get().saveGame(true);
	},

	rescueCharacter: (id) => {
		const { saveData } = get();
		if (!saveData.unlockedCharacters.includes(id)) {
			set((state) => ({
				saveData: {
					...state.saveData,
					strategicObjectives: {
						...state.saveData.strategicObjectives,
						alliesRescued: state.saveData.strategicObjectives.alliesRescued + 1,
					},
				},
			}));
			get().unlockCharacter(id);
		}
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
		get().saveGame(true);
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
			get().saveGame(true);
		}
	},

	/**
	 * Economy & Upgrades
	 */
	completeStrategic: (type) => {
		set((state) => {
			const newObjectives = { ...state.saveData.strategicObjectives };
			switch (type) {
				case "gas":
					newObjectives.gasStockpilesCaptured++;
					break;
			}
			return {
				saveData: {
					...state.saveData,
					strategicObjectives: newObjectives,
				},
			};
		});
		get().saveGame(true);
	},

	collectSpoils: (type) => {
		set((state) => {
			const newSpoils = { ...state.saveData.spoilsOfWar };
			switch (type) {
				case "credit":
					newSpoils.creditsEarned += 100;
					break;
				case "clam":
					newSpoils.clamsHarvested += 1;
					break;
			}
			return {
				saveData: {
					...state.saveData,
					spoilsOfWar: newSpoils,
				},
			};
		});
		get().saveGame(true);
	},

	setLevel: (levelId) => {
		const levelCoords = [
			[0, 0],
			[10, 10],
			[-20, 20],
		];
		const [x, z] = levelCoords[levelId] || [0, 0];
		get().setPlayerPos([x * CHUNK_SIZE, 0, z * CHUNK_SIZE]);
	},

	secureLZ: () => {
		set((state) => ({
			saveData: {
				...state.saveData,
				isLZSecured: true,
			},
		}));
		get().saveGame(true);
	},

	placeComponent: (comp) => {
		set((state) => ({
			saveData: {
				...state.saveData,
				baseComponents: [
					...state.saveData.baseComponents,
					{ ...comp, id: `base-${uuidv4()}` },
				],
			},
		}));
		get().saveGame();
	},

	removeComponent: (id) => {
		set((state) => ({
			saveData: {
				...state.saveData,
				baseComponents: state.saveData.baseComponents.filter(
					(c) => c.id !== id,
				),
			},
		}));
		get().saveGame(true);
	},

	addCoins: (amount) => {
		set((state) => ({
			saveData: { ...state.saveData, coins: state.saveData.coins + amount },
		}));
		get().saveGame();
	},

	spendCoins: (amount) => {
		const { saveData } = get();
		if (saveData.coins >= amount) {
			set((state) => ({
				saveData: { ...state.saveData, coins: state.saveData.coins - amount },
			}));
			return true;
		}
		return false;
	},

	buyUpgrade: (type, cost) => {
		const { saveData } = get();
		const boostKey = `${type}Boost` as
			| "speedBoost"
			| "healthBoost"
			| "damageBoost";
		const currentBoost = saveData.upgrades[boostKey];

		// Validation before spending coins
		if (typeof currentBoost !== "number") return;
		if (currentBoost >= MAX_UPGRADE_LEVEL) return;

		if (get().spendCoins(cost)) {
			set((state) => ({
				saveData: {
					...state.saveData,
					upgrades: {
						...state.saveData.upgrades,
						[boostKey]: currentBoost + 1,
					},
				},
			}));
			get().saveGame(true);
		}
	},

	/**
	 * Persistence Layer
	 */
	loadData: () => {
		const data = loadFromLocalStorage();
		if (data) set({ saveData: data });
	},

	saveGame: (immediate = false) => {
		const { saveTimeout } = get();
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}

		const performSave = () => {
			saveToLocalStorage(get().saveData);
			set({ saveTimeout: null });
		};

		if (immediate) {
			performSave();
		} else {
			const timeout = setTimeout(performSave, SAVE_DEBOUNCE_MS);
			set({ saveTimeout: timeout });
		}
	},

	resetData: () => {
		const { saveTimeout } = get();
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}
		const freshData = deepClone(DEFAULT_SAVE_DATA);
		saveToLocalStorage(freshData);
		set({
			saveData: freshData,
			health: 100,
			maxHealth: 100,
			kills: 0,
			mudAmount: 0,
			isCarryingClam: false,
			isPilotingRaft: false,
			isEscortingVillager: false,
			isFallTriggered: false,
			raftId: null,
			mode: "MENU",
			selectedCharacterId: "bubbles",
			playerPos: [0, 0, 0],
			isZoomed: false,
			isBuildMode: false,
			currentChunkId: "0,0",
			saveTimeout: null,
		});
	},

	gainXP: (amount) => {
		set((state) => {
			const newXP = state.saveData.xp + amount;
			const requiredXP = (state.saveData.rank + 1) * 200;
			const newRank =
				newXP >= requiredXP
					? Math.min(state.saveData.rank + 1, RANKS.length - 1)
					: state.saveData.rank;
			return { saveData: { ...state.saveData, xp: newXP, rank: newRank } };
		});
		get().saveGame();
	},

	toggleZoom: () => set((state) => ({ isZoomed: !state.isZoomed })),
}));
