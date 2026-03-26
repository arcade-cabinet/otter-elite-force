/**
 * BossHealthBar — Full-width HP bar for boss encounters.
 *
 * Renders at the top of the game viewport when a BossUnit entity exists.
 * Shows boss name, current phase name, red HP fill, and phase threshold markers.
 *
 * Reads BossUnit + Health traits from the first matching entity in the world.
 */

import type { Entity } from "koota";
import { useQuery, useTrait } from "koota/react";
import { BossUnit } from "@/ecs/traits/boss";
import { Health } from "@/ecs/traits/combat";
import { cn } from "@/ui/lib/utils";

export function BossHealthBar() {
	const bosses = useQuery(BossUnit, Health);
	const boss = bosses.length > 0 ? bosses[0] : null;

	if (!boss) return null;

	return <BossHealthBarInner entity={boss} />;
}

function BossHealthBarInner({ entity }: { entity: Entity }) {
	const boss = useTrait(entity, BossUnit);
	const health = useTrait(entity, Health);

	if (!boss || !health) return null;

	const hpPercent = Math.max(0, Math.min(100, (health.current / Math.max(health.max, 1)) * 100));
	const currentPhaseIndex = boss.currentPhase > 0 ? boss.currentPhase - 1 : 0;
	const phaseName = boss.phases[currentPhaseIndex]?.name ?? "---";

	return (
		<div
			role="status"
			aria-label={`Boss: ${boss.name}, HP ${Math.round(hpPercent)}%, Phase: ${phaseName}`}
			data-testid="boss-health-bar"
			className="absolute top-12 md:top-14 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-xl"
		>
			{/* Boss name + phase label */}
			<div className="flex items-center justify-between px-2 pb-0.5">
				<span
					className={cn(
						"font-mono text-xs md:text-sm font-bold uppercase tracking-[0.2em]",
						boss.enraged ? "text-red-400 animate-pulse" : "text-amber-300",
					)}
				>
					{boss.name}
				</span>
				<span className="font-mono text-[10px] md:text-xs uppercase tracking-wider text-slate-400">
					{phaseName}
					{boss.enraged ? " — ENRAGED" : ""}
				</span>
			</div>

			{/* HP bar container */}
			<div className="relative h-4 md:h-5 bg-slate-900/90 border-2 border-slate-600 shadow-[0_0_8px_rgba(239,68,68,0.25)]">
				{/* Red fill */}
				<div
					className="absolute inset-0 bg-red-600 transition-all duration-300 origin-left"
					style={{ width: `${hpPercent}%` }}
				/>

				{/* Phase threshold markers */}
				{boss.phases.map((phase, i) => (
					<div
						key={phase.name}
						className={cn(
							"absolute top-0 h-full w-px",
							boss.currentPhase > i + 1 ? "bg-slate-500/40" : "bg-white/60",
						)}
						style={{ left: `${100 - phase.hpThreshold}%` }}
						title={`Phase: ${phase.name} (${phase.hpThreshold}% HP)`}
					/>
				))}

				{/* HP text overlay */}
				<div className="absolute inset-0 flex items-center justify-center">
					<span className="font-mono text-[10px] md:text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
						{health.current} / {health.max}
					</span>
				</div>
			</div>
		</div>
	);
}
