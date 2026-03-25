import { useMemo } from "react";
import { useTrait, useWorld } from "koota/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GameClock, Objectives } from "@/ecs/traits/state";
import { CAMPAIGN, getMissionById } from "@/entities/missions";
import { ResourceBar } from "@/ui/hud/ResourceBar";
import { cn } from "@/ui/lib/utils";

function formatChronometer(elapsedMs: number): string {
	const totalCentiseconds = Math.max(0, Math.floor(elapsedMs / 10));
	const minutes = Math.floor(totalCentiseconds / 6000);
	const seconds = Math.floor((totalCentiseconds % 6000) / 100);
	const centiseconds = totalCentiseconds % 100;
	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}

export function GameplayTopBar({
	missionId,
	compact = false,
}: {
	missionId: string;
	compact?: boolean;
}) {
	const world = useWorld();
	const mission = useMemo(() => getMissionById(missionId) ?? CAMPAIGN[0], [missionId]);
	const liveObjectives = useTrait(world, Objectives)?.list ?? [];
	const clock = useTrait(world, GameClock);
	const primaryCount =
		liveObjectives.filter((objective) => !objective.bonus).length ||
		mission.objectives.primary.length;
	const primaryComplete = liveObjectives.filter(
		(objective) => !objective.bonus && objective.status === "completed",
	).length;
	const bonusCount =
		liveObjectives.filter((objective) => objective.bonus).length || mission.objectives.bonus.length;
	const bonusComplete = liveObjectives.filter(
		(objective) => objective.bonus && objective.status === "completed",
	).length;

	return (
		<div
			className={cn(
				"grid items-start gap-2",
				compact ? "grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_auto]",
			)}
		>
			<Card className="overflow-hidden border-accent/20 bg-card/86 shadow-[0_16px_36px_rgba(0,0,0,0.34)]">
				<CardContent className={cn("grid gap-3", compact ? "p-3" : "p-3.5 sm:p-4")}>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="accent">Operation</Badge>
						<Badge>{`Chapter ${mission.chapter} • Mission ${mission.mission}`}</Badge>
						<Badge>{formatChronometer(clock?.elapsedMs ?? 0)}</Badge>
						<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
							Copper-Silt Reach
						</span>
					</div>
					<div className="grid gap-1">
						<div className="font-heading text-sm uppercase tracking-[0.16em] text-foreground sm:text-base">
							{mission.name}
						</div>
						{mission.subtitle ? (
							<div className="font-body text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px]">
								{mission.subtitle}
							</div>
						) : null}
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Badge
							variant={primaryCount > 0 && primaryComplete === primaryCount ? "primary" : "accent"}
						>
							{primaryComplete}/{primaryCount} primary
						</Badge>
						{bonusCount > 0 ? (
							<Badge>
								{bonusComplete}/{bonusCount} bonus
							</Badge>
						) : null}
						<span className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent/80">
							Command-post tactical net online
						</span>
					</div>
				</CardContent>
			</Card>
			<ResourceBar />
		</div>
	);
}
