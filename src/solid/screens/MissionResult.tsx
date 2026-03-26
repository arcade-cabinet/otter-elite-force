/**
 * MissionResult — SolidJS mission result screen (US-F04).
 *
 * Victory or defeat banner, star rating display, stats summary,
 * "Next Mission" or "Retry" buttons, "Return to Campaign" button.
 */

import { type Component, For, Show } from "solid-js";
import type { AppState } from "../appState";

export interface MissionResultStats {
	/** Total mission time in seconds. */
	timeElapsed: number;
	/** Units the player lost. */
	unitsLost: number;
	/** Total resources gathered. */
	resourcesGathered: number;
	/** Units deployed over the mission. */
	unitsDeployed: number;
}

export interface MissionResultData {
	outcome: "victory" | "defeat";
	missionId: string;
	missionName: string;
	stars: 0 | 1 | 2 | 3;
	stats: MissionResultStats;
	isFinalMission: boolean;
}

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

/** Star rating display for mission result. */
const StarRating: Component<{ stars: number }> = (props) => {
	return (
		<div class="flex gap-2 text-2xl">
			<For each={[1, 2, 3]}>
				{(i) => (
					<span
						class={
							i <= props.stars
								? props.stars === 3
									? "text-yellow-400"
									: props.stars === 2
										? "text-gray-300"
										: "text-amber-600"
								: "text-slate-700"
						}
					>
						{i <= props.stars ? "\u2605" : "\u2606"}
					</span>
				)}
			</For>
		</div>
	);
};

/**
 * Default result data used when no external data is provided.
 * In full integration, this would be populated from the game session.
 */
const DEFAULT_RESULT: MissionResultData = {
	outcome: "victory",
	missionId: "mission_1",
	missionName: "Mission Complete",
	stars: 1,
	stats: {
		timeElapsed: 0,
		unitsLost: 0,
		resourcesGathered: 0,
		unitsDeployed: 0,
	},
	isFinalMission: false,
};

export const MissionResult: Component<{
	app: AppState;
	result?: MissionResultData;
}> = (props) => {
	const result = () => props.result ?? DEFAULT_RESULT;
	const isVictory = () => result().outcome === "victory";

	return (
		<div class="flex min-h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
			<div class="relative z-10 flex w-full max-w-2xl flex-col items-center gap-8 px-6 py-12">
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
					{result().missionName}
				</h1>

				<p class="max-w-lg text-center font-body text-xs uppercase tracking-[0.16em] text-slate-400">
					{isVictory()
						? "Objectives secured. Well done, Captain."
						: "Mission failed. Regroup and try again."}
				</p>

				{/* Star rating (victory only) */}
				<Show when={isVictory()}>
					<StarRating stars={result().stars} />
				</Show>

				{/* Stats panel */}
				<div class="w-full max-w-md rounded-none border border-slate-700/70 bg-black/30 p-6">
					<div class="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
						After Action Report
					</div>
					<div class="grid grid-cols-2 gap-4">
						<StatRow label="Time" value={formatTime(result().stats.timeElapsed)} />
						<StatRow label="Units Deployed" value={String(result().stats.unitsDeployed)} />
						<StatRow label="Units Lost" value={String(result().stats.unitsLost)} />
						<StatRow label="Resources Gathered" value={String(result().stats.resourcesGathered)} />
					</div>
				</div>

				{/* Action buttons */}
				<div class="flex flex-wrap gap-3">
					<Show when={isVictory() && !result().isFinalMission}>
						<button
							type="button"
							onClick={() => {
								// Advance to next mission briefing
								props.app.setScreen("briefing");
							}}
							class="min-h-11 rounded border border-accent/60 bg-accent/15 px-6 py-2 font-heading text-sm uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent/25"
						>
							Next Mission
						</button>
					</Show>
					<Show when={!isVictory()}>
						<button
							type="button"
							onClick={() => {
								props.app.setScreen("briefing");
							}}
							class="min-h-11 rounded border border-accent/60 bg-accent/15 px-6 py-2 font-heading text-sm uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent/25"
						>
							Retry
						</button>
					</Show>
					<button
						type="button"
						onClick={() => props.app.setScreen("campaign")}
						class="min-h-11 rounded border border-slate-600/70 bg-slate-900/85 px-6 py-2 font-mono text-xs uppercase tracking-[0.18em] text-slate-100 transition-colors hover:border-accent/50 hover:bg-slate-800/85"
					>
						Return to Campaign
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
