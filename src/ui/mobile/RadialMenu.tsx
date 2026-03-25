/**
 * RadialMenu — Mobile context radial menu (long-press).
 *
 * Fan-out radial menu for contextual actions on mobile.
 * Opens on long-press, actions fan out in a semicircle.
 * Touch-friendly with 48px+ hit areas.
 */
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

export function RadialMenu({ actions, open, position, onAction, onClose }: RadialMenuProps) {
	if (!open) return null;

	const angleStep = Math.PI / Math.max(actions.length - 1, 1);
	const radius = 72;

	return (
		<div
			data-testid="radial-menu"
			className="fixed inset-0 z-50"
			onClick={onClose}
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			role="button"
			tabIndex={0}
		>
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
								"absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2",
								"items-center justify-center",
								"border-2 border-border bg-card",
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
		</div>
	);
}
