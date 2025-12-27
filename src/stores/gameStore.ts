import { create } from "zustand";

export type GameMode = "MENU" | "GAME" | "GAMEOVER";

interface GameState {
	mode: GameMode;
	setMode: (mode: GameMode) => void;
}

export const useGameStore = create<GameState>((set) => ({
	mode: "MENU",
	setMode: (mode) => set({ mode }),
}));
