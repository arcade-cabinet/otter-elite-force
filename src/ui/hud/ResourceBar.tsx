/**
 * ResourceBar — Top HUD bar showing Fish, Timber, Salvage, and Population.
 *
 * Reads ResourcePool and PopulationState from Koota world-level traits.
 * Digital counter font, slight flicker aesthetic (tactical theme).
 */
import { useTrait, useWorld } from "koota/react";
import { ResourcePool, PopulationState } from "@/ecs/traits/state";
import { cn } from "@/ui/lib/utils";

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
		<div
			role="status"
			data-testid="resource-bar"
			className={cn(
				"resource-bar",
				"flex items-center gap-6 px-4 py-2",
				"border-b-2 border-border bg-card",
				"font-mono text-sm tracking-wider text-card-foreground",
			)}
		>
			<ResourceItem label="FISH" value={fish} />
			<ResourceItem label="TIMBER" value={timber} />
			<ResourceItem label="SALVAGE" value={salvage} />
			<div className="ml-auto flex items-center gap-1 text-muted-foreground">
				<span className="text-xs uppercase tracking-widest">POP</span>
				<span className="text-foreground">
					{popCurrent}/{popMax}
				</span>
			</div>
		</div>
	);
}

function ResourceItem({ label, value }: { label: string; value: number }) {
	return (
		<div className="flex items-center gap-1.5">
			<span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
			<span className="min-w-[3ch] text-right tabular-nums text-foreground">{value}</span>
		</div>
	);
}
