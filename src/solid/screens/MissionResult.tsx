/**
 * MissionResult — SolidJS mission result screen (US-F04).
 *
 * Victory: golden banner, animated star reveal, triumphant styling.
 * Defeat: red/dark banner, somber styling.
 * Stats table with After Action Report header.
 * Star rating with animated reveal (staggered 400ms per star).
 */

import { type Component, createSignal, onMount, Show } from "solid-js";
import type { AppState } from "../appState";
import {
	calculateStarRating,
	type ScoreBreakdown,
	StarRatingDisplay,
} from "../hud/StarRatingDisplay";

export interface MissionResultStats {
	timeElapsed: number;
	unitsLost: number;
	resourcesGathered: number;
	unitsDeployed: number;
}

export interface MissionResultData {
	outcome: "victory" | "defeat";
	missionId: string;
	missionName: string;
	stars: 0 | 1 | 2 | 3;
	stats: MissionResultStats;
	isFinalMission: boolean;
	scoreBreakdown?: ScoreBreakdown;
}

function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const StatRow: Component<{ label: string; value: string }> = (props) => (
	<div class="flex items-baseline justify-between border-b border-border/20 py-2 last:border-0">
		<span class="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
			{props.label}
		</span>
		<span class="font-mono text-base tabular-nums tracking-[0.14em] text-foreground">
			{props.value}
		</span>
	</div>
);

function buildFallbackBreakdown(stars: 0 | 1 | 2 | 3, stats: MissionResultStats): ScoreBreakdown {
	if (stats.timeElapsed > 0) {
		return calculateStarRating({
			parTimeMs: stats.timeElapsed * 1000 * 0.8,
			elapsedMs: stats.timeElapsed * 1000,
			unitsLost: stats.unitsLost,
			totalUnits: stats.unitsDeployed || 1,
			bonusObjectivesCompleted: stars >= 3 ? 1 : 0,
			bonusObjectivesTotal: 1,
		});
	}
	const totalScore = stars === 3 ? 95 : stars === 2 ? 70 : stars === 1 ? 40 : 10;
	return {
		timeScore: totalScore,
		survivalScore: totalScore,
		bonusScore: stars >= 3 ? 100 : 0,
		totalScore,
		stars,
	};
}

const DEFAULT_RESULT: MissionResultData = {
	outcome: "victory",
	missionId: "mission_1",
	missionName: "Mission Complete",
	stars: 1,
	stats: { timeElapsed: 0, unitsLost: 0, resourcesGathered: 0, unitsDeployed: 0 },
	isFinalMission: false,
};

export const MissionResult: Component<{ app: AppState; result?: MissionResultData }> = (props) => {
	const result = () => props.result ?? DEFAULT_RESULT;
	const isVictory = () => result().outcome === "victory";
	const [visible, setVisible] = createSignal(false);
	onMount(() => setTimeout(() => setVisible(true), 80));

	return (
		<div class="canvas-grain relative flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden bg-background text-foreground">
			<div class="riverine-camo absolute inset-0 opacity-15" />
			<div
				class={`pointer-events-none absolute inset-0 ${isVictory() ? "bg-[radial-gradient(ellipse_at_center,rgba(255,226,138,0.08)_0%,transparent_50%,rgba(0,0,0,0.6)_100%)]" : "bg-[radial-gradient(ellipse_at_center,rgba(217,83,63,0.06)_0%,transparent_40%,rgba(0,0,0,0.7)_100%)]"}`}
			/>
			<div
				class={`relative z-10 flex w-full max-w-2xl flex-col items-center gap-8 px-6 py-12 transition-all duration-700 ease-out ${visible() ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
			>
				<div
					class={`border px-5 py-2 font-heading text-[11px] uppercase tracking-[0.36em] ${isVictory() ? "border-accent/40 bg-accent/12 text-accent" : "border-destructive/40 bg-destructive/12 text-destructive"}`}
				>
					{isVictory() ? "Mission Complete" : "Mission Failed"}
				</div>
				<h1
					class={`text-center font-heading text-4xl uppercase tracking-[0.26em] text-stencil-shadow sm:text-5xl ${isVictory() ? "text-accent" : "text-destructive"}`}
				>
					{result().missionName}
				</h1>
				<p class="max-w-lg text-center font-body text-xs uppercase tracking-[0.14em] text-muted-foreground">
					{isVictory()
						? "Objectives secured. Well done, Captain."
						: "Mission failed. Regroup and try again."}
				</p>
				<div class="flex items-center gap-3">
					<div class={`h-px w-16 ${isVictory() ? "bg-accent/30" : "bg-destructive/30"}`} />
					<div
						class={`h-2 w-2 rotate-45 border ${
							isVictory()
								? "border-accent/40 bg-accent/20"
								: "border-destructive/40 bg-destructive/20"
						}`}
					/>
					<div class={`h-px w-16 ${isVictory() ? "bg-accent/30" : "bg-destructive/30"}`} />
				</div>
				<Show when={isVictory()}>
					<StarRatingDisplay
						breakdown={
							result().scoreBreakdown ?? buildFallbackBreakdown(result().stars, result().stats)
						}
						animate={true}
					/>
				</Show>
				<div class="w-full max-w-md border border-border/50 bg-card/40 p-6">
					<div class="mb-4 flex items-center gap-3">
						<span class="font-heading text-[10px] uppercase tracking-[0.26em] text-accent">
							After Action Report
						</span>
						<div class="h-px flex-1 bg-accent/20" />
					</div>
					<StatRow label="Time Elapsed" value={formatTime(result().stats.timeElapsed)} />
					<StatRow label="Units Deployed" value={String(result().stats.unitsDeployed)} />
					<StatRow label="Units Lost" value={String(result().stats.unitsLost)} />
					<StatRow label="Resources Gathered" value={String(result().stats.resourcesGathered)} />
				</div>
				<div class="flex flex-wrap justify-center gap-3">
					<Show when={isVictory() && !result().isFinalMission}>
						<button
							type="button"
							onClick={() => props.app.setScreen("briefing")}
							class="min-h-12 border-2 border-accent/60 bg-accent/15 px-8 py-3 font-heading text-sm uppercase tracking-[0.2em] text-accent transition-all duration-200 hover:border-accent/80 hover:bg-accent/25 hover:shadow-[0_0_20px_rgba(255,226,138,0.12)]"
						>
							Next Mission
						</button>
					</Show>
					<Show when={!isVictory()}>
						<button
							type="button"
							onClick={() => props.app.setScreen("briefing")}
							class="min-h-12 border-2 border-accent/60 bg-accent/15 px-8 py-3 font-heading text-sm uppercase tracking-[0.2em] text-accent transition-all duration-200 hover:border-accent/80 hover:bg-accent/25"
						>
							Retry
						</button>
					</Show>
					<button
						type="button"
						onClick={() => props.app.setScreen("campaign")}
						class="min-h-11 border border-border/50 bg-card/60 px-6 py-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
					>
						Campaign
					</button>
					<button
						type="button"
						onClick={() => props.app.setScreen("main-menu")}
						class="min-h-11 border border-border/50 bg-card/60 px-6 py-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
					>
						Main Menu
					</button>
				</div>
			</div>
		</div>
	);
};
