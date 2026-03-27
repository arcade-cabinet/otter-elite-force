/**
 * SolidJS App Shell — root component with screen routing.
 *
 * Replaces the React app root for the new engine stack.
 * Routes between: main-menu, campaign, settings, skirmish,
 * game, briefing, result screens.
 *
 * During migration, the game screen delegates to a React RuntimeHost
 * mounted via a DOM bridge. Post-migration, all screens are pure Solid.
 */

import { type Component, createEffect, Match, Switch } from "solid-js";
import { isFinalCampaignMission, resolveMissionVictory } from "@/app/missionResult";
import { SqlitePersistenceStore } from "@/engine/persistence/sqlitePersistenceStore";
import { type PhaseChangeStats, RuntimeHost } from "@/engine/runtime/RuntimeHost";
import { type AppState, createAppState, type ScreenId } from "./appState";
import { createFormFactorSignal } from "./mobile/MobileLayout";
import {
	BriefingOverlay,
	CampaignView,
	MainMenu,
	MissionResult,
	SettingsPanel,
	SkirmishResult,
	SkirmishSetup,
} from "./screens";
import type { MissionResultData } from "./screens/MissionResult";

export type { ScreenId } from "./appState";
// Re-export for consumers
export { type AppState, createAppState };

/**
 * Game screen — mounts the LittleJS tactical runtime via RuntimeHost.
 * On victory/defeat, captures stats and navigates to result screen.
 */
const GameScreen: Component<{ app: AppState }> = (props) => {
	const formFactor = createFormFactorSignal();

	return (
		<div class="h-screen w-screen" data-form-factor={formFactor()}>
			<RuntimeHost
				mode={props.app.isSkirmish() ? "skirmish" : "campaign"}
				missionId={props.app.currentMissionId() ?? undefined}
				onPhaseChange={(phase, stats?: PhaseChangeStats) => {
					if (phase === "victory" || phase === "defeat") {
						const missionId = props.app.currentMissionId() ?? "unknown";
						const elapsedSec = stats ? Math.floor(stats.timeElapsedMs / 1000) : 0;
						// Star rating: 1 star base, +1 for > half objectives, +1 for all objectives
						let stars: 0 | 1 | 2 | 3 = 0;
						if (phase === "victory" && stats) {
							stars = 1;
							if (stats.objectivesTotal > 0) {
								if (stats.objectivesCompleted >= stats.objectivesTotal) {
									stars = 3;
								} else if (stats.objectivesCompleted > stats.objectivesTotal / 2) {
									stars = 2;
								}
							}
						}
						const resultData: MissionResultData = {
							outcome: phase as "victory" | "defeat",
							missionId,
							missionName: phase === "victory" ? "MISSION COMPLETE" : "MISSION FAILED",
							stars,
							stats: {
								timeElapsed: elapsedSec,
								unitsLost: stats?.unitsLost ?? 0,
								resourcesGathered: stats?.resourcesGathered ?? 0,
								unitsDeployed: stats?.unitsDeployed ?? 0,
							},
							isFinalMission: isFinalCampaignMission(missionId),
						};
						props.app.setMissionResult(resultData);

						// Persist campaign progress on victory
						if (phase === "victory" && !props.app.isSkirmish()) {
							const store = new SqlitePersistenceStore();
							void store
								.initialize()
								.then(async () => {
									const existing = await store.loadCampaign();
									const progress = existing ?? {
										currentMissionId: missionId,
										difficulty: "tactical" as const,
										missions: {},
									};
									const resolution = resolveMissionVictory(
										{
											missions: Object.fromEntries(
												Object.entries(progress.missions).map(([k, v]) => [
													k,
													{
														status: v.status,
														stars: v.stars,
														bestTime: v.bestTimeMs ?? 0,
													},
												]),
											),
											currentMission: progress.currentMissionId,
											difficulty: progress.difficulty,
										},
										missionId,
										stars,
									);
									await store.saveCampaign({
										currentMissionId: resolution.nextMissionId,
										difficulty: progress.difficulty,
										missions: Object.fromEntries(
											Object.entries(resolution.progress.missions).map(([k, v]) => [
												k,
												{
													status: v.status as "locked" | "available" | "completed",
													stars: v.stars,
													bestTimeMs: v.bestTime,
												},
											]),
										),
									});
								})
								.catch((err: unknown) => {
									console.error("[AppShell] Failed to persist campaign progress:", err);
								});
						}

						props.app.setScreen("result");
					}
				}}
			/>
		</div>
	);
};

/**
 * Root SolidJS App Shell — manages screen routing via Switch/Match.
 */
/** Map screen IDs to their visual theme for CSS custom properties. */
function screenToTheme(screen: ScreenId): string {
	switch (screen) {
		case "game":
			return "tactical";
		case "briefing":
			return "briefing";
		default:
			return "command-post";
	}
}

export const AppShell: Component = () => {
	const app = createAppState();

	// Synchronize the data-theme attribute on <html> so CSS custom properties resolve
	createEffect(() => {
		document.documentElement.setAttribute("data-theme", screenToTheme(app.screen()));
	});

	return (
		<Switch fallback={<MainMenu app={app} />}>
			<Match when={app.screen() === "main-menu"}>
				<MainMenu app={app} />
			</Match>
			<Match when={app.screen() === "campaign"}>
				<CampaignView app={app} />
			</Match>
			<Match when={app.screen() === "settings"}>
				<SettingsPanel app={app} />
			</Match>
			<Match when={app.screen() === "skirmish"}>
				<SkirmishSetup app={app} />
			</Match>
			<Match when={app.screen() === "game"}>
				<GameScreen app={app} />
			</Match>
			<Match when={app.screen() === "briefing"}>
				<BriefingOverlay app={app} />
			</Match>
			<Match when={app.screen() === "result"}>
				{app.isSkirmish() ? (
					<SkirmishResult app={app} />
				) : (
					<MissionResult app={app} result={app.missionResult() ?? undefined} />
				)}
			</Match>
		</Switch>
	);
};
