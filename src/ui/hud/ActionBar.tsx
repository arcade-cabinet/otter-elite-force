/**
 * ActionBar — Contextual command console grid based on selection.
 *
 * Worker selected   → Build palette + gathering/repair command hints
 * Military selected → classic RTS order buttons + contextual guidance
 * Building selected → train/research palette from data definitions
 * Nothing selected  → quiet instruction panel
 */

import { useQuery, useTrait, useWorld } from "koota/react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ALL_BUILDINGS } from "@/data/buildings";
import { ALL_RESEARCH } from "@/data/research";
import { ALL_HEROES, ALL_UNITS } from "@/data/units";
import { ConstructionProgress, ProductionQueue } from "@/ecs/traits/economy";
import { Category, IsBuilding, Selected, UnitType } from "@/ecs/traits/identity";
import { PopulationState, ResourcePool } from "@/ecs/traits/state";
import { EventBus } from "@/game/EventBus";
import { queueUnit } from "@/systems/productionSystem";
import { BuildMenu } from "@/ui/hud/BuildMenu";
import { cn } from "@/ui/lib/utils";

type TraitTarget = Parameters<typeof useTrait>[0];

interface Action {
	id: string;
	label: string;
	hint: string;
}

const WORKER_ACTIONS: Action[] = [
	{ id: "move", label: "Move", hint: "Right-click terrain to redeploy this worker." },
	{ id: "stop", label: "Stop", hint: "Cancel all orders and halt movement." },
	{
		id: "gather",
		label: "Gather",
		hint: "Right-click fish, timber, or salvage to start harvesting.",
	},
	{ id: "build", label: "Build", hint: "Open the field build palette for this worker." },
];

const MILITARY_ACTIONS: Action[] = [
	{ id: "move", label: "Move", hint: "Right-click terrain to redeploy this squad." },
	{ id: "stop", label: "Stop", hint: "Cancel all orders and halt movement." },
	{ id: "attack", label: "Attack", hint: "Right-click hostiles to focus fire and push the line." },
	{ id: "patrol", label: "Patrol", hint: "Set a lane to screen crossings and guard approaches." },
	{ id: "hold", label: "Hold", hint: "Lock the unit in place to anchor the formation." },
];

const EMPTY_HINT = "Select a worker, squad, or structure to bring up contextual field commands.";

export function ActionBar({
	compact = false,
	embedded = false,
}: {
	compact?: boolean;
	embedded?: boolean;
}) {
	const selected = useQuery(Selected);
	const entity = selected.length > 0 ? selected[0] : null;

	if (!entity) {
		return (
			<ActionBarFrame
				compact={compact}
				embedded={embedded}
				selectedName="No Selection"
				actions={[]}
				activeActionId={null}
			>
				<ContextHint title="Field Orders" body={EMPTY_HINT} />
			</ActionBarFrame>
		);
	}

	return <SelectedActionBar entity={entity} compact={compact} embedded={embedded} />;
}

function SelectedActionBar({
	entity,
	compact,
	embedded,
}: {
	entity: TraitTarget;
	compact: boolean;
	embedded: boolean;
}) {
	const world = useWorld();
	const unitType = useTrait(entity, UnitType);
	const category = useTrait(entity, Category);
	const isBuilding = useTrait(entity, IsBuilding);
	const resources = useTrait(world, ResourcePool);
	const population = useTrait(world, PopulationState);
	const productionQueue = useTrait(entity, ProductionQueue) ?? [];
	const constructionProgress = useTrait(entity, ConstructionProgress);
	const type = unitType?.type ?? "";
	const resolvedCategory =
		category?.category ??
		(ALL_UNITS[type] as { category?: string } | undefined)?.category ??
		(ALL_HEROES[type] as { category?: string } | undefined)?.category ??
		"";
	const actions = useMemo(
		() => resolveActions(type, resolvedCategory, isBuilding !== undefined),
		[type, resolvedCategory, isBuilding],
	);
	const [activeActionId, setActiveActionId] = useState<string | null>(null);

	useEffect(() => {
		setActiveActionId(actions[0]?.id ?? null);
	}, [actions]);

	const activeAction = actions.find((action) => action.id === activeActionId) ?? null;
	const selectedName =
		ALL_HEROES[type]?.name ?? ALL_UNITS[type]?.name ?? ALL_BUILDINGS[type]?.name ?? "No Selection";

	return (
		<ActionBarFrame
			compact={compact}
			embedded={embedded}
			selectedName={selectedName}
			actions={actions}
			activeActionId={activeAction?.id ?? null}
			onSelectAction={setActiveActionId}
		>
			{renderDetailPanel({
				action: activeAction,
				type,
				compact,
				entity,
				world,
				resources,
				population,
				queueLength: productionQueue.length,
				isUnderConstruction: constructionProgress !== undefined,
			})}
		</ActionBarFrame>
	);
}

