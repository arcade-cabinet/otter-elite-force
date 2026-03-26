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
 * Game screen — mounts the tactical runtime canvas.
 * During migration, this provides a container for the React RuntimeHost.
 */
const GameScreen: Component<{ app: AppState }> = (props) => {
	return (
		<div class="relative h-screen w-screen overflow-hidden bg-slate-950">
			<div class="absolute inset-0" data-testid="solid-game-container" />
			<div class="absolute right-4 top-4 z-10">
				<button
					type="button"
					class="min-h-11 rounded border border-slate-600/70 bg-slate-950/85 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-100 backdrop-blur-sm"
					onClick={() => props.app.setScreen("main-menu")}
				>
					Quit
				</button>
			</div>
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
