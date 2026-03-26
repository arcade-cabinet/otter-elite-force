/**
 * App — Root component with theme switching and simplified screen routing.
 *
 * Flow: menu → game → victory → menu
 */

import { useTrait, useWorld, WorldProvider } from "koota/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GameCanvas } from "@/canvas/GameCanvas";
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
	UserSettings,
} from "@/ecs/traits/state";
import { world } from "@/ecs/world";
import { CAMPAIGN, getMissionById } from "@/entities/missions";
import { SkirmishSetup } from "@/features/skirmish/SkirmishSetup";
import type { DeploymentData, DifficultyMode } from "@/game/deployment";
import { EventBus } from "@/game/EventBus";
import { useAudioUnlock } from "@/hooks/useAudioUnlock";
import { useMusicWiring } from "@/hooks/useMusicWiring";
import { saveMission } from "@/systems/saveLoadSystem";
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

	// Initialize audio on first user gesture (US-029)
	useAudioUnlock();

	// Wire music to screen and combat state (US-031)
	useMusicWiring();

	useEffect(() => {
		const theme = SCREEN_THEMES[screen] ?? "command-post";
		document.documentElement.setAttribute("data-theme", theme);
	}, [screen]);

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
	const ready = useAssetsReady();
	const isPaused = gamePhase?.phase === "paused";
	const currentMission = campaign?.currentMission ?? "mission_1";
	const difficulty = (campaign?.difficulty ?? "support") as DifficultyMode;
	const deploymentData = useMemo<DeploymentData>(
		() => ({ missionId: currentMission, difficulty }),
		[currentMission, difficulty],
	);
	const [pauseView, setPauseView] = useState<"pause" | "settings">("pause");

	// Mission briefing state — shows before gameplay starts
	const [briefingDone, setBriefingDone] = useState(false);
	const mission = useMemo(() => getMissionById(currentMission), [currentMission]);
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
		const onMissionComplete = (data: {
			missionId: string;
			stars: number;
			stats?: { timeElapsed?: number; timeElapsedMs?: number };
		}) => {
			const progress = w.get(CampaignProgress);
			if (!progress) return;

			const currentIndex = CAMPAIGN.findIndex((mission) => mission.id === data.missionId);
			const nextMission = currentIndex >= 0 ? CAMPAIGN[currentIndex + 1] : undefined;
			const existing = progress.missions[data.missionId];
			const bestTime =
				data.stats?.timeElapsedMs ??
				(data.stats?.timeElapsed != null
					? data.stats.timeElapsed * 1000
					: (existing?.bestTime ?? 0));

			w.set(CampaignProgress, {
				...progress,
				missions: {
					...progress.missions,
					[data.missionId]: {
						status: "completed",
						stars: Math.max(existing?.stars ?? 0, data.stars),
						bestTime: existing?.bestTime != null ? Math.min(existing.bestTime, bestTime) : bestTime,
					},
				},
				currentMission: nextMission?.id ?? data.missionId,
			});
			w.set(AppScreen, { screen: "victory" });
		};

		const onMissionFailed = () => {
			w.set(AppScreen, { screen: "victory" });
		};

		EventBus.on("mission-complete", onMissionComplete);
		EventBus.on("mission-failed", onMissionFailed);

		return () => {
			EventBus.off("mission-complete", onMissionComplete);
			EventBus.off("mission-failed", onMissionFailed);
			import("@/input/screenOrientation").then((m) => m.unlockOrientation());
		};
	}, [w]);

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
	if (!briefingDone && briefingLines.length > 0) {
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
	if (dialogueState?.active && dialogueState.lines.length > 0) {
		return (
			<>
				<GameLayout>
					<GameCanvas deploymentData={deploymentData} />
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
			<GameCanvas deploymentData={deploymentData} />
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
	const phase = useTrait(w, GamePhase)?.phase ?? "victory";
	const finalMissionId = CAMPAIGN.at(-1)?.id ?? null;
	const finalMissionComplete =
		finalMissionId !== null && campaign?.missions[finalMissionId]?.status === "completed";
	const isDefeat = phase === "defeat";

	// US-053: Retrieve star rating for the just-completed mission
	const completedMissionId = campaign?.currentMission ?? null;
	const missionResult = completedMissionId ? campaign?.missions[completedMissionId] : null;
	const stars = (missionResult?.stars ?? 0) as 0 | 1 | 2 | 3;

	const primaryLabel = isDefeat
		? "Retry Mission"
		: finalMissionComplete
			? "Return to Menu"
			: "Next Mission";
	const primaryTarget: AppScreenType = isDefeat ? "game" : finalMissionComplete ? "menu" : "game";

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
					<Button variant="accent" onClick={() => w.set(AppScreen, { screen: primaryTarget })}>
						{primaryLabel}
					</Button>
					{!isDefeat && !finalMissionComplete ? (
						<Button variant="command" onClick={() => w.set(AppScreen, { screen: "game" })}>
							Replay
						</Button>
					) : null}
					<Button variant="command" onClick={() => w.set(AppScreen, { screen: "menu" })}>
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
