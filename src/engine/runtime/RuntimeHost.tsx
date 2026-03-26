import { useEffect, useMemo, useRef, useState } from "react";
import { createGameBridge, type GameBridgeState } from "../bridge/gameBridge";
import {
	persistDiagnosticSnapshot,
	recordDiagnosticEvent,
	syncGameWorldDiagnostics,
} from "../diagnostics/runtimeDiagnostics";
import { createEmptyDiagnosticsSnapshot } from "../diagnostics/types";
import { createSeedBundle } from "../random/seed";
import {
	createCampaignRuntimeSession,
	createSkirmishRuntimeSession,
	describeCampaignRuntimeSession,
	describeSkirmishRuntimeSession,
	seedGameWorldFromCampaignSession,
	seedGameWorldFromSkirmishSession,
	type RuntimeSessionDescriptor,
} from "../session/tacticalSession";
import { createRuntimeMissionFlow } from "../session/runtimeMissionFlow";
import { createLittleJsRuntime, type TacticalRuntime } from "./littlejsRuntime";
import { createGameWorld } from "../world/gameWorld";
import type { SkirmishSessionConfig } from "@/features/skirmish/types";

export interface RuntimeHostProps {
	mode: "campaign" | "skirmish";
	missionId?: string;
	skirmish?: SkirmishSessionConfig | null;
	onPhaseChange?: (phase: "loading" | "briefing" | "playing" | "paused" | "victory" | "defeat") => void;
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

