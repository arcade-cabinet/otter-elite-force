/**
 * MilitaryTooltip -- Hover tooltip with military theme styling.
 *
 * Shows unit name, cost, HP, damage, armor, speed, and description
 * for any hovered button/unit/building. Uses createSignal for position
 * tracking, rendered as an absolute-positioned overlay near the cursor.
 *
 * SolidJS replacement for the old Radix UI tooltip. Pure CSS positioning
 * with no external tooltip library needed.
 */

import { createSignal, type JSX, onCleanup, type ParentComponent, Show } from "solid-js";

export interface TooltipData {
	name: string;
	cost?: string;
	hp?: number;
	damage?: number;
	armor?: number;
	speed?: number;
	time?: number;
	description?: string;
}

const TOOLTIP_OFFSET_X = 12;
const TOOLTIP_OFFSET_Y = 16;

export const MilitaryTooltip: ParentComponent<{
	data: TooltipData;
	/** Preferred placement side (default: "top") */
	side?: "top" | "right" | "bottom" | "left";
}> = (props) => {
	const [visible, setVisible] = createSignal(false);
	const [position, setPosition] = createSignal({ x: 0, y: 0 });
	let triggerRef: HTMLDivElement | undefined;

	const onPointerEnter = (e: PointerEvent) => {
		setPosition({ x: e.clientX, y: e.clientY });
		setVisible(true);
	};

	const onPointerMove = (e: PointerEvent) => {
		setPosition({ x: e.clientX, y: e.clientY });
	};

	const onPointerLeave = () => {
		setVisible(false);
	};

	// Clean up on unmount
	onCleanup(() => {
		setVisible(false);
	});

	const tooltipStyle = (): JSX.CSSProperties => {
		const pos = position();
		const side = props.side ?? "top";

		let x = pos.x;
		let y = pos.y;

		if (side === "top") {
			x += TOOLTIP_OFFSET_X;
			y -= TOOLTIP_OFFSET_Y;
		} else if (side === "bottom") {
			x += TOOLTIP_OFFSET_X;
			y += TOOLTIP_OFFSET_Y;
		} else if (side === "left") {
			x -= TOOLTIP_OFFSET_X;
			y -= TOOLTIP_OFFSET_Y / 2;
		} else {
			x += TOOLTIP_OFFSET_X;
			y -= TOOLTIP_OFFSET_Y / 2;
		}

		return {
			position: "fixed",
			left: `${x}px`,
			top: `${y}px`,
			transform: side === "top" ? "translateY(-100%)" : "none",
			"z-index": "9999",
			"pointer-events": "none",
		};
	};

	return (
		<div
			ref={triggerRef}
			onPointerEnter={onPointerEnter}
			onPointerMove={onPointerMove}
			onPointerLeave={onPointerLeave}
			class="inline-block"
		>
			{props.children}

			<Show when={visible()}>
				<div style={tooltipStyle()}>
					<div class="max-w-xs overflow-hidden rounded-[2px] border border-green-500/25 bg-[linear-gradient(180deg,rgba(9,18,15,0.98),rgba(8,12,11,0.99))] px-3 py-2 shadow-[0_16px_32px_rgba(0,0,0,0.5)]">
						<div class="grid gap-1.5">
							{/* Name */}
							<div class="font-heading text-[11px] uppercase tracking-[0.18em] text-slate-100">
								{props.data.name}
							</div>

							{/* Stat badges row */}
							<div class="flex flex-wrap gap-2">
								<Show when={props.data.cost}>
									<span class="font-mono text-[9px] uppercase tracking-[0.18em] text-green-400">
										{props.data.cost}
									</span>
								</Show>
								<Show when={props.data.hp != null}>
									<span class="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-300">
										HP {props.data.hp}
									</span>
								</Show>
								<Show when={props.data.damage != null && props.data.damage > 0}>
									<span class="font-mono text-[9px] uppercase tracking-[0.18em] text-red-400">
										DMG {props.data.damage}
									</span>
								</Show>
								<Show when={props.data.armor != null && props.data.armor > 0}>
									<span class="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-400">
										ARM {props.data.armor}
									</span>
								</Show>
								<Show when={props.data.speed != null && props.data.speed > 0}>
									<span class="font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-400">
										SPD {props.data.speed}
									</span>
								</Show>
								<Show when={props.data.time != null}>
									<span class="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">
										{props.data.time}s
									</span>
								</Show>
							</div>

							{/* Description */}
							<Show when={props.data.description}>
								<p class="font-body text-[9px] uppercase tracking-[0.12em] leading-relaxed text-slate-400">
									{props.data.description}
								</p>
							</Show>
						</div>
					</div>
				</div>
			</Show>
		</div>
	);
};

/**
 * SimpleTooltip -- wrap a plain text label tooltip around any element.
 */
export const SimpleTooltip: ParentComponent<{
	label: string;
	side?: "top" | "right" | "bottom" | "left";
}> = (props) => {
	return (
		<MilitaryTooltip data={{ name: props.label }} side={props.side}>
			{props.children}
		</MilitaryTooltip>
	);
};
