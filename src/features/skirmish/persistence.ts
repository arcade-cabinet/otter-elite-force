import { createSeedBundle, SqlitePersistenceStore, shuffleSkirmishSeedBundle } from "@/engine";
import type { GameWorld } from "@/engine/world/gameWorld";
import { initDatabase } from "@/persistence/database";
import { SKIRMISH_MAPS, type SkirmishSessionConfig } from "./types";

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

export function applySkirmishConfigToWorld(
	_world: GameWorld,
	_config: SkirmishSessionConfig,
): void {
	// GameWorld does not use Koota singleton traits.
	// Skirmish config is applied via seedGameWorldFromSkirmishSession in the engine session layer.
	// This function is now a no-op placeholder for backward compatibility.
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
