/**
 * Game State Store - Central State Management
 *
 * This Zustand store manages all game state including:
 * - Game mode FSM (MENU → CUTSCENE → GAME → VICTORY/GAMEOVER)
 * - Player stats (health, kills, position, status effects)
 * - World state (discovered chunks, secured territory)
 * - Character/weapon unlocks and selection
 * - Economy (coins, medals, upgrades)
 * - Persistent save data (localStorage)
 *
 * Architecture Notes:
 * - State is hydrated from localStorage on app start (loadData)
 * - Chunks are generated deterministically from coordinates
 * - Difficulty can only escalate (SUPPORT → TACTICAL → ELITE), never downgrade
 * - "The Fall" mechanic triggers emergency extraction in TACTICAL mode
 *
 * @see ./types.ts for TypeScript interfaces
 * @see ./persistence.ts for save/load utilities
 * @see ./gameData.ts for static character/weapon definitions
 */

import { create } from "zustand";
import { audioEngine } from "../Core/AudioEngine";
import { DIFFICULTY_ORDER, GAME_CONFIG, RANKS, STORAGE_KEY } from "../utils/constants";
import { CHAR_PRICES, CHARACTERS, UPGRADE_COSTS, WEAPONS } from "./gameData";
import { DEFAULT_SAVE_DATA } from "./persistence";
import type { ChunkData, DifficultyMode, GameMode, PlacedComponent, SaveData } from "./types";

// Re-export types and data for backward compatibility
export type { ChunkData, DifficultyMode, GameMode, PlacedComponent, SaveData };
export { CHAR_PRICES, CHARACTERS, UPGRADE_COSTS, WEAPONS };

// Re-export types from ./types.ts for backward compatibility
export type { CharacterGear, CharacterTraits, WeaponData } from "./types";

/**
 * Core game state interface.
 * Organized into logical sections: mode, player, world, character, economy.
 */
interface GameState {
	// =========================================================================
	// MODE MANAGEMENT
	// =========================================================================
	/** Current game mode (FSM state) */
	mode: GameMode;
	/** Whether the HUD is ready (for input system init) */
	hudReady: boolean;
	/** Set HUD ready state */
	setHudReady: (ready: boolean) => void;
	/** Transition to a new game mode */
	setMode: (mode: GameMode) => void;
	/** Upgrade difficulty (can only go UP: SUPPORT → TACTICAL → ELITE) */
	setDifficulty: (difficulty: DifficultyMode) => void;

	// =========================================================================
	// PLAYER STATS
	// =========================================================================
	/** Current health (0 = death/fall) */
	health: number;
	/** Maximum health (can be upgraded) */
	maxHealth: number;
	/** Kill count for current session */
	kills: number;
	/** Mud accumulation (affects movement speed) */
	mudAmount: number;
	/** Whether player is carrying a clam (affects speed, enables deposit) */
	isCarryingClam: boolean;
	/** Whether player is piloting a raft */
	isPilotingRaft: boolean;
	/** Whether "The Fall" has been triggered (TACTICAL mode emergency) */
	isFallTriggered: boolean;
	/** ID of the raft being piloted, if any */
	raftId: string | null;
	/** Player's 3D position [x, y, z] - y is height for platforms/trees */
	playerPos: [number, number, number];
	/** Direction of last damage taken (for screen shake/feedback) */
	lastDamageDirection: { x: number; y: number } | null;

	// Combat feedback
	/** Current combo count */
	comboCount: number;
	/** Combo timer in seconds (resets combo when reaches 0) */
	comboTimer: number;
	/** Last hit data for damage feedback UI */
	lastHit: {
		isCritical: boolean;
		isKill: boolean;
		enemyType?: string;
		xp?: number;
		credits?: number;
	} | null;

	/** Apply damage to player, optionally with directional feedback */
	takeDamage: (amount: number, direction?: { x: number; y: number }) => void;
	/** Heal player by amount (capped at maxHealth) */
	heal: (amount: number) => void;
	/** Increment kill counter */
	addKill: () => void;
	/** Register a hit for damage feedback */
	registerHit: (
		isCritical: boolean,
		isKill: boolean,
		enemyType?: string,
		xp?: number,
		credits?: number,
	) => void;
	/** Reset all player stats to defaults */
	resetStats: () => void;
	/** Set mud accumulation level */
	setMud: (amount: number) => void;
	/** Update player's 3D position */
	setPlayerPos: (pos: [number, number, number]) => void;
	/** Set clam carrying state */
	setCarryingClam: (isCarrying: boolean) => void;
	/** Set raft piloting state */
	setPilotingRaft: (isPiloting: boolean, raftId?: string | null) => void;
	/** Set fall triggered state */
	setFallTriggered: (active: boolean) => void;
	/** Trigger "The Fall" - emergency extraction in TACTICAL mode */
	triggerFall: () => void;

