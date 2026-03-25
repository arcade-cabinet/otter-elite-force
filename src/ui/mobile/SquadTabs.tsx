/**
 * SquadTabs — Mobile squad selection tabs.
 *
 * US-061: Minimum 44px touch targets for tab buttons.
 * Horizontal tab bar for switching between squad groups on mobile.
 * Manila folder tab aesthetic.
 */
import { cn } from "@/ui/lib/utils";

interface SquadTab {
	id: string;
	label: string;
	count: number;
}

interface SquadTabsProps {
	tabs: SquadTab[];
	activeTab: string;
	onSelect: (id: string) => void;
}

export function SquadTabs({ tabs, activeTab, onSelect }: SquadTabsProps) {
	return (
		<div data-testid="squad-tabs" className="flex gap-1 overflow-x-auto px-2 py-1">
			{tabs.map((tab) => (
				<button
					key={tab.id}
					type="button"
					onClick={() => onSelect(tab.id)}
					className={cn(
						"flex min-h-[44px] min-w-[48px] items-center gap-1 px-3 py-2",
						"font-heading text-xs uppercase tracking-wider",
						"rounded-t-lg border-2 border-b-0",
						activeTab === tab.id
							? "border-accent bg-card text-accent"
							: "border-border bg-muted text-muted-foreground",
					)}
				>
					<span>{tab.label}</span>
					<span className="font-mono text-[10px]">({tab.count})</span>
				</button>
			))}
		</div>
	);
}
