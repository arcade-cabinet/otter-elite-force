/**
 * App — Root component with theme switching and screen routing.
 *
 * Reads AppScreen trait from Koota to determine active screen.
 * Sets `data-theme` on <html> to activate the correct CSS theme.
 * Wraps everything in WorldProvider so all children can read Koota.
 *
 * Flow: menu → campaign → briefing → game → victory → settings
 */

import { useTrait, useWorld, WorldProvider } from "koota/react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { initSingletons } from "@/ecs/singletons";
import { AppScreen, type AppScreenType, CampaignProgress } from "@/ecs/traits/state";
import { world } from "@/ecs/world";
import { CAMPAIGN, getMissionById } from "@/entities/missions";
import type { DeploymentData, DifficultyMode } from "@/game/deployment";
import { EventBus } from "@/game/EventBus";
import { BriefingScreen } from "@/ui/briefing/BriefingScreen";
import { CampaignMap } from "@/ui/command-post/CampaignMap";
import { CanteenScreen } from "@/ui/command-post/CanteenScreen";
// UI screens
import { MainMenu } from "@/ui/command-post/MainMenu";
import { SettingsPanel } from "@/ui/command-post/SettingsPanel";
import { ActionBar } from "@/ui/hud/ActionBar";
import { AlertBanner } from "@/ui/hud/AlertBanner";
import { CombatTextOverlay } from "@/ui/hud/CombatTextOverlay";
import { Minimap } from "@/ui/hud/Minimap";

// HUD overlay (shown during gameplay)
import { ResourceBar } from "@/ui/hud/ResourceBar";
import { UnitPanel } from "@/ui/hud/UnitPanel";
import { BriefingShell, TacticalShell } from "@/ui/layout/shells";
import { resolveTacticalHudLayout, useViewportProfile } from "@/ui/layout/viewport";
import { cn } from "@/ui/lib/utils";
import { type IRefPhaserGame, PhaserGame } from "./PhaserGame";

// Initialize singleton state traits once at module load
initSingletons(world);

/** Map screen → CSS theme name */
const SCREEN_THEMES: Record<AppScreenType, string> = {
	menu: "command-post",
	campaign: "command-post",
	canteen: "command-post",
	settings: "command-post",
	briefing: "briefing",
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

/** Reads AppScreen from Koota and renders the active screen. */
function AppRouter() {
	const w = useWorld();
	const appScreen = useTrait(w, AppScreen);
	const screen = appScreen?.screen ?? "menu";

	// Apply theme to <html> element
	useEffect(() => {
		const theme = SCREEN_THEMES[screen] ?? "command-post";
		document.documentElement.setAttribute("data-theme", theme);
	}, [screen]);

	switch (screen) {
		case "menu":
			return <MainMenu />;
		case "campaign":
			return <CampaignMap />;
		case "canteen":
			return <CanteenScreen />;
		case "settings":
			return <SettingsPanel />;
		case "briefing":
			return <BriefingRoute />;
		case "game":
			return <GameplayScreen />;
		case "victory":
			return <VictoryOverlay />;
		default:
			return <MainMenu />;
	}
}

/** Briefing screen driven by the selected mission definition. */
function BriefingRoute() {
	const w = useWorld();
	const campaign = useTrait(w, CampaignProgress);
	const mission = getMissionById(campaign?.currentMission ?? "mission_1") ?? CAMPAIGN[0];

	const deploy = () => {
		w.set(AppScreen, { screen: "game" });
	};

	return (
		<BriefingScreen
			briefing={{
				missionId: mission.id,
				missionName: mission.name,
				subtitle: mission.subtitle,
				portraitId: mission.briefing.portraitId,
				lines: mission.briefing.lines,
			}}
			onDeploy={deploy}
		/>
	);
}

/** Gameplay screen: Phaser canvas + tactical HUD overlay. */
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
	const inlineUnitSummary = hudLayout === "mobile" && viewport.isLandscape;

	useEffect(() => {
		const onMissionComplete = (data: {
			missionId: string;
			stars: number;
			stats?: { timeElapsed?: number };
		}) => {
			const progress = w.get(CampaignProgress);
			if (!progress) return;

			const currentIndex = CAMPAIGN.findIndex((mission) => mission.id === data.missionId);
			const nextMission = currentIndex >= 0 ? CAMPAIGN[currentIndex + 1] : undefined;
			const existing = progress.missions[data.missionId];
			const bestTime = data.stats?.timeElapsed ?? existing?.bestTime ?? 0;

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
			w.set(AppScreen, { screen: "briefing" });
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
				<div className="grid gap-2">
					<ResourceBar />
					{!needsLandscapePrompt && inlineUnitSummary ? <UnitPanel compact /> : null}
					{viewport.isPhone && viewport.isLandscape ? (
						<div className="sm:hidden rounded-md border border-accent/20 bg-card/72 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
							Landscape compact HUD active • unit status rides top-side while command docks stay
							edge-anchored.
						</div>
					) : null}
				</div>
			}
			alerts={
				needsLandscapePrompt ? (
					<RotateDeviceNotice
						width={viewport.width}
						height={viewport.height}
						onReturn={() => w.set(AppScreen, { screen: "briefing" })}
					/>
				) : (
					<AlertBanner />
				)
			}
			leftDock={needsLandscapePrompt ? null : <Minimap compact={hudLayout !== "desktop"} />}
			centerDock={
				needsLandscapePrompt || inlineUnitSummary ? null : (
					<UnitPanel compact={hudLayout === "tablet"} />
				)
			}
			rightDock={needsLandscapePrompt ? null : <ActionBar compact={hudLayout !== "desktop"} />}
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
					Back to Briefing
				</Button>
			</div>
		</div>
	);
}

/** Victory overlay — shown after mission completion. */
function VictoryOverlay() {
	const w = useWorld();

	return (
		<BriefingShell
			title="Mission Complete"
			subtitle="Return to the campaign map, queue the next operation, and keep the pressure moving forward."
			footer={
				<Button variant="accent" onClick={() => w.set(AppScreen, { screen: "campaign" })}>
					Continue Campaign
				</Button>
			}
		>
			<div className="rounded-lg border border-accent/25 bg-card/70 p-6 font-body text-xs uppercase tracking-[0.16em] text-muted-foreground">
				Mission results are now presented inside the same high-contrast briefing shell instead of a
				generic standalone page.
			</div>
		</BriefingShell>
	);
}

export default App;
