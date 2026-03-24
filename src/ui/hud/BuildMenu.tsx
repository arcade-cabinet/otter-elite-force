/**
 * BuildMenu — Building placement grid (opens from ActionBar "Build" action).
 *
 * Shows available buildings as blueprint-style cards with cost and name.
 * Reads ResourcePool from Koota to grey out unaffordable buildings.
 * Placeholder implementation — will be wired to placement system.
 */
import { useTrait, useWorld } from "koota/react";
import { ResourcePool } from "@/ecs/traits/state";
import { cn } from "@/ui/lib/utils";

interface BuildOption {
	id: string;
	label: string;
	cost: { fish: number; timber: number; salvage: number };
}

const BUILD_OPTIONS: BuildOption[] = [
	{ id: "command_post", label: "Command Post", cost: { fish: 0, timber: 200, salvage: 0 } },
	{ id: "barracks", label: "Barracks", cost: { fish: 100, timber: 150, salvage: 0 } },
	{ id: "burrow", label: "Burrow", cost: { fish: 0, timber: 100, salvage: 0 } },
	{ id: "fish_trap", label: "Fish Trap", cost: { fish: 50, timber: 50, salvage: 0 } },
	{ id: "watchtower", label: "Watchtower", cost: { fish: 0, timber: 100, salvage: 50 } },
	{ id: "armory", label: "Armory", cost: { fish: 100, timber: 200, salvage: 100 } },
];

export function BuildMenu({ open = false }: { open?: boolean }) {
	const world = useWorld();
	const resources = useTrait(world, ResourcePool);

	if (!open) return null;

	const fish = resources?.fish ?? 0;
	const timber = resources?.timber ?? 0;
	const salvage = resources?.salvage ?? 0;

	return (
		<div
			data-testid="build-menu"
			className={cn("grid grid-cols-3 gap-2 p-3", "border-2 border-border bg-popover")}
		>
			{BUILD_OPTIONS.map((opt) => {
				const affordable =
					fish >= opt.cost.fish && timber >= opt.cost.timber && salvage >= opt.cost.salvage;

				return (
					<button
						key={opt.id}
						type="button"
						disabled={!affordable}
						className={cn(
							"flex flex-col items-center gap-1 p-2",
							"border border-border text-xs uppercase tracking-wider",
							affordable
								? "bg-secondary text-secondary-foreground hover:border-accent"
								: "cursor-not-allowed bg-muted text-muted-foreground opacity-50",
						)}
					>
						<span className="font-heading">{opt.label}</span>
						<span className="font-mono text-[10px] text-muted-foreground">
							{formatCost(opt.cost)}
						</span>
					</button>
				);
			})}
		</div>
	);
}

function formatCost(cost: { fish: number; timber: number; salvage: number }) {
	const parts: string[] = [];
	if (cost.fish > 0) parts.push(`F${cost.fish}`);
	if (cost.timber > 0) parts.push(`T${cost.timber}`);
	if (cost.salvage > 0) parts.push(`S${cost.salvage}`);
	return parts.join(" ");
}
