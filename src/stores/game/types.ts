import type { ChunkData, DifficultyMode, GameMode, PlacedComponent } from "../types";

export interface ModeActions {
	setMode: (mode: GameMode) => void;
	setDifficulty: (difficulty: DifficultyMode) => void;
}

export interface PlayerActions {
	takeDamage: (amount: number, direction?: { x: number; y: number }) => void;
	heal: (amount: number) => void;
	addKill: () => void;
	resetStats: () => void;
	setMud: (amount: number) => void;
	setPlayerPos: (pos: [number, number, number]) => void;
	setCarryingClam: (isCarrying: boolean) => void;
	setPilotingRaft: (isPiloting: boolean, raftId?: string | null) => void;
	setFallTriggered: (active: boolean) => void;
	triggerFall: () => void;
}

export interface WorldActions {
	setBuildMode: (active: boolean) => void;
	discoverChunk: (x: number, z: number) => ChunkData;
	getNearbyChunks: (x: number, z: number) => ChunkData[];
	secureChunk: (chunkId: string) => void;
}

export interface CharacterActions {
	selectCharacter: (id: string) => void;
	unlockCharacter: (id: string) => void;
	rescueCharacter: (id: string) => void;
}

export interface EconomyActions {
	addCoins: (amount: number) => void;
	spendCoins: (amount: number) => boolean;
	buyUpgrade: (type: "speed" | "health" | "damage", cost: number) => void;
	upgradeWeapon: (id: string, cost: number) => void;
	unlockWeapon: (id: string) => void;
	collectSpoils: (type: "credit" | "clam") => void;
	completeStrategic: (type: "peacekeeping") => void;
}

export interface SaveActions {
	loadData: () => void;
	saveGame: () => void;
	resetData: () => void;
	gainXP: (amount: number) => void;
	setLevel: (levelId: number) => void;
}

export interface BaseActions {
	secureLZ: () => void;
	placeComponent: (component: Omit<PlacedComponent, "id">) => void;
	removeComponent: (id: string) => void;
}

export interface UIActions {
	toggleZoom: () => void;
}

export interface GameStateActions extends 
	ModeActions, 
	PlayerActions, 
	WorldActions, 
	CharacterActions, 
	EconomyActions, 
	SaveActions, 
	BaseActions, 
	UIActions {}

export type GameStore = import("./initialState").GameStateProperties & GameStateActions;
