import type { StateCreator } from "zustand";
import type { GameStore, PlayerActions } from "../types";

export const createPlayerSlice: StateCreator<GameStore, [], [], PlayerActions> = (set, get) => ({
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
		set((state: GameStore) => ({
			health: Math.min(state.maxHealth, state.health + amount),
		})),

	addKill: () => set((state: GameStore) => ({ kills: state.kills + 1 })),

	resetStats: () =>
		set((state: GameStore) => ({
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
		set((state: GameStore) => ({
			saveData: { ...state.saveData, isFallTriggered: active },
		})),

	triggerFall: () => {
		const { saveData } = get();
		if (saveData.difficultyMode === "TACTICAL" && !saveData.isFallTriggered) {
			set((state: GameStore) => ({
				saveData: { ...state.saveData, isFallTriggered: true },
			}));
			get().saveGame();
		}
	},
});
