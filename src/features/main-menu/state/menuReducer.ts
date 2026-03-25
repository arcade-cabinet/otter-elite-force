/**
 * Menu State Reducer
 * Pure business logic - no React, no UI
 */

import type { MenuAction, MenuState } from "../types/menu.types";

export const initialMenuState: MenuState = {
	currentScreen: "main",
	selectedDifficulty: null,
	hasSaveData: false,
	isLoading: false,
};

export function menuReducer(state: MenuState, action: MenuAction): MenuState {
	switch (action.type) {
		case "NEW_GAME":
			return {
				...state,
				currentScreen: "difficulty",
				selectedDifficulty: null,
			};

		case "SELECT_DIFFICULTY":
			return {
				...state,
				selectedDifficulty: action.payload?.difficulty ?? null,
			};

		case "CONFIRM_START":
			if (!state.selectedDifficulty) return state;
			return {
				...state,
				isLoading: true,
			};

		case "CONTINUE":
			if (!state.hasSaveData) return state;
			return {
				...state,
				isLoading: true,
			};

		case "GO_BACK":
			return {
				...state,
				currentScreen: "main",
				selectedDifficulty: null,
			};

		case "OPEN_CANTEEN":
			return {
				...state,
				isLoading: true,
			};

		default:
			return state;
	}
}
