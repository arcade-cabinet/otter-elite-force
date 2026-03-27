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

import { Switch, Match, type Component } from "solid-js";
import { createAppState, type AppState } from "./appState";
import { RuntimeHost } from "@/engine/runtime/RuntimeHost";
import {
	MainMenu,
	CampaignView,
	SettingsPanel,
	SkirmishSetup,
	BriefingOverlay,
	MissionResult,
	SkirmishResult,
} from "./screens";

// Re-export for consumers
export { createAppState, type AppState };
export type { ScreenId } from "./appState";

/**
 * Game screen — mounts the LittleJS tactical runtime via RuntimeHost.
 */
const GameScreen: Component<{ app: AppState }> = (props) => {
	return (
		<div class="h-screen w-screen">
			<RuntimeHost
				mode={props.app.isSkirmish() ? "skirmish" : "campaign"}
				missionId={props.app.currentMissionId() ?? undefined}
				onPhaseChange={(phase) => {
					if (phase === "victory" || phase === "defeat") {
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
export const AppShell: Component = () => {
	const app = createAppState();

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
					<MissionResult app={app} />
				)}
			</Match>
		</Switch>
	);
};
