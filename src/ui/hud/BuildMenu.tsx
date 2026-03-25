/**
 * BuildMenu — Build palette for the command console.
 *
 * Shows available URA structures with affordability gating.
 * Unaffordable buildings are greyed out and unclickable.
 * Buildings locked by mission progression are hidden.
 * Clicking an affordable building dispatches ghost placement mode to Phaser.
 */
import { useTrait, useWorld } from "koota/react";
import { Button } from "@/components/ui/button";
import { ALL_BUILDINGS } from "@/data/buildings";
import { CurrentMission, ResourcePool } from "@/ecs/traits/state";
import { cn } from "@/ui/lib/utils";

const DEFAULT_BUILD_ORDER = [
	"command_post",
	"barracks",
	"burrow",
	"fish_trap",
	"watchtower",
	"sandbag_wall",
	"armory",
	"field_hospital",
	"dock",
];

export function BuildMenu({
	open = false,
	compact = false,
	embedded = false,
	optionIds = DEFAULT_BUILD_ORDER,
	onSelect,
}: {
	open?: boolean;
	compact?: boolean;
	embedded?: boolean;
	optionIds?: string[];
	onSelect?: (buildingId: string) => void;
}) {
	const world = useWorld();
	const resources = useTrait(world, ResourcePool);
	const currentMission = useTrait(world, CurrentMission);

	if (!open) return null;

	const fish = resources?.fish ?? 0;
	const timber = resources?.timber ?? 0;
	const salvage = resources?.salvage ?? 0;
	const missionNumber = parseMissionNumber(currentMission?.missionId ?? "mission_1");
	const options = optionIds
		.map((id) => ALL_BUILDINGS[id])
		.filter((option) => option?.faction === "ura")
		.filter((option) => option.unlock <= missionNumber);

	return (
		<div
			data-testid="build-menu"
			className={cn(
				"grid gap-2",
				compact ? "grid-cols-2" : "grid-cols-3",
				embedded ? "p-0" : "rounded-none border border-border/70 bg-background/30 p-3",
			)}
		>
			{options.map((opt) => {
				const cost = {
					fish: opt.cost.fish ?? 0,
					timber: opt.cost.timber ?? 0,
					salvage: opt.cost.salvage ?? 0,
				};
				const affordable = fish >= cost.fish && timber >= cost.timber && salvage >= cost.salvage;

				return (
					<Button
						key={opt.id}
						type="button"
						variant="hud"
						size="sm"
						disabled={!affordable}
						title={`${opt.name} — ${formatCost(cost) || "Free"}`}
						onClick={() => onSelect?.(opt.id)}
						className={cn(
							"h-auto min-h-24 flex-col items-start justify-between gap-2 rounded-none border px-2.5 py-2 text-left",
							"text-[10px] uppercase tracking-[0.18em]",
							affordable
								? "border-accent/20 bg-background/35 text-foreground"
								: "border-border/70 bg-background/20 text-muted-foreground opacity-60",
						)}
					>
						<div className="grid gap-1">
							<span className="font-heading text-[11px] uppercase tracking-[0.16em]">
								{opt.name}
							</span>
							<span className="font-body text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
								{opt.role}
							</span>
						</div>
						<span className="font-mono text-[9px] text-muted-foreground">{formatCost(cost)}</span>
					</Button>
				);
			})}
		</div>
	);
}

function formatCost(cost: { fish?: number; timber?: number; salvage?: number }) {
	const parts: string[] = [];
	if ((cost.fish ?? 0) > 0) parts.push(`F${cost.fish}`);
	if ((cost.timber ?? 0) > 0) parts.push(`T${cost.timber}`);
	if ((cost.salvage ?? 0) > 0) parts.push(`S${cost.salvage}`);
	return parts.join(" ");
}

/** Extract the mission number from a mission ID like "mission_3". */
function parseMissionNumber(missionId: string | null): number {
	if (!missionId) return 1;
	const match = missionId.match(/(\d+)/);
	return match ? Number.parseInt(match[1], 10) : 1;
}
