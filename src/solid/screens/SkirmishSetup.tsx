/**
 * SkirmishSetup — SolidJS skirmish setup screen (US-F04).
 *
 * Map selection with preview cards, seed input with shuffle, difficulty
 * selector, test preset selector, faction swap checkbox, and launch button.
 */

import { type Component, createSignal, For, Show } from "solid-js";
import { createSeedBundle } from "@/engine/random/seed";
import {
	isMapUnlocked,
	SKIRMISH_DIFFICULTIES,
	SKIRMISH_MAPS,
	SKIRMISH_PRESETS,
	type SkirmishDifficultyOption,
	type SkirmishMapDef,
	type SkirmishPreset,
	type SkirmishSessionConfig,
} from "@/features/skirmish/types";
import type { AppState } from "../appState";

function generateSeedPhrase(): string {
	const words = [
		"river",
		"mud",
		"otter",
		"delta",
		"creek",
		"marsh",
		"timber",
		"scout",
		"dawn",
		"fog",
		"ridge",
		"stone",
		"drift",
		"iron",
		"tide",
		"frost",
		"bark",
		"fern",
		"moss",
		"vale",
	];
	const pick = () => words[Math.floor(Math.random() * words.length)];
	return `${pick()}-${pick()}-${pick()}`;
}

const MapCard: Component<{
	map: SkirmishMapDef;
	unlocked: boolean;
	selected: boolean;
	onSelect: () => void;
}> = (props) => (
	<button
		type="button"
		onClick={props.onSelect}
		disabled={!props.unlocked}
		class={`group relative border p-3 text-left transition-all duration-150 ${
			props.unlocked
				? props.selected
					? "border-accent/60 bg-accent/10 shadow-[0_0_0_1px_rgba(255,226,138,0.15)]"
					: "border-border/50 bg-card/30 hover:border-accent/35 hover:bg-card/50"
				: "cursor-not-allowed border-border/25 bg-card/15 opacity-50"
		}`}
	>
		<div
			class={`flex h-16 items-center justify-center border text-center ${
				props.unlocked
					? props.selected
						? "border-accent/20 bg-[radial-gradient(circle,rgba(212,165,116,0.1),transparent_50%)]"
						: "border-border/30 bg-muted/20"
					: "border-border/20 bg-muted/10"
			}`}
		>
			<Show when={props.unlocked}>
				<div class="flex flex-col items-center gap-0.5">
					<span class="font-mono text-[9px] uppercase tracking-[0.2em] text-accent/60">
						{props.map.terrainType}
					</span>
					<span class="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground/60">
						{props.map.size}
					</span>
				</div>
			</Show>
			<Show when={!props.unlocked}>
				<span class="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50">
					{props.map.starsRequired} stars
				</span>
			</Show>
		</div>
		<div class="mt-2 font-heading text-sm uppercase tracking-[0.16em] text-primary">
			{props.unlocked ? props.map.name : "Locked"}
		</div>
		<Show when={props.unlocked}>
			<div class="mt-1 font-body text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70">
				{props.map.description}
			</div>
		</Show>
		<Show when={!props.unlocked}>
			<div class="mt-1 font-body text-[10px] uppercase tracking-[0.08em] text-muted-foreground/50">
				Requires {props.map.starsRequired} campaign stars
			</div>
		</Show>
		<Show when={props.selected && props.unlocked}>
			<div class="absolute right-2 top-2 h-2 w-2 bg-accent/70" />
		</Show>
	</button>
);

const SectionLabel: Component<{ label: string }> = (props) => (
	<div class="mb-2 flex items-center gap-3">
		<span class="font-heading text-[10px] uppercase tracking-[0.26em] text-accent">
			{props.label}
		</span>
		<div class="h-px flex-1 bg-accent/15" />
	</div>
);

