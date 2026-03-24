/**
 * PortraitDisplay — Large character portrait for briefings.
 *
 * Rendered large with spotlight vignette effect.
 * Uses the portraitId to load the compiled sprite PNG.
 * Placeholder: shows initials until sprites are compiled.
 */
import { cn } from "@/ui/lib/utils";

interface PortraitDisplayProps {
	portraitId: string;
	className?: string;
}

export function PortraitDisplay({ portraitId, className }: PortraitDisplayProps) {
	const initials = portraitId
		.replace(/_/g, " ")
		.split(" ")
		.map((w) => w[0]?.toUpperCase() ?? "")
		.join("");

	return (
		<div
			data-testid="portrait"
			className={cn(
				"portrait relative flex h-48 w-36 items-center justify-center",
				"border-2 border-border bg-card",
				"overflow-hidden",
				className,
			)}
		>
			{/* Spotlight vignette */}
			<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60" />

			{/* Placeholder — replaced with actual portrait sprite later */}
			<span className="relative z-10 font-heading text-3xl uppercase text-muted-foreground">
				{initials}
			</span>
		</div>
	);
}
