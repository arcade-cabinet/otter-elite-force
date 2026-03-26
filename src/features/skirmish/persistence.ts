import type { World } from "koota";
import { SqlitePersistenceStore, createSeedBundle, shuffleSkirmishSeedBundle } from "@/engine";
import { SkirmishSession } from "@/ecs/traits/state";
import { initDatabase } from "@/persistence/database";
import { SKIRMISH_MAPS, type SkirmishSessionConfig } from "./types";

function toWorldConfig(config: SkirmishSessionConfig) {
	return {
		active: true,
		mapId: config.mapId,
		mapName: config.mapName,
		mapPreset: config.preset,
		difficulty: config.difficulty,
		playAsScaleGuard: config.playAsScaleGuard,
		seedPhrase: config.seed.phrase,
		designSeed: config.seed.designSeed,
		gameplaySeeds: config.seed.gameplaySeeds,
		startingResources: config.startingResources,
	};
}

export async function createSkirmishPersistenceStore(): Promise<SqlitePersistenceStore> {
	await initDatabase();
	const store = new SqlitePersistenceStore();
	await store.initialize();
	return store;
}

export async function saveSkirmishConfig(config: SkirmishSessionConfig): Promise<void> {
	const store = await createSkirmishPersistenceStore();
	await store.saveSkirmishSetup({
		mapPreset: config.preset,
		seed: config.seed,
		startingResources: config.startingResources,
	});
}

export async function loadSkirmishConfig(): Promise<SkirmishSessionConfig | null> {
	const store = await createSkirmishPersistenceStore();
	const saved = await store.loadSkirmishSetup();
	if (!saved) return null;
	const map = SKIRMISH_MAPS[0];
	return {
		mapId: map.id,
		mapName: map.name,
		difficulty: "medium",
		playAsScaleGuard: false,
		preset: saved.mapPreset as SkirmishSessionConfig["preset"],
		seed: saved.seed,
		startingResources: saved.startingResources,
	};
}

export function createDefaultSkirmishConfig(): SkirmishSessionConfig {
	const seed = shuffleSkirmishSeedBundle();
	const map = SKIRMISH_MAPS[0];
	return {
		mapId: map.id,
		mapName: map.name,
		difficulty: "medium",
		playAsScaleGuard: false,
		preset: "meso",
		seed,
		startingResources: { fish: 300, timber: 200, salvage: 100 },
	};
}

export function applySkirmishConfigToWorld(world: World, config: SkirmishSessionConfig): void {
	world.set(SkirmishSession, toWorldConfig(config));
}

export function updateSkirmishSeedPhrase(
	config: SkirmishSessionConfig,
	seedPhrase: string,
): SkirmishSessionConfig {
	return {
		...config,
		seed: createSeedBundle({
			phrase: seedPhrase,
			source: "skirmish",
		}),
	};
}