export const SkirmishSetup: Component<{ app: AppState }> = (props) => {
	const [selectedMapId, setSelectedMapId] = createSignal<string>(SKIRMISH_MAPS[0].id);
	const [selectedDifficulty, setSelectedDifficulty] = createSignal<SkirmishDifficultyOption>(
		SKIRMISH_DIFFICULTIES[1],
	);
	const [playAsScaleGuard, setPlayAsScaleGuard] = createSignal(false);
	const [seedPhrase, setSeedPhrase] = createSignal(generateSeedPhrase());
	const [selectedPreset, setSelectedPreset] = createSignal<SkirmishPreset>("meso");
	const totalStars = 0;
	const allUnlocked = false;
	const selectedMap = () => SKIRMISH_MAPS.find((m) => m.id === selectedMapId()) ?? SKIRMISH_MAPS[0];
	const canStart = () => allUnlocked || isMapUnlocked(selectedMap(), totalStars);

	return (
		<div class="canvas-grain relative min-h-screen overflow-hidden bg-background text-foreground">
			<div class="riverine-camo absolute inset-0 opacity-15" />
			<div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,226,138,0.04),transparent_40%)]" />
			<div class="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
				<header class="flex flex-col items-center gap-2 text-center">
					<div class="border border-accent/30 bg-accent/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.36em] text-accent">
						Skirmish Operations
					</div>
					<h1 class="font-heading text-3xl uppercase tracking-[0.24em] text-primary sm:text-4xl">
						Skirmish
					</h1>
					<p class="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
						{totalStars} campaign stars earned
					</p>
				</header>
				<div class="mt-6 grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
					<section>
						<SectionLabel label="Select Map" />
						<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							<For each={SKIRMISH_MAPS}>
								{(map) => {
									const unlocked = allUnlocked || isMapUnlocked(map, totalStars);
									return (
										<MapCard
											map={map}
											unlocked={unlocked}
											selected={map.id === selectedMapId()}
											onSelect={() => unlocked && setSelectedMapId(map.id)}
										/>
									);
								}}
							</For>
						</div>
					</section>
					<aside class="flex flex-col gap-4">
						<div>
							<SectionLabel label="Difficulty" />
							<div class="grid gap-2">
								<For each={SKIRMISH_DIFFICULTIES}>
									{(d) => (
										<button
											type="button"
											onClick={() => setSelectedDifficulty(d)}
											class={`border px-4 py-3 text-left transition-all duration-150 ${d.id === selectedDifficulty().id ? "border-accent/50 bg-accent/12 text-accent" : "border-border/40 bg-card/30 text-foreground hover:border-accent/30 hover:bg-card/50"}`}
										>
											<div class="font-heading text-sm uppercase tracking-[0.18em]">{d.label}</div>
											<div class="mt-1 font-body text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70">
												{d.note}
											</div>
										</button>
									)}
								</For>
							</div>
						</div>
						<div>
							<SectionLabel label="Test Preset" />
							<div class="grid gap-2">
								<For each={SKIRMISH_PRESETS}>
									{(preset) => (
										<button
											type="button"
											onClick={() => setSelectedPreset(preset.id)}
											class={`border px-4 py-3 text-left transition-all duration-150 ${preset.id === selectedPreset() ? "border-accent/50 bg-accent/12 text-accent" : "border-border/40 bg-card/30 text-foreground hover:border-accent/30 hover:bg-card/50"}`}
										>
											<div class="font-heading text-sm uppercase tracking-[0.18em]">
												{preset.label}
											</div>
											<div class="mt-1 font-body text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70">
												{preset.note}
											</div>
										</button>
									)}
								</For>
							</div>
						</div>
						<div class="border border-border/40 bg-card/25 p-4">
							{/* biome-ignore lint/a11y/noLabelWithoutControl: sr-only input inside label */}
							<label class="flex cursor-pointer items-center gap-3">
								<input
									type="checkbox"
									checked={playAsScaleGuard()}
									onChange={(e) => setPlayAsScaleGuard(e.currentTarget.checked)}
									class="sr-only"
								/>
								<div
									class={`flex h-4 w-4 items-center justify-center border transition-colors ${playAsScaleGuard() ? "border-accent/60 bg-accent/30" : "border-border/50 bg-muted/30"}`}
									aria-hidden="true"
								>
									<Show when={playAsScaleGuard()}>
										<span class="text-[9px] text-accent">&#x2713;</span>
									</Show>
								</div>
								<div>
									<div class="font-heading text-sm uppercase tracking-[0.16em] text-foreground">
										Play as Scale-Guard
									</div>
									<div class="font-body text-[10px] uppercase tracking-[0.08em] text-muted-foreground/60">
										Swap factions. AI controls OEF.
									</div>
								</div>
							</label>
						</div>
						<div class="border border-border/40 bg-card/25 p-4">
							<SectionLabel label="Seed Phrase" />
							<div class="flex gap-2">
								<input
									type="text"
									value={seedPhrase()}
									onInput={(e) => setSeedPhrase(e.currentTarget.value)}
									class="min-w-0 flex-1 border border-border/50 bg-muted/30 px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-foreground placeholder:text-muted-foreground/30"
								/>
								<button
									type="button"
									onClick={() => setSeedPhrase(generateSeedPhrase())}
									class="border border-border/50 bg-card/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
								>
									Shuffle
								</button>
							</div>
							<div class="mt-2 font-body text-[9px] uppercase tracking-[0.1em] text-muted-foreground/50">
								Deterministic seed for map generation.
							</div>
						</div>
						<div class="border border-border/40 bg-card/25 p-4">
							<div class="font-heading text-lg uppercase tracking-[0.18em] text-primary">
								{selectedMap().name}
							</div>
							<div class="mt-1 font-body text-[11px] uppercase tracking-[0.1em] text-muted-foreground/70">
								{selectedMap().description}
							</div>
							<div class="mt-3 flex flex-wrap gap-2">
								<span class="border border-accent/25 bg-accent/8 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
									{selectedMap().size}
								</span>
								<span class="border border-accent/25 bg-accent/8 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
									{selectedMap().terrainType}
								</span>
							</div>
						</div>
						<div class="mt-auto flex flex-col gap-2">
							<button
								type="button"
								disabled={!canStart()}
								onClick={() => {
									if (!canStart()) return;
									const map = selectedMap();
									const seed = createSeedBundle({
										phrase: seedPhrase(),
										source: "skirmish",
									});
									const config: SkirmishSessionConfig = {
										mapId: map.id,
										mapName: map.name,
										difficulty: selectedDifficulty().id,
										playAsScaleGuard: playAsScaleGuard(),
										preset: selectedPreset(),
										seed,
										startingResources: { fish: 300, timber: 200, salvage: 100 },
									};
									props.app.setSkirmishConfig(config);
									props.app.setSkirmishSeedPhrase(seedPhrase());
									props.app.setIsSkirmish(true);
									props.app.setScreen("game");
								}}
								class="min-h-12 w-full border-2 border-accent/60 bg-accent/15 px-4 py-3 font-heading text-sm uppercase tracking-[0.2em] text-accent transition-all duration-200 hover:border-accent/80 hover:bg-accent/25 hover:shadow-[0_0_20px_rgba(255,226,138,0.1)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
							>
								Start Skirmish
							</button>
							<button
								type="button"
								onClick={() => props.app.setScreen("main-menu")}
								class="min-h-11 w-full border border-border/50 bg-card/60 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
							>
								Back to Menu
							</button>
						</div>
					</aside>
				</div>
			</div>
		</div>
	);
};
