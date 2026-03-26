/**
 * SkirmishSetup — SolidJS skirmish setup screen (US-F04).
 *
 * Seed phrase input with shuffle, map size selector, faction selector,
 * difficulty selector, and launch button. All form state uses createSignal.
 */

import { type Component, For, Show, createSignal } from "solid-js";
import {
	SKIRMISH_DIFFICULTIES,
	SKIRMISH_MAPS,
	SKIRMISH_PRESETS,
	isMapUnlocked,
	type SkirmishDifficultyOption,
	type SkirmishMapDef,
	type SkirmishPreset,
} from "@/features/skirmish/types";
import type { AppState } from "../appState";

/** Generate a random seed phrase from common word-like tokens. */
function generateSeedPhrase(): string {
	const words = [
		"river", "mud", "otter", "delta", "creek", "marsh", "timber",
		"scout", "dawn", "fog", "ridge", "stone", "drift", "iron",
		"tide", "frost", "bark", "fern", "moss", "vale",
	];
	const pick = () => words[Math.floor(Math.random() * words.length)];
	return `${pick()}-${pick()}-${pick()}`;
}

/** Map selection card. */
const MapCard: Component<{
	map: SkirmishMapDef;
	unlocked: boolean;
	selected: boolean;
	onSelect: () => void;
}> = (props) => {
	return (
		<button
			type="button"
			onClick={props.onSelect}
			disabled={!props.unlocked}
			class={`group relative rounded-none border p-4 text-left transition ${
				props.unlocked
					? props.selected
						? "border-accent/60 bg-accent/12 shadow-[0_0_0_1px_rgba(255,226,138,0.2)]"
						: "border-slate-700/70 bg-black/28 hover:border-accent/40 hover:bg-black/36"
					: "cursor-not-allowed border-slate-700/40 bg-black/40 opacity-50"
			}`}
		>
			<div
				class={`flex h-20 items-center justify-center rounded-none border text-center ${
					props.unlocked
						? "border-accent/15 bg-[radial-gradient(circle,rgba(212,165,116,0.12),transparent_40%)]"
						: "border-slate-700/30 bg-black/30"
				}`}
			>
				<Show when={props.unlocked}>
					<span class="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/60">
						{props.map.terrainType} / {props.map.size}
					</span>
				</Show>
				<Show when={!props.unlocked}>
					<span class="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
						{props.map.starsRequired} stars needed
					</span>
				</Show>
			</div>
			<div class="mt-2 font-heading text-sm uppercase tracking-[0.14em] text-primary">
				{props.unlocked ? props.map.name : "Locked"}
			</div>
			<Show when={props.unlocked}>
				<div class="mt-1 font-body text-[10px] uppercase tracking-[0.1em] text-slate-500">
					{props.map.description}
				</div>
			</Show>
			<Show when={!props.unlocked}>
				<div class="mt-1 font-body text-[10px] uppercase tracking-[0.1em] text-slate-500">
					Requires {props.map.starsRequired} stars
				</div>
			</Show>
		</button>
	);
};

