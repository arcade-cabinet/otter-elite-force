/**
 * CommandButtons — Mobile command button strip.
 *
 * Large, touch-friendly (56px) command buttons for mobile HUD.
 * Bold Lyra-style icons. Thick outlines for mobile readability.
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
						"flex h-14 w-14 flex-col items-center justify-center",
						"border-2 border-border bg-secondary",
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
