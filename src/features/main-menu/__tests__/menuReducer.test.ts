import { describe, expect, it } from "vitest";
import { menuReducer, initialMenuState } from "../state/menuReducer";

describe("menuReducer", () => {
it("should initialize with main screen", () => {
expect(initialMenuState.currentScreen).toBe("main");
expect(initialMenuState.selectedDifficulty).toBe(null);
});

it("should transition to difficulty selection on NEW_GAME", () => {
const state = menuReducer(initialMenuState, { type: "NEW_GAME" });
expect(state.currentScreen).toBe("difficulty");
});

it("should set selected difficulty", () => {
const state = menuReducer(initialMenuState, {
type: "SELECT_DIFFICULTY",
payload: { difficulty: "TACTICAL" },
});
expect(state.selectedDifficulty).toBe("TACTICAL");
});

it("should go back to main screen", () => {
const difficultyState = menuReducer(initialMenuState, { type: "NEW_GAME" });
const backState = menuReducer(difficultyState, { type: "GO_BACK" });
expect(backState.currentScreen).toBe("main");
expect(backState.selectedDifficulty).toBe(null);
});

it("should set loading state on CONFIRM_START", () => {
const state = menuReducer(
{ ...initialMenuState, selectedDifficulty: "ELITE" },
{ type: "CONFIRM_START" },
);
expect(state.isLoading).toBe(true);
});

it("should handle CONTINUE action when save exists", () => {
const stateWithSave = { ...initialMenuState, hasSaveData: true };
const state = menuReducer(stateWithSave, { type: "CONTINUE" });
expect(state.isLoading).toBe(true);
});

it("should not allow CONTINUE without save data", () => {
const state = menuReducer(initialMenuState, { type: "CONTINUE" });
expect(state.isLoading).toBe(false);
expect(state.currentScreen).toBe("main");
});
});
