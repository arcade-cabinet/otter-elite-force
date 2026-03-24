/**
 * ActionBar — Contextual action buttons based on selection (bottom-right HUD).
 *
 * Worker selected  → Build, Gather, Repair
 * Military selected → Move, Attack, Patrol, Hold
 * Building selected → Train, Research (context-dependent)
 * Nothing selected → empty
 */
import { useQuery, useTrait } from "koota/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Category, IsBuilding, Selected, UnitType } from "@/ecs/traits/identity";
import { cn } from "@/ui/lib/utils";

type TraitTarget = Parameters<typeof useTrait>[0];

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

export function ActionBar({ compact = false }: { compact?: boolean }) {
	const selected = useQuery(Selected);
	const entity = selected.length > 0 ? selected[0] : null;

	if (!entity) {
		return <div data-testid="action-bar" />;
	}

	return <ActionBarInner entity={entity} compact={compact} />;
}

function ActionBarInner({ entity, compact }: { entity: TraitTarget; compact: boolean }) {
	const unitType = useTrait(entity, UnitType);
	const category = useTrait(entity, Category);
	const isBuilding = useTrait(entity, IsBuilding);

	const actions = resolveActions(
		unitType?.type ?? "",
		category?.category ?? "",
		isBuilding !== undefined,
	);

	return (
		<Card data-testid="action-bar" className="border-accent/18 bg-card/88">
			<CardContent className={cn("grid", compact ? "gap-2 p-2" : "gap-2.5 p-2.5 sm:gap-3 sm:p-3")}>
				<div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
					<div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
						Command Actions
					</div>
					<div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
						Context Live
					</div>
				</div>
				<div className="grid grid-cols-2 gap-2">
					{actions.map((action) => (
						<Button
							key={action.id}
							type="button"
							variant="hud"
							size="sm"
							className={cn("justify-between", compact ? "h-10 px-2.5" : "h-11 px-3")}
						>
							{action.label}
							<span className="ml-1 font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
								{resolveHotkey(action.id)}
							</span>
						</Button>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function resolveHotkey(id: string) {
	if (id === "build") return "Q";
	if (id === "gather") return "W";
	if (id === "repair") return "E";
	if (id === "move") return "M";
	if (id === "attack") return "A";
	if (id === "patrol") return "P";
	if (id === "hold") return "H";
	if (id === "train") return "T";
	if (id === "research") return "R";
	return "•";
}

function resolveActions(type: string, category: string, building: boolean): Action[] {
	if (building) {
		if (type === "armory") return ARMORY_ACTIONS;
		return BARRACKS_ACTIONS;
	}
	if (category === "worker") return WORKER_ACTIONS;
	return MILITARY_ACTIONS;
}
