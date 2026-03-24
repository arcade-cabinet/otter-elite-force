/**
 * ResourceBar — Top HUD bar showing Fish, Timber, Salvage, and Population.
 *
 * Reads ResourcePool and PopulationState from Koota world-level traits.
 * Digital counter font, slight flicker aesthetic (tactical theme).
 */
import { useTrait, useWorld } from "koota/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ResourcePool, PopulationState } from "@/ecs/traits/state";

export function ResourceBar() {
	const world = useWorld();
	const resources = useTrait(world, ResourcePool);
	const population = useTrait(world, PopulationState);

	const fish = resources?.fish ?? 0;
	const timber = resources?.timber ?? 0;
	const salvage = resources?.salvage ?? 0;
	const popCurrent = population?.current ?? 0;
	const popMax = population?.max ?? 0;

	return (
		<Card role="status" data-testid="resource-bar" className="resource-bar border-accent/20 bg-card/86 shadow-[0_0_0_1px_rgba(0,255,65,0.06),0_18px_40px_rgba(0,0,0,0.34)]">
			<CardContent className="flex flex-wrap items-center gap-2 p-2.5 sm:gap-4 sm:p-3">
				<div className="flex items-center gap-2 pr-1 sm:pr-2">
					<Badge variant="accent">TACTICAL NET</Badge>
					<span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:inline">FIELD ECONOMY</span>
				</div>
				<div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-3">
					<ResourceItem label="Fish" value={fish} />
					<ResourceItem label="Timber" value={timber} />
					<ResourceItem label="Salvage" value={salvage} />
				</div>
				<div className="flex w-full items-center justify-between gap-2 rounded-md border border-border/70 bg-background/18 px-3 py-2 sm:ml-auto sm:w-auto sm:justify-start">
					<Badge variant="accent">POP</Badge>
					<span className="font-mono text-sm tracking-[0.18em] text-foreground">
						{popCurrent}/{popMax}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}

function ResourceItem({ label, value }: { label: string; value: number }) {
	return (
		<div className="flex items-center gap-2 rounded-md border border-border/70 bg-background/18 px-2.5 py-1.5 sm:px-3 sm:py-2">
			<span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{label}</span>
			<span className="min-w-[3ch] text-right font-mono text-sm tabular-nums tracking-[0.18em] text-foreground">{value}</span>
		</div>
	);
}
