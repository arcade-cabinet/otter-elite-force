/**
 * App — Root component with theme switching and simplified screen routing.
 *
 * Flow: menu → game → victory → menu
 */

import { useTrait, useWorld, WorldProvider } from "koota/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RuntimeHost } from "@/engine";
import { applySkirmishConfigToWorld, loadSkirmishConfig } from "@/features/skirmish";
import { isFinalCampaignMission, resolveMissionVictory } from "@/app/missionResult";
import { loadAllAtlases } from "@/canvas/spriteAtlas";
import { loadTerrainTiles } from "@/canvas/tilePainter";
import { Button } from "@/components/ui/button";
import { initSingletons } from "@/ecs/singletons";
import {
	AppScreen,
	type AppScreenType,
		CampaignProgress,
		CurrentMission,
		DialogueState,
		GamePhase,
		MissionResultState,
		SkirmishSession,
		UserSettings,
	} from "@/ecs/traits/state";
import { world } from "@/ecs/world";
import { getMissionById } from "@/entities/missions";
import { SkirmishSetup } from "@/features/skirmish/SkirmishSetup";
import { EventBus } from "@/game/EventBus";
import { useAudioUnlock } from "@/hooks/useAudioUnlock";
import { useMusicWiring } from "@/hooks/useMusicWiring";
import { saveMission } from "@/systems/saveLoadSystem";
import { loadPersistedState } from "@/persistence/campaignPersistence";
import { initDatabase } from "@/persistence/database";
import { runMigrations } from "@/persistence/migrations";
import { BriefingDialogue } from "@/ui/BriefingDialogue";
import { CampaignView } from "@/ui/command-post/CampaignView";
import { MainMenu } from "@/ui/command-post/MainMenu";
import {
	DEFAULT_USER_SETTINGS,
	SliderSetting,
	ToggleSetting,
} from "@/ui/command-post/SettingsControls";
import { SettingsPanel } from "@/ui/command-post/SettingsPanel";
import { GameLayout } from "@/ui/GameLayout";
import { AlertBanner } from "@/ui/hud/AlertBanner";
import { ErrorFeedback } from "@/ui/hud/ErrorFeedback";
import { PauseOverlay } from "@/ui/hud/PauseOverlay";
import { BriefingShell } from "@/ui/layout/shells";
import { cn } from "@/ui/lib/utils";

initSingletons(world);
// NO procedural fallback — all sprites come from atlas/tile system

// Asset loading promise — game screens wait for this before rendering
let assetsReady = false;
const assetsPromise = Promise.all([loadAllAtlases(), loadTerrainTiles()]).then(() => {
	assetsReady = true;
	console.log("[boot] All sprites + terrain tiles loaded");
});

/** Hook: returns true once all visual assets are loaded. */
function useAssetsReady(): boolean {
	const [ready, setReady] = useState(assetsReady);
	useEffect(() => {
		if (assetsReady) {
			setReady(true);
			return;
		}
		assetsPromise.then(() => setReady(true));
	}, []);
	return ready;
}

const SCREEN_THEMES: Record<AppScreenType, string> = {
	menu: "command-post",
	campaign: "command-post",
	settings: "command-post",
	skirmish: "command-post",
	skirmish_result: "command-post",
	game: "tactical",
	victory: "tactical",
};

function App() {
	return (
		<WorldProvider world={world}>
			<AppRouter />
		</WorldProvider>
	);
}

