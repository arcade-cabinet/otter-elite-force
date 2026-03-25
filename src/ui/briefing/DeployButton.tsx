/**
 * DeployButton — Single CTA for mission deployment.
 *
 * "DEPLOY >>" with military emphasis styling.
 * Prominent, beveled, pulse animation on hover.
 */
import { Button } from "@/components/ui/button";

interface DeployButtonProps {
	onClick?: () => void;
	disabled?: boolean;
}

export function DeployButton({ onClick, disabled = false }: DeployButtonProps) {
	return (
		<Button
			type="button"
			onClick={onClick}
			disabled={disabled}
			variant="accent"
			size="lg"
			className="min-w-52 px-8"
		>
			DEPLOY &gt;&gt;
		</Button>
	);
}