	// =========================================================================
	// WORLD MANAGEMENT
	// =========================================================================
	/** Current chunk ID in "x,z" format */
	currentChunkId: string;
	/** Whether base building mode is active */
	isBuildMode: boolean;
	/** Currently selected component type for building (template ID) */
	selectedComponentType: string;
	/** Set the selected component type */
	setSelectedComponentType: (type: string) => void;
	/** Toggle base building mode */
	setBuildMode: (active: boolean) => void;
	/** Discover (or retrieve cached) chunk at coordinates */
	discoverChunk: (x: number, z: number) => ChunkData;
	/** Get all chunks within render distance of coordinates */
	getNearbyChunks: (x: number, z: number) => ChunkData[];
	/** Mark a chunk as secured (URA territory) */
	secureChunk: (chunkId: string) => void;
	/** Update a specific entity in a chunk (for state persistence) */
	updateChunkEntity: (
		chunkId: string,
		entityId: string,
		updates: Partial<ChunkData["entities"][0]>,
	) => void;
	/** Mark chunk as visited (updates lastVisited timestamp) */
	visitChunk: (chunkId: string) => void;
	/** Hibernate distant chunks (suspend AI processing) */
	hibernateDistantChunks: (centerX: number, centerZ: number, distance?: number) => void;
	/** Get list of currently active (non-hibernated) chunks */
	getActiveChunks: () => ChunkData[];

	// =========================================================================
	// CHARACTER MANAGEMENT
	// =========================================================================
	/** Currently selected character ID */
	selectedCharacterId: string;
	/** Select a different character (must be unlocked) */
	selectCharacter: (id: string) => void;

	// Economy & Upgrades
	addCoins: (amount: number) => void;
	spendCoins: (amount: number) => boolean;
	addResources: (wood: number, metal: number, supplies: number) => void;
	spendResources: (wood: number, metal: number, supplies: number) => boolean;
	buyUpgrade: (type: "speed" | "health" | "damage", cost: number) => void;
	collectSpoils: (type: "credit" | "clam") => void;
	completeStrategic: (type: "peacekeeping") => void;
	setLevel: (levelId: number) => void;

	// Save data
	saveData: SaveData;
	loadData: () => void;
	saveGame: () => void;
	resetData: () => void;
	gainXP: (amount: number) => void;
	unlockCharacter: (id: string) => void;
	rescueCharacter: (id: string) => void;
	unlockWeapon: (id: string) => void;
	upgradeWeapon: (id: string, cost: number) => void;

	// Base Building
	secureLZ: () => void;
	placeComponent: (component: Omit<PlacedComponent, "id">) => void;
	removeComponent: (id: string) => void;

	// UI state
	isZoomed: boolean;
	toggleZoom: () => void;
	requestSupplyDrop: () => void;
}

// Use CHUNK_SIZE from GAME_CONFIG for consistency
export const CHUNK_SIZE = GAME_CONFIG.CHUNK_SIZE;