	const session = props.missionId
		? createCampaignRuntimeSession(props.missionId)
		: null;
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
	const containerRef = useRef<HTMLDivElement>(null);
	const runtimeRef = useRef<TacticalRuntime | null>(null);
	const bridgeRef = useRef<ReturnType<typeof createGameBridge> | null>(null);
	const worldRef = useRef<ReturnType<typeof createGameWorld> | null>(null);
	const [runtimeReady, setRuntimeReady] = useState(false);
	const [runtimeError, setRuntimeError] = useState<string | null>(null);
	const [hudState, setHudState] = useState<GameBridgeState>({
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

	const runtimeState = useMemo(() => buildRuntimeViewModel(props), [props]);
	const viewModel = runtimeState.viewModel;
	const lastReportedPhaseRef = useRef(hudState.screen === "paused" ? "paused" : "playing");

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		let cancelled = false;
		const seed =
			props.mode === "skirmish" && props.skirmish
				? props.skirmish.seed
				: createSeedBundle({ phrase: viewModel.seedPhrase, source: "manual" });
		const world = createGameWorld(seed);
		worldRef.current = world;
		const bridge = createGameBridge({
			screen: "game",
		});
		bridgeRef.current = bridge;
		runtimeState.seedWorld(world);
		world.diagnostics = {
			...world.diagnostics,
			...runtimeState.diagnostics,
			events: [...runtimeState.diagnostics.events],
			objectives: [...runtimeState.diagnostics.objectives],
		};
		recordDiagnosticEvent(world.diagnostics, "runtime-host-mounted", {
			mode: props.mode,
			runId: viewModel.runId,
		});
		void persistDiagnosticSnapshot(syncGameWorldDiagnostics(world));
		const missionFlow =
			props.mode === "campaign" && props.missionId
				? createRuntimeMissionFlow({
						world,
						mission: createCampaignRuntimeSession(props.missionId).mission,
					})
				: null;

		void (async () => {
			try {
				const runtime = await createLittleJsRuntime({
					container,
					world,
					bridge,
					onTick: missionFlow ? () => missionFlow.step() : undefined,
				});
				if (cancelled) {
					await runtime.stop();
					return;
				}
				runtimeRef.current = runtime;
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
			if (!entry || !runtimeRef.current) return;
			runtimeRef.current.resize(
				Math.round(entry.contentRect.width),
				Math.round(entry.contentRect.height),
			);
		});
		observer.observe(container);

		return () => {
			cancelled = true;
			observer.disconnect();
			missionFlow?.dispose();
			bridgeRef.current = null;
			worldRef.current = null;
			if (runtimeRef.current) {
				void runtimeRef.current.stop();
				runtimeRef.current = null;
			}
		};
	}, [
		props.mode,
		props.skirmish,
		runtimeState.diagnostics,
		viewModel.runId,
		viewModel.seedPhrase,
	]);

	useEffect(() => {
		const interval = window.setInterval(() => {
			const bridge = bridgeRef.current;
			if (!bridge) return;
			setHudState({
				screen: bridge.state.screen,
				resources: { ...bridge.state.resources },
				population: { ...bridge.state.population },
				selection: bridge.state.selection
					? {
							entityIds: [...bridge.state.selection.entityIds],
							primaryLabel: bridge.state.selection.primaryLabel,
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
				worldRef.current?.session.phase ??
				(bridge.state.screen === "paused" ? "paused" : "playing");
			if (worldPhase !== lastReportedPhaseRef.current) {
				lastReportedPhaseRef.current = worldPhase;
				props.onPhaseChange?.(worldPhase);
			}
		}, 100);

		return () => {
			window.clearInterval(interval);
		};
	}, [props]);

	return (
		<div className="relative h-full w-full overflow-hidden bg-slate-950">
			<div ref={containerRef} className="absolute inset-0" data-testid="runtime-host-container" />
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,41,59,0.35),transparent_55%)]" />
			<div className="absolute right-4 top-4 z-10 flex gap-2">
				<button
					type="button"
					className="min-h-11 rounded border border-slate-600/70 bg-slate-950/85 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-100 backdrop-blur-sm"
					onClick={() => runtimeRef.current?.clearSelection()}
				>
					Deselect
				</button>
				<button
					type="button"
					className="min-h-11 rounded border border-slate-600/70 bg-slate-950/85 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-100 backdrop-blur-sm"
					onClick={() => runtimeRef.current?.recenter()}
				>
					Recenter
				</button>
				<button
					type="button"
					className="min-h-11 rounded border border-slate-600/70 bg-slate-950/85 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-100 backdrop-blur-sm"
					onClick={() => runtimeRef.current?.zoomOut()}
				>
					-
				</button>
				<button
					type="button"
					className="min-h-11 rounded border border-slate-600/70 bg-slate-950/85 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-100 backdrop-blur-sm"
					onClick={() => runtimeRef.current?.zoomIn()}
				>
					+
				</button>
				{hudState.dialogue?.lines.length ? (
					<button
						type="button"
						className="min-h-11 rounded border border-fuchsia-600/70 bg-slate-950/85 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-100 backdrop-blur-sm"
						onClick={() => runtimeRef.current?.dismissDialogue()}
					>
						Dismiss
					</button>
				) : null}
			</div>
			<div className="absolute left-4 top-4 z-10 max-w-sm border border-accent/20 bg-black/65 p-4 text-slate-100 shadow-2xl backdrop-blur-sm">
				<div className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
					{runtimeReady
						? "Runtime Active"
						: runtimeError
							? "Runtime Failed"
							: "Runtime Boot"}
				</div>
				<h2 className="mt-2 font-heading text-xl uppercase tracking-[0.18em] text-primary">
					{viewModel.title}
				</h2>
				<div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
					{viewModel.subtitle}
				</div>
				<div className="mt-3 space-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-300">
					<div>Seed: {viewModel.seedPhrase}</div>
					<div>Design: {viewModel.designSeed}</div>
					<div>Gameplay Streams: {Object.keys(viewModel.gameplaySeeds).join(", ")}</div>
					{viewModel.mapSummary ? (
						<>
							<div>Run: {viewModel.runId}</div>
							<div>Map: {viewModel.mapSummary.size}</div>
							<div>Resources: {viewModel.mapSummary.resourceNodes}</div>
							<div>Chokepoints: {viewModel.mapSummary.chokepoints}</div>
							<div>Focus: {viewModel.mapSummary.focusTile}</div>
							{viewModel.mapSummary.playerStart && viewModel.mapSummary.aiStart ? (
								<div>
									Starts: {viewModel.mapSummary.playerStart} / {viewModel.mapSummary.aiStart}
								</div>
							) : null}
						</>
					) : null}
				</div>
				{runtimeError ? (
					<div className="mt-3 text-[10px] uppercase tracking-[0.12em] text-amber-300">
						LittleJS could not boot in this environment. The tactical runtime failed hard.
					</div>
				) : null}
			</div>
			<div className="absolute bottom-4 left-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap gap-3">
				<div className="min-w-[200px] border border-emerald-500/20 bg-slate-950/85 px-4 py-3 text-slate-100 shadow-xl backdrop-blur-sm">
					<div
						data-testid="runtime-hud-resources"
						className="font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-300"
					>
						Resources
					</div>
					<div className="mt-2 grid grid-cols-3 gap-3 font-mono text-xs uppercase tracking-[0.12em]">
						<div>Fish {hudState.resources.fish}</div>
						<div>Timber {hudState.resources.timber}</div>
						<div>Salvage {hudState.resources.salvage}</div>
					</div>
					<div className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-slate-300">
						Population {hudState.population.current}/{hudState.population.max}
					</div>
				</div>
				<div className="min-w-[180px] border border-cyan-500/20 bg-slate-950/85 px-4 py-3 text-slate-100 shadow-xl backdrop-blur-sm">
					<div
						data-testid="runtime-hud-weather"
						className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-300"
					>
						Weather
					</div>
					<div className="mt-2 font-mono text-xs uppercase tracking-[0.12em]">
						{hudState.weather ?? "clear"}
					</div>
				</div>
				<div className="min-w-[220px] border border-sky-500/20 bg-slate-950/85 px-4 py-3 text-slate-100 shadow-xl backdrop-blur-sm">
					<div
						data-testid="runtime-hud-selection"
						className="font-mono text-[10px] uppercase tracking-[0.24em] text-sky-300"
					>
						Selection
					</div>
					<div className="mt-2 font-mono text-xs uppercase tracking-[0.12em]">
						{hudState.selection?.primaryLabel ?? "No selection"}
					</div>
					<div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
						{hudState.selection ? `${hudState.selection.entityIds.length} entities ready` : "Tap or drag to select"}
					</div>
				</div>
				<div className="min-w-[240px] border border-amber-500/20 bg-slate-950/85 px-4 py-3 text-slate-100 shadow-xl backdrop-blur-sm">
					<div
						data-testid="runtime-hud-objectives"
						className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-300"
					>
						Objectives
					</div>
					<div className="mt-2 space-y-1 font-mono text-[10px] uppercase tracking-[0.12em]">
						{hudState.objectives.length > 0 ? (
							hudState.objectives.slice(0, 4).map((objective) => (
								<div key={objective.id}>
									{objective.status}: {objective.description}
								</div>
							))
						) : (
							<div className="text-slate-400">Objectives pending mission bootstrap</div>
						)}
					</div>
				</div>
				<div className="min-w-[240px] border border-rose-500/20 bg-slate-950/85 px-4 py-3 text-slate-100 shadow-xl backdrop-blur-sm">
					<div
						data-testid="runtime-hud-alerts"
						className="font-mono text-[10px] uppercase tracking-[0.24em] text-rose-300"
					>
						Alerts
					</div>
					<div className="mt-2 space-y-1 font-mono text-[10px] uppercase tracking-[0.12em]">
						{hudState.alerts.length > 0 ? (
							hudState.alerts.slice(-3).map((alert) => (
								<div key={alert.id}>
									{alert.severity}: {alert.message}
								</div>
							))
						) : (
							<div className="text-slate-400">No active tactical alerts</div>
						)}
					</div>
				</div>
				{hudState.dialogue?.lines.length ? (
					<div className="min-w-[260px] border border-fuchsia-500/20 bg-slate-950/85 px-4 py-3 text-slate-100 shadow-xl backdrop-blur-sm">
						<div className="font-mono text-[10px] uppercase tracking-[0.24em] text-fuchsia-300">Dialogue</div>
						<div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em]">
							{hudState.dialogue.lines[0]?.speaker}: {hudState.dialogue.lines[0]?.text}
						</div>
					</div>
				) : null}
				{hudState.boss ? (
					<div className="min-w-[260px] border border-rose-500/20 bg-slate-950/85 px-4 py-3 text-slate-100 shadow-xl backdrop-blur-sm">
						<div
							data-testid="runtime-hud-boss"
							className="font-mono text-[10px] uppercase tracking-[0.24em] text-rose-300"
						>
							Boss
						</div>
						<div className="mt-2 font-mono text-xs uppercase tracking-[0.12em]">{hudState.boss.name}</div>
						<div className="mt-2 h-2 overflow-hidden rounded bg-slate-800">
							<div
								className="h-full bg-rose-500"
								style={{
									width: `${Math.max(0, Math.min(100, (hudState.boss.currentHp / Math.max(1, hudState.boss.maxHp)) * 100))}%`,
								}}
							/>
						</div>
						<div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-300">
							{Math.round(hudState.boss.currentHp)} / {Math.round(hudState.boss.maxHp)}
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
