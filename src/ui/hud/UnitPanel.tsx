/**
 * UnitPanel — Displays selected unit stats (bottom-center HUD).
 *
 * Shows portrait placeholder, name, HP bar, armor, damage, range, speed.
 * For multi-select: shows count of selected units.
 * For heroes: indicates hero status.
 * Hidden when nothing is selected.
 */
import { useQuery, useTrait } from "koota/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ALL_BUILDINGS } from "@/data/buildings";
import { ALL_HEROES, ALL_UNITS } from "@/data/units";
import { Armor, Attack, Health, VisionRadius } from "@/ecs/traits/combat";
import { IsHero, Selected, UnitType } from "@/ecs/traits/identity";
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
		return <MultiSelectPanel count={selected.length} compact={compact} embedded={embedded} />;
	}

	return <SingleUnitPanel entity={selected[0]} compact={compact} embedded={embedded} />;
}

function SingleUnitPanel({
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

	return (
		<Card
			data-testid="unit-panel"
			className={cn(
				embedded
					? "rounded-none border-0 bg-transparent shadow-none"
					: "border-accent/18 bg-card/88",
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

					<div className="flex w-full items-center gap-3">
						<div
							className={cn(
								"h-2 w-full overflow-hidden rounded-full border border-border bg-muted",
								compact ? "sm:w-24" : "sm:w-32",
							)}
						>
							<div
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
}

function MultiSelectPanel({
	count,
	compact,
	embedded,
}: {
	count: number;
	compact: boolean;
	embedded: boolean;
}) {
	return (
		<Card
			data-testid="unit-panel"
			className={cn(
				embedded
					? "rounded-none border-0 bg-transparent shadow-none"
					: "border-accent/18 bg-card/88",
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
			</CardContent>
		</Card>
	);
}