function AppRouter() {
	const w = useWorld();
	const appScreen = useTrait(w, AppScreen);
	const screen = appScreen?.screen ?? "menu";
	const [bootReady, setBootReady] = useState(false);

	// Initialize audio on first user gesture (US-029)
	useAudioUnlock();

	// Wire music to screen and combat state (US-031)
	useMusicWiring();

	useEffect(() => {
		const theme = SCREEN_THEMES[screen] ?? "command-post";
		document.documentElement.setAttribute("data-theme", theme);
	}, [screen]);

	useEffect(() => {
		let cancelled = false;

		void (async () => {
			const db = await initDatabase();
			await runMigrations(db);
			await loadPersistedState(w);
			const skirmishConfig = await loadSkirmishConfig();
			if (skirmishConfig) {
				applySkirmishConfigToWorld(w, skirmishConfig);
			}
			if (!cancelled) {
				setBootReady(true);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [w]);

	if (!bootReady) {
		return (
			<div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-200">
				<div className="text-center">
					<div className="text-2xl font-bold tracking-[0.22em]">BOOTING</div>
					<div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
						Loading command state and field archives
					</div>
				</div>
			</div>
		);
	}

	switch (screen) {
		case "menu":
			return <MainMenu />;
		case "campaign":
			return <CampaignView />;
		case "skirmish":
			return <SkirmishSetup />;
		case "settings":
			return <SettingsPanel />;
		case "game":
			return <GameplayScreen />;
		case "victory":
			return <MissionResultOverlay />;
		case "skirmish_result":
			return <MissionResultOverlay />;
		default:
			return <MainMenu />;
	}
}

function GameplayScreen() {
	const w = useWorld();
	const campaign = useTrait(w, CampaignProgress);
	const gamePhase = useTrait(w, GamePhase);
	const dialogueState = useTrait(w, DialogueState);
	const skirmishSession = useTrait(w, SkirmishSession);
	const ready = useAssetsReady();
	const isPaused = gamePhase?.phase === "paused";
	const isSkirmish = skirmishSession?.active === true;
	const currentMission = campaign?.currentMission ?? "mission_1";
	const [pauseView, setPauseView] = useState<"pause" | "settings">("pause");

	const finalizeMissionVictory = useCallback(
		(missionId: string) => {
			const progress = w.get(CampaignProgress);
			if (!progress) return;
			const resolution = resolveMissionVictory(progress, missionId, 1);
			w.set(CampaignProgress, resolution.progress);
			w.set(MissionResultState, {
				active: true,
				missionId,
				outcome: "victory",
				stars: resolution.stars,
				isSkirmish,
			});
			w.set(GamePhase, { phase: "victory" });
			w.set(AppScreen, { screen: isSkirmish ? "skirmish_result" : "victory" });
		},
		[isSkirmish, w],
	);

	const finalizeMissionDefeat = useCallback((missionId: string) => {
		w.set(MissionResultState, {
			active: true,
			missionId,
			outcome: "defeat",
			stars: 0,
			isSkirmish,
		});
		w.set(GamePhase, { phase: "defeat" });
		w.set(AppScreen, { screen: isSkirmish ? "skirmish_result" : "victory" });
	}, [isSkirmish, w]);

	// Mission briefing state — shows before gameplay starts
	const [briefingDone, setBriefingDone] = useState(false);
	const mission = useMemo(() => (isSkirmish ? undefined : getMissionById(currentMission)), [currentMission, isSkirmish]);
	const briefingLines = useMemo(
		() =>
			mission?.briefing?.lines?.map((l) => ({
				speaker: l.speaker,
				text: l.text,
			})) ?? [],
		[mission],
	);

	// US-020: Pause/Resume wiring
	const handleResume = useCallback(() => {
		setPauseView("pause");
		w.set(GamePhase, { phase: "playing" });
	}, [w]);

	const handlePause = useCallback(() => {
		w.set(GamePhase, { phase: "paused" });
	}, [w]);

	// Listen for ESC → game-paused event
	useEffect(() => {
		const onGamePaused = () => {
			handlePause();
		};
		EventBus.on("game-paused", onGamePaused);
		return () => {
			EventBus.off("game-paused", onGamePaused);
		};
	}, [handlePause]);

	useEffect(() => {
		return () => {
			import("@/input/screenOrientation").then((m) => m.unlockOrientation());
		};
	}, []);

	const handleRuntimePhaseChange = useCallback(
		(phase: "loading" | "briefing" | "playing" | "paused" | "victory" | "defeat") => {
			if (phase === "victory") {
				finalizeMissionVictory(currentMission);
			}
			if (phase === "defeat") {
				finalizeMissionDefeat(currentMission);
			}
		},
		[currentMission, finalizeMissionDefeat, finalizeMissionVictory],
	);

	// Gate: wait for all visual assets before rendering game
	if (!ready) {
		return (
			<div className="flex items-center justify-center h-screen w-screen bg-slate-900">
				<div className="text-center">
					<div className="text-2xl font-bold text-slate-300 mb-2">LOADING</div>
					<div className="text-sm text-slate-500">Preparing battlefield assets...</div>
				</div>
			</div>
		);
	}

	// Handle mission start: show briefing before gameplay
	if (!isSkirmish && !briefingDone && briefingLines.length > 0) {
		return (
			<BriefingDialogue
				missionName={mission?.name ?? "Mission"}
				subtitle={mission?.subtitle}
				lines={briefingLines}
				onComplete={() => {
					setBriefingDone(true);
					w.set(GamePhase, { phase: "playing" });
				}}
				isMissionBriefing
			/>
		);
	}

	// Handle mid-mission dialogue exchanges (from scenario triggers)
	if (!isSkirmish && dialogueState?.active && dialogueState.lines.length > 0) {
		return (
			<>
				<GameLayout>
					<GameplayRuntimeSurface
						missionId={currentMission}
						isSkirmish={isSkirmish}
						skirmishSession={skirmishSession}
						onRuntimePhaseChange={handleRuntimePhaseChange}
					/>
				</GameLayout>
				<BriefingDialogue
					missionName={mission?.name ?? ""}
					lines={dialogueState.lines}
					onComplete={() => {
						w.set(DialogueState, {
							active: false,
							lines: [],
							currentLine: 0,
							pauseGame: true,
							triggerId: null,
						});
						if (dialogueState.pauseGame) {
							w.set(GamePhase, { phase: "playing" });
						}
					}}
					isMissionBriefing={false}
				/>
			</>
		);
	}

	return (
		<GameLayout>
			<GameplayRuntimeSurface
				missionId={currentMission}
				isSkirmish={isSkirmish}
				skirmishSession={skirmishSession}
				onRuntimePhaseChange={handleRuntimePhaseChange}
			/>
			<AlertBanner />
			<ErrorFeedback />
			{isPaused && pauseView === "pause" ? (
				<PauseOverlay
					onResume={handleResume}
					onSaveGame={() => {
						const missionId = w.get(CurrentMission)?.missionId ?? currentMission;
						saveMission(w, 1, missionId).then(() => {
							EventBus.emit("hud-alert", { message: "Game saved.", severity: "info" });
						});
					}}
					onSettings={() => setPauseView("settings")}
					onQuitToMenu={() => {
						w.set(GamePhase, { phase: "loading" });
						w.set(AppScreen, { screen: "menu" });
					}}
				/>
			) : null}
			{isPaused && pauseView === "settings" ? (
				<InGameSettingsOverlay onBack={() => setPauseView("pause")} />
			) : null}
		</GameLayout>
	);
}

function GameplayRuntimeSurface({
	missionId,
	isSkirmish,
	skirmishSession,
	onRuntimePhaseChange,
}: {
	missionId: string;
	isSkirmish: boolean;
	skirmishSession:
		| {
				mapId: string | null;
				mapName: string | null;
				mapPreset: "macro" | "meso" | "micro";
				difficulty: "easy" | "medium" | "hard" | "brutal";
				playAsScaleGuard: boolean;
				seedPhrase: string;
				designSeed: number;
				gameplaySeeds: Record<string, number>;
				startingResources: {
					fish: number;
					timber: number;
					salvage: number;
				};
		  }
		| null
		| undefined;
	onRuntimePhaseChange?: (phase: "loading" | "briefing" | "playing" | "paused" | "victory" | "defeat") => void;
}) {
	const skirmishConfig = useMemo(() => {
		if (!isSkirmish || !skirmishSession) return null;
		return {
			mapId: skirmishSession.mapId ?? "sk_river_crossing",
			mapName: skirmishSession.mapName ?? "Skirmish",
			difficulty: skirmishSession.difficulty,
			playAsScaleGuard: skirmishSession.playAsScaleGuard,
			preset: skirmishSession.mapPreset,
			seed: {
				phrase: skirmishSession.seedPhrase,
				source: "skirmish" as const,
				numericSeed: 0,
				designSeed: skirmishSession.designSeed,
				gameplaySeeds: skirmishSession.gameplaySeeds,
			},
			startingResources: skirmishSession.startingResources,
		};
	}, [isSkirmish, skirmishSession]);

	if (skirmishConfig) {
		return <RuntimeHost mode="skirmish" skirmish={skirmishConfig} onPhaseChange={onRuntimePhaseChange} />;
	}

	return <RuntimeHost mode="campaign" missionId={missionId} onPhaseChange={onRuntimePhaseChange} />;
}

/** Inline settings overlay shown from the pause menu (stays on game screen). */
function InGameSettingsOverlay({ onBack }: { onBack: () => void }) {
	const w = useWorld();
	const settings = useTrait(w, UserSettings);
	const resolved = settings ?? DEFAULT_USER_SETTINGS;

	const update = (patch: Partial<typeof resolved>) => {
		w.set(UserSettings, { ...resolved, ...patch });
	};

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				onBack();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onBack]);

	return (
		<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
			<div className="relative w-full max-w-md border border-accent/25 bg-[linear-gradient(180deg,rgba(13,22,20,0.98),rgba(7,12,12,0.99))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
				<div className="riverine-camo absolute inset-0 opacity-30" />
				<div className="relative z-10 grid gap-4">
					<div className="text-center">
						<div className="inline-block border border-accent/25 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
							Field Controls
						</div>
						<h2 className="mt-3 font-heading text-2xl uppercase tracking-[0.22em] text-primary">
							Settings
						</h2>
					</div>
					<div className="flex max-w-xl flex-col gap-3">
						<SliderSetting
							label="Music Volume"
							value={resolved.musicVolume}
							onChange={(v) => update({ musicVolume: v })}
						/>
						<SliderSetting
							label="SFX Volume"
							value={resolved.sfxVolume}
							onChange={(v) => update({ sfxVolume: v })}
						/>
						<SliderSetting
							label="Camera Speed"
							value={resolved.cameraSpeed}
							onChange={(v) => update({ cameraSpeed: v })}
						/>
						<ToggleSetting
							label="Show Grid"
							value={resolved.showGrid}
							onChange={(v) => update({ showGrid: v })}
						/>
						<ToggleSetting
							label="Reduce FX"
							value={resolved.reduceFx}
							onChange={(v) => update({ reduceFx: v })}
						/>
					</div>
					<Button variant="command" onClick={onBack} className="w-full justify-center">
						Back
					</Button>
					<div className="text-center font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
						Press ESC to return
					</div>
				</div>
			</div>
		</div>
	);
}

function MissionResultOverlay() {
	const w = useWorld();
	const campaign = useTrait(w, CampaignProgress);
	const result = useTrait(w, MissionResultState);
	const phase = useTrait(w, GamePhase)?.phase ?? "victory";
	const completedMissionId = result?.missionId ?? campaign?.currentMission ?? null;
	const finalMissionComplete = completedMissionId ? isFinalCampaignMission(completedMissionId) : false;
	const isDefeat = phase === "defeat";
	const missionResult = completedMissionId ? campaign?.missions[completedMissionId] : null;
	const stars = (result?.stars ?? missionResult?.stars ?? 0) as 0 | 1 | 2 | 3;

	const primaryLabel = isDefeat
		? "Retry Mission"
		: finalMissionComplete
			? "Return to Menu"
			: "Next Mission";
	const primaryTarget: AppScreenType = isDefeat ? "game" : finalMissionComplete ? "menu" : "game";

	const clearMissionResult = () => {
		w.set(MissionResultState, {
			active: false,
			missionId: null,
			outcome: "victory",
			stars: 0,
			isSkirmish: false,
		});
	};

	return (
		<BriefingShell
			title={isDefeat ? "Mission Failed" : "Mission Complete"}
			subtitle={
				isDefeat
					? "Re-establish contact, revise the approach, and get boots back on the ground."
					: finalMissionComplete
						? "Campaign pressure is broken. Return to the command post and review the Reach."
						: "Command has the next operation ready. Stay in the fight and push forward."
			}
			footer={
				<div className="flex flex-wrap gap-2">
					<Button
						variant="accent"
						onClick={() => {
							if (isDefeat && completedMissionId) {
								w.set(CampaignProgress, {
									...(campaign ?? { missions: {}, currentMission: null, difficulty: "support" }),
									currentMission: completedMissionId,
								});
							}
							clearMissionResult();
							w.set(AppScreen, { screen: primaryTarget });
						}}
					>
						{primaryLabel}
					</Button>
					{!isDefeat && !finalMissionComplete ? (
						<Button
							variant="command"
							onClick={() => {
								if (completedMissionId && campaign) {
									w.set(CampaignProgress, { ...campaign, currentMission: completedMissionId });
								}
								clearMissionResult();
								w.set(AppScreen, { screen: "game" });
							}}
						>
							Replay
						</Button>
					) : null}
					<Button
						variant="command"
						onClick={() => {
							clearMissionResult();
							w.set(AppScreen, { screen: "menu" });
						}}
					>
						Main Menu
					</Button>
				</div>
			}
		>
			{!isDefeat && stars > 0 ? (
				<div className="rounded-none border border-accent/25 bg-card/70 p-6">
					<MissionStarResult stars={stars} />
				</div>
			) : (
				<div className="rounded-none border border-accent/25 bg-card/70 p-6 font-body text-xs uppercase tracking-[0.16em] text-muted-foreground">
					{isDefeat
						? "Mission command now loops directly back into play. Retry the operation without bouncing through detached pre-mission screens."
						: "Campaign progression now moves operation-to-operation. No campaign map, no canteen, no store friction."}
				</div>
			)}
		</BriefingShell>
	);
}

/** US-053: Animated star reveal for mission completion. */
function MissionStarResult({ stars }: { stars: 0 | 1 | 2 | 3 }) {
	const [revealedStars, setRevealedStars] = useState(0);

	useEffect(() => {
		const timers: ReturnType<typeof setTimeout>[] = [];
		for (let i = 1; i <= stars; i++) {
			timers.push(
				setTimeout(() => {
					setRevealedStars(i);
				}, i * 400),
			);
		}
		return () => {
			for (const t of timers) clearTimeout(t);
		};
	}, [stars]);

	const starLabels: Record<number, string> = { 1: "Bronze", 2: "Silver", 3: "Gold" };
	const starColors: Record<number, string> = {
		1: "text-amber-600",
		2: "text-gray-300",
		3: "text-yellow-400",
	};
	const colorClass = starColors[stars] ?? "text-muted-foreground";

	return (
		<div data-testid="mission-star-result" className="grid gap-3 text-center">
			<div className="flex items-center justify-center gap-3">
				{[1, 2, 3].map((i) => (
					<span
						key={i}
						data-testid={`result-star-${i}`}
						className={cn(
							"text-4xl transition-all duration-300",
							i <= revealedStars ? colorClass : "text-muted-foreground/20",
						)}
					>
						{i <= revealedStars ? "\u2605" : "\u2606"}
					</span>
				))}
			</div>
			<span className="font-heading text-lg uppercase tracking-[0.2em] text-accent">
				{starLabels[stars] ?? "No Rating"}
			</span>
		</div>
	);
}

export default App;
