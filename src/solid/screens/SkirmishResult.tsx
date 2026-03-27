/**
 * SkirmishResult — SolidJS skirmish result screen (US-F04).
 *
 * Stats from skirmish, seed phrase display for replay,
 * "Rematch" and "New Setup" buttons. Victory/defeat styling.
 */

import { type Component, createSignal, onMount, Show } from "solid-js";
import type { SkirmishMatchResult } from "@/features/skirmish/types";
import type { AppState } from "../appState";

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

const DEFAULT_RESULT: SkirmishMatchResult = {
	outcome: "victory",
	mapId: "sk_river_crossing",
	difficulty: "medium",
	playedAsScaleGuard: false,
	stats: { timeElapsed: 0, unitsTrained: 0, unitsLost: 0, resourcesGathered: 0 },
};

export const SkirmishResult: Component<{
	app: AppState;
	result?: SkirmishMatchResult;
	seedPhrase?: string;
}> = (props) => {
	const result = () => props.result ?? DEFAULT_RESULT;
	const isVictory = () => result().outcome === "victory";
	const [visible, setVisible] = createSignal(false);
	onMount(() => setTimeout(() => setVisible(true), 80));

	return (
		<div class="canvas-grain relative min-h-screen overflow-hidden bg-background text-foreground">
			<div class="riverine-camo absolute inset-0 opacity-15" />
			<div
				class={`pointer-events-none absolute inset-0 ${isVictory() ? "bg-[radial-gradient(ellipse_at_center,rgba(255,226,138,0.06)_0%,transparent_50%,rgba(0,0,0,0.5)_100%)]" : "bg-[radial-gradient(ellipse_at_center,rgba(217,83,63,0.05)_0%,transparent_40%,rgba(0,0,0,0.6)_100%)]"}`}
			/>
			<div
				class={`relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-8 px-6 py-12 transition-all duration-700 ease-out ${visible() ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
			>
				<div
					class={`border px-5 py-2 font-heading text-[11px] uppercase tracking-[0.36em] ${isVictory() ? "border-accent/40 bg-accent/12 text-accent" : "border-destructive/40 bg-destructive/12 text-destructive"}`}
				>
					{isVictory() ? "Victory" : "Defeat"}
				</div>
				<h1
					class={`text-center font-heading text-4xl uppercase tracking-[0.24em] text-stencil-shadow sm:text-5xl ${isVictory() ? "text-accent" : "text-destructive"}`}
				>
					{isVictory() ? "Command Post Destroyed" : "Command Post Lost"}
				</h1>
				<p class="max-w-lg text-center font-body text-xs uppercase tracking-[0.14em] text-muted-foreground">
					{isVictory()
						? "Enemy command structure eliminated. The field is yours."
						: "Your command post has fallen. Regroup and try again."}
				</p>
				<div class="flex items-center gap-3">
					<div class={`h-px w-14 ${isVictory() ? "bg-accent/30" : "bg-destructive/30"}`} />
					<div
						class={`h-1.5 w-1.5 rotate-45 border ${isVictory() ? "border-accent/40 bg-accent/20" : "border-destructive/40 bg-destructive/20"}`}
					/>
					<div class={`h-px w-14 ${isVictory() ? "bg-accent/30" : "bg-destructive/30"}`} />
				</div>
				<div class="w-full max-w-md border border-border/50 bg-card/40 p-6">
					<div class="mb-4 flex items-center gap-3">
						<span class="font-heading text-[10px] uppercase tracking-[0.26em] text-accent">
							After Action Report
						</span>
						<div class="h-px flex-1 bg-accent/20" />
					</div>
					<StatRow label="Time Elapsed" value={formatTime(result().stats.timeElapsed)} />
					<StatRow label="Units Trained" value={String(result().stats.unitsTrained)} />
					<StatRow label="Units Lost" value={String(result().stats.unitsLost)} />
					<StatRow label="Resources Gathered" value={String(result().stats.resourcesGathered)} />
					<div class="mt-4 flex flex-wrap gap-2 border-t border-border/30 pt-4">
						<span class="border border-accent/25 bg-accent/8 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
							{result().difficulty}
						</span>
						<Show when={result().playedAsScaleGuard}>
							<span class="border border-green-500/25 bg-green-500/8 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-green-400">
								Scale-Guard
							</span>
						</Show>
					</div>
				</div>
				<Show when={props.seedPhrase}>
					{(seed) => (
						<div class="w-full max-w-md border border-border/40 bg-card/25 p-4">
							<div class="mb-2 flex items-center gap-3">
								<span class="font-heading text-[10px] uppercase tracking-[0.24em] text-accent">
									Seed Phrase
								</span>
								<div class="h-px flex-1 bg-accent/15" />
							</div>
							<div class="font-mono text-sm uppercase tracking-[0.16em] text-foreground">
								{seed()}
							</div>
							<div class="mt-1 font-body text-[10px] uppercase tracking-[0.08em] text-muted-foreground/60">
								Share this seed to replay the same match.
							</div>
						</div>
					)}
				</Show>
				<div class="flex flex-wrap justify-center gap-3">
					<button
						type="button"
						onClick={() => {
							props.app.setIsSkirmish(true);
							props.app.setScreen("game");
						}}
						class="min-h-12 border-2 border-accent/60 bg-accent/15 px-8 py-3 font-heading text-sm uppercase tracking-[0.2em] text-accent transition-all duration-200 hover:border-accent/80 hover:bg-accent/25 hover:shadow-[0_0_20px_rgba(255,226,138,0.12)]"
					>
						Rematch
					</button>
					<button
						type="button"
						onClick={() => {
							props.app.setIsSkirmish(true);
							props.app.setScreen("skirmish");
						}}
						class="min-h-11 border border-border/50 bg-card/60 px-6 py-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
					>
						New Setup
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
