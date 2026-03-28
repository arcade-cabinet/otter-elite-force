/**
 * SettingsPanel — SolidJS settings screen (US-F04).
 *
 * Military equipment panel aesthetic: grouped settings (Audio, Visual,
 * Accessibility), sliders styled as equipment dials with stencil/uppercase
 * labels, toggles with on/off indicator, back button at bottom.
 *
 * Settings are persisted to SQLite via SqlitePersistenceStore. They load
 * on mount and save on every change so they survive across sessions.
 */

import { type Component, createSignal, For, onMount } from "solid-js";
import { SqlitePersistenceStore } from "@/engine/persistence/sqlitePersistenceStore";
import type { UserSettingsRecord } from "@/engine/persistence/types";
import type { AppState } from "../appState";

const DEFAULT_SETTINGS: UserSettingsRecord = {
	masterVolume: 1.0,
	musicVolume: 0.7,
	sfxVolume: 1.0,
	showSubtitles: true,
	reduceMotion: false,
};

const SliderSetting: Component<{
	label: string;
	value: () => number;
	onChange: (v: number) => void;
}> = (props) => {
	return (
		<div class="group border border-border/50 bg-card/40 p-3 transition-colors hover:border-border/70">
			<div class="flex items-center justify-between">
				<span class="font-heading text-[11px] uppercase tracking-[0.2em] text-foreground">
					{props.label}
				</span>
				<span class="min-w-[4ch] text-right font-mono text-sm tabular-nums tracking-[0.14em] text-accent">
					{Math.round(props.value() * 100)}
				</span>
			</div>
			<div class="relative mt-2">
				<div class="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-muted/80" />
				<div
					class="absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-accent/60"
					style={{ width: `${props.value() * 100}%` }}
				/>
				<div class="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-0.5">
					<For each={[0, 25, 50, 75, 100]}>
						{() => <div class="h-2 w-px bg-muted-foreground/30" />}
					</For>
				</div>
				<input
					type="range"
					min={0}
					max={1}
					step={0.05}
					value={props.value()}
					onInput={(e) => props.onChange(Number(e.currentTarget.value))}
					class="relative z-10 h-6 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent/70 [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(255,226,138,0.3)]"
				/>
			</div>
		</div>
	);
};

const ToggleSetting: Component<{
	label: string;
	value: () => boolean;
	onChange: (v: boolean) => void;
}> = (props) => {
	return (
		<button
			type="button"
			onClick={() => props.onChange(!props.value())}
			class="flex items-center justify-between border border-border/50 bg-card/40 px-3 py-3 transition-colors hover:border-border/70"
		>
			<span class="font-heading text-[11px] uppercase tracking-[0.2em] text-foreground">
				{props.label}
			</span>
			<div class="flex items-center gap-2">
				<span
					class={`font-mono text-[10px] uppercase tracking-[0.16em] ${props.value() ? "text-accent" : "text-muted-foreground/50"}`}
				>
					{props.value() ? "ON" : "OFF"}
				</span>
				<div class="flex h-5 w-9 items-center border border-border/50 bg-muted/60 p-0.5">
					<div
						class={`h-3.5 w-3.5 transition-all duration-150 ${props.value() ? "ml-auto border border-accent/60 bg-accent/50" : "border border-muted-foreground/30 bg-muted-foreground/20"}`}
					/>
				</div>
			</div>
		</button>
	);
};

const SectionHeader: Component<{ label: string }> = (props) => {
	return (
		<div class="mb-3 flex items-center gap-3">
			<span class="font-heading text-[11px] uppercase tracking-[0.28em] text-accent">
				{props.label}
			</span>
			<div class="h-px flex-1 bg-accent/20" />
		</div>
	);
};

