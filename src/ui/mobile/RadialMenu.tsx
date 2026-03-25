/**
 * RadialMenu — Mobile context radial menu (long-press).
 *
 * US-060: Long-press triggers radial command menu after 500ms.
 * Actions fan out in a semicircle above the press point.
 * Touch-friendly with 48px+ hit areas (exceeds 44px minimum from US-061).
 *
 * Ground long-press actions: Move, Attack-Move, Patrol, Rally
 * Unit long-press actions: unit-specific options
 */
import type { ReactNode } from "react";
import { cn } from "@/ui/lib/utils";

interface RadialAction {
	id: string;
	label: string;
}

interface RadialMenuProps {
	actions: RadialAction[];
	open: boolean;
	position: { x: number; y: number };
	onAction: (id: string) => void;
	onClose: () => void;
}

/** Default ground actions for US-060 radial menu. */
export const GROUND_RADIAL_ACTIONS: RadialAction[] = [
	{ id: "move", label: "Move" },
	{ id: "attack-move", label: "Atk Move" },
	{ id: "patrol", label: "Patrol" },
	{ id: "rally", label: "Rally" },
];

/** Default unit actions for US-060 radial menu. */
export const UNIT_RADIAL_ACTIONS: RadialAction[] = [
	{ id: "move", label: "Move" },
	{ id: "stop", label: "Stop" },
	{ id: "attack", label: "Attack" },
	{ id: "hold", label: "Hold" },
];

export function RadialMenu({ actions, open, position, onAction, onClose }: RadialMenuProps) {
	if (!open) return null;

	const angleStep = Math.PI / Math.max(actions.length - 1, 1);
	const radius = 72;

	return (
		<RadialBackdrop onClose={onClose}>
			<div className="absolute" style={{ left: position.x, top: position.y }}>
				{actions.map((action, i) => {
					const angle = Math.PI + i * angleStep;
					const x = Math.cos(angle) * radius;
					const y = Math.sin(angle) * radius;

					return (
						<button
							key={action.id}
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onAction(action.id);
							}}
							className={cn(
								"absolute flex min-h-[48px] min-w-[48px] -translate-x-1/2 -translate-y-1/2",
								"items-center justify-center rounded-lg px-2",
								"border-2 border-border bg-card shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
								"font-heading text-[9px] uppercase tracking-wider text-card-foreground",
								"active:border-accent active:text-accent",
							)}
							style={{
								left: x,
								top: y,
							}}
						>
							{action.label}
						</button>
					);
				})}
			</div>
		</RadialBackdrop>
	);
}

/** Full-screen dismiss backdrop for the radial menu. */
function RadialBackdrop({ onClose, children }: { onClose: () => void; children: ReactNode }) {
	return (
		<button
			type="button"
			data-testid="radial-menu"
			className="fixed inset-0 z-50 cursor-default bg-transparent"
			onClick={onClose}
		>
			{children}
		</button>
	);
}
