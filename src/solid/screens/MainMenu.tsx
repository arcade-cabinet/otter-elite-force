/**
 * MainMenu — SolidJS main menu screen (US-F02).
 *
 * Displays "Otter: Elite Force" title with military styling,
 * buttons for New Campaign, Continue, Skirmish, and Settings.
 * Each button navigates via appState.setScreen().
 */

import { type Component, createSignal, onMount } from "solid-js";
import { SqlitePersistenceStore } from "@/engine/persistence/sqlitePersistenceStore";
import type { CampaignProgressRecord } from "@/engine/persistence/types";
import type { AppState } from "../appState";

/** Reusable menu button for the command-post theme. */
const MenuButton: Component<{
	label: string;
	subtitle?: string;
	onClick: () => void;
	disabled?: boolean;
}> = (props) => {
	return (
		<button
			type="button"
			class="min-h-11 w-full rounded border border-slate-600/70 bg-slate-900/85 px-5 py-4 text-left font-mono uppercase tracking-[0.18em] text-slate-100 backdrop-blur-sm transition-colors hover:border-accent/50 hover:bg-slate-800/85 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-600/70 disabled:hover:bg-slate-900/85"
			onClick={props.onClick}
			disabled={props.disabled}
		>
			<span class="block font-heading text-xl tracking-[0.18em]">{props.label}</span>
			{props.subtitle && (
				<span class="mt-1 block font-mono text-[10px] tracking-[0.22em] text-slate-400">
					{props.subtitle}
				</span>
			)}
		</button>
	);
};

export const MainMenu: Component<{ app: AppState }> = (props) => {
	const [campaignProgress, setCampaignProgress] = createSignal<CampaignProgressRecord | null>(null);
	const [loadingProgress, setLoadingProgress] = createSignal(true);

	onMount(() => {
		const store = new SqlitePersistenceStore();
		void store
			.initialize()
			.then(() => store.loadCampaign())
			.then((progress) => {
				setCampaignProgress(progress);
				setLoadingProgress(false);
			})
			.catch(() => {
				setLoadingProgress(false);
			});
	});

	return (
		<main
			aria-label="Main Menu"
			class="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100"
		>
			<div class="riverine-camo absolute inset-0 opacity-20" />

			<div class="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center px-6 py-8">
				{/* Header */}
				<header class="flex flex-col items-center gap-2 text-center">
					<div class="inline-block border border-accent/25 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.32em] text-accent">
						Copper-Silt Reach
					</div>
					<h1 class="mt-4 font-heading text-4xl uppercase tracking-[0.22em] text-primary sm:text-5xl lg:text-6xl">
						Otter Elite Force
					</h1>
					<p class="mt-2 max-w-2xl font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
						Campaign-first river-jungle warfare
					</p>
				</header>

				{/* Navigation buttons */}
				<nav aria-label="Main Navigation" class="mt-10 flex w-full max-w-md flex-col gap-3">
					<MenuButton
						label="New Campaign"
						subtitle="Start Campaign"
						onClick={() => {
							props.app.setCurrentMissionId("mission_1");
							props.app.setIsSkirmish(false);
							props.app.setScreen("briefing");
						}}
					/>
					<MenuButton
						label="Continue"
						subtitle={
							campaignProgress()?.currentMissionId
								? `Resume: ${campaignProgress()?.currentMissionId}`
								: "Resume Campaign"
						}
						disabled={loadingProgress() || !campaignProgress()}
						onClick={() => {
							const progress = campaignProgress();
							props.app.setIsSkirmish(false);
							if (progress?.currentMissionId) {
								props.app.setCurrentMissionId(progress.currentMissionId);
								props.app.setScreen("briefing");
							} else {
								props.app.setScreen("campaign");
							}
						}}
					/>
					<MenuButton
						label="Skirmish"
						subtitle="Single-Player Battle"
						onClick={() => {
							props.app.setIsSkirmish(true);
							props.app.setScreen("skirmish");
						}}
					/>
					<MenuButton
						label="Settings"
						subtitle="Audio / Controls / Readability"
						onClick={() => props.app.setScreen("settings")}
					/>
				</nav>
			</div>
		</main>
	);
};
