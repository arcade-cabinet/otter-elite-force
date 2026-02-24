/**
 * Main Menu Feature - Type Definitions
 */

export type DifficultyMode = "SUPPORT" | "TACTICAL" | "ELITE";

export interface MenuState {
currentScreen: "main" | "difficulty" | "loading";
selectedDifficulty: DifficultyMode | null;
hasSaveData: boolean;
isLoading: boolean;
}

export interface MenuAction {
type: "NEW_GAME" | "CONTINUE" | "SELECT_DIFFICULTY" | "CONFIRM_START" | "GO_BACK" | "OPEN_CANTEEN";
payload?: {
difficulty?: DifficultyMode;
};
}