function ActionBarFrame({
	compact,
	embedded,
	selectedName,
	actions,
	activeActionId,
	onSelectAction,
	children,
}: {
	compact: boolean;
	embedded: boolean;
	selectedName: string;
	actions: Action[];
	activeActionId: string | null;
	onSelectAction?: (actionId: string) => void;
	children: ReactNode;
}) {
	return (
		<Card
			data-testid="action-bar"
			className={cn(
				embedded
					? "rounded-none border-0 bg-transparent shadow-none"
					: "canvas-grain border-accent/18 bg-card/88",
			)}
		>
			<CardContent
				className={cn(
					"grid",
					embedded && "p-0",
					compact ? "gap-2 p-2" : "gap-2.5 p-2.5 sm:gap-3 sm:p-3",
				)}
			>
				<div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
					<div className="grid gap-1">
						<div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
							Command Actions
						</div>
						<div className="font-heading text-[11px] uppercase tracking-[0.16em] text-foreground">
							{selectedName}
						</div>
					</div>
					<Badge variant="accent">Context Live</Badge>
				</div>
				<div className="grid grid-cols-2 gap-2">
					{actions.map((action) => (
						<Button
							key={action.id}
							type="button"
							variant="hud"
							size="sm"
							title={action.hint}
							onClick={() => onSelectAction?.(action.id)}
							className={cn(
								"justify-between",
								action.id === activeActionId && "border-accent/70 text-accent",
								compact ? "h-10 px-2.5" : "h-11 px-3",
							)}
						>
							{action.label}
							<span className="ml-1 font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
								{resolveHotkey(action.id)}
							</span>
						</Button>
					))}
				</div>
				<div className="rounded-md border border-border/70 bg-background/25 px-3 py-3">
					{children}
				</div>
			</CardContent>
		</Card>
	);
}

function resolveHotkey(id: string) {
	if (id === "build") return "Q";
	if (id === "gather") return "W";
	if (id === "stop") return "S";
	if (id === "move") return "M";
	if (id === "attack") return "A";
	if (id === "patrol") return "P";
	if (id === "hold") return "H";
	if (id === "train") return "T";
	if (id === "research") return "R";
	return "\u2022";
}

function resolveActions(type: string, category: string, building: boolean): Action[] {
	if (building) {
		const actions: Action[] = [];
		if (ALL_BUILDINGS[type]?.trains?.length) {
			actions.push({
				id: "train",
				label: "Train",
				hint: "Review the unit roster available from this structure.",
			});
		}
		if (type === "armory") {
			actions.push({
				id: "research",
				label: "Research",
				hint: "Upgrade the field kit before the next push inland.",
			});
		}
		return actions;
	}
	if (category === "worker") return WORKER_ACTIONS;
	return MILITARY_ACTIONS;
}

