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

// Re-export for consumers
export { createAppState, type AppState };
export type { ScreenId } from "./appState";

/**
 * Main Menu screen — New Campaign, Continue, Skirmish, Settings.
 */
const MainMenuScreen: Component<{ app: AppState }> = (props) => {
	return (
		<div class="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
			<div class="riverine-camo absolute inset-0 opacity-20" />
			<div class="relative z-10 flex flex-col items-center gap-8">
				<div class="text-center">
					<div class="inline-block border border-accent/25 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
						Otter: Elite Force
					</div>
					<h1 class="mt-4 font-heading text-4xl uppercase tracking-[0.22em] text-primary">
						Command Post
					</h1>
					<p class="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
						Copper-Silt Reach -- Campaign Operations
					</p>
				</div>
				<div class="flex flex-col gap-3 min-w-[240px]">
					<MenuButton
						label="New Campaign"
						onClick={() => {
							props.app.setCurrentMissionId("mission_1");
							props.app.setIsSkirmish(false);
							props.app.setScreen("briefing");
						}}
					/>
					<MenuButton
						label="Continue"
						onClick={() => {
							props.app.setIsSkirmish(false);
							props.app.setScreen("campaign");
						}}
					/>
					<MenuButton
						label="Skirmish"
						onClick={() => {
							props.app.setIsSkirmish(true);
							props.app.setScreen("skirmish");
						}}
					/>
					<MenuButton
						label="Settings"
						onClick={() => props.app.setScreen("settings")}
					/>
				</div>
			</div>
		</div>
	);
};

/**
 * Campaign view — shows mission list with unlock/star state.
 */
const CampaignScreen: Component<{ app: AppState }> = (props) => {
	return (
		<div class="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
			<div class="relative z-10 flex flex-col items-center gap-6 max-w-lg w-full px-4">
				<h2 class="font-heading text-2xl uppercase tracking-[0.22em] text-primary">
					Campaign
				</h2>
				<p class="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
					Select a mission to deploy
				</p>
				<div class="flex flex-col gap-2 w-full">
					{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((n) => (
						<button
							type="button"
							class="w-full text-left border border-slate-700/50 bg-slate-900/80 px-4 py-3 font-mono text-xs uppercase tracking-[0.14em] text-slate-200 hover:border-accent/40 hover:bg-slate-800/80 transition-colors"
							onClick={() => {
								props.app.setCurrentMissionId(`mission_${n}`);
								props.app.setScreen("briefing");
							}}
						>
							Mission {n}
						</button>
					))}
				</div>
				<MenuButton label="Back" onClick={() => props.app.setScreen("main-menu")} />
			</div>
		</div>
	);
};

/**
 * Settings screen — audio, subtitles, reduce motion.
 */
const SettingsScreen: Component<{ app: AppState }> = (props) => {
	return (
		<div class="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
			<div class="relative z-10 flex flex-col items-center gap-6 max-w-md w-full px-4">
				<h2 class="font-heading text-2xl uppercase tracking-[0.22em] text-primary">
					Settings
				</h2>
				<div class="w-full space-y-4">
					<SettingRow label="Music Volume" />
					<SettingRow label="SFX Volume" />
					<SettingRow label="Subtitles" />
					<SettingRow label="Reduce Motion" />
				</div>
				<MenuButton label="Back" onClick={() => props.app.setScreen("main-menu")} />
			</div>
		</div>
	);
};

/**
 * Skirmish setup screen — seed, map, faction, difficulty.
 */
const SkirmishScreen: Component<{ app: AppState }> = (props) => {
	return (
		<div class="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
			<div class="relative z-10 flex flex-col items-center gap-6 max-w-md w-full px-4">
				<h2 class="font-heading text-2xl uppercase tracking-[0.22em] text-primary">
					Skirmish Setup
				</h2>
				<p class="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
					Configure your battlefield
				</p>
				<MenuButton
					label="Launch Skirmish"
					onClick={() => props.app.setScreen("game")}
				/>
				<MenuButton label="Back" onClick={() => props.app.setScreen("main-menu")} />
			</div>
		</div>
	);
};

/**
 * Briefing screen — commander portrait, mission description, objectives, deploy.
 */
const BriefingScreen: Component<{ app: AppState }> = (props) => {
	return (
		<div class="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
			<div class="relative z-10 flex flex-col items-center gap-6 max-w-lg w-full px-4">
				<div class="inline-block border border-accent/25 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
					Mission Briefing
				</div>
				<h2 class="font-heading text-2xl uppercase tracking-[0.22em] text-primary">
					{props.app.currentMissionId() ?? "Mission"}
				</h2>
				<p class="font-body text-sm text-slate-300 text-center leading-relaxed">
					Intel is being compiled. Deploy when ready, Captain.
				</p>
				<MenuButton
					label="Deploy"
					onClick={() => props.app.setScreen("game")}
				/>
				<MenuButton label="Back" onClick={() => props.app.setScreen("campaign")} />
			</div>
		</div>
	);
};

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
 * Mission result screen — victory/defeat banner, star rating, next mission.
 */
const ResultScreen: Component<{ app: AppState }> = (props) => {
	return (
		<div class="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
			<div class="relative z-10 flex flex-col items-center gap-6">
				<h2 class="font-heading text-3xl uppercase tracking-[0.22em] text-primary">
					Mission Complete
				</h2>
				<MenuButton
					label="Next Mission"
					onClick={() => props.app.setScreen("briefing")}
				/>
				<MenuButton
					label="Main Menu"
					onClick={() => props.app.setScreen("main-menu")}
				/>
			</div>
		</div>
	);
};

/**
 * Reusable menu button for the command-post theme.
 */
const MenuButton: Component<{ label: string; onClick: () => void }> = (props) => {
	return (
		<button
			type="button"
			class="min-h-11 w-full rounded border border-slate-600/70 bg-slate-900/85 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-slate-100 backdrop-blur-sm hover:border-accent/50 hover:bg-slate-800/85 transition-colors"
			onClick={props.onClick}
		>
			{props.label}
		</button>
	);
};

/**
 * Placeholder settings row.
 */
const SettingRow: Component<{ label: string }> = (props) => {
	return (
		<div class="flex items-center justify-between border border-slate-700/30 bg-slate-900/50 px-4 py-3">
			<span class="font-mono text-xs uppercase tracking-[0.14em] text-slate-300">{props.label}</span>
			<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">--</span>
		</div>
	);
};

/**
 * Root SolidJS App Shell — manages screen routing via Switch/Match.
 */
export const AppShell: Component = () => {
	const app = createAppState();

	return (
		<Switch fallback={<MainMenuScreen app={app} />}>
			<Match when={app.screen() === "main-menu"}>
				<MainMenuScreen app={app} />
			</Match>
			<Match when={app.screen() === "campaign"}>
				<CampaignScreen app={app} />
			</Match>
			<Match when={app.screen() === "settings"}>
				<SettingsScreen app={app} />
			</Match>
			<Match when={app.screen() === "skirmish"}>
				<SkirmishScreen app={app} />
			</Match>
			<Match when={app.screen() === "game"}>
				<GameScreen app={app} />
			</Match>
			<Match when={app.screen() === "briefing"}>
				<BriefingScreen app={app} />
			</Match>
			<Match when={app.screen() === "result"}>
				<ResultScreen app={app} />
			</Match>
		</Switch>
	);
};
