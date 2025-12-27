import { beforeEach, describe, expect, it } from "vitest";
import { useGameStore } from "../stores/gameStore";

describe("gameStore", () => {
	beforeEach(() => {
		const store = useGameStore.getState();
		store.resetStats();
	});

	it("should initialize with default values", () => {
		const state = useGameStore.getState();
		expect(state.mode).toBe("MENU");
		expect(state.health).toBe(100);
		expect(state.kills).toBe(0);
	});

	it("should update mode", () => {
		const store = useGameStore.getState();
		store.setMode("GAME");
		expect(useGameStore.getState().mode).toBe("GAME");
	});

	it("should take damage correctly", () => {
		const store = useGameStore.getState();
		store.takeDamage(20);
		expect(useGameStore.getState().health).toBe(80);
	});

	it("should not go below zero health", () => {
		const store = useGameStore.getState();
		store.takeDamage(120);
		expect(useGameStore.getState().health).toBe(0);
	});

	it("should heal correctly", () => {
		const store = useGameStore.getState();
		store.takeDamage(50);
		store.heal(20);
		expect(useGameStore.getState().health).toBe(70);
	});

	it("should not exceed max health", () => {
		const store = useGameStore.getState();
		store.heal(50);
		expect(useGameStore.getState().health).toBe(100);
	});

	it("should increment kills", () => {
		const store = useGameStore.getState();
		store.addKill();
		expect(useGameStore.getState().kills).toBe(1);
	});
});
