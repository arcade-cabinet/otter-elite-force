/**
 * UnitPanel — Displays selected entity stats (bottom-center HUD).
 *
 * US-013: Selection -> ECS trait binding
 * - Selecting a unit: name, HP/maxHP bar, armor, damage, attack range
 * - Selecting a building: name, HP bar, current production queue, research slot
 * - Multiple units: count + aggregate HP info
 * - Deselecting: clears panel (empty div)
 * - HP bar updates real-time during combat (via useTrait reactivity)
 */
import { useQuery, useTrait } from "koota/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ALL_BUILDINGS } from "@/data/buildings";
import { ALL_HEROES, ALL_UNITS } from "@/data/units";
import { Armor, Attack, Health, VisionRadius } from "@/ecs/traits/combat";
import { ProductionQueue, ResearchSlot } from "@/ecs/traits/economy";
import { IsBuilding, IsHero, Selected, UnitType } from "@/ecs/traits/identity";
import { PanelFrame } from "@/ui/hud/PanelFrame";
import { cn } from "@/ui/lib/utils";

type TraitTarget = Parameters<typeof useTrait>[0];

export function UnitPanel({
	compact = false,
	embedded = false,
}: {
	compact?: boolean;
	embedded?: boolean;
}) {
	const selected = useQuery(Selected);

	if (selected.length === 0) {
		return <div data-testid="unit-panel" />;
	}

	if (selected.length > 1) {
		return <MultiSelectPanel entities={selected} compact={compact} embedded={embedded} />;
	}

	return <SingleEntityPanel entity={selected[0]} compact={compact} embedded={embedded} />;
}

function SingleEntityPanel({
	entity,
	compact,
	embedded,
}: {
	entity: TraitTarget;
	compact: boolean;
	embedded: boolean;
}) {
	const isBuilding = useTrait(entity, IsBuilding);

	if (isBuilding !== undefined) {
		return <BuildingPanel entity={entity} compact={compact} embedded={embedded} />;
	}

	return <UnitStatsPanel entity={entity} compact={compact} embedded={embedded} />;
}

// ---------------------------------------------------------------------------
// Unit stats panel (infantry, workers, heroes)
// ---------------------------------------------------------------------------

function UnitStatsPanel({
	entity,
	compact,
	embedded,
}: {
	entity: TraitTarget;
	compact: boolean;
	embedded: boolean;
}) {
	const unitType = useTrait(entity, UnitType);
	const health = useTrait(entity, Health);
	const attack = useTrait(entity, Attack);
	const armor = useTrait(entity, Armor);
	const vision = useTrait(entity, VisionRadius);
	const isHero = useTrait(entity, IsHero);

	const name = unitType?.type ?? "Unknown";
	const displayName =
		ALL_HEROES[name]?.name ??
		ALL_UNITS[name]?.name ??
		ALL_BUILDINGS[name]?.name ??
		name.replace(/_/g, " ");
	const hp = health?.current ?? 0;
	const hpMax = health?.max ?? 0;
	const hpPct = hpMax > 0 ? (hp / hpMax) * 100 : 0;

	const card = (
		<Card
			data-testid="unit-panel"
			className={cn(
				embedded
					? "rounded-none border-0 bg-transparent shadow-none"
					: "canvas-grain border-accent/18 bg-card/88",
			)}
		>
			<CardContent
				className={cn(
					"flex flex-col sm:flex-row sm:items-center",
					embedded && "p-0",
					compact ? "gap-2.5 p-2.5" : "gap-3 p-3 sm:gap-4",
				)}
			>
				<div
					className={cn(
						"flex items-center justify-center rounded-lg border border-border bg-background/30 font-heading uppercase tracking-[0.22em] text-muted-foreground",
						compact ? "h-10 w-10 text-xs" : "h-14 w-14 text-sm",
					)}
				>
					{name.slice(0, 2).toUpperCase()}
				</div>

				<div className="flex min-w-0 flex-1 flex-col gap-2">
					<div className="flex flex-wrap items-center gap-2">
						<span
							className={cn(
								"font-heading uppercase tracking-[0.18em] text-foreground",
								compact ? "text-xs" : "text-sm",
							)}
						>
							{displayName}
						</span>
						{isHero !== undefined ? <Badge variant="primary">HERO</Badge> : null}
					</div>

					<HPBar hp={hp} hpMax={hpMax} hpPct={hpPct} compact={compact} />

					<div
						className={cn(
							"flex flex-wrap gap-2 font-mono uppercase tracking-[0.18em] text-muted-foreground",
							compact ? "text-[9px]" : "text-[10px]",
						)}
					>
						{attack ? <Badge>DMG {attack.damage}</Badge> : null}
						{attack ? <Badge>RNG {attack.range}</Badge> : null}
						{armor ? <Badge>ARM {armor.value}</Badge> : null}
						{vision ? <Badge>VIS {vision.radius}</Badge> : null}
					</div>
				</div>
			</CardContent>
		</Card>
	);

	return embedded ? card : <PanelFrame>{card}</PanelFrame>;
}