export const SkirmishSetup: Component<{ app: AppState }> = (props) => {
	const [selectedMapId, setSelectedMapId] = createSignal<string>(SKIRMISH_MAPS[0].id);
	const [selectedDifficulty, setSelectedDifficulty] = createSignal<SkirmishDifficultyOption>(
		SKIRMISH_DIFFICULTIES[1],
	);
	const [playAsScaleGuard, setPlayAsScaleGuard] = createSignal(false);
	const [seedPhrase, setSeedPhrase] = createSignal(generateSeedPhrase());
	const [selectedPreset, setSelectedPreset] = createSignal<SkirmishPreset>("meso");

	const totalStars = 0; // Will be wired to campaign persistence
	const allUnlocked = false;

	const selectedMap = () =>
		SKIRMISH_MAPS.find((m) => m.id === selectedMapId()) ?? SKIRMISH_MAPS[0];

	const canStart = () => allUnlocked || isMapUnlocked(selectedMap(), totalStars);

	const handleLaunch = () => {
		if (!canStart()) return;
		props.app.setScreen("game");
	};

	return (
		<div class="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
			<div class="riverine-camo absolute inset-0 opacity-20" />

			<div class="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
				{/* Header */}
				<header class="flex flex-col items-center gap-2 text-center">
					<div class="rounded border border-accent/25 bg-black/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.32em] text-accent">
						Skirmish Operations
					</div>
					<h1 class="font-heading text-3xl uppercase tracking-[0.22em] text-primary sm:text-4xl">
						Skirmish
					</h1>
					<p class="font-body text-[11px] uppercase tracking-[0.18em] text-slate-400">
						{totalStars} campaign stars earned
					</p>
				</header>

				{/* Content grid */}
				<div class="mt-6 grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
					{/* Map grid */}
					<section>
						<div class="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
							Select Map
						</div>
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

					{/* Sidebar: difficulty + options */}
					<aside class="flex flex-col gap-4">
						{/* Difficulty */}
						<div>
							<div class="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
								Difficulty
							</div>
							<div class="grid gap-2">
								<For each={SKIRMISH_DIFFICULTIES}>
									{(d) => (
										<button
											type="button"
											onClick={() => setSelectedDifficulty(d)}
											class={`rounded-none border px-4 py-3 text-left transition ${
												d.id === selectedDifficulty().id
													? "border-accent/60 bg-accent/15 text-accent"
													: "border-slate-700/70 bg-slate-900/40 text-slate-100 hover:border-accent/30 hover:bg-slate-900/55"
											}`}
										>
											<div class="font-heading text-sm uppercase tracking-[0.16em]">
												{d.label}
											</div>
											<div class="mt-1 font-body text-[10px] uppercase tracking-[0.1em] text-slate-500">
												{d.note}
											</div>
										</button>
									)}
								</For>
							</div>
						</div>

						{/* Test Preset */}
						<div>
							<div class="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
								Test Preset
							</div>
							<div class="grid gap-2">
								<For each={SKIRMISH_PRESETS}>
									{(preset) => (
										<button
											type="button"
											onClick={() => setSelectedPreset(preset.id)}
											class={`rounded-none border px-4 py-3 text-left transition ${
												preset.id === selectedPreset()
													? "border-accent/60 bg-accent/15 text-accent"
													: "border-slate-700/70 bg-slate-900/40 text-slate-100 hover:border-accent/30 hover:bg-slate-900/55"
											}`}
										>
											<div class="font-heading text-sm uppercase tracking-[0.16em]">
												{preset.label}
											</div>
											<div class="mt-1 font-body text-[10px] uppercase tracking-[0.1em] text-slate-500">
												{preset.note}
											</div>
										</button>
									)}
								</For>
							</div>
						</div>

						{/* Play as Scale-Guard */}
						<div class="rounded-none border border-slate-700/70 bg-black/24 p-4">
							<label class="flex cursor-pointer items-center gap-3">
								<input
									type="checkbox"
									checked={playAsScaleGuard()}
									onChange={(e) => setPlayAsScaleGuard(e.currentTarget.checked)}
									class="size-4 accent-accent"
								/>
								<div>
									<div class="font-heading text-sm uppercase tracking-[0.14em] text-slate-100">
										Play as Scale-Guard
									</div>
									<div class="font-body text-[10px] uppercase tracking-[0.1em] text-slate-500">
										Swap factions. AI controls OEF.
									</div>
								</div>
							</label>
						</div>

						{/* Seed phrase */}
						<div class="rounded-none border border-slate-700/70 bg-black/24 p-4">
							<div class="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
								Seed Phrase
							</div>
							<div class="flex gap-2">
								<input
									type="text"
									value={seedPhrase()}
									onInput={(e) => setSeedPhrase(e.currentTarget.value)}
									class="min-w-0 flex-1 rounded-none border border-slate-700/70 bg-slate-900/40 px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-slate-100"
								/>
								<button
									type="button"
									onClick={() => setSeedPhrase(generateSeedPhrase())}
									class="rounded-none border border-slate-600/70 bg-slate-900/85 px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-slate-100 transition-colors hover:border-accent/50 hover:bg-slate-800/85"
								>
									Shuffle
								</button>
							</div>
							<div class="mt-2 font-body text-[10px] uppercase tracking-[0.1em] text-slate-500">
								Deterministic seed for skirmish generation.
							</div>
						</div>

						{/* Map info */}
						<div class="rounded-none border border-slate-700/70 bg-black/24 p-4">
							<div class="font-heading text-lg uppercase tracking-[0.16em] text-primary">
								{selectedMap().name}
							</div>
							<div class="mt-1 font-body text-[11px] uppercase tracking-[0.12em] text-slate-500">
								{selectedMap().description}
							</div>
							<div class="mt-3 flex flex-wrap gap-2">
								<span class="rounded border border-accent/25 bg-accent/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
									{selectedMap().size}
								</span>
								<span class="rounded border border-accent/25 bg-accent/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
									{selectedMap().terrainType}
								</span>
							</div>
						</div>

						{/* Actions */}
						<div class="mt-auto flex flex-col gap-2">
							<button
								type="button"
								disabled={!canStart()}
								onClick={handleLaunch}
								class="min-h-11 w-full rounded border border-accent/60 bg-accent/15 px-4 py-3 font-heading text-sm uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-50"
							>
								Start Skirmish
							</button>
							<button
								type="button"
								onClick={() => props.app.setScreen("main-menu")}
								class="min-h-11 w-full rounded border border-slate-600/70 bg-slate-900/85 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-slate-100 transition-colors hover:border-accent/50 hover:bg-slate-800/85"
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
