import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import type { SkirmishSessionConfig } from "@/features/skirmish/types";
import { createGameBridge, type GameBridgeState } from "../bridge/gameBridge";
import {
	persistDiagnosticSnapshot,
	recordDiagnosticEvent,
	syncGameWorldDiagnostics,
} from "../diagnostics/runtimeDiagnostics";
import { createEmptyDiagnosticsSnapshot } from "../diagnostics/types";
import { createSeedBundle } from "../random/seed";
import { bootstrapMission } from "../session/missionBootstrap";
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
import { createLittleJsRuntime, type TacticalRuntime } from "./littlejsRuntime";

export interface RuntimeHostProps {
	mode: "campaign" | "skirmish";
	missionId?: string;
	skirmish?: SkirmishSessionConfig | null;
	onPhaseChange?: (
		phase: "loading" | "briefing" | "playing" | "paused" | "victory" | "defeat",
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
	const [runtimeReady, setRuntimeReady] = createSignal(false);
	const [runtimeError, setRuntimeError] = createSignal<string | null>(null);
	const [hudState, setHudState] = createSignal<GameBridgeState>({
		screen: "game",
		resources: { fish: 0, timber: 0, salvage: 0 },
		population: { current: 0, max: 0 },
		selection: null,
		objectives: [],
		alerts: [],
		dialogue: null,
		weather: null,
		boss: null,
	});

	const runtimeState = createMemo(() => buildRuntimeViewModel(props));
	const viewModel = createMemo(() => runtimeState().viewModel);
	let lastReportedPhase = hudState().screen === "paused" ? "paused" : "playing";

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

		// Bootstrap mission entities into the world for campaign mode
		if (props.mode === "campaign" && props.missionId) {
			bootstrapMission(world, props.missionId);
		}

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

		void (async () => {
			try {
				const runtime = await createLittleJsRuntime({
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
			const bridge = bridgeInstance;
			if (!bridge) return;
			setHudState({
				screen: bridge.state.screen,
				resources: { ...bridge.state.resources },
				population: { ...bridge.state.population },
				selection: bridge.state.selection
					? {
							entityIds: [...bridge.state.selection.entityIds],
							primaryLabel: bridge.state.selection.primaryLabel,
							unitBreakdown: bridge.state.selection.unitBreakdown,
						}
					: null,
				objectives: bridge.state.objectives.map((objective) => ({ ...objective })),
				alerts: bridge.state.alerts.map((alert) => ({ ...alert })),
				dialogue: bridge.state.dialogue
					? {
							lines: bridge.state.dialogue.lines.map((line) => ({ ...line })),
						}
					: null,
				weather: bridge.state.weather,
				boss: bridge.state.boss ? { ...bridge.state.boss } : null,
			});
			const worldPhase =
				worldInstance?.session.phase ?? (bridge.state.screen === "paused" ? "paused" : "playing");
			if (worldPhase !== lastReportedPhase) {
				lastReportedPhase = worldPhase;
				props.onPhaseChange?.(worldPhase);
			}
		}, 100);

		onCleanup(() => {
			window.clearInterval(interval);
		});
	});

	const phase = createMemo(() => {
		if (!runtimeReady() && !runtimeError()) return "LOADING";
		const s = hudState().screen;
		if (s === "paused") return "PAUSED";
		const wp = worldInstance?.session.phase;
		if (wp === "victory") return "VICTORY";
		if (wp === "defeat") return "DEFEAT";
		return "playing";
	});

	return (
		<div class="relative h-full w-full overflow-hidden bg-jungle-950">
			{/* Canvas container */}
			<div ref={containerEl} class="absolute inset-0" data-testid="runtime-host-container" />

			{/* ═══ TOP BAR ═══ */}
			<div class="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-start justify-between px-3 pt-2">
				{/* Left: mission title + phase */}
				<div class="pointer-events-auto flex items-center gap-3">
					<span class="font-stencil text-stencil-sm uppercase tracking-widest text-khaki-200/90 drop-shadow-md">
						{viewModel().title}
					</span>
					<Show when={phase() !== "playing"}>
						<span class="border border-warning-amber/40 bg-jungle-950/70 px-2 py-0.5 font-terminal text-xs uppercase tracking-widest text-warning-amber backdrop-blur-sm">
							{phase()}
						</span>
					</Show>
					<Show when={runtimeError()}>
						<span class="border border-blood-orange/40 bg-jungle-950/70 px-2 py-0.5 font-terminal text-xs uppercase text-blood-orange backdrop-blur-sm">
							Runtime failed
						</span>
					</Show>
				</div>

				{/* Center-right: resources + population */}
				<div
					data-testid="runtime-hud-resources"
					class="pointer-events-auto flex items-center gap-4 border border-khaki-700/30 bg-jungle-950/60 px-3 py-1.5 backdrop-blur-sm"
				>
					<span class="font-terminal text-xs uppercase tracking-wider text-emerald-400">
						Fish {hudState().resources.fish}
					</span>
					<span class="font-terminal text-xs uppercase tracking-wider text-amber-400">
						Timber {hudState().resources.timber}
					</span>
					<span class="font-terminal text-xs uppercase tracking-wider text-slate-300">
						Salvage {hudState().resources.salvage}
					</span>
					<span class="border-l border-khaki-700/40 pl-3 font-terminal text-xs uppercase tracking-wider text-khaki-200/80">
						Pop {hudState().population.current}/{hudState().population.max}
					</span>
				</div>

				{/* Right: compact toolbar */}
				<div class="pointer-events-auto flex items-center gap-1">
					<button
						type="button"
						class="flex h-7 w-7 items-center justify-center border border-khaki-700/30 bg-jungle-950/60 font-terminal text-xs text-khaki-200/80 backdrop-blur-sm hover:bg-jungle-800/80 hover:text-khaki-100"
						onClick={() => runtimeInstance?.recenter()}
						title="Recenter camera"
					>
						<span data-testid="runtime-btn-recenter">H</span>
					</button>
					<button
						type="button"
						class="flex h-7 w-7 items-center justify-center border border-khaki-700/30 bg-jungle-950/60 font-terminal text-sm text-khaki-200/80 backdrop-blur-sm hover:bg-jungle-800/80 hover:text-khaki-100"
						onClick={() => runtimeInstance?.zoomOut()}
						title="Zoom out"
					>
						-
					</button>
					<button
						type="button"
						class="flex h-7 w-7 items-center justify-center border border-khaki-700/30 bg-jungle-950/60 font-terminal text-sm text-khaki-200/80 backdrop-blur-sm hover:bg-jungle-800/80 hover:text-khaki-100"
						onClick={() => runtimeInstance?.zoomIn()}
						title="Zoom in"
					>
						+
					</button>
				</div>
			</div>

			{/* ═══ BOSS HP BAR (top-center, only when boss present) ═══ */}
			<Show when={hudState().boss}>
				{(boss) => (
					<div
						data-testid="runtime-hud-boss"
						class="absolute left-1/2 top-12 z-10 w-64 -translate-x-1/2 border border-rose-500/30 bg-jungle-950/70 px-3 py-2 text-center backdrop-blur-sm"
					>
						<div class="font-stencil text-xs uppercase tracking-widest text-rose-400">
							{boss().name}
						</div>
						<div class="mt-1 h-2 overflow-hidden bg-jungle-900">
							<div
								class="h-full bg-rose-500 transition-[width] duration-200"
								style={{
									width: `${Math.max(0, Math.min(100, (boss().currentHp / Math.max(1, boss().maxHp)) * 100))}%`,
								}}
							/>
						</div>
						<div class="mt-1 font-terminal text-[10px] uppercase text-rose-300/70">
							{Math.round(boss().currentHp)} / {Math.round(boss().maxHp)}
						</div>
					</div>
				)}
			</Show>

			{/* ═══ ALERT BANNER (top-center, slides in/out) ═══ */}
			<Show when={hudState().alerts.length > 0}>
				<div
					data-testid="runtime-hud-alerts"
					class="absolute left-1/2 z-10 -translate-x-1/2 transition-all duration-300"
					style={{ top: hudState().boss ? "7.5rem" : "3rem" }}
				>
					<div class="border border-warning-amber/30 bg-jungle-950/70 px-4 py-1.5 backdrop-blur-sm">
						<span class="font-terminal text-xs uppercase tracking-wider text-warning-amber">
							{hudState().alerts[hudState().alerts.length - 1]?.message}
						</span>
					</div>
				</div>
			</Show>

			{/* ═══ RIGHT SIDE: Objectives panel ═══ */}
			<div
				data-testid="runtime-hud-objectives"
				class="absolute right-3 top-14 z-10 w-52 border border-khaki-700/20 bg-jungle-950/50 px-3 py-2 backdrop-blur-sm"
			>
				<div class="font-stencil text-[10px] uppercase tracking-widest text-khaki-400">
					Objectives
				</div>
				<div class="mt-1.5 space-y-1">
					<Show
						when={hudState().objectives.length > 0}
						fallback={
							<div class="font-terminal text-[10px] uppercase text-khaki-600">Awaiting orders</div>
						}
					>
						<For each={hudState().objectives.slice(0, 4)}>
							{(objective) => (
								<div class="flex items-start gap-1.5 font-terminal text-[10px] uppercase leading-tight">
									<span
										class={
											objective.status === "completed"
												? "text-emerald-400"
												: objective.status === "failed"
													? "text-rose-400"
													: "text-khaki-300"
										}
									>
										{objective.status === "completed"
											? "[x]"
											: objective.status === "failed"
												? "[!]"
												: "[ ]"}
									</span>
									<span
										class={
											objective.status === "completed"
												? "text-khaki-500 line-through"
												: "text-khaki-200/80"
										}
									>
										{objective.description}
									</span>
								</div>
							)}
						</For>
					</Show>
				</div>
			</div>

			{/* ═══ BOTTOM-LEFT: Selection panel (only when units selected) ═══ */}
			<Show when={hudState().selection}>
				{(sel) => (
					<div
						data-testid="runtime-hud-selection"
						class="absolute bottom-3 left-3 z-10 min-w-[200px] max-w-xs border border-ura-orange/20 bg-jungle-950/70 px-3 py-2 backdrop-blur-sm"
					>
						<div class="font-stencil text-sm uppercase tracking-wider text-ura-orange/90">
							{sel().primaryLabel}
						</div>
						<Show when={sel().entityIds.length > 1}>
							<div class="mt-1 font-terminal text-[10px] uppercase tracking-wide text-khaki-300/70">
								{sel().unitBreakdown}
							</div>
						</Show>
					</div>
				)}
			</Show>

			{/* ═══ BOTTOM-CENTER: Dialogue transmission ═══ */}
			<Show when={hudState().dialogue?.lines.length}>
				<div class="absolute bottom-3 left-1/2 z-20 w-[min(500px,80vw)] -translate-x-1/2 border border-phosphor/20 bg-jungle-950/80 px-4 py-3 backdrop-blur-sm">
					<div class="flex items-start gap-2">
						<span class="font-stencil text-xs uppercase tracking-wider text-phosphor">
							{hudState().dialogue?.lines[0]?.speaker}
						</span>
					</div>
					<div class="mt-1 font-typewriter text-report leading-relaxed text-khaki-200/90">
						{hudState().dialogue?.lines[0]?.text}
					</div>
					<button
						type="button"
						class="mt-2 font-terminal text-[10px] uppercase tracking-wider text-khaki-500 hover:text-khaki-300"
						onClick={() => runtimeInstance?.dismissDialogue()}
					>
						[continue]
					</button>
				</div>
			</Show>
		</div>
	);
}
