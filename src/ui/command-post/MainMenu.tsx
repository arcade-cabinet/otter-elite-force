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
import { useState, type ReactNode } from "react";
import { useTrait, useWorld } from "koota/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CampaignProgress, AppScreen } from "@/ecs/traits/state";
import { CommandPostShell, ShellPanel } from "@/ui/layout/shells";
import { cn } from "@/ui/lib/utils";

type MenuView = "main" | "difficulty";

const DIFFICULTY_OPTIONS = [
	{
		id: "support",
		name: "Support",
		description: "Forgiving economy and softer enemy pressure for learning the campaign.",
		notes: ["Most forgiving mode", "Fastest path to field readiness"],
	},
	{
		id: "tactical",
		name: "Tactical",
		description: "Standard resource pressure and balanced enemy response across the operation chain.",
		notes: ["Campaign default", "Balanced mission pacing"],
	},
	{
		id: "elite",
		name: "Elite",
		description: "Harsh attrition, tighter margins, and no downgrade path once committed.",
		notes: ["Escalation only", "For hardened marsh veterans"],
	},
] as const;

export function MainMenu() {
	const world = useWorld();
	const campaign = useTrait(world, CampaignProgress);
	const [view, setView] = useState<MenuView>("main");

	const hasSave =
		campaign !== undefined &&
		campaign.missions !== undefined &&
		Object.keys(campaign.missions).length > 0;

	const completedMissions = Object.values(campaign?.missions ?? {}).filter(
		(entry) => entry.status === "completed",
	).length;
	const currentDifficulty = campaign?.difficulty ?? "support";

	return (
		<CommandPostShell
			title="OTTER ELITE FORCE"
			subtitle="Lead a scripted river-jungle campaign through briefings, rescues, and hard-fought operations built to read clearly on phone, tablet, and desktop."
			meta={
				<div className="flex flex-wrap items-center justify-end gap-2">
					<Badge variant="primary">CAMPAIGN OPERATIONS</Badge>
					<Badge variant="accent">{completedMissions} MISSIONS COMPLETE</Badge>
				</div>
			}
		>
			<div data-testid="main-menu" className="command-post-main grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
				<ShellPanel
					title={view === "difficulty" ? "New Deployment" : "Campaign Loader"}
					description={
						view === "difficulty"
							? "Select a doctrine. Difficulty can escalate upward, never downward."
								: "Start a new campaign, continue the current operation chain, or review field settings without burying the critical actions."
					}
				>
					{view === "difficulty" ? (
						<DifficultySelect onBack={() => setView("main")} />
					) : (
							<div className="grid gap-4">
								<div className="rounded-lg border border-border/70 bg-background/18 p-3">
									<div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
											Command Routing
									</div>
									<p className="mt-2 font-body text-[11px] uppercase tracking-[0.14em] leading-relaxed text-muted-foreground">
											Pick the next operation, lock doctrine, and move into the briefing chain without drowning the screen in filler.
									</p>
								</div>
								<nav className="flex flex-col gap-3">
									<MenuButton onClick={() => setView("difficulty")}>New Deployment</MenuButton>
							{hasSave ? (
								<MenuButton
									onClick={() =>
										world.set(AppScreen, {
											screen: campaign?.currentMission ? "briefing" : "campaign",
										})
									}
								>
										Continue Campaign
								</MenuButton>
							) : null}
							<MenuButton onClick={() => world.set(AppScreen, { screen: "canteen" })}>Canteen</MenuButton>
							<MenuButton onClick={() => world.set(AppScreen, { screen: "settings" })}>Settings</MenuButton>
								</nav>
								<div className="grid gap-2 rounded-lg border border-primary/20 bg-primary/8 p-3">
									<div className="flex items-center justify-between gap-3">
										<span className="font-heading text-xs uppercase tracking-[0.22em] text-primary">
												Task Force Status
										</span>
											<Badge variant="primary">DOCTRINE {currentDifficulty.toUpperCase()}</Badge>
									</div>
									<div className="grid gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
											<div className="flex items-center justify-between"><span>Chain of Command</span><span>BUBBLES / WHISKERS</span></div>
											<div className="flex items-center justify-between"><span>Briefing Net</span><span>FOXHOUND</span></div>
										<div className="flex items-center justify-between"><span>Doctrine Lock</span><span>ACTIVE</span></div>
									</div>
								</div>
							</div>
					)}
				</ShellPanel>

				<div className="grid gap-6">
					<ShellPanel
						title="Operational Doctrine"
							description="The command-post layer should feel like stamped orders, field reports, and a clean route into the next mission briefing."
					>
							<div className="mb-3 flex flex-wrap items-center gap-2">
								<Badge>CAMPAIGN LOADER</Badge>
									<Badge variant="primary">MISSION BRIEFINGS</Badge>
									<Badge variant="accent">TACTICAL CLARITY</Badge>
							</div>
							<div className="grid gap-3 md:grid-cols-3">
								<IntelCard label="Theater" value="Copper-Silt Reach" detail="Sequential operations move from beachheads and prison camps to depots, strongholds, and the final offensive." />
							<IntelCard label="Current Save" value={hasSave ? "Campaign Active" : "No Save"} detail={hasSave ? `${completedMissions} sectors liberated` : "Begin a new deployment to establish your foothold."} />
							<IntelCard label="Doctrine" value={currentDifficulty.toUpperCase()} detail="Escalation only. Difficulty cannot be lowered once increased." />
						</div>
							<div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
								<div className="rounded-lg border border-border/70 bg-background/18 p-4">
									<div className="font-heading text-xs uppercase tracking-[0.22em] text-primary">Command Intent</div>
									<p className="mt-2 font-body text-xs uppercase tracking-[0.14em] leading-relaxed text-muted-foreground">
											Break the occupation, rescue your specialists, and keep the next operation one click away from the player.
									</p>
								</div>
								<div className="rounded-lg border border-accent/25 bg-accent/8 p-4">
									<div className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">Stamped Orders</div>
										<div className="mt-2 font-heading text-sm uppercase tracking-[0.18em] text-foreground">Brief. Deploy. Hold the line.</div>
								</div>
							</div>
					</ShellPanel>

						<ShellPanel title="Campaign Pillars" description="Each layer of the campaign should reinforce story progression, tactical variety, or persistent upgrades.">
						<div className="grid gap-3 md:grid-cols-3">
								<DoctrineBlock title="PLATOON" body="Rescue trapped specialists through authored operations and turn them into real campaign power spikes." />
								<DoctrineBlock title="ARSENAL" body="Spend credits in the Canteen for permanent upgrades that sharpen later missions without replacing them." />
								<DoctrineBlock title="INTEL" body="Use map pressure, objective variety, and mission pacing to keep every chapter legible and distinct." />
						</div>
					</ShellPanel>
				</div>
			</div>
		</CommandPostShell>
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
		world.set(AppScreen, { screen: "briefing" });
	};

	return (
		<div data-testid="difficulty-select" className="flex flex-col gap-3">
			<p className="max-w-xl font-body text-xs uppercase tracking-[0.16em] text-muted-foreground">
				Once committed to a higher doctrine, there is no going back. Choose the campaign pressure you want to live with.
			</p>
			<div className="grid gap-2 rounded-lg border border-destructive/30 bg-destructive/8 p-3">
				<div className="font-heading text-xs uppercase tracking-[0.22em] text-destructive">Escalation Notice</div>
				<p className="font-body text-[11px] uppercase tracking-[0.14em] leading-relaxed text-muted-foreground">
						Higher doctrine means harsher attrition, tighter resources, and no downgrade path once the campaign has hardened.
				</p>
			</div>
			<div className="grid gap-3">
				{DIFFICULTY_OPTIONS.map((option) => (
					<DifficultyOption
						key={option.id}
						name={option.name}
						description={option.description}
						notes={option.notes}
						onClick={() => select(option.id)}
					/>
				))}
			</div>
			<Button type="button" variant="ghost" className="justify-start px-0" onClick={onBack}>
				Back
			</Button>
		</div>
	);
}

