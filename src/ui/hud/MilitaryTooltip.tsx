/**
 * MilitaryTooltip — Radix UI Tooltip with military theme styling (US-097).
 *
 * Wraps @radix-ui/react-tooltip with the project's dark stencil-header /
 * typewriter-body aesthetic. Shows unit name, cost, HP, damage, description
 * for train/build/research buttons.
 *
 * No tooltips on mobile (no hover) — the Radix tooltip already handles
 * this by requiring pointer hover events.
 */

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { cn } from "@/ui/lib/utils";

export interface TooltipData {
	name: string;
	cost?: string;
	hp?: number;
	damage?: number;
	time?: number;
	description?: string;
}

function formatTooltipContent(data: TooltipData): ReactNode {
	return (
		<div className="grid gap-1.5">
			<div className="font-heading text-[11px] uppercase tracking-[0.18em] text-foreground">
				{data.name}
			</div>
			<div className="flex flex-wrap gap-2">
				{data.cost ? (
					<span className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
						{data.cost}
					</span>
				) : null}
				{data.hp != null ? (
					<span className="font-mono text-[9px] uppercase tracking-[0.18em] text-foreground/80">
						HP {data.hp}
					</span>
				) : null}
				{data.damage != null && data.damage > 0 ? (
					<span className="font-mono text-[9px] uppercase tracking-[0.18em] text-destructive">
						DMG {data.damage}
					</span>
				) : null}
				{data.time != null ? (
					<span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
						{data.time}s
					</span>
				) : null}
			</div>
			{data.description ? (
				<p className="font-body text-[9px] uppercase tracking-[0.12em] leading-relaxed text-muted-foreground">
					{data.description}
				</p>
			) : null}
		</div>
	);
}

export function MilitaryTooltip({
	data,
	children,
	side = "top",
	delayDuration = 400,
}: {
	data: TooltipData;
	children: ReactNode;
	side?: "top" | "right" | "bottom" | "left";
	delayDuration?: number;
}) {
	return (
		<TooltipPrimitive.Provider delayDuration={delayDuration}>
			<TooltipPrimitive.Root>
				<TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
				<TooltipPrimitive.Portal>
					<TooltipPrimitive.Content
						side={side}
						sideOffset={6}
						className={cn(
							"z-50 max-w-xs overflow-hidden rounded-[2px] border border-accent/25",
							"bg-[linear-gradient(180deg,rgba(9,18,15,0.98),rgba(8,12,11,0.99))]",
							"px-3 py-2 shadow-[0_16px_32px_rgba(0,0,0,0.5)]",
							"animate-in fade-in-0 zoom-in-95",
							"data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
						)}
					>
						{formatTooltipContent(data)}
						<TooltipPrimitive.Arrow className="fill-[#09120f]" />
					</TooltipPrimitive.Content>
				</TooltipPrimitive.Portal>
			</TooltipPrimitive.Root>
		</TooltipPrimitive.Provider>
	);
}

/**
 * Convenience: wrap a simple text tooltip around any element.
 */
export function SimpleTooltip({
	label,
	children,
	side = "top",
}: {
	label: string;
	children: ReactNode;
	side?: "top" | "right" | "bottom" | "left";
}) {
	return (
		<TooltipPrimitive.Provider delayDuration={300}>
			<TooltipPrimitive.Root>
				<TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
				<TooltipPrimitive.Portal>
					<TooltipPrimitive.Content
						side={side}
						sideOffset={6}
						className={cn(
							"z-50 max-w-xs overflow-hidden rounded-[2px] border border-accent/25",
							"bg-[linear-gradient(180deg,rgba(9,18,15,0.98),rgba(8,12,11,0.99))]",
							"px-2.5 py-1.5 shadow-[0_12px_24px_rgba(0,0,0,0.45)]",
							"animate-in fade-in-0 zoom-in-95",
							"data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
						)}
					>
						<span className="font-body text-[9px] uppercase tracking-[0.14em] text-foreground">
							{label}
						</span>
						<TooltipPrimitive.Arrow className="fill-[#09120f]" />
					</TooltipPrimitive.Content>
				</TooltipPrimitive.Portal>
			</TooltipPrimitive.Root>
		</TooltipPrimitive.Provider>
	);
}
