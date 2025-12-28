import { DEFAULT_SAVE_DATA } from "../persistence";
import type { GameMode, SaveData } from "../types";

export interface GameStateProperties {
	mode: GameMode;
	health: number;
	maxHealth: number;
	kills: number;
	mudAmount: number;
	isCarryingClam: boolean;
	isPilotingRaft: boolean;
	isFallTriggered: boolean;
	raftId: string | null;
	selectedCharacterId: string;
	playerPos: [number, number, number];
	lastDamageDirection: { x: number; y: number } | null;
	saveData: SaveData;
	isZoomed: boolean;
	isBuildMode: boolean;
	currentChunkId: string;
}

export const INITIAL_STATE: GameStateProperties = {
	mode: "MENU",
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
	saveData: { ...DEFAULT_SAVE_DATA },
	isZoomed: false,
	isBuildMode: false,
	currentChunkId: "0,0",
};