export const SettingsPanel: Component<{ app: AppState }> = (props) => {
	const [masterVolume, setMasterVolume] = createSignal(DEFAULT_SETTINGS.masterVolume);
	const [musicVolume, setMusicVolume] = createSignal(DEFAULT_SETTINGS.musicVolume);
	const [sfxVolume, setSfxVolume] = createSignal(DEFAULT_SETTINGS.sfxVolume);
	const [subtitles, setSubtitles] = createSignal(DEFAULT_SETTINGS.showSubtitles);
	const [reduceMotion, setReduceMotion] = createSignal(DEFAULT_SETTINGS.reduceMotion);
	const [showGrid, setShowGrid] = createSignal(false);
	const [reduceFx, setReduceFx] = createSignal(false);

	/** Persist the current settings to SQLite. Fire-and-forget. */
	function persistSettings(): void {
		const store = new SqlitePersistenceStore();
		void store
			.initialize()
			.then(() =>
				store.saveSettings({
					masterVolume: masterVolume(),
					musicVolume: musicVolume(),
					sfxVolume: sfxVolume(),
					showSubtitles: subtitles(),
					reduceMotion: reduceMotion(),
				}),
			)
			.catch((err: unknown) => {
				console.warn("[SettingsPanel] Failed to persist settings:", err);
			});
	}

	/** Wrap a setter to also persist after changing. */
	function withPersist<T>(setter: (v: T) => void): (v: T) => void {
		return (v: T) => {
			setter(v);
			persistSettings();
		};
	}

	onMount(() => {
		const store = new SqlitePersistenceStore();
		void store
			.initialize()
			.then(() => store.loadSettings())
			.then((saved) => {
				if (saved) {
					setMasterVolume(saved.masterVolume);
					setMusicVolume(saved.musicVolume);
					setSfxVolume(saved.sfxVolume);
					setSubtitles(saved.showSubtitles);
					setReduceMotion(saved.reduceMotion);
				}
			})
			.catch((err: unknown) => {
				console.warn("[SettingsPanel] Failed to load settings:", err);
			});
	});

	return (
		<div class="canvas-grain relative min-h-screen w-screen overflow-hidden bg-background text-foreground">
			<div class="riverine-camo absolute inset-0 opacity-15" />
			<div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.5)_100%)]" />
			<div class="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
				<div class="flex flex-col items-center gap-3 text-center">
					<div class="inline-block border border-accent/30 bg-accent/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.32em] text-accent">
						Field Controls
					</div>
					<h2 class="font-heading text-2xl uppercase tracking-[0.24em] text-primary">Settings</h2>
					<p class="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
						Audio, visuals, and readability configuration
					</p>
				</div>
				<section>
					<SectionHeader label="Audio" />
					<div class="flex flex-col gap-2">
						<SliderSetting
							label="Master Volume"
							value={masterVolume}
							onChange={withPersist(setMasterVolume)}
						/>
						<SliderSetting
							label="Music Volume"
							value={musicVolume}
							onChange={withPersist(setMusicVolume)}
						/>
						<SliderSetting
							label="SFX Volume"
							value={sfxVolume}
							onChange={withPersist(setSfxVolume)}
						/>
					</div>
				</section>
				<section>
					<SectionHeader label="Visual" />
					<div class="flex flex-col gap-2">
						<ToggleSetting
							label="Show Grid Overlay"
							value={showGrid}
							onChange={withPersist(setShowGrid)}
						/>
						<ToggleSetting label="Reduce FX" value={reduceFx} onChange={withPersist(setReduceFx)} />
					</div>
				</section>
				<section>
					<SectionHeader label="Accessibility" />
					<div class="flex flex-col gap-2">
						<ToggleSetting
							label="Subtitles"
							value={subtitles}
							onChange={withPersist(setSubtitles)}
						/>
						<ToggleSetting
							label="Reduce Motion"
							value={reduceMotion}
							onChange={withPersist(setReduceMotion)}
						/>
					</div>
				</section>
				<section class="border border-border/30 bg-card/20 p-4">
					<div class="mb-2 font-heading text-[10px] uppercase tracking-[0.24em] text-accent/70">
						Operator Notes
					</div>
					<div class="grid gap-2 font-body text-[10px] uppercase tracking-[0.1em] text-muted-foreground/60">
						<p>Audio context waits for user gesture before playback.</p>
						<p>Touch-first controls stay readable at narrow widths.</p>
						<p>Analog, gritty, river-war aesthetic -- not futuristic.</p>
					</div>
				</section>
				<div class="flex flex-col items-center gap-4">
					<div class="flex items-center gap-3">
						<div class="h-px w-8 bg-accent/20" />
						<div class="h-1 w-1 rotate-45 border border-accent/30 bg-accent/15" />
						<div class="h-px w-8 bg-accent/20" />
					</div>
					<button
						type="button"
						class="min-h-11 border border-border/50 bg-card/60 px-8 py-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
						onClick={() => props.app.setScreen("main-menu")}
					>
						Back to Menu
					</button>
				</div>
			</div>
		</div>
	);
};
