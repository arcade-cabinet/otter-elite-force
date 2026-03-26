/**
 * SettingsPanel — SolidJS settings screen (US-F04).
 *
 * Audio: master, music, SFX volume sliders.
 * Visual: subtitles toggle, reduce motion toggle.
 * All state managed via createSignal.
 */

import { type Component, createSignal } from "solid-js";
import type { AppState } from "../appState";

/** Slider setting row. */
const SliderSetting: Component<{
	label: string;
	value: () => number;
	onChange: (v: number) => void;
}> = (props) => {
	return (
		<div class="flex flex-col gap-1 rounded-[2px] border border-slate-700/70 bg-slate-900/20 p-3">
			<div class="flex items-center justify-between">
				<span class="font-body text-xs uppercase tracking-wider text-slate-400">
					{props.label}
				</span>
				<span class="font-mono text-xs tabular-nums text-slate-100">
					{Math.round(props.value() * 100)}%
				</span>
			</div>
			<input
				type="range"
				min={0}
				max={1}
				step={0.05}
				value={props.value()}
				onInput={(e) => props.onChange(Number(e.currentTarget.value))}
				class="h-2 w-full cursor-pointer appearance-none bg-slate-700 accent-accent"
			/>
		</div>
	);
};

/** Toggle setting row. */
const ToggleSetting: Component<{
	label: string;
	value: () => boolean;
	onChange: (v: boolean) => void;
}> = (props) => {
	return (
		<button
			type="button"
			onClick={() => props.onChange(!props.value())}
			class="flex items-center justify-between rounded-[2px] border border-slate-700/70 bg-slate-900/20 px-3 py-3"
		>
			<span class="font-body text-xs uppercase tracking-wider text-slate-400">
				{props.label}
			</span>
			<span
				class={`font-mono text-xs uppercase ${props.value() ? "text-accent" : "text-slate-500"}`}
			>
				{props.value() ? "ON" : "OFF"}
			</span>
		</button>
	);
};

export const SettingsPanel: Component<{ app: AppState }> = (props) => {
	const [masterVolume, setMasterVolume] = createSignal(1.0);
	const [musicVolume, setMusicVolume] = createSignal(0.7);
	const [sfxVolume, setSfxVolume] = createSignal(1.0);
	const [subtitles, setSubtitles] = createSignal(true);
	const [reduceMotion, setReduceMotion] = createSignal(false);
	const [showGrid, setShowGrid] = createSignal(false);
	const [reduceFx, setReduceFx] = createSignal(false);

	return (
		<div class="flex min-h-screen w-screen flex-col items-center bg-slate-950 text-slate-100">
			<div class="relative z-10 flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
				{/* Header */}
				<div class="flex flex-col items-center gap-2 text-center">
					<h2 class="font-heading text-2xl uppercase tracking-[0.22em] text-primary">
						Settings
					</h2>
					<p class="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
						Field controls for audio, visuals, and readability
					</p>
				</div>

				{/* Audio section */}
				<section>
					<div class="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
						Audio
					</div>
					<div class="flex flex-col gap-3">
						<SliderSetting
							label="Master Volume"
							value={masterVolume}
							onChange={setMasterVolume}
						/>
						<SliderSetting
							label="Music Volume"
							value={musicVolume}
							onChange={setMusicVolume}
						/>
						<SliderSetting
							label="SFX Volume"
							value={sfxVolume}
							onChange={setSfxVolume}
						/>
					</div>
				</section>

				{/* Visual section */}
				<section>
					<div class="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
						Visual
					</div>
					<div class="flex flex-col gap-3">
						<ToggleSetting
							label="Subtitles"
							value={subtitles}
							onChange={setSubtitles}
						/>
						<ToggleSetting
							label="Reduce Motion"
							value={reduceMotion}
							onChange={setReduceMotion}
						/>
						<ToggleSetting
							label="Show Grid"
							value={showGrid}
							onChange={setShowGrid}
						/>
						<ToggleSetting
							label="Reduce FX"
							value={reduceFx}
							onChange={setReduceFx}
						/>
					</div>
				</section>

				{/* Operator notes */}
				<section class="rounded-[2px] border border-slate-700/30 bg-slate-900/20 p-4">
					<div class="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
						Operator Notes
					</div>
					<div class="grid gap-3 text-xs uppercase tracking-[0.14em] text-slate-500">
						<p>Audio context still waits for user gesture before playback begins.</p>
						<p>Touch-first controls must stay readable at narrow mobile widths.</p>
						<p>Keep the look analog, gritty, and river-war instead of futuristic.</p>
					</div>
				</section>

				{/* Back button */}
				<div class="flex justify-center">
					<button
						type="button"
						class="min-h-11 rounded border border-slate-600/70 bg-slate-900/85 px-6 py-2 font-mono text-xs uppercase tracking-[0.18em] text-slate-100 backdrop-blur-sm transition-colors hover:border-accent/50 hover:bg-slate-800/85"
						onClick={() => props.app.setScreen("main-menu")}
					>
						Back to Menu
					</button>
				</div>
			</div>
		</div>
	);
};
