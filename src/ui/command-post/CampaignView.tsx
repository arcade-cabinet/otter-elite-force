/**
 * CampaignView — Campaign progression UI (US-050 + US-051).
 *
 * Shows 16 missions organized by 4 chapters of 4 missions each.
 * Completed missions show star rating (bronze/silver/gold).
 * Locked missions are greyed out with padlock indicator.
 * Clicking an unlocked mission navigates to the briefing screen.
 *
 * Difficulty selection is integrated: New Game picks difficulty,
 * and difficulty cannot be lowered mid-campaign (US-051).
 */

import { useTrait, useWorld } from "koota/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AppScreen, CampaignProgress } from "@/ecs/traits/state";
import { CAMPAIGN } from "@/entities/missions";
import type { MissionDef } from "@/entities/types";
import { type DifficultyId, getDifficultyDef } from "@/game/difficulty";
import { CommandPostShell } from "@/ui/layout/shells";
import { cn } from "@/ui/lib/utils";

/** Chapter labels for the 4 chapters. */
const CHAPTER_NAMES = ["First Landing", "Deep Operations", "Turning Tide", "Final Offensive"];

type MissionStatus = "locked" | "available" | "completed";

interface MissionSlot {
	def: MissionDef;
	status: MissionStatus;
	stars: number;
}

function getMissionStatus(
	missionDef: MissionDef,
	missions: Record<string, { status: string; stars: number; bestTime: number }>,
	campaignIndex: number,
): { status: MissionStatus; stars: number } {
	const entry = missions[missionDef.id];
	if (entry?.status === "completed") {
		return { status: "completed", stars: entry.stars };
	}

	// First mission is always available
	if (campaignIndex === 0) {
		return { status: "available", stars: 0 };
	}

	// Available if previous mission is completed
	const prevMission = CAMPAIGN[campaignIndex - 1];
	if (prevMission && missions[prevMission.id]?.status === "completed") {
		return { status: "available", stars: 0 };
	}

	return { status: "locked", stars: 0 };
}

function StarRating({ stars, size = "md" }: { stars: number; size?: "sm" | "md" }) {
	const starSize = size === "sm" ? "text-xs" : "text-base";
	return (
		<div className={cn("flex gap-0.5", starSize)} data-testid="star-rating">
			{[1, 2, 3].map((i) => (
				<span
					key={i}
					className={cn(
						i <= stars
							? stars === 3
								? "text-yellow-400" // gold
								: stars === 2
									? "text-gray-300" // silver
									: "text-amber-600" // bronze
							: "text-muted-foreground/30",
					)}
				>
					{i <= stars ? "\u2605" : "\u2606"}
				</span>
			))}
		</div>
	);
}

function MissionCard({ slot, onClick }: { slot: MissionSlot; onClick: () => void }) {
	const isLocked = slot.status === "locked";
	const isCompleted = slot.status === "completed";

	return (
		<button
			type="button"
			data-testid={`mission-card-${slot.def.id}`}
			disabled={isLocked}
			onClick={onClick}
			className={cn(
				"group relative rounded-md border px-3 py-3 text-left transition",
				isLocked
					? "cursor-not-allowed border-border/40 bg-background/15 opacity-50"
					: isCompleted
						? "border-primary/35 bg-primary/8 hover:border-primary/55 hover:bg-primary/12"
						: "border-accent/30 bg-background/30 hover:border-accent/55 hover:bg-background/45",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					<div className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
						{slot.def.chapter}-{slot.def.mission}
					</div>
					<div
						className={cn(
							"mt-0.5 font-heading text-sm uppercase tracking-[0.14em]",
							isLocked ? "text-muted-foreground" : "text-foreground",
						)}
					>
						{slot.def.name}
					</div>
					<div className="mt-1 font-body text-[10px] uppercase tracking-[0.1em] text-muted-foreground line-clamp-1">
						{slot.def.subtitle}
					</div>
				</div>
				<div className="flex shrink-0 flex-col items-end gap-1">
					{isLocked ? (
						<span
							role="img"
							className="font-mono text-sm text-muted-foreground/50"
							aria-label="Locked"
							data-testid={`mission-locked-${slot.def.id}`}
						>
							&#x1F512;
						</span>
					) : isCompleted ? (
						<StarRating stars={slot.stars} size="sm" />
					) : (
						<span className="rounded border border-accent/25 bg-accent/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-accent">
							Available
						</span>
					)}
				</div>
			</div>
		</button>
	);
}

export function CampaignView() {
	const world = useWorld();
	const campaign = useTrait(world, CampaignProgress);
	const missions = campaign?.missions ?? {};
	const currentDifficulty = (campaign?.difficulty ?? "support") as DifficultyId;
	// Reserved for future mission detail panel
	const [_selectedMissionId, _setSelectedMissionId] = useState<string | null>(null);

	const slots = useMemo<MissionSlot[]>(
		() =>
			CAMPAIGN.map((def, index) => {
				const { status, stars } = getMissionStatus(def, missions, index);
				return { def, status, stars };
			}),
		[missions],
	);

	/** Group missions by chapter (4 chapters x 4 missions). */
	const chapters = useMemo(() => {
		const grouped: { chapter: number; name: string; missions: MissionSlot[] }[] = [];
		for (let c = 1; c <= 4; c++) {
			grouped.push({
				chapter: c,
				name: CHAPTER_NAMES[c - 1],
				missions: slots.filter((s) => s.def.chapter === c),
			});
		}
		return grouped;
	}, [slots]);

	const completedCount = slots.filter((s) => s.status === "completed").length;

	const handleMissionClick = (missionId: string) => {
		const slot = slots.find((s) => s.def.id === missionId);
		if (!slot || slot.status === "locked") return;

		// Set current mission and navigate to game (which shows briefing via CommandConsole)
		if (!campaign) return;
		world.set(CampaignProgress, {
			...campaign,
			currentMission: missionId,
		});
		world.set(AppScreen, { screen: "game" });
	};

	return (
		<CommandPostShell
			title="Campaign"
			subtitle={`${completedCount} of ${CAMPAIGN.length} missions completed`}
			eyebrow="Copper-Silt Reach"
			meta={
				<div className="flex items-center gap-2">
					<span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
						Difficulty:
					</span>
					<span className="rounded border border-accent/25 bg-accent/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
						{getDifficultyDef(currentDifficulty).label}
					</span>
				</div>
			}
			footer={
				<div className="flex flex-wrap gap-2">
					<Button variant="command" onClick={() => world.set(AppScreen, { screen: "menu" })}>
						Back to Menu
					</Button>
				</div>
			}
		>
			<div className="grid gap-6" data-testid="campaign-view">
				{chapters.map((chapter) => (
					<div key={chapter.chapter}>
						<div className="mb-3 flex items-center gap-2">
							<span className="rounded border border-accent/20 bg-accent/8 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.24em] text-accent">
								Chapter {chapter.chapter}
							</span>
							<span className="font-heading text-sm uppercase tracking-[0.16em] text-foreground">
								{chapter.name}
							</span>
						</div>
						<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
							{chapter.missions.map((slot) => (
								<MissionCard
									key={slot.def.id}
									slot={slot}
									onClick={() => handleMissionClick(slot.def.id)}
								/>
							))}
						</div>
					</div>
				))}
			</div>
		</CommandPostShell>
	);
}
