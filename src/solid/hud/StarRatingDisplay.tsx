/**
 * StarRatingDisplay -- Animated star rating reveal for mission results.
 *
 * Shows 1-3 stars with staggered reveal animation (400ms per star).
 * Gold = all objectives (3 stars, >= 90%).
 * Silver = primary only (2 stars, >= 60%).
 * Bronze = minimum (1 star, >= 30%).
 *
 * Includes score breakdown bars: Time (40%), Survival (30%), Bonus (30%).
 */

import { type Component, createSignal, For, onCleanup, onMount } from "solid-js";

export interface ScoreBreakdown {
	timeScore: number;
	survivalScore: number;
	bonusScore: number;
	totalScore: number;
	stars: 0 | 1 | 2 | 3;
}

/** Calculate star rating from mission completion stats. */
export function calculateStarRating(params: {
	parTimeMs: number;
	elapsedMs: number;
	unitsLost: number;
	totalUnits: number;
	bonusObjectivesCompleted: number;
	bonusObjectivesTotal: number;
}): ScoreBreakdown {
	const {
		parTimeMs,
		elapsedMs,
		unitsLost,
		totalUnits,
		bonusObjectivesCompleted,
		bonusObjectivesTotal,
	} = params;

	// Time score (40% weight): 100% at or under par, linear decay to 0% at 3x par
	let timeScore = 100;
	if (elapsedMs > parTimeMs) {
		const overPar = elapsedMs - parTimeMs;
		const maxOver = parTimeMs * 2; // 3x par total
		timeScore = Math.max(0, Math.round(100 - (overPar / maxOver) * 100));
	}

	// Survival score (30% weight): proportional to units surviving
	const survivalScore = Math.max(0, Math.round(100 - (unitsLost / Math.max(totalUnits, 1)) * 100));

	// Bonus score (30% weight): proportional to completed bonus objectives
	const bonusScore =
		bonusObjectivesTotal > 0
			? Math.round((bonusObjectivesCompleted / bonusObjectivesTotal) * 100)
			: 100;

	// Weighted total
	const totalScore = Math.round(timeScore * 0.4 + survivalScore * 0.3 + bonusScore * 0.3);

	// Star thresholds
	let stars: 0 | 1 | 2 | 3;
	if (totalScore >= 90) {
		stars = 3;
	} else if (totalScore >= 60) {
		stars = 2;
	} else if (totalScore >= 30) {
		stars = 1;
	} else {
		stars = 0;
	}

	return { timeScore, survivalScore, bonusScore, totalScore, stars };
}

const STAR_COLORS: Record<number, string> = {
	1: "text-amber-600", // bronze
	2: "text-gray-300", // silver
	3: "text-yellow-400", // gold
};

const STAR_LABELS: Record<number, string> = {
	0: "No Rating",
	1: "Bronze",
	2: "Silver",
	3: "Gold",
};

/** Score breakdown bar row. */
const ScoreBar: Component<{
	label: string;
	score: number;
	weight: string;
}> = (props) => {
	return (
		<div class="grid gap-1">
			<div class="flex items-center justify-between">
				<span class="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-500">
					{props.label} ({props.weight})
				</span>
				<span class="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-100">
					{props.score}%
				</span>
			</div>
			<div class="h-1.5 overflow-hidden rounded-full bg-slate-800/50">
				<div
					class={`h-full rounded-full transition-all duration-700 ${
						props.score >= 80
							? "bg-green-500"
							: props.score >= 50
								? "bg-green-400/70"
								: "bg-slate-500"
					}`}
					style={{ width: `${Math.min(100, props.score)}%` }}
				/>
			</div>
		</div>
	);
};

export const StarRatingDisplay: Component<{
	breakdown: ScoreBreakdown;
	/** Enable animated staggered reveal (default: true) */
	animate?: boolean;
}> = (props) => {
	const shouldAnimate = () => props.animate !== false;
	const [revealedStars, setRevealedStars] = createSignal<number>(
		shouldAnimate() ? 0 : props.breakdown.stars,
	);

	const timers: ReturnType<typeof setTimeout>[] = [];

	onMount(() => {
		if (!shouldAnimate()) {
			setRevealedStars(props.breakdown.stars);
			return;
		}

		setRevealedStars(0);
		for (let i = 1; i <= props.breakdown.stars; i++) {
			timers.push(
				setTimeout(() => {
					setRevealedStars(i);
				}, i * 400),
			);
		}
	});

	onCleanup(() => {
		for (const t of timers) clearTimeout(t);
	});

	const starColor = () => STAR_COLORS[props.breakdown.stars] ?? "text-slate-600";

	return (
		<div data-testid="star-rating-display" class="grid gap-4">
			{/* Star icons */}
			<div class="flex items-center justify-center gap-3">
				<For each={[1, 2, 3]}>
					{(i) => (
						<span
							data-testid={`star-${i}`}
							class={`text-4xl transition-all duration-300 ${
								i <= revealedStars() ? starColor() : "text-slate-700"
							} ${
								i <= revealedStars() && shouldAnimate()
									? "scale-100 opacity-100"
									: i > revealedStars()
										? "scale-75 opacity-40"
										: ""
							}`}
						>
							{i <= revealedStars() ? "\u2605" : "\u2606"}
						</span>
					)}
				</For>
			</div>

			{/* Rating label */}
			<div class="text-center">
				<span class="rounded border border-green-500/25 bg-green-500/10 px-3 py-1 font-heading text-sm uppercase tracking-[0.2em] text-green-400">
					{STAR_LABELS[props.breakdown.stars]}
				</span>
				<div class="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
					Total Score: {props.breakdown.totalScore}%
				</div>
			</div>

			{/* Score breakdown */}
			<div class="grid gap-2 border border-slate-600/60 bg-slate-900/20 p-3">
				<ScoreBar label="Time" score={props.breakdown.timeScore} weight="40%" />
				<ScoreBar label="Survival" score={props.breakdown.survivalScore} weight="30%" />
				<ScoreBar label="Bonus" score={props.breakdown.bonusScore} weight="30%" />
			</div>
		</div>
	);
};
