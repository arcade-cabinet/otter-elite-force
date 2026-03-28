import { createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { SkirmishAI } from "@/ai/skirmishAI";
import { createSkirmishGameAdapter } from "@/ai/skirmishGameAdapter";
import type { SkirmishSessionConfig } from "@/features/skirmish/types";
import { TacticalHUD } from "@/solid/hud/TacticalHUD";
import { createGameBridge } from "../bridge/gameBridge";
import { createSolidBridge } from "../bridge/solidBridge";
import {
	persistDiagnosticSnapshot,
	recordDiagnosticEvent,
	syncGameWorldDiagnostics,
} from "../diagnostics/runtimeDiagnostics";
import { createEmptyDiagnosticsSnapshot } from "../diagnostics/types";
import { createSeedBundle } from "../random/seed";
import { createRuntimeMissionFlow } from "../session/runtimeMissionFlow";
import { createSystemPipeline } from "../session/systemPipeline";
import {
	createCampaignRuntimeSession,
	createSkirmishRuntimeSession,
	describeCampaignRuntimeSession,
	describeSkirmishRuntimeSession,
	type RuntimeSessionDescriptor,
	seedGameWorldFromCampaignSession,
	seedGameWorldFromSkirmishSession,
} from "../session/tacticalSession";
import { createGameWorld } from "../world/gameWorld";
import { processCommands } from "./commandProcessor";
import { createTacticalRuntime, type TacticalRuntime } from "./tacticalRuntime";

/** Stats snapshot passed on victory/defeat phase transitions. */
export interface PhaseChangeStats {
	timeElapsedMs: number;
	unitsDeployed: number;
	unitsLost: number;
	resourcesGathered: number;
	objectivesCompleted: number;
	objectivesTotal: number;
}

export interface RuntimeHostProps {
	mode: "campaign" | "skirmish";
	missionId?: string;
	skirmish?: SkirmishSessionConfig | null;
	onPhaseChange?: (
		phase: "loading" | "briefing" | "playing" | "paused" | "victory" | "defeat",
		stats?: PhaseChangeStats,
	) => void;
}

interface ResolvedRuntimeState {
	viewModel: RuntimeSessionDescriptor;
	seedWorld: (world: ReturnType<typeof createGameWorld>) => void;
	diagnostics: {
		runId: string;
		mode: "campaign" | "skirmish";
		missionId: string | null;
		skirmishPresetId: string | null;
		seedPhrase: string;
		designSeed: number;
		gameplaySeeds: Record<string, number>;
		tick: number;
		objectives: Array<{ id: string; status: string }>;
		events: Array<{ tick: number; type: string; payload?: Record<string, unknown> }>;
		performance: { fps: number; frameTimeMs: number; systemTimeMs: number };
		pathfinding: { navWarnings: string[]; stuckEntities: number[]; boundaryViolations: number[] };
		fogVisibleTiles: number;
		minimapVisibleEntities: number;
		failures: string[];
	};
}

function buildRuntimeViewModel(props: RuntimeHostProps): ResolvedRuntimeState {
	if (props.mode === "skirmish" && props.skirmish) {
		const session = createSkirmishRuntimeSession(props.skirmish);
		return {
			viewModel: describeSkirmishRuntimeSession(session),
			seedWorld: (world) => seedGameWorldFromSkirmishSession(world, session),
			diagnostics: session.diagnostics,
		};
	}

	const session = props.missionId ? createCampaignRuntimeSession(props.missionId) : null;
	if (!session) {
		const seed = createSeedBundle({
			phrase: "silent-ember-heron",
			source: "manual",
		});
		return {
			viewModel: {
				mode: "campaign",
				title: "Campaign Runtime",
				subtitle: "LittleJS tactical runtime host",
				seedPhrase: seed.phrase,
				designSeed: seed.designSeed,
				gameplaySeeds: seed.gameplaySeeds,
				runId: "campaign:pending",
				cameraFocus: { x: 0, y: 0 },
				worldSize: { width: 0, height: 0 },
			},
			diagnostics: {
				...createEmptyDiagnosticsSnapshot(),
				runId: "campaign:pending",
			},
			seedWorld: () => {},
		};
	}
	return {
		viewModel: describeCampaignRuntimeSession(session),
		seedWorld: (world) => seedGameWorldFromCampaignSession(world, session),
		diagnostics: session.diagnostics,
	};
}

export function RuntimeHost(props: RuntimeHostProps) {
	let containerEl: HTMLDivElement | undefined;
	let runtimeInstance: TacticalRuntime | null = null;
	let bridgeInstance: ReturnType<typeof createGameBridge> | null = null;
	let worldInstance: ReturnType<typeof createGameWorld> | null = null;
	const [_runtimeReady, setRuntimeReady] = createSignal(false);
	const [_runtimeError, setRuntimeError] = createSignal<string | null>(null);

	// Create the SolidBridge for reactive HUD updates
	const solidBridge = createSolidBridge();

	const runtimeState = createMemo(() => buildRuntimeViewModel(props));
	const viewModel = createMemo(() => runtimeState().viewModel);
	let lastReportedPhase = "playing";

	onMount(() => {
		const container = containerEl;
		if (!container) return;
		let cancelled = false;
		const vm = viewModel();
		const rs = runtimeState();
		const seed =
			props.mode === "skirmish" && props.skirmish
				? props.skirmish.seed
				: createSeedBundle({ phrase: vm.seedPhrase, source: "manual" });
		const world = createGameWorld(seed);
		worldInstance = world;
		const bridge = createGameBridge({
			screen: "game",
		});
		bridgeInstance = bridge;
		rs.seedWorld(world);

		// Note: seedWorld already populates the world from the mission definition.
		// Do NOT also call bootstrapMission — that would duplicate all placements.

		world.diagnostics = {
			...world.diagnostics,
			...rs.diagnostics,
			events: [...rs.diagnostics.events],
			objectives: [...rs.diagnostics.objectives],
		};
		recordDiagnosticEvent(world.diagnostics, "runtime-host-mounted", {
			mode: props.mode,
			runId: vm.runId,
		});
		void persistDiagnosticSnapshot(syncGameWorldDiagnostics(world));
		const missionFlow =
			props.mode === "campaign" && props.missionId
				? createRuntimeMissionFlow({
						world,
						mission: createCampaignRuntimeSession(props.missionId).mission,
					})
				: null;

		// Create the system pipeline for gameplay systems
		const pipeline = createSystemPipeline(world);

		// Skirmish AI opponent: create and tick for enemy faction
		const skirmishAI =
			props.mode === "skirmish" && props.skirmish
				? new SkirmishAI(props.skirmish.difficulty, createSkirmishGameAdapter(world))
				: null;

		void (async () => {
			try {
				const runtime = await createTacticalRuntime({
					container,
					world,
					bridge,
					onTick: () => {
						// Drain and process UI commands before systems run
						const commands = bridge.drainCommands();
						if (commands.length > 0) {
							processCommands(world, commands);
						}
						if (missionFlow) {
							missionFlow.step();
						}
						// Tick skirmish AI each frame (AI gates internally via think interval)
						if (skirmishAI && world.session.phase === "playing") {
							skirmishAI.update(world.time.deltaMs / 1000);
						}
						pipeline.step();
					},
				});
				if (cancelled) {
					await runtime.stop();
					return;
				}
				runtimeInstance = runtime;
				await runtime.start();
				runtime.resize(container.clientWidth, container.clientHeight);
				recordDiagnosticEvent(world.diagnostics, "runtime-started", {
					width: container.clientWidth,
					height: container.clientHeight,
				});
				void persistDiagnosticSnapshot(syncGameWorldDiagnostics(world));
				setRuntimeReady(true);
			} catch (error) {
				if (!cancelled) {
					recordDiagnosticEvent(world.diagnostics, "runtime-start-failed", {
						message: (error as Error).message,
					});
					world.diagnostics.failures.push("runtime-start-failed");
					void persistDiagnosticSnapshot(syncGameWorldDiagnostics(world));
					setRuntimeError((error as Error).message);
				}
			}
		})();

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry || !runtimeInstance) return;
			runtimeInstance.resize(
				Math.round(entry.contentRect.width),
				Math.round(entry.contentRect.height),
			);
		});
		observer.observe(container);

		onCleanup(() => {
			cancelled = true;
			observer.disconnect();
			missionFlow?.dispose();
			pipeline.dispose();
			bridgeInstance = null;
			worldInstance = null;
			if (runtimeInstance) {
				void runtimeInstance.stop();
				runtimeInstance = null;
			}
		});
	});

	onMount(() => {
		const interval = window.setInterval(() => {
			const world = worldInstance;
			const bridge = bridgeInstance;
			if (!world || !bridge) return;

			// Push world state into the SolidBridge reactive signals
			solidBridge.syncFromWorld(world);

			// Detect phase transitions and notify parent
			const worldPhase = world.session.phase === "paused" ? "paused" : world.session.phase;
			if (worldPhase !== lastReportedPhase) {
				lastReportedPhase = worldPhase;
				let stats: PhaseChangeStats | undefined;
				if (worldPhase === "victory" || worldPhase === "defeat") {
					const objectives = world.session.objectives;
					stats = {
						timeElapsedMs: world.time.elapsedMs,
						unitsDeployed: bridge.state.population.current,
						unitsLost: 0,
						resourcesGathered:
							bridge.state.resources.fish +
							bridge.state.resources.timber +
							bridge.state.resources.salvage,
						objectivesCompleted: objectives.filter((o) => o.status === "completed").length,
						objectivesTotal: objectives.length,
					};
				}
				props.onPhaseChange?.(worldPhase, stats);
			}
		}, 100);

		onCleanup(() => {
			window.clearInterval(interval);
		});
	});

	// Process SolidBridge command queue: drain commands and forward to the GameBridge command processor
	onMount(() => {
		const cmdInterval = window.setInterval(() => {
			const world = worldInstance;
			if (!world) return;
			const commands = solidBridge.drainCommands();
			if (commands.length > 0) {
				processCommands(world, commands);
			}
		}, 50);

		onCleanup(() => {
			window.clearInterval(cmdInterval);
		});
	});

	return (
		<div class="relative h-full w-full overflow-hidden bg-jungle-950">
			<div ref={containerEl} class="absolute inset-0" data-testid="runtime-host-container" />
			<TacticalHUD
				bridge={solidBridge.accessors}
				emit={solidBridge.emit}
				missionId={props.missionId}
			/>
		</div>
	);
}
