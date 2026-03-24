/**
 * DeployButton — Single CTA for mission deployment.
 *
 * "DEPLOY >>" with military emphasis styling.
 * Prominent, beveled, pulse animation on hover.
 */
import { cn } from "@/ui/lib/utils";

interface DeployButtonProps {
	onClick?: () => void;
	disabled?: boolean;
}

export function DeployButton({ onClick, disabled = false }: DeployButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"px-10 py-3",
				"font-heading text-lg uppercase tracking-[0.3em]",
				"border-2 border-accent bg-accent/10 text-accent",
				"hover:bg-accent/20",
				"active:translate-y-px active:shadow-inner",
				"disabled:cursor-not-allowed disabled:opacity-40",
			)}
		>
			DEPLOY &gt;&gt;
		</button>
	);
}