function renderDetailPanel({
	action,
	type,
	compact,
	entity,
	world,
	resources,
	population,
	queueLength,
	isUnderConstruction,
}: {
	action: Action | null;
	type: string;
	compact: boolean;
	entity: TraitTarget;
	world: ReturnType<typeof useWorld>;
	resources: { fish: number; timber: number; salvage: number } | undefined;
	population: { current: number; max: number } | undefined;
	queueLength: number;
	isUnderConstruction: boolean;
}) {
	if (!action) {
		return <ContextHint title="Field Orders" body={EMPTY_HINT} />;
	}

	if (action.id === "build") {
		return (
			<BuildMenu
				open
				compact={compact}
				embedded
				onSelect={(buildingId) => {
					if (!entity) return;
					const workerEntityId = typeof entity.id === "function" ? entity.id() : entity.id;
					if (workerEntityId == null) return;
					EventBus.emit("start-build-placement", {
						workerEntityId,
						buildingId,
					});
				}}
			/>
		);
	}

	if (action.id === "train") {
		const building = ALL_BUILDINGS[type];
		const trainables = (building?.trains ?? []).map((id) => ALL_UNITS[id]).filter(Boolean);
		if (trainables.length === 0) {
			return <ContextHint title="Training Queue" body={action.hint} />;
		}

		if (isUnderConstruction) {
			return (
				<ContextHint
					title="Construction In Progress"
					body="Finish this structure before opening a training queue."
				/>
			);
		}

		return (
			<div className="grid gap-2">
				<div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
					Queue {queueLength}
				</div>
				<div className={cn("grid gap-2", compact ? "grid-cols-1" : "grid-cols-2")}>
					{trainables.map((unit) => (
						<Button
							key={unit.id}
							type="button"
							variant="hud"
							size="sm"
							title={`Cost: ${formatCost(unit.cost)} | Pop: ${unit.pop ?? 1}`}
							className="h-auto items-start justify-start rounded-md border border-accent/15 bg-background/25 px-3 py-2 text-left"
							disabled={
								(resources?.fish ?? 0) < (unit.cost.fish ?? 0) ||
								(resources?.timber ?? 0) < (unit.cost.timber ?? 0) ||
								(resources?.salvage ?? 0) < (unit.cost.salvage ?? 0) ||
								(population?.current ?? 0) + (unit.pop ?? 0) >
									(population?.max ?? Number.POSITIVE_INFINITY)
							}
							onClick={() => {
								const queued = queueUnit(entity as ReturnType<typeof world.spawn>, unit.id, world);
								EventBus.emit("hud-alert", {
									message: queued
										? `${unit.name} added to queue.`
										: `Unable to queue ${unit.name}. Check supplies and population.`,
									severity: queued ? "info" : "warning",
								});
							}}
						>
							<div className="font-heading text-[11px] uppercase tracking-[0.16em] text-foreground">
								{unit.name}
							</div>
							<div className="mt-1 font-body text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
								{unit.role}
							</div>
							<div className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-accent/85">
								{formatCost(unit.cost)}
							</div>
						</Button>
					))}
				</div>
			</div>
		);
	}

	if (action.id === "research") {
		const researchItems = Object.values(ALL_RESEARCH).filter(
			(research) => research.researchAt === type,
		);
		return (
			<div className="grid gap-2">
				{researchItems.slice(0, compact ? 2 : 3).map((research) => (
					<div
						key={research.id}
						className="rounded-md border border-accent/15 bg-background/25 px-3 py-2"
					>
						<div className="flex items-center justify-between gap-2">
							<div className="font-heading text-[11px] uppercase tracking-[0.16em] text-foreground">
								{research.name}
							</div>
							<div className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent/85">
								{formatCost(research.cost)}
							</div>
						</div>
						<div className="mt-1 font-body text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
							{research.effect}
						</div>
					</div>
				))}
			</div>
		);
	}

	return <ContextHint title={action.label} body={action.hint} />;
}

function ContextHint({ title, body }: { title: string; body: string }) {
	return (
		<div className="grid gap-1.5">
			<div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
				{title}
			</div>
			<p className="font-body text-[11px] uppercase tracking-[0.14em] leading-relaxed text-foreground/88">
				{body}
			</p>
		</div>
	);
}

function formatCost(cost: { fish?: number; timber?: number; salvage?: number }) {
	const parts: string[] = [];
	if ((cost.fish ?? 0) > 0) parts.push(`F${cost.fish}`);
	if ((cost.timber ?? 0) > 0) parts.push(`T${cost.timber}`);
	if ((cost.salvage ?? 0) > 0) parts.push(`S${cost.salvage}`);
	return parts.join(" • ") || "No cost";
}
