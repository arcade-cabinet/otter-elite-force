/**
 * MainMenu — Game loader interface (command-post theme).
 *
 * Campaign Command Interface with:
 *   - "New Deployment" (always) → difficulty selection
 *   - "Continue" (only when save exists)
 *   - "Canteen" (always) → meta-progression hub
 *   - "Settings" (always)
 *
 * NO level select. NO mission list. This is a game loader, not a level picker.
 */
import { useState } from "react";
import { useTrait, useWorld } from "koota/react";
import { CampaignProgress, AppScreen } from "@/ecs/traits/state";
import { cn } from "@/ui/lib/utils";

type MenuView = "main" | "difficulty";

export function MainMenu() {
	const world = useWorld();
	const campaign = useTrait(world, CampaignProgress);
	const [view, setView] = useState<MenuView>("main");

	const hasSave =
		campaign !== undefined &&
		campaign.missions !== undefined &&
		Object.keys(campaign.missions).length > 0;

	if (view === "difficulty") {
		return <DifficultySelect onBack={() => setView("main")} />;
	}

	return (
		<div
			data-testid="main-menu"
			className={cn(
				"flex min-h-screen flex-col items-center justify-center gap-8",
				"bg-background text-foreground",
			)}
		>
			{/* Title */}
			<h1 className="font-heading text-4xl uppercase tracking-widest text-primary">
				Otter Elite Force
			</h1>
			<p className="font-body text-sm uppercase tracking-wider text-muted-foreground">
				Defend the River. Fear the Clam.
			</p>

			{/* Menu buttons */}
			<nav className="flex flex-col gap-3">
				<MenuButton onClick={() => setView("difficulty")}>New Deployment</MenuButton>

				{hasSave && (
					<MenuButton onClick={() => world.set(AppScreen, { screen: "campaign" })}>
						Continue
					</MenuButton>
				)}

				<MenuButton onClick={() => world.set(AppScreen, { screen: "campaign" })}>
					Canteen
				</MenuButton>

				<MenuButton onClick={() => world.set(AppScreen, { screen: "settings" })}>
					Settings
				</MenuButton>
			</nav>
		</div>
	);
}

function DifficultySelect({ onBack }: { onBack: () => void }) {
	const world = useWorld();

	const select = (difficulty: string) => {
		world.set(CampaignProgress, {
			missions: {},
			currentMission: "mission_1",
			difficulty,
		});
		world.set(AppScreen, { screen: "campaign" });
	};

	return (
		<div
			data-testid="difficulty-select"
			className={cn(
				"flex min-h-screen flex-col items-center justify-center gap-8",
				"bg-background text-foreground",
			)}
		>
			<h2 className="font-heading text-2xl uppercase tracking-widest text-primary">
				Select Difficulty
			</h2>
			<p className="max-w-md text-center font-body text-xs uppercase tracking-wider text-muted-foreground">
				Once committed to higher difficulty, there is no going back.
			</p>

			<div className="flex flex-col gap-3">
				<DifficultyOption
					name="Support"
					description="Supply drops anywhere. Extract at any coordinate."
					onClick={() => select("support")}
				/>
				<DifficultyOption
					name="Tactical"
					description="LZ supply drops only. 'The Fall' at 30% HP."
					onClick={() => select("tactical")}
				/>
				<DifficultyOption
					name="Elite"
					description="LZ only. Permadeath. No second chances."
					onClick={() => select("elite")}
				/>
			</div>

			<button
				type="button"
				onClick={onBack}
				className="font-body text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
			>
				Back
			</button>
		</div>
	);
}

function DifficultyOption({
	name,
	description,
	onClick,
}: {
	name: string;
	description: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex flex-col items-start gap-1 px-6 py-3",
				"border-2 border-border bg-card text-left",
				"hover:border-accent hover:text-accent",
				"active:translate-y-px",
			)}
		>
			<span className="font-heading text-sm uppercase tracking-wider">{name}</span>
			<span className="font-body text-xs text-muted-foreground">{description}</span>
		</button>
	);
}

function MenuButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"w-64 px-6 py-3 text-center",
				"font-heading text-sm uppercase tracking-widest",
				"border-2 border-border bg-card text-card-foreground",
				"hover:border-primary hover:text-primary",
				"active:translate-y-px active:shadow-inner",
			)}
		>
			{children}
		</button>
	);
}
