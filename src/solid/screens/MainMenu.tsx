/**
 * MainMenu — SolidJS main menu screen (US-F02).
 *
 * Military command screen with canvas-grain texture background,
 * golden/amber "OTTER ELITE FORCE" stencil title, "COPPER-SILT REACH"
 * subtitle, campaign-first tagline, and military-styled buttons.
 * Continue button is conditional on saved campaign presence.
 * Title fades in on load.
 */

import { type Component, createSignal, onMount, Show } from "solid-js";
import { SqlitePersistenceStore } from "@/engine/persistence/sqlitePersistenceStore";
import type { CampaignProgressRecord } from "@/engine/persistence/types";
import type { AppState } from "../appState";

/** Reusable menu button for the command-post theme. */
const MenuButton: Component<{
	label: string;
	subtitle?: string;
	onClick: () => void;
	disabled?: boolean;
	primary?: boolean;
}> = (props) => {
	return (
		<button
			type="button"
			class={`group relative min-h-12 w-full overflow-hidden border px-5 py-4 text-left uppercase transition-all duration-200 ${
				props.primary
					? "border-accent/50 bg-accent/12 hover:border-accent/70 hover:bg-accent/20 disabled:border-accent/20 disabled:bg-accent/5"
					: "border-border/60 bg-card/60 hover:border-accent/40 hover:bg-card/80 disabled:border-border/30 disabled:bg-card/30"
			} disabled:cursor-not-allowed disabled:opacity-50`}
			onClick={props.onClick}
			disabled={props.disabled}
		>
			{/* Hover sweep line */}
			<div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
				<div class="absolute inset-y-0 left-0 w-[2px] bg-accent/60" />
			</div>
			<span class="relative z-10 block font-heading text-lg tracking-[0.2em] text-foreground sm:text-xl">
				{props.label}
			</span>
			{props.subtitle && (
				<span class="relative z-10 mt-1 block font-mono text-[10px] tracking-[0.22em] text-muted-foreground">
					{props.subtitle}
				</span>
			)}
		</button>
	);
};

export const MainMenu: Component<{ app: AppState }> = (props) => {
	const [campaignProgress, setCampaignProgress] = createSignal<CampaignProgressRecord | null>(null);
	const [loadingProgress, setLoadingProgress] = createSignal(true);
	const [titleVisible, setTitleVisible] = createSignal(false);

	onMount(() => {
		setTimeout(() => setTitleVisible(true), 120);

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
			class="canvas-grain relative min-h-screen overflow-hidden bg-background text-foreground"
		>
			<div class="riverine-camo absolute inset-0 opacity-15" />
			<div class="command-post-grid absolute inset-0 opacity-30" />
			<div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]" />

			<div class="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center px-6 py-8">
				<header
					class={`flex flex-col items-center gap-3 text-center transition-all duration-700 ease-out ${titleVisible() ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
				>
					<div class="inline-block border border-accent/30 bg-accent/8 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.36em] text-accent">
						Copper-Silt Reach
					</div>

					<h1 class="mt-2 font-heading text-4xl uppercase tracking-[0.24em] text-accent text-stencil-shadow sm:text-5xl lg:text-6xl">
						Otter Elite Force
					</h1>

					<p class="mt-1 max-w-xl font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
						Campaign-first river-jungle warfare
					</p>

					<div class="mt-2 flex items-center gap-3">
						<div class="h-px w-12 bg-accent/30" />
						<div class="h-1.5 w-1.5 rotate-45 border border-accent/40 bg-accent/20" />
						<div class="h-px w-12 bg-accent/30" />
					</div>
				</header>

				<nav
					aria-label="Main Navigation"
					class={`mt-10 flex w-full max-w-md flex-col gap-3 transition-all delay-200 duration-700 ease-out ${titleVisible() ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
				>
					<MenuButton
						label="New Campaign"
						subtitle="Begin a new operation"
						primary
						onClick={() => {
							props.app.setCurrentMissionId("mission_1");
							props.app.setIsSkirmish(false);
							props.app.setScreen("briefing");
						}}
					/>
					<Show when={!loadingProgress() && campaignProgress()}>
						<MenuButton
							label="Continue"
							subtitle={
								campaignProgress()?.currentMissionId
									? `Resume: ${campaignProgress()?.currentMissionId}`
									: "Resume Campaign"
							}
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
					</Show>
					<MenuButton
						label="Skirmish"
						subtitle="Single-player battle"
						onClick={() => {
							props.app.setIsSkirmish(true);
							props.app.setScreen("skirmish");
						}}
					/>
					<MenuButton
						label="Settings"
						subtitle="Audio / controls / readability"
						onClick={() => props.app.setScreen("settings")}
					/>
				</nav>

				<div
					class={`mt-12 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 transition-all delay-500 duration-700 ease-out ${titleVisible() ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
				>
					Otter: Elite Force / Build Alpha
				</div>
			</div>
		</main>
	);
};
