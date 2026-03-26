import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createWorld } from "koota";
import { initSingletons } from "@/ecs/singletons";
import { SkirmishSession } from "@/ecs/traits/state";
import { closeDatabase, InMemoryDatabase, setDatabase } from "@/persistence/database";
import {
	applySkirmishConfigToWorld,
	createDefaultSkirmishConfig,
	loadSkirmishConfig,
	saveSkirmishConfig,
	updateSkirmishSeedPhrase,
} from "./persistence";

describe("features/skirmish/persistence", () => {
	beforeEach(() => {
		setDatabase(new InMemoryDatabase());
	});

	afterEach(async () => {
		await closeDatabase();
	});

	it("creates default deterministic skirmish config", () => {
		const config = createDefaultSkirmishConfig();
		expect(config.seed.phrase).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/);
		expect(config.preset).toBe("meso");
	});

	it("updates exposed seed phrases deterministically", () => {
		const config = updateSkirmishSeedPhrase(createDefaultSkirmishConfig(), "Rapid Ember Heron");
		expect(config.seed.phrase).toBe("rapid-ember-heron");
		expect(config.seed.designSeed).toBeGreaterThan(0);
	});

	it("persists and reloads skirmish setup through sqlite store", async () => {
		const config = updateSkirmishSeedPhrase(createDefaultSkirmishConfig(), "rapid-ember-heron");
		await saveSkirmishConfig(config);
		const loaded = await loadSkirmishConfig();
		expect(loaded?.seed.phrase).toBe("rapid-ember-heron");
		expect(loaded?.preset).toBe(config.preset);
	});

	it("applies skirmish config into the world singleton state", () => {
		const world = createWorld();
		initSingletons(world);
		const config = updateSkirmishSeedPhrase(createDefaultSkirmishConfig(), "rapid-ember-heron");

		applySkirmishConfigToWorld(world, config);

		expect(world.get(SkirmishSession)?.active).toBe(true);
		expect(world.get(SkirmishSession)?.seedPhrase).toBe("rapid-ember-heron");
	});
});
