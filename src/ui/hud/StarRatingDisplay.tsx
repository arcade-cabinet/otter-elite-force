/**
 * StarRatingDisplay — Animated star rating reveal (US-053).
 *
 * Victory overlay component showing 1-3 stars with score breakdown:
 * - Time (40%), Survival (30%), Bonus (30%)
 * - Stars animate on reveal with staggered delay
 * - Bronze (1 star), Silver (2 stars), Gold (3 stars)
 */

import { useEffect, useState } from "react";
import { cn } from "@/ui/lib/utils";

export interface ScoreBreakdown {
	timeScore: number;
	survivalScore: number;
	bonusScore: number;
	totalScore: number;
	stars: 0 | 1 | 2 | 3;
}

/** Calculate star rating from mission completion stats (US-053). */
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

	// Survival score (30% weight): starts at 100%, -10% per unit lost, min 0%
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

function ScoreBar({ label, score, weight }: { label: string; score: number; weight: string }) {
	return (
		<div className="grid gap-1">
			<div className="flex items-center justify-between">
				<span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
					{label} ({weight})
				</span>
				<span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground">
					{score}%
				</span>
			</div>
			<div className="h-1.5 overflow-hidden rounded-full bg-background/30">
				<div
					className={cn(
						"h-full rounded-full transition-all duration-700",
						score >= 80 ? "bg-primary" : score >= 50 ? "bg-accent" : "bg-muted-foreground",
					)}
					style={{ width: `${Math.min(100, score)}%` }}
				/>
			</div>
		</div>
	);
}

export function StarRatingDisplay({
	breakdown,
	animate = true,
}: {
	breakdown: ScoreBreakdown;
	animate?: boolean;
}) {
	const [revealedStars, setRevealedStars] = useState<number>(animate ? 0 : breakdown.stars);

	useEffect(() => {
		if (!animate) {
			setRevealedStars(breakdown.stars);
			return;
		}

		setRevealedStars(0);
		const timers: ReturnType<typeof setTimeout>[] = [];
		for (let i = 1; i <= breakdown.stars; i++) {
			timers.push(
				setTimeout(() => {
					setRevealedStars(i as 0 | 1 | 2 | 3);
				}, i * 400),
			);
		}

		return () => {
			for (const t of timers) clearTimeout(t);
		};
	}, [breakdown.stars, animate]);

	const starColor = STAR_COLORS[breakdown.stars] ?? "text-muted-foreground";

	return (
		<div data-testid="star-rating-display" className="grid gap-4">
			{/* Star icons */}
			<div className="flex items-center justify-center gap-3">
				{[1, 2, 3].map((i) => (
					<span
						key={i}
						data-testid={`star-${i}`}
						className={cn(
							"text-4xl transition-all duration-300",
							i <= revealedStars ? starColor : "text-muted-foreground/20",
							i <= revealedStars && animate && "animate-in zoom-in-50",
						)}
					>
						{i <= revealedStars ? "\u2605" : "\u2606"}
					</span>
				))}
			</div>

			{/* Rating label */}
			<div className="text-center">
				<span className="rounded border border-accent/25 bg-accent/10 px-3 py-1 font-heading text-sm uppercase tracking-[0.2em] text-accent">
					{STAR_LABELS[breakdown.stars]}
				</span>
				<div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
					Total Score: {breakdown.totalScore}%
				</div>
			</div>

			{/* Score breakdown */}
			<div className="grid gap-2 rounded-none border border-border/60 bg-background/20 p-3">
				<ScoreBar label="Time" score={breakdown.timeScore} weight="40%" />
				<ScoreBar label="Survival" score={breakdown.survivalScore} weight="30%" />
				<ScoreBar label="Bonus" score={breakdown.bonusScore} weight="30%" />
			</div>
		</div>
	);
}
