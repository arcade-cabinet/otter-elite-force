/**
 * SolidJS GameBridge — reactive bridge between game loop and Solid UI.
 *
 * Uses Solid createSignal/createStore for fine-grained reactive HUD updates.
 * The game loop calls syncFromWorld() at the end of each tick inside batch()
 * to coalesce all signal updates into a single reactive propagation.
 *
 * No polling interval — Solid components react to signal changes automatically.
 */

import { batch, createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";
import type { GameWorld } from "../world/gameWorld";
import { Faction, Flags, Health, Selection } from "../world/components";
import type {
	AlertViewModel,
	BossViewModel,
	DialogueViewModel,
	GameBridgeState,
	ObjectiveViewModel,
	PopulationViewModel,
	ResourceViewModel,
	SelectionViewModel,
} from "./gameBridge";

// Re-export view model types for consumers
export type {
	AlertViewModel,
	BossViewModel,
	DialogueViewModel,
	ObjectiveViewModel,
	PopulationViewModel,
	ResourceViewModel,
	SelectionViewModel,
};

/**
 * Solid-reactive bridge state. Each field is either a signal accessor
 * or a store accessor for fine-grained reactivity.
 */
export interface SolidBridgeAccessors {
	/** Current screen (game, paused, menu, etc.) */
	screen: () => string;
	/** Resource counts (fish, timber, salvage) */
	resources: ResourceViewModel;
	/** Population current/max */
	population: PopulationViewModel;
	/** Currently selected entities, or null */
	selection: () => SelectionViewModel | null;
	/** Active mission objectives */
	objectives: ObjectiveViewModel[];
	/** Tactical alerts */
	alerts: AlertViewModel[];
	/** Active dialogue, or null */
	dialogue: () => DialogueViewModel | null;
	/** Current weather state */
	weather: () => "clear" | "rain" | "monsoon" | null;
	/** Boss health bar data, or null */
	boss: () => BossViewModel | null;
}

/**
 * Emit methods — dispatch commands from UI back to the game runtime.
 * These are called by Solid HUD components.
 */
export interface SolidBridgeEmit {
	pause(): void;
	resume(): void;
	saveGame(): void;
	startBuild(buildingId: string): void;
	queueUnit(unitId: string): void;
	issueResearch(researchId: string): void;
	setScreen(screen: string): void;
}

/**
 * Full SolidJS bridge — accessors for reading + emit for writing + sync for game loop.
 */
export interface SolidBridge {
	/** Reactive accessors for Solid components */
	readonly accessors: SolidBridgeAccessors;
	/** Command dispatch methods for UI → game */
	readonly emit: SolidBridgeEmit;
	/** Called from game loop at end of each tick to push world state into signals */
	syncFromWorld(world: GameWorld): void;
	/** Get the current non-reactive snapshot (for legacy compatibility) */
	snapshot(): GameBridgeState;
}

/**
 * Create a SolidJS-reactive bridge.
 *
 * Usage in game loop:
 *   const bridge = createSolidBridge();
 *   // Each tick:
 *   bridge.syncFromWorld(world);
 *
 * Usage in Solid components:
 *   const { accessors } = bridge;
 *   return <div>{accessors.resources.fish}</div>;
 */
export function createSolidBridge(): SolidBridge {
	// --- Signals for primitive/nullable values ---
	const [screen, setScreen] = createSignal("game");
	const [selection, setSelection] = createSignal<SelectionViewModel | null>(null);
	const [dialogue, setDialogue] = createSignal<DialogueViewModel | null>(null);
	const [weather, setWeather] = createSignal<"clear" | "rain" | "monsoon" | null>(null);
	const [boss, setBoss] = createSignal<BossViewModel | null>(null);

	// --- Stores for complex objects (fine-grained nested reactivity) ---
	const [resources, setResources] = createStore<ResourceViewModel>({
		fish: 0,
		timber: 0,
		salvage: 0,
	});

	const [population, setPopulation] = createStore<PopulationViewModel>({
		current: 0,
		max: 0,
	});

	const [objectives, setObjectives] = createStore<ObjectiveViewModel[]>([]);
	const [alerts, setAlerts] = createStore<AlertViewModel[]>([]);

	// --- Command queue (UI → game loop) ---
	const commandQueue: Array<{ type: string; payload?: Record<string, unknown> }> = [];

	function enqueueCommand(type: string, payload?: Record<string, unknown>): void {
		commandQueue.push({ type, payload });
	}

	// --- Sync: game loop pushes world state into signals ---
	function syncFromWorld(world: GameWorld): void {
		batch(() => {
			// Screen / phase
			setScreen(world.session.phase === "paused" ? "paused" : "game");

			// Resources
			setResources("fish", world.session.resources.fish);
			setResources("timber", world.session.resources.timber);
			setResources("salvage", world.session.resources.salvage);

			// Population: count alive player entities and buildings with pop capacity
			let popCurrent = 0;
			let popMax = 0;
			for (const eid of world.runtime.alive) {
				if (Faction.id[eid] === 1 && Flags.isBuilding[eid] === 0 && Flags.isResource[eid] === 0) {
					popCurrent++;
				}
				// Buildings contribute to pop cap (simplified: each player building adds 5)
				if (Faction.id[eid] === 1 && Flags.isBuilding[eid] === 1) {
					popMax += 5;
				}
			}
			setPopulation("current", popCurrent);
			setPopulation("max", Math.max(popMax, 10)); // minimum pop cap of 10

			// Selection
			const selectedIds: number[] = [];
			let primaryLabel = "No selection";
			for (const eid of world.runtime.alive) {
				if (Selection.selected[eid] === 1) {
					selectedIds.push(eid);
					if (selectedIds.length === 1) {
						primaryLabel = world.runtime.entityTypeIndex.get(eid) ?? "Unit";
					}
				}
			}
			if (selectedIds.length > 0) {
				if (selectedIds.length > 1) {
					primaryLabel = `${selectedIds.length} units selected`;
				}
				setSelection({ entityIds: selectedIds, primaryLabel });
			} else {
				setSelection(null);
			}

			// Objectives
			const worldObjectives = world.session.objectives;
			if (worldObjectives.length !== objectives.length) {
				setObjectives(
					worldObjectives.map((o) => ({
						id: o.id,
						description: o.description,
						status: o.status,
					})),
				);
			} else {
				for (let i = 0; i < worldObjectives.length; i++) {
					const wo = worldObjectives[i];
					if (objectives[i]?.status !== wo.status) {
						setObjectives(i, "status", wo.status);
					}
				}
			}

			// Alerts — extract from world events
			const newAlerts: AlertViewModel[] = [];
			for (const event of world.events) {
				if (event.type === "hud-alert" && event.payload) {
					newAlerts.push({
						id: `alert-${world.time.tick}-${newAlerts.length}`,
						severity: (event.payload.severity as AlertViewModel["severity"]) ?? "info",
						message: (event.payload.message as string) ?? "",
					});
				}
			}
			if (newAlerts.length > 0) {
				setAlerts(
					produce((arr) => {
						arr.push(...newAlerts);
						// Keep last 10 alerts
						while (arr.length > 10) {
							arr.shift();
						}
					}),
				);
			}

			// Dialogue
			if (world.session.dialogue?.active && world.session.dialogue.lines.length > 0) {
				setDialogue({
					lines: world.session.dialogue.lines.map((l) => ({
						speaker: l.speaker,
						text: l.text,
					})),
				});
			} else {
				setDialogue(null);
			}

			// Weather
			setWeather(world.runtime.weather === "clear" ? null : world.runtime.weather);

			// Boss — find any entity tagged as boss with health
			let foundBoss: BossViewModel | null = null;
			for (const [_eid, config] of world.runtime.bossConfigs) {
				const bossConfig = config as { name?: string; eid?: number };
				const bossEid = bossConfig.eid ?? _eid;
				if (world.runtime.alive.has(bossEid)) {
					foundBoss = {
						name: bossConfig.name ?? "Boss",
						currentHp: Health.current[bossEid],
						maxHp: Health.max[bossEid],
					};
					break;
				}
			}
			setBoss(foundBoss);
		});
	}

	function snapshot(): GameBridgeState {
		return {
			screen: screen(),
			resources: { ...resources },
			population: { ...population },
			selection: selection(),
			objectives: [...objectives],
			alerts: [...alerts],
			dialogue: dialogue(),
			weather: weather(),
			boss: boss(),
		};
	}

	return {
		accessors: {
			screen,
			resources,
			population,
			selection,
			objectives,
			alerts,
			dialogue,
			weather,
			boss,
		},
		emit: {
			pause(): void {
				enqueueCommand("pause");
			},
			resume(): void {
				enqueueCommand("resume");
			},
			saveGame(): void {
				enqueueCommand("save");
			},
			startBuild(buildingId: string): void {
				enqueueCommand("startBuild", { buildingId });
			},
			queueUnit(unitId: string): void {
				enqueueCommand("queueUnit", { unitId });
			},
			issueResearch(researchId: string): void {
				enqueueCommand("issueResearch", { researchId });
			},
			setScreen(s: string): void {
				setScreen(s);
			},
		},
		syncFromWorld,
		snapshot,
	};
}
