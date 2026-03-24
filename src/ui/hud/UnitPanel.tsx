/**
 * UnitPanel — Displays selected unit stats (bottom-center HUD).
 *
 * Shows portrait placeholder, name, HP bar, armor, damage, range, speed.
 * For multi-select: shows count of selected units.
 * For heroes: indicates hero status.
 * Hidden when nothing is selected.
 */
import { useQuery, useTrait } from "koota/react";
import { UnitType, Selected, IsHero } from "@/ecs/traits/identity";
import { Health, Attack, Armor } from "@/ecs/traits/combat";
import { cn } from "@/ui/lib/utils";

export function UnitPanel() {
	const selected = useQuery(Selected);

	if (selected.length === 0) {
		return <div data-testid="unit-panel" />;
	}

	if (selected.length > 1) {
		return <MultiSelectPanel count={selected.length} />;
	}

	return <SingleUnitPanel entity={selected[0]} />;
}

function SingleUnitPanel({ entity }: { entity: any }) {
	const unitType = useTrait(entity, UnitType);
	const health = useTrait(entity, Health);
	const attack = useTrait(entity, Attack);
	const armor = useTrait(entity, Armor);
	const isHero = useTrait(entity, IsHero);

	const name = unitType?.type ?? "Unknown";
	const displayName = name.replace(/_/g, " ");
	const hp = health?.current ?? 0;
	const hpMax = health?.max ?? 0;
	const hpPct = hpMax > 0 ? (hp / hpMax) * 100 : 0;

	return (
		<div
			data-testid="unit-panel"
			className={cn("flex items-center gap-4 px-4 py-2", "border-t-2 border-border bg-card")}
		>
			{/* Portrait placeholder */}
			<div className="flex h-12 w-12 items-center justify-center border border-border bg-muted text-xs uppercase text-muted-foreground">
				{name.slice(0, 2).toUpperCase()}
			</div>

			<div className="flex flex-col gap-1">
				{/* Name + hero badge */}
				<span className="font-heading text-sm uppercase tracking-wide text-foreground">
					{isHero !== undefined ? `${displayName}` : displayName}
				</span>

				{/* HP bar */}
				<div className="flex items-center gap-2">
					<div className="h-2 w-24 overflow-hidden border border-border bg-muted">
						<div
							className={cn("h-full transition-all", hpPct > 30 ? "bg-accent" : "bg-destructive")}
							style={{ width: `${hpPct}%` }}
						/>
					</div>
					<span className="font-mono text-xs tabular-nums text-muted-foreground">
						{hp}/{hpMax}
					</span>
				</div>

				{/* Stats row */}
				<div className="flex gap-3 font-mono text-xs text-muted-foreground">
					{attack && <span>DMG {attack.damage}</span>}
					{armor && <span>ARM {armor.value}</span>}
				</div>
			</div>
		</div>
	);
}

function MultiSelectPanel({ count }: { count: number }) {
	return (
		<div
			data-testid="unit-panel"
			className={cn("flex items-center gap-4 px-4 py-2", "border-t-2 border-border bg-card")}
		>
			<span className="font-heading text-sm uppercase tracking-wide text-foreground">
				{count} UNITS SELECTED
			</span>
		</div>
	);
}
