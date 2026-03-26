/**
 * BossHealthBar — Full-width HP bar for boss encounters.
 *
 * Shows boss name and HP bar when a boss is present. Color gradient
 * from green to red as HP drops. Uses SolidJS Show for conditional rendering.
 *
 * Reads from solidBridge boss() signal.
 */

import { Show, createMemo, type Component } from "solid-js";
import type { SolidBridgeAccessors } from "@/engine/bridge/solidBridge";

export const BossHealthBar: Component<{ bridge: SolidBridgeAccessors }> = (props) => {
	const boss = () => props.bridge.boss();

	const hpPercent = createMemo(() => {
		const b = boss();
		if (!b) return 0;
		return Math.max(0, Math.min(100, (b.currentHp / Math.max(b.maxHp, 1)) * 100));
	});

	const barColor = createMemo(() => {
		const pct = hpPercent();
		if (pct > 60) return "bg-green-500";
		if (pct > 30) return "bg-amber-500";
		return "bg-red-500";
	});

	return (
		<Show when={boss()}>
			{(b) => (
				<div
					role="status"
					aria-label={`Boss: ${b().name}, HP ${Math.round(hpPercent())}%`}
					data-testid="boss-health-bar"
					class="w-[90%] max-w-xl"
				>
					{/* Boss name */}
					<div class="flex items-center justify-between px-2 pb-0.5">
						<span class="font-mono text-xs font-bold uppercase tracking-[0.2em] text-amber-300 md:text-sm">
							{b().name}
						</span>
						<span class="font-mono text-[10px] uppercase tracking-wider text-slate-400 md:text-xs">
							{b().currentHp} / {b().maxHp}
						</span>
					</div>

					{/* HP bar container */}
					<div class="relative h-4 border-2 border-slate-600 bg-slate-900/90 shadow-[0_0_8px_rgba(239,68,68,0.25)] md:h-5">
						{/* HP fill */}
						<div
							class={`absolute inset-0 origin-left transition-all duration-300 ${barColor()}`}
							style={{ width: `${hpPercent()}%` }}
						/>

						{/* HP text overlay */}
						<div class="absolute inset-0 flex items-center justify-center">
							<span class="font-mono text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] md:text-xs">
								{Math.round(hpPercent())}%
							</span>
						</div>
					</div>
				</div>
			)}
		</Show>
	);
};