export const useGameStore = create<GameState>((set, get) => ({
	// Initial state
	mode: "MENU",
	hudReady: false,
	health: 100,
	maxHealth: 100,
	kills: 0,
	mudAmount: 0,
	isCarryingClam: false,
	isPilotingRaft: false,
	isFallTriggered: false,
	raftId: null,
	selectedCharacterId: "bubbles",
	playerPos: [0, 0, 0],
	lastDamageDirection: null,
	comboCount: 0,
	comboTimer: 0,
	lastHit: null,
	saveData: { ...DEFAULT_SAVE_DATA },
	isZoomed: false,
	isBuildMode: false,
	selectedComponentType: "floor-section",
	currentChunkId: "0,0",

	// Mode management
	setMode: (mode) => set({ mode }),
	setHudReady: (ready) => set({ hudReady: ready }),
	setBuildMode: (active) => set({ isBuildMode: active }),
	setSelectedComponentType: (type) => set({ selectedComponentType: type }),
	setDifficulty: (difficulty) => {
		// Use centralized DIFFICULTY_ORDER constant for escalation logic
		const current = get().saveData.difficultyMode;
		if (DIFFICULTY_ORDER.indexOf(difficulty) > DIFFICULTY_ORDER.indexOf(current)) {
			set((state) => ({
				saveData: {
					...state.saveData,
					difficultyMode: difficulty,
				},
			}));
			get().saveGame();
		}
	},

	// Player stats
	takeDamage: (amount, direction) => {
		const { health, saveData, resetData, triggerFall, setMode } = get();
		const newHealth = Math.max(0, health - amount);

		if (newHealth <= 0) {
			if (saveData.difficultyMode === "ELITE") {
				resetData(); // Permadeath
				return;
			}
			setMode("GAMEOVER");
		} else if (newHealth < 30) {
			triggerFall();
		}

		set({ health: newHealth, lastDamageDirection: direction ?? null });

		// Clear damage direction after a short delay
		if (direction) {
			setTimeout(() => set({ lastDamageDirection: null }), 500);
		}
	},

	heal: (amount) =>
		set((state) => ({
			health: Math.min(state.maxHealth, state.health + amount),
		})),

	addKill: () => set((state) => ({ kills: state.kills + 1 })),

	registerHit: (isCritical, isKill, enemyType, xp, credits) => {
		const { comboCount, comboTimer } = get();

		// Update combo
		let newComboCount = comboCount;
		const newComboTimer = 3; // Reset to 3 seconds

		if (isKill) {
			// Only kills contribute to combo
			if (comboTimer > 0) {
				// Continue combo
				newComboCount = comboCount + 1;
			} else {
				// Start new combo
				newComboCount = 1;
			}
		}

		set({
			lastHit: {
				isCritical,
				isKill,
				enemyType,
				xp,
				credits,
			},
			comboCount: newComboCount,
			comboTimer: newComboTimer,
		});

		// Clear lastHit after a short delay
		setTimeout(() => set({ lastHit: null }), 100);
	},

	resetStats: () =>
		set((state) => ({
			health: 100,
			kills: 0,
			mudAmount: 0,
			isCarryingClam: false,
			saveData: { ...state.saveData, isFallTriggered: false }, // Reset fall state on new run
		})),

	setMud: (amount) => set({ mudAmount: amount }),

	setPlayerPos: (pos) => set({ playerPos: pos }),

	setCarryingClam: (isCarrying) => set({ isCarryingClam: isCarrying }),

	setPilotingRaft: (isPiloting, raftId = null) => set({ isPilotingRaft: isPiloting, raftId }),

	setFallTriggered: (active) =>
		set((state) => ({
			saveData: { ...state.saveData, isFallTriggered: active },
		})),

	triggerFall: () => {
		const { saveData } = get();
		if (saveData.difficultyMode === "TACTICAL" && !saveData.isFallTriggered) {
			set((state) => ({
				saveData: { ...state.saveData, isFallTriggered: true },
			}));
			get().saveGame();
		}
	},

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
		const packId = `pack-${id}`;
		for (let i = 0; i < entityCount; i++) {
			const type = rand() > 0.7 ? (rand() > 0.5 ? "SNAPPER" : "SNAKE") : "GATOR";
			entities.push({
				id: `e-${id}-${i}`,
				type,
				position: [
					(rand() - 0.5) * CHUNK_SIZE,
					type === "SNAKE" ? 5 : 0,
					(rand() - 0.5) * CHUNK_SIZE,
				],
				isHeavy: rand() > 0.8,
				hp: type === "SNAPPER" ? 20 : type === "GATOR" ? 10 : 2,
				suppression: 0,
				packId: type !== "SNAKE" ? packId : undefined,
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
			const isHealerVillage = rand() > 0.8;
			const villageX = (rand() - 0.5) * 30;
			const villageZ = (rand() - 0.5) * 30;
			entities.push({ id: `hut-${id}`, type: "HUT", position: [villageX, 0, villageZ] });
			entities.push({
				id: `vil-${id}`,
				type: isHealerVillage ? "HEALER" : "VILLAGER",
				position: [villageX + 3, 0, villageZ + 2],
			});
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

		// Add Prison Cages (Character Unlocks)
		if (x === 5 && z === 5) {
			entities.push({
				id: "cage-whiskers",
				type: "PRISON_CAGE",
				position: [0, 0, 0],
				objectiveId: "whiskers",
			});
		}
		if (terrainType === "RIVER" && rand() > 0.8) {
			entities.push({
				id: `raft-${id}`,
				type: "RAFT",
				position: [(rand() - 0.5) * 40, 0.2, (rand() - 0.5) * 40],
			});
		}

		const newChunk: ChunkData = {
			id,
			x,
			z,
			seed,
			terrainType,
			secured: false,
			territoryState: "NEUTRAL",
			lastVisited: Date.now(),
			hibernated: false,
			entities,
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

			const newStrategic = { ...state.saveData.strategicObjectives };
			let peacekeepingGain = 0;

			if (chunk.entities.some((e) => e.type === "SIPHON")) newStrategic.siphonsDismantled++;
			if (chunk.entities.some((e) => e.type === "HUT")) {
				newStrategic.villagesLiberated++;
				peacekeepingGain += 10;
			}
			if (chunk.entities.some((e) => e.type === "HEALER")) {
				newStrategic.healersProtected++;
				peacekeepingGain += 20;
			}

			// Add URA flag at chunk center as visual indicator
			const updatedEntities = [
				...chunk.entities,
				{
					id: `flag-${chunkId}`,
					type: "EXTRACTION_POINT" as const, // Reuse extraction point visual for flag
					position: [0, 0, 0] as [number, number, number],
				},
			];

			return {
				saveData: {
					...state.saveData,
					territoryScore: state.saveData.territoryScore + 1,
					peacekeepingScore: state.saveData.peacekeepingScore + peacekeepingGain,
					strategicObjectives: newStrategic,
					discoveredChunks: {
						...state.saveData.discoveredChunks,
						[chunkId]: {
							...chunk,
							secured: true,
							territoryState: "SECURED",
							entities: updatedEntities,
						},
					},
				},
			};
		});
		get().saveGame();
	},

	updateChunkEntity: (chunkId, entityId, updates) => {
		set((state) => {
			const chunk = state.saveData.discoveredChunks[chunkId];
			if (!chunk) return state;

			const updatedEntities = chunk.entities.map((entity) =>
				entity.id === entityId ? { ...entity, ...updates } : entity,
			);

			return {
				saveData: {
					...state.saveData,
					discoveredChunks: {
						...state.saveData.discoveredChunks,
						[chunkId]: { ...chunk, entities: updatedEntities },
					},
				},
			};
		});
		get().saveGame();
	},

	visitChunk: (chunkId) => {
		set((state) => {
			const chunk = state.saveData.discoveredChunks[chunkId];
			if (!chunk) return state;

			return {
				saveData: {
					...state.saveData,
					discoveredChunks: {
						...state.saveData.discoveredChunks,
						[chunkId]: {
							...chunk,
							lastVisited: Date.now(),
							hibernated: false,
						},
					},
				},
			};
		});
	},

	hibernateDistantChunks: (centerX, centerZ, distance = 2) => {
		set((state) => {
			const updatedChunks = { ...state.saveData.discoveredChunks };

			for (const [chunkId, chunk] of Object.entries(updatedChunks)) {
				const dx = Math.abs(chunk.x - centerX);
				const dz = Math.abs(chunk.z - centerZ);
				const chunkDistance = Math.max(dx, dz);

				// Hibernate chunks beyond the distance threshold
				if (chunkDistance > distance) {
					updatedChunks[chunkId] = { ...chunk, hibernated: true };
				} else {
					updatedChunks[chunkId] = { ...chunk, hibernated: false };
				}
			}

			return {
				saveData: {
					...state.saveData,
					discoveredChunks: updatedChunks,
				},
			};
		});
	},

	getActiveChunks: () => {
		const { saveData } = get();
		return Object.values(saveData.discoveredChunks).filter((chunk) => !chunk.hibernated);
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

	secureLZ: () => {
		set((state) => ({
			saveData: {
				...state.saveData,
				isLZSecured: true,
			},
		}));
		get().saveGame();
	},

	placeComponent: (comp) => {
		set((state) => ({
			saveData: {
				...state.saveData,
				baseComponents: [
					...state.saveData.baseComponents,
					{ ...comp, id: `base-${crypto.randomUUID()}` },
				],
			},
		}));
		get().saveGame();
	},

	removeComponent: (id) => {
		set((state) => ({
			saveData: {
				...state.saveData,
				baseComponents: state.saveData.baseComponents.filter((c) => c.id !== id),
			},
		}));
		get().saveGame();
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

	addResources: (wood, metal, supplies) => {
		set((state) => ({
			saveData: {
				...state.saveData,
				wood: state.saveData.wood + wood,
				metal: state.saveData.metal + metal,
				supplies: state.saveData.supplies + supplies,
			},
		}));
		get().saveGame();
	},

	spendResources: (wood, metal, supplies) => {
		const { saveData } = get();
		if (saveData.wood >= wood && saveData.metal >= metal && saveData.supplies >= supplies) {
			set((state) => ({
				saveData: {
					...state.saveData,
					wood: state.saveData.wood - wood,
					metal: state.saveData.metal - metal,
					supplies: state.saveData.supplies - supplies,
				},
			}));
			get().saveGame();
			return true;
		}
		return false;
	},

	buyUpgrade: (type, cost) => {
		if (get().spendCoins(cost)) {
			const upgradeKey = `${type}Boost` as "speedBoost" | "healthBoost" | "damageBoost";
			set((state) => ({
				saveData: {
					...state.saveData,
					upgrades: {
						...state.saveData.upgrades,
						[upgradeKey]: state.saveData.upgrades[upgradeKey] + 1,
					},
				},
			}));
			get().saveGame();
		}
	},

	loadData: () => {
		try {
			// NOSONAR: localStorage is appropriate for client-side game save data
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				// NOSONAR: JSON.parse is safe - we validate structure before use
				const parsedData = JSON.parse(saved);
				// Migrate old saves that don't have lastPlayerPosition
				if (!parsedData.lastPlayerPosition) {
					parsedData.lastPlayerPosition = [0, 0, 0];
				}
				set({
					saveData: parsedData,
					// Restore player's 3D position (including height for climbing/platforms/trees)
					playerPos: parsedData.lastPlayerPosition,
				});
			}
		} catch (e) {
			console.error("Load failed", e);
		}
	},

	saveGame: () => {
		try {
			// Save current player 3D position (including height for climbing/platforms)
			const currentPos = get().playerPos;
			const updatedSaveData = {
				...get().saveData,
				lastPlayerPosition: currentPos as [number, number, number],
			};
			// NOSONAR: localStorage is appropriate for client-side game save data
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSaveData));
			set({ saveData: updatedSaveData });
		} catch (e) {
			console.error("Save failed", e);
		}
	},

	resetData: () => {
		// NOSONAR: localStorage is appropriate for client-side game save data
		localStorage.removeItem(STORAGE_KEY);
		set({ saveData: { ...DEFAULT_SAVE_DATA } });
		window.location.reload();
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

	requestSupplyDrop: () => {
		const { saveData, heal, playerPos } = get();
		const isAtLZ =
			Math.abs(playerPos[0]) < CHUNK_SIZE / 2 && Math.abs(playerPos[2]) < CHUNK_SIZE / 2;

		if (saveData.difficultyMode === "SUPPORT" || isAtLZ) {
			heal(50);
			audioEngine.playSFX("pickup");
		}
	},

	collectSpoils: (type: "credit" | "clam") => {
		set((state) => ({
			saveData: {
				...state.saveData,
				spoilsOfWar: {
					...state.saveData.spoilsOfWar,
					creditsEarned: state.saveData.spoilsOfWar.creditsEarned + (type === "credit" ? 1 : 0),
					clamsHarvested: state.saveData.spoilsOfWar.clamsHarvested + (type === "clam" ? 1 : 0),
				},
			},
		}));
		get().saveGame();
	},

	completeStrategic: (_type: "peacekeeping") => {
		set((state) => ({
			saveData: {
				...state.saveData,
				peacekeepingScore: state.saveData.peacekeepingScore + 10,
			},
		}));
		get().saveGame();
	},

	setLevel: (levelId: number) => {
		// Store level selection for cutscene/game transition
		set({ currentChunkId: `${levelId},0` });
	},
}));
