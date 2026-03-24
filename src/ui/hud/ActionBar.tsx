/**
 * ActionBar — Contextual action buttons based on selection (bottom-right HUD).
 *
 * Worker selected  → Build, Gather, Repair
 * Military selected → Move, Attack, Patrol, Hold
 * Building selected → Train, Research (context-dependent)
 * Nothing selected → empty
 */
import { useQuery, useTrait } from "koota/react";
import { UnitType, Selected, IsBuilding, Category } from "@/ecs/traits/identity";
import { cn } from "@/ui/lib/utils";

interface Action {
	id: string;
	label: string;
}

const WORKER_ACTIONS: Action[] = [
	{ id: "build", label: "Build" },
	{ id: "gather", label: "Gather" },
	{ id: "repair", label: "Repair" },
];

const MILITARY_ACTIONS: Action[] = [
	{ id: "move", label: "Move" },
	{ id: "attack", label: "Attack" },
	{ id: "patrol", label: "Patrol" },
	{ id: "hold", label: "Hold" },
];

const BARRACKS_ACTIONS: Action[] = [{ id: "train", label: "Train" }];
const ARMORY_ACTIONS: Action[] = [{ id: "research", label: "Research" }];

export function ActionBar() {
	const selected = useQuery(Selected);
	const entity = selected.length > 0 ? selected[0] : null;

	if (!entity) {
		return <div data-testid="action-bar" />;
	}

	return <ActionBarInner entity={entity} />;
}

function ActionBarInner({ entity }: { entity: any }) {
	const unitType = useTrait(entity, UnitType);
	const category = useTrait(entity, Category);
	const isBuilding = useTrait(entity, IsBuilding);

	const actions = resolveActions(
		unitType?.type ?? "",
		category?.category ?? "",
		isBuilding !== undefined,
	);

	return (
		<div
			data-testid="action-bar"
			className={cn("flex flex-wrap gap-2 px-4 py-2", "border-t-2 border-border bg-card")}
		>
			{actions.map((action) => (
				<button
					key={action.id}
					type="button"
					className={cn(
						"px-3 py-1.5 text-xs font-heading uppercase tracking-wider",
						"border-2 border-border bg-secondary text-secondary-foreground",
						"hover:border-accent hover:text-accent",
						"active:translate-y-px active:shadow-inner",
					)}
				>
					{action.label}
				</button>
			))}
		</div>
	);
}

function resolveActions(type: string, category: string, building: boolean): Action[] {
	if (building) {
		if (type === "armory") return ARMORY_ACTIONS;
		return BARRACKS_ACTIONS;
	}
	if (category === "worker") return WORKER_ACTIONS;
	return MILITARY_ACTIONS;
}
