import { describe, expect, it } from "vitest";
import {
	createMissionSeedBundle,
	createSeedBundle,
	createSkirmishSeedPhrase,
	deriveGameplaySeed,
	deriveMissionSeedPhrase,
	normalizeSeedPhrase,
	seedPhraseToNumber,
} from "./seed";

describe("engine/random/seed", () => {
	it("normalizes seed phrases into adjective-adjective-noun style tokens", () => {
		expect(normalizeSeedPhrase("  Silent Ember Heron  ")).toBe("silent-ember-heron");
	});

	it("derives stable numeric seeds from phrases", () => {
		expect(seedPhraseToNumber("silent-ember-heron")).toBe(seedPhraseToNumber("silent-ember-heron"));
		expect(seedPhraseToNumber("silent-ember-heron")).not.toBe(
			seedPhraseToNumber("rapid-ember-heron"),
		);
	});

	it("derives stable buried mission phrases from mission ids", () => {
		expect(deriveMissionSeedPhrase("mission_1")).toBe(deriveMissionSeedPhrase("mission_1"));
		expect(deriveMissionSeedPhrase("mission_1")).not.toBe(deriveMissionSeedPhrase("mission_2"));
	});

	it("creates seed bundles with deterministic design and gameplay seeds", () => {
		const bundle = createSeedBundle({
			phrase: "silent-ember-heron",
			source: "manual",
			gameplayNamespaces: ["loot", "waves"],
		});

		expect(bundle.phrase).toBe("silent-ember-heron");
		expect(bundle.designSeed).toBe(deriveGameplaySeed(bundle.numericSeed, "design"));
		expect(bundle.gameplaySeeds.loot).toBe(deriveGameplaySeed(bundle.numericSeed, "loot"));
		expect(bundle.gameplaySeeds.waves).toBe(deriveGameplaySeed(bundle.numericSeed, "waves"));
	});

	it("creates mission seed bundles as buried deterministic seeds", () => {
		const bundle = createMissionSeedBundle("mission_7");
		expect(bundle.source).toBe("mission");
		expect(bundle.phrase).toBe(deriveMissionSeedPhrase("mission_7"));
	});

	it("creates readable exposed skirmish phrases", () => {
		expect(createSkirmishSeedPhrase(123456)).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/);
	});
});
