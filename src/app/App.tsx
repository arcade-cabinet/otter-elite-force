/**
 * App — Root component with theme switching and simplified screen routing.
 *
 * Flow: menu → game → victory → menu
 */

import { useTrait, useWorld, WorldProvider } from "koota/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { initSingletons } from "@/ecs/singletons";
import { AppScreen, type AppScreenType, CampaignProgress, GamePhase } from "@/ecs/traits/state";
import { world } from "@/ecs/world";
import { CAMPAIGN } from "@/entities/missions";
import type { DeploymentData, DifficultyMode } from "@/game/deployment";
import { EventBus } from "@/game/EventBus";
import { useAudioUnlock } from "@/hooks/useAudioUnlock";
import { useMusicWiring } from "@/hooks/useMusicWiring";
import { MainMenu } from "@/ui/command-post/MainMenu";
import { SettingsPanel } from "@/ui/command-post/SettingsPanel";
import { AlertBanner } from "@/ui/hud/AlertBanner";
import { CombatTextOverlay } from "@/ui/hud/CombatTextOverlay";
import { CommandConsole } from "@/ui/hud/CommandConsole";
import { GameplayTopBar } from "@/ui/hud/GameplayTopBar";
import { TacticalRail } from "@/ui/hud/TacticalRail";
import { BriefingShell, TacticalShell } from "@/ui/layout/shells";
import { resolveTacticalHudLayout, useViewportProfile } from "@/ui/layout/viewport";
import { cn } from "@/ui/lib/utils";
import { type IRefPhaserGame, PhaserGame } from "./PhaserGame";

initSingletons(world);

const SCREEN_THEMES: Record<AppScreenType, string> = {
	menu: "command-post",
	settings: "command-post",
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
		case "settings":
			return <SettingsPanel />;
		case "game":
			return <GameplayScreen />;
		case "victory":
			return <MissionResultOverlay />;
		default:
			return <MainMenu />;
	}
}

function GameplayScreen() {
	const phaserRef = useRef<IRefPhaserGame>(null);
	const w = useWorld();
	const campaign = useTrait(w, CampaignProgress);
	const viewport = useViewportProfile();
	const hudLayout = resolveTacticalHudLayout(viewport);
	const currentMission = campaign?.currentMission ?? "mission_1";
	const difficulty = (campaign?.difficulty ?? "support") as DifficultyMode;
	const deploymentData: DeploymentData = { missionId: currentMission, difficulty };
	const needsLandscapePrompt = viewport.isPhone && viewport.isPortrait;
	const [activeTransmission, setActiveTransmission] = useState<{
		speaker: string;
		text: string;
		portraitId?: string;
		isScenario: boolean;
	} | null>(null);

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

	return (
		<TacticalShell
			hudLayout={hudLayout}
			className={cn(needsLandscapePrompt && "tactical-shell--mobile-portrait")}
			hudTop={
				needsLandscapePrompt ? null : (
					<GameplayTopBar missionId={currentMission} compact={hudLayout !== "desktop"} />
				)
			}
			alerts={
				needsLandscapePrompt ? (
					<RotateDeviceNotice
						width={viewport.width}
						height={viewport.height}
						onReturn={() => w.set(AppScreen, { screen: "menu" })}
					/>
				) : (
					<AlertBanner />
				)
			}
			leftDock={
				needsLandscapePrompt ? null : (
					<TacticalRail
						missionId={currentMission}
						activeSpeaker={activeTransmission?.speaker}
						activePortraitId={activeTransmission?.portraitId}
						compact={hudLayout !== "desktop"}
					/>
				)
			}
			centerDock={
				needsLandscapePrompt ? null : (
					<CommandConsole
						missionId={currentMission}
						compact={hudLayout !== "desktop"}
						showUnitPanel={false}
						showMinimap={false}
						onActiveTransmissionChange={setActiveTransmission}
					/>
				)
			}
		>
			<PhaserGame ref={phaserRef} deploymentData={deploymentData} />
			<CombatTextOverlay />
		</TacticalShell>
	);
}

function RotateDeviceNotice({
	width,
	height,
	onReturn,
}: {
	width: number;
	height: number;
	onReturn: () => void;
}) {
	return (
		<div className="gameplay-viewport-card w-full rounded-lg border border-accent/25 bg-card/82 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.4)] sm:max-w-sm">
			<div className="flex flex-wrap items-center gap-2">
				<span className="rounded border border-accent/25 bg-accent/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
					Rotate to Landscape
				</span>
				<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
					{width} × {height}
				</span>
			</div>
			<div className="mt-3 font-heading text-sm uppercase tracking-[0.18em] text-foreground">
				Tactical play is landscape-first on phone.
			</div>
			<p className="mt-2 font-body text-[11px] uppercase tracking-[0.14em] leading-relaxed text-muted-foreground">
				Rotate your device to keep the battlefield clear, preserve touch-safe command zones, and
				avoid fighting the HUD.
			</p>
			<div className="mt-3 flex flex-wrap gap-2">
				<Button variant="accent" onClick={onReturn}>
					Back to Menu
				</Button>
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
					<Button variant="command" onClick={() => w.set(AppScreen, { screen: "menu" })}>
						Main Menu
					</Button>
				</div>
			}
		>
			<div className="rounded-lg border border-accent/25 bg-card/70 p-6 font-body text-xs uppercase tracking-[0.16em] text-muted-foreground">
				{isDefeat
					? "Mission command now loops directly back into play. Retry the operation without bouncing through detached pre-mission screens."
					: "Campaign progression now moves operation-to-operation. No campaign map, no canteen, no store friction."}
			</div>
		</BriefingShell>
	);
}

export default App;