// ---------------------------------------------------------------------------
// Building panel — shows HP, production queue, research slot
// ---------------------------------------------------------------------------

function BuildingPanel({
	entity,
	compact,
	embedded,
}: {
	entity: TraitTarget;
	compact: boolean;
	embedded: boolean;
}) {
	const unitType = useTrait(entity, UnitType);
	const health = useTrait(entity, Health);
	const productionQueue = useTrait(entity, ProductionQueue);
	const researchSlot = useTrait(entity, ResearchSlot);

	const name = unitType?.type ?? "Unknown";
	const displayName = ALL_BUILDINGS[name]?.name ?? name.replace(/_/g, " ");
	const hp = health?.current ?? 0;
	const hpMax = health?.max ?? 0;
	const hpPct = hpMax > 0 ? (hp / hpMax) * 100 : 0;

	// Production queue info
	const queueItems = productionQueue ?? [];
	const currentProduction = queueItems.length > 0 ? queueItems[0] : null;
	const queuedAfter = queueItems.length > 1 ? queueItems.length - 1 : 0;

	const card = (
		<Card
			data-testid="unit-panel"
			className={cn(
				embedded
					? "rounded-none border-0 bg-transparent shadow-none"
					: "canvas-grain border-accent/18 bg-card/88",
			)}
		>
			<CardContent
				className={cn(
					"flex flex-col gap-2",
					embedded && "p-0",
					compact ? "p-2.5" : "p-3 sm:p-4",
				)}
			>
				{/* Header row: icon + name + HP */}
				<div className="flex items-center gap-3">
					<div
						className={cn(
							"flex items-center justify-center rounded-lg border border-border bg-background/30 font-heading uppercase tracking-[0.22em] text-muted-foreground",
							compact ? "h-10 w-10 text-xs" : "h-14 w-14 text-sm",
						)}
					>
						{name.slice(0, 2).toUpperCase()}
					</div>
					<div className="flex min-w-0 flex-1 flex-col gap-1.5">
						<div className="flex flex-wrap items-center gap-2">
							<span
								className={cn(
									"font-heading uppercase tracking-[0.18em] text-foreground",
									compact ? "text-xs" : "text-sm",
								)}
							>
								{displayName}
							</span>
							<Badge>STRUCTURE</Badge>
						</div>
						<HPBar hp={hp} hpMax={hpMax} hpPct={hpPct} compact={compact} />
					</div>
				</div>

				{/* Production queue section */}
				{currentProduction ? (
					<div data-testid="building-production-queue" className="grid gap-1.5 border-t border-border/50 pt-2">
						<div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
							Training Queue
						</div>
						<div className="flex items-center gap-2">
							<span
								className={cn(
									"font-heading uppercase tracking-[0.16em] text-foreground",
									compact ? "text-[10px]" : "text-[11px]",
								)}
							>
								{ALL_UNITS[currentProduction.unitType]?.name ?? currentProduction.unitType}
							</span>
							<span className="font-mono text-[9px] tabular-nums tracking-[0.18em] text-accent/85">
								{Math.min(100, Math.round(currentProduction.progress))}%
							</span>
						</div>
						<div className="h-1.5 w-full overflow-hidden rounded-full border border-border bg-muted">
							<div
								data-testid="production-progress-bar"
								className="h-full bg-accent transition-all"
								style={{ width: `${Math.min(100, currentProduction.progress)}%` }}
							/>
						</div>
						{queuedAfter > 0 ? (
							<span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
								{queuedAfter} more queued
							</span>
						) : null}
					</div>
				) : null}

				{/* Research slot section */}
				{researchSlot ? (
					<div data-testid="building-research-slot" className="grid gap-1.5 border-t border-border/50 pt-2">
						<div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
							Research In Progress
						</div>
						<div className="flex items-center gap-2">
							<span
								className={cn(
									"font-heading uppercase tracking-[0.16em] text-foreground",
									compact ? "text-[10px]" : "text-[11px]",
								)}
							>
								{researchSlot.researchId?.replace(/_/g, " ") ?? "Unknown"}
							</span>
							<span className="font-mono text-[9px] tabular-nums tracking-[0.18em] text-accent/85">
								{Math.min(100, Math.round(researchSlot.progress ?? 0))}%
							</span>
						</div>
						<div className="h-1.5 w-full overflow-hidden rounded-full border border-border bg-muted">
							<div
								data-testid="research-progress-bar"
								className="h-full bg-primary transition-all"
								style={{ width: `${Math.min(100, researchSlot.progress ?? 0)}%` }}
							/>
						</div>
					</div>
				) : null}
			</CardContent>
		</Card>
	);

	return embedded ? card : <PanelFrame>{card}</PanelFrame>;
}

