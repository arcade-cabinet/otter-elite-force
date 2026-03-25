/**
 * CommandButtons — Mobile command button strip.
 *
 * US-061: All interactive buttons enforce minimum 44x44px touch targets.
 * Bold labels with thick outlines for mobile readability.
 */
import { cn } from "@/ui/lib/utils";

interface CommandButton {
	id: string;
	label: string;
	shortcut?: string;
}

interface CommandButtonsProps {
	commands: CommandButton[];
	onCommand: (id: string) => void;
}

export function CommandButtons({ commands, onCommand }: CommandButtonsProps) {
	return (
		<div data-testid="command-buttons" className="flex gap-2 px-2 py-1">
			{commands.map((cmd) => (
				<button
					key={cmd.id}
					type="button"
					onClick={() => onCommand(cmd.id)}
					className={cn(
						"flex min-h-[44px] min-w-[44px] flex-col items-center justify-center",
						"rounded-none border-2 border-border bg-secondary px-3",
						"font-heading text-[10px] uppercase tracking-wider text-secondary-foreground",
						"active:border-accent active:text-accent",
					)}
				>
					<span>{cmd.label}</span>
				</button>
			))}
		</div>
	);
}
