/**
 * CanteenScreen — Meta-progression hub (command-post theme).
 *
 * Permanent upgrades purchased with Supply Credits earned across missions.
 * Arsenal: muzzle velocity, armor plating, grenades.
 * Placeholder — will be expanded with full upgrade tree.
 */
import { useWorld } from "koota/react";
import { AppScreen } from "@/ecs/traits/state";
import { cn } from "@/ui/lib/utils";

interface Upgrade {
	id: string;
	name: string;
	description: string;
	cost: number;
}

const UPGRADES: Upgrade[] = [
	{
		id: "muzzle_velocity",
		name: "Muzzle Velocity I",
		description: "+10% projectile speed",
		cost: 100,
	},
	{
		id: "armor_plating",
		name: "Armor Plating I",
		description: "+1 armor for all units",
		cost: 150,
	},
	{ id: "grenade_belt", name: "Grenade Belt", description: "Unlock frag grenades", cost: 200 },
	{ id: "field_medic", name: "Field Medic Training", description: "+25% healing rate", cost: 175 },
	{
		id: "recon_optics",
		name: "Recon Optics",
		description: "+2 vision radius for scouts",
		cost: 125,
	},
];

export function CanteenScreen() {
	const world = useWorld();

	return (
		<div
			data-testid="canteen-screen"
			className={cn(
				"flex min-h-screen flex-col items-center gap-8 py-12",
				"bg-background text-foreground",
			)}
		>
			<h2 className="font-heading text-2xl uppercase tracking-widest text-primary">The Canteen</h2>
			<p className="font-body text-xs uppercase tracking-wider text-muted-foreground">
				Permanent upgrades for your campaign
			</p>

			<div className="grid w-full max-w-lg grid-cols-1 gap-3 px-6">
				{UPGRADES.map((upgrade) => (
					<button
						key={upgrade.id}
						type="button"
						className={cn(
							"flex items-center justify-between gap-4 px-4 py-3",
							"border-2 border-border bg-card text-left",
							"hover:border-accent",
						)}
					>
						<div className="flex flex-col gap-0.5">
							<span className="font-heading text-xs uppercase tracking-wider text-foreground">
								{upgrade.name}
							</span>
							<span className="font-body text-[10px] text-muted-foreground">
								{upgrade.description}
							</span>
						</div>
						<span className="font-mono text-xs tabular-nums text-accent">{upgrade.cost} SC</span>
					</button>
				))}
			</div>

			<button
				type="button"
				onClick={() => world.set(AppScreen, { screen: "menu" })}
				className={cn(
					"px-6 py-2 font-heading text-xs uppercase tracking-widest",
					"border-2 border-border bg-card text-card-foreground",
					"hover:border-primary hover:text-primary",
				)}
			>
				Back to HQ
			</button>
		</div>
	);
}