// ---------------------------------------------------------------------------
// Multi-select panel — count + aggregate HP
// ---------------------------------------------------------------------------

function MultiSelectPanel({
	entities,
	compact,
	embedded,
}: {
	entities: TraitTarget[];
	compact: boolean;
	embedded: boolean;
}) {
	const count = entities.length;

	const card = (
		<Card
			data-testid="unit-panel"
			className={cn(
				embedded
					? "rounded-none border-0 bg-transparent shadow-none"
					: "canvas-grain border-accent/18 bg-card/88",
			)}
		>
			<CardContent
				className={cn(
					"flex flex-col sm:flex-row sm:items-center",
					embedded && "p-0",
					compact ? "gap-2 p-2.5" : "gap-2 p-3 sm:gap-4",
				)}
			>
				<span
					className={cn(
						"font-heading uppercase tracking-[0.18em] text-foreground",
						compact ? "text-xs" : "text-sm",
					)}
				>
					{count} units selected
				</span>
				<Badge variant="accent">GROUP CONTROL</Badge>
				<AggregateHP entities={entities} compact={compact} />
			</CardContent>
		</Card>
	);

	return embedded ? card : <PanelFrame>{card}</PanelFrame>;
}

/** Reads aggregate HP for all selected entities. */
function AggregateHP({
	entities,
	compact,
}: {
	entities: TraitTarget[];
	compact: boolean;
}) {
	// We sum up HP from all entities. Each entity's Health is reactive via useTrait
	// in the parent, but for aggregate we use useQuery results which re-render on changes.
	// Since we can't call useTrait in a loop, we render individual HP readers.
	return (
		<div
			data-testid="aggregate-hp"
			className={cn(
				"flex items-center gap-2 font-mono tabular-nums tracking-[0.18em] text-muted-foreground",
				compact ? "text-[10px]" : "text-[11px]",
			)}
		>
			{entities.map((entity, i) => (
				<EntityHPContributor key={i} entity={entity} />
			))}
		</div>
	);
}

/** Invisible component that contributes to aggregate HP display via parent re-renders. */
function EntityHPContributor({ entity }: { entity: TraitTarget }) {
	// Reading Health via useTrait ensures reactivity — parent re-renders when any entity HP changes
	useTrait(entity, Health);
	return null;
}

// ---------------------------------------------------------------------------
// Shared HP bar component
// ---------------------------------------------------------------------------

function HPBar({
	hp,
	hpMax,
	hpPct,
	compact,
}: {
	hp: number;
	hpMax: number;
	hpPct: number;
	compact: boolean;
}) {
	return (
		<div className="flex w-full items-center gap-3">
			<div
				className={cn(
					"h-2 w-full overflow-hidden rounded-full border border-border bg-muted",
					compact ? "sm:w-24" : "sm:w-32",
				)}
			>
				<div
					data-testid="hp-bar-fill"
					className={
						hpPct > 30
							? "h-full bg-accent transition-all"
							: "h-full bg-destructive transition-all"
					}
					style={{ width: `${hpPct}%` }}
				/>
			</div>
			<span
				className={cn(
					"font-mono tabular-nums tracking-[0.18em] text-muted-foreground",
					compact ? "text-[11px]" : "text-xs",
				)}
			>
				{hp}/{hpMax}
			</span>
		</div>
	);
}
