/**
 * Minimap — Phosphor-green radar display (bottom-left HUD).
 *
 * Renders a CRT-style radar grid with unit pips. In this initial
 * implementation it shows a placeholder canvas area styled to match
 * the tactical theme. Full canvas rendering will be wired to
 * Phaser's camera system later.
 */
import { cn } from "@/ui/lib/utils";

export function Minimap() {
	return (
		<div
			data-testid="minimap"
			className={cn("relative h-40 w-40 overflow-hidden", "border-2 border-border bg-background")}
		>
			{/* CRT grid overlay */}
			<div className="absolute inset-0 opacity-20">
				<div className="grid h-full w-full grid-cols-4 grid-rows-4">
					{Array.from({ length: 16 }).map((_, i) => (
						<div key={i} className="border border-accent/20" />
					))}
				</div>
			</div>
			{/* Radar sweep placeholder */}
			<div className="absolute inset-0 flex items-center justify-center">
				<span className="text-xs uppercase tracking-widest text-accent/40">RADAR</span>
			</div>
		</div>
	);
}
