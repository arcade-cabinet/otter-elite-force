import { useQuery } from "koota/react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Selected } from "@/ecs/traits/identity";
import { CAMPAIGN, getMissionById } from "@/entities/missions";
import { Minimap } from "@/ui/hud/Minimap";
import { TransmissionPortrait } from "@/ui/hud/TransmissionPortrait";
import { UnitPanel } from "@/ui/hud/UnitPanel";
import { cn } from "@/ui/lib/utils";

export function TacticalRail({
	missionId,
	activeSpeaker,
	activePortraitId,
	compact = false,
}: {
	missionId: string;
	activeSpeaker?: string | null;
	activePortraitId?: string | null;
	compact?: boolean;
}) {
	const selected = useQuery(Selected);
	const mission = useMemo(() => getMissionById(missionId) ?? CAMPAIGN[0], [missionId]);
	const speaker = activeSpeaker ?? mission.briefing.lines[0]?.speaker ?? "Field Command";
	const portraitId = activePortraitId ?? mission.briefing.portraitId ?? undefined;

	return (
		<div className="grid h-full min-h-0 gap-2 sm:gap-3">
			<Card className="overflow-hidden border-accent/20 bg-card/86 shadow-[0_18px_36px_rgba(0,0,0,0.34)]">
				<CardContent className="grid gap-2 p-2.5 sm:p-3">
					<div className="flex items-center justify-between gap-2">
						<Badge variant="accent">Active Channel</Badge>
						<span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
							Speaker Feed
						</span>
					</div>
					<div className="flex justify-center rounded-none border border-border/60 bg-background/22 p-2">
						<TransmissionPortrait portraitId={portraitId} speaker={speaker} compact={compact} />
					</div>
				</CardContent>
			</Card>

			<Card className="overflow-hidden border-accent/16 bg-card/84 shadow-[0_16px_32px_rgba(0,0,0,0.28)]">
				<CardContent className="grid gap-2 p-2.5 sm:p-3">
					<div className="flex items-center justify-between gap-2">
						<Badge variant="accent">Selection</Badge>
						<span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
							{selected.length > 0 ? `${selected.length} active` : "Awaiting orders"}
						</span>
					</div>
					<div className="rounded-none border border-border/60 bg-background/22 p-2">
						{selected.length > 0 ? (
							<UnitPanel compact={compact} embedded />
						) : (
							<div className={cn("grid gap-1.5", compact ? "min-h-24" : "min-h-28")}>
								<div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
									Roster standby
								</div>
								<p className="font-body text-[10px] uppercase tracking-[0.14em] leading-relaxed text-foreground/82">
									Select a worker, squad, or structure to pull its field dossier and command options
									into the rail.
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<div className="min-h-0">
				<Minimap compact={compact} />
			</div>
		</div>
	);
}
