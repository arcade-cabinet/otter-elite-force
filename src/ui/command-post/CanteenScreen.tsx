/**
 * CanteenScreen — Meta-progression hub (command-post theme).
 *
 * Permanent upgrades purchased with Supply Credits earned across missions.
 * Arsenal: muzzle velocity, armor plating, grenades.
 */
import { useWorld } from "koota/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppScreen } from "@/ecs/traits/state";
import { CommandPostShell, ShellPanel } from "@/ui/layout/shells";
import { cn } from "@/ui/lib/utils";

interface Upgrade {
	id: string;
	name: string;
	description: string;
	cost: number;
}

const UPGRADES: Upgrade[] = [
	{ id: "muzzle_velocity", name: "Muzzle Velocity I", description: "+10% projectile speed", cost: 100 },
	{ id: "armor_plating", name: "Armor Plating I", description: "+1 armor for all units", cost: 150 },
	{ id: "grenade_belt", name: "Grenade Belt", description: "Unlock frag grenades", cost: 200 },
	{ id: "field_medic", name: "Field Medic Training", description: "+25% healing rate", cost: 175 },
	{ id: "recon_optics", name: "Recon Optics", description: "+2 vision radius for scouts", cost: 125 },
];

export function CanteenScreen() {
	const world = useWorld();
	const totalCost = UPGRADES.reduce((sum, upgrade) => sum + upgrade.cost, 0);

	return (
		<CommandPostShell
			title="The Canteen"
			subtitle="Permanent campaign upgrades live here: a meta-progression armory dressed like a field ledger, not a placeholder menu."
			meta={
				<div className="flex flex-wrap gap-2">
					<Badge variant="primary">5 UPGRADE STUBS</Badge>
					<Badge variant="accent">{totalCost} SC TOTAL</Badge>
				</div>
			}
			footer={
				<Button variant="ghost" onClick={() => world.set(AppScreen, { screen: "menu" })}>
					Back to HQ
				</Button>
			}
		>
			<div data-testid="canteen-screen" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
				<ShellPanel title="Arsenal Ledger" description="These are still stubs mechanically, but the visual treatment now matches the command-post art direction.">
					<div className="grid gap-3">
						{UPGRADES.map((upgrade) => (
							<button
								key={upgrade.id}
								type="button"
								className={cn(
									"flex items-center justify-between gap-4 rounded-lg border border-border bg-card/75 px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all",
									"hover:border-accent hover:-translate-y-0.5 hover:bg-card",
								)}
							>
								<div className="flex flex-col gap-1">
									<span className="font-heading text-xs uppercase tracking-[0.2em] text-foreground">{upgrade.name}</span>
									<span className="font-body text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{upgrade.description}</span>
								</div>
								<Badge variant="accent">{upgrade.cost} SC</Badge>
							</button>
						))}
					</div>
				</ShellPanel>

				<ShellPanel title="Mess Hall Notes" description="Permanent progression should feel grounded in supply discipline, not arcade vending-machine chrome.">
					<div className="grid gap-3">
						<div className="rounded-lg border border-border/70 bg-background/20 p-4">
							<div className="font-heading text-xs uppercase tracking-[0.2em] text-primary">Supply Credits</div>
							<p className="mt-2 font-body text-xs uppercase tracking-[0.14em] leading-relaxed text-muted-foreground">Spend credits on permanent upgrades that live outside any single mission run.</p>
						</div>
						<div className="rounded-lg border border-border/70 bg-background/20 p-4">
							<div className="font-heading text-xs uppercase tracking-[0.2em] text-accent">Design Goal</div>
							<p className="mt-2 font-body text-xs uppercase tracking-[0.14em] leading-relaxed text-muted-foreground">Keep the screen feeling like a riveted field ledger rather than a flat list of buttons.</p>
						</div>
					</div>
				</ShellPanel>
			</div>
		</CommandPostShell>
	);
}
