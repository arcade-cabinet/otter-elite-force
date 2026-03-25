/**
 * Skirmish Victory / Defeat Screen (US-081)
 *
 * Displays after a skirmish match ends:
 *   - Win: destroy enemy Command Post
 *   - Lose: player Command Post destroyed
 *   - Victory screen shows: time, units trained, units lost, resources gathered
 *   - Buttons to return to skirmish setup or main menu
 */

import { useWorld } from "koota/react";
import { Button } from "@/components/ui/button";
import { AppScreen } from "@/ecs/traits/state";
import type { SkirmishMatchResult } from "./types";

interface SkirmishResultProps {
	result: SkirmishMatchResult;
}

export function SkirmishResult({ result }: SkirmishResultProps) {
	const world = useWorld();
	const isVictory = result.outcome === "victory";

	const handlePlayAgain = () => {
		// Return to skirmish setup (via menu for now — the AppRouter handles "skirmish" screen)
		world.set(AppScreen, { screen: "skirmish" as never });
	};

	const handleMainMenu = () => {
		world.set(AppScreen, { screen: "menu" });
	};

	return (
		<div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#1c362c_0%,#0d1614_42%,#080c0c_100%)] text-foreground">
			<div className="riverine-camo absolute inset-0 opacity-70" />
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(212,165,116,0.18),transparent_20%),linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.3))]" />

			<div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-8 px-6 py-12">
				{/* Outcome badge */}
				<div
					className={`rounded border px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.32em] ${
						isVictory
							? "border-accent/40 bg-accent/15 text-accent"
							: "border-destructive/40 bg-destructive/15 text-destructive"
					}`}
				>
					{isVictory ? "Victory" : "Defeat"}
				</div>

				{/* Title */}
				<h1
					className={`text-center font-heading text-4xl uppercase tracking-[0.24em] sm:text-5xl ${
						isVictory ? "text-accent" : "text-destructive"
					}`}
				>
					{isVictory ? "Command Post Destroyed" : "Command Post Lost"}
				</h1>
				<p className="max-w-lg text-center font-body text-xs uppercase tracking-[0.16em] text-muted-foreground">
					{isVictory
						? "Enemy command structure eliminated. The field is yours."
						: "Your command post has fallen. Regroup and try again."}
				</p>

				{/* Stats panel */}
				<div className="w-full max-w-md rounded-none border border-border/70 bg-black/30 p-6">
					<div className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
						After Action Report
					</div>
					<div className="grid grid-cols-2 gap-4">
						<StatRow
							label="Time"
							value={formatTime(result.stats.timeElapsed)}
						/>
						<StatRow
							label="Units Trained"
							value={String(result.stats.unitsTrained)}
						/>
						<StatRow
							label="Units Lost"
							value={String(result.stats.unitsLost)}
						/>
						<StatRow
							label="Resources Gathered"
							value={String(result.stats.resourcesGathered)}
						/>
					</div>

					<div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-4">
						<span className="rounded border border-accent/20 bg-accent/8 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
							{result.difficulty}
						</span>
						{result.playedAsScaleGuard && (
							<span className="rounded border border-emerald-500/20 bg-emerald-500/8 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-300">
								Scale-Guard
							</span>
						)}
					</div>
				</div>

				{/* Actions */}
				<div className="flex flex-wrap gap-3">
					<Button variant="accent" size="lg" onClick={handlePlayAgain}>
						Play Again
					</Button>
					<Button variant="command" size="lg" onClick={handleMainMenu}>
						Main Menu
					</Button>
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatRow({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
				{label}
			</div>
			<div className="mt-0.5 font-heading text-lg uppercase tracking-[0.12em] text-foreground">
				{value}
			</div>
		</div>
	);
}

function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}