function DifficultyOption({
	name,
	description,
	notes,
	onClick,
}: {
	name: string;
	description: string;
	notes: readonly string[];
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"relative flex flex-col items-start gap-3 overflow-hidden rounded-lg border border-border bg-card/80 px-5 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all",
				"hover:border-accent hover:-translate-y-0.5 hover:bg-card",
			)}
		>
			<div className="absolute inset-y-0 left-0 w-1 bg-[linear-gradient(180deg,rgba(212,165,116,0.95),rgba(212,165,116,0.15))]" />
			<div className="flex w-full items-start justify-between gap-3">
				<div className="grid gap-1">
					<span className="font-heading text-sm uppercase tracking-[0.22em] text-foreground">{name}</span>
					<span className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">Doctrine {name === "Support" ? "01" : name === "Tactical" ? "02" : "03"}</span>
				</div>
				<Badge variant={name === "Elite" ? "danger" : name === "Tactical" ? "accent" : "primary"}>{name === "Support" ? "FIELD READY" : name === "Tactical" ? "COMMITMENT" : "NO FAILSAFE"}</Badge>
			</div>
			<span className="font-body text-xs uppercase tracking-[0.14em] text-muted-foreground">{description}</span>
			<div className="flex flex-wrap gap-2">
				{notes.map((note) => (
					<Badge key={note}>{note}</Badge>
				))}
			</div>
			<div className="flex w-full items-center justify-between border-t border-border/60 pt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
				<span>Commit Doctrine</span>
				<span>&gt;&gt;</span>
			</div>
		</button>
	);
}

function MenuButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
	return (
		<Button type="button" variant="command" size="lg" onClick={onClick} className="w-full justify-start px-5">
			{children}
		</Button>
	);
}

function IntelCard({ label, value, detail }: { label: string; value: string; detail: string }) {
	return (
		<div className="rounded-lg border border-border/80 bg-background/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
			<div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
			<div className="mt-2 font-heading text-base uppercase tracking-[0.18em] text-primary">{value}</div>
			<p className="mt-2 font-body text-xs uppercase tracking-[0.14em] text-muted-foreground">{detail}</p>
		</div>
	);
}

function DoctrineBlock({ title, body }: { title: string; body: string }) {
	return (
		<div className="rounded-lg border border-border/70 bg-background/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
			<div className="font-heading text-sm uppercase tracking-[0.22em] text-accent">{title}</div>
			<p className="mt-2 font-body text-xs uppercase tracking-[0.14em] leading-relaxed text-muted-foreground">{body}</p>
		</div>
	);
}
