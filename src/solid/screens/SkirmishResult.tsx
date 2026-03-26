/**
 * SkirmishResult — SolidJS skirmish result screen (US-F04).
 *
 * Stats from skirmish, seed phrase display for replay,
 * "Rematch" and "New Setup" buttons.
 */

import { type Component, Show } from "solid-js";
import type { SkirmishMatchResult } from "@/features/skirmish/types";
import type { AppState } from "../appState";

/** Format seconds as M:SS. */
function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** Stat row display. */
const StatRow: Component<{ label: string; value: string }> = (props) => {
	return (
		<div>
			<div class="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">
				{props.label}
			</div>
			<div class="mt-0.5 font-heading text-lg uppercase tracking-[0.12em] text-slate-100">
				{props.value}
			</div>
		</div>
	);
};

/**
 * Default result data for display before a real result is available.
 */
const DEFAULT_RESULT: SkirmishMatchResult = {
	outcome: "victory",
	mapId: "sk_river_crossing",
	difficulty: "medium",
	playedAsScaleGuard: false,
	stats: {
		timeElapsed: 0,
		unitsTrained: 0,
		unitsLost: 0,
		resourcesGathered: 0,
	},
};

export const SkirmishResult: Component<{
	app: AppState;
	result?: SkirmishMatchResult;
	seedPhrase?: string;
}> = (props) => {
	const result = () => props.result ?? DEFAULT_RESULT;
	const isVictory = () => result().outcome === "victory";

	return (
		<div class="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
			<div class="riverine-camo absolute inset-0 opacity-20" />

			<div class="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-8 px-6 py-12">
				{/* Outcome badge */}
				<div
					class={`rounded border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.32em] ${
						isVictory()
							? "border-accent/40 bg-accent/15 text-accent"
							: "border-red-600/40 bg-red-900/15 text-red-400"
					}`}
				>
					{isVictory() ? "Victory" : "Defeat"}
				</div>

				{/* Title */}
				<h1
					class={`text-center font-heading text-4xl uppercase tracking-[0.24em] sm:text-5xl ${
						isVictory() ? "text-accent" : "text-red-400"
					}`}
				>
					{isVictory() ? "Command Post Destroyed" : "Command Post Lost"}
				</h1>
				<p class="max-w-lg text-center font-body text-xs uppercase tracking-[0.16em] text-slate-400">
					{isVictory()
						? "Enemy command structure eliminated. The field is yours."
						: "Your command post has fallen. Regroup and try again."}
				</p>

				{/* Stats panel */}
				<div class="w-full max-w-md rounded-none border border-slate-700/70 bg-black/30 p-6">
					<div class="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
						After Action Report
					</div>
					<div class="grid grid-cols-2 gap-4">
						<StatRow label="Time" value={formatTime(result().stats.timeElapsed)} />
						<StatRow label="Units Trained" value={String(result().stats.unitsTrained)} />
						<StatRow label="Units Lost" value={String(result().stats.unitsLost)} />
						<StatRow label="Resources Gathered" value={String(result().stats.resourcesGathered)} />
					</div>

					<div class="mt-4 flex flex-wrap gap-2 border-t border-slate-700/50 pt-4">
						<span class="rounded border border-accent/20 bg-accent/8 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
							{result().difficulty}
						</span>
						<Show when={result().playedAsScaleGuard}>
							<span class="rounded border border-emerald-500/20 bg-emerald-500/8 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-300">
								Scale-Guard
							</span>
						</Show>
					</div>
				</div>

				{/* Seed phrase display */}
				<Show when={props.seedPhrase}>
					{(seed) => (
						<div class="w-full max-w-md rounded-none border border-slate-700/70 bg-black/24 p-4">
							<div class="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
								Seed Phrase
							</div>
							<div class="font-mono text-sm uppercase tracking-[0.14em] text-slate-200">
								{seed()}
							</div>
							<div class="mt-1 font-body text-[10px] uppercase tracking-[0.1em] text-slate-500">
								Share this seed to replay the same match.
							</div>
						</div>
					)}
				</Show>

				{/* Actions */}
				<div class="flex flex-wrap gap-3">
					<button
						type="button"
						onClick={() => {
							props.app.setIsSkirmish(true);
							props.app.setScreen("game");
						}}
						class="min-h-11 rounded border border-accent/60 bg-accent/15 px-6 py-2 font-heading text-sm uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent/25"
					>
						Rematch
					</button>
					<button
						type="button"
						onClick={() => {
							props.app.setIsSkirmish(true);
							props.app.setScreen("skirmish");
						}}
						class="min-h-11 rounded border border-slate-600/70 bg-slate-900/85 px-6 py-2 font-mono text-xs uppercase tracking-[0.18em] text-slate-100 transition-colors hover:border-accent/50 hover:bg-slate-800/85"
					>
						New Setup
					</button>
					<button
						type="button"
						onClick={() => props.app.setScreen("main-menu")}
						class="min-h-11 rounded border border-slate-600/70 bg-slate-900/85 px-6 py-2 font-mono text-xs uppercase tracking-[0.18em] text-slate-100 transition-colors hover:border-accent/50 hover:bg-slate-800/85"
					>
						Main Menu
					</button>
				</div>
			</div>
		</div>
	);
};
