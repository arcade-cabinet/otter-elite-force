import { useTrait, useWorld } from "koota/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AppScreen, CampaignProgress, CompletedResearch } from "@/ecs/traits/state";
import { CAMPAIGN, getMissionById } from "@/entities/missions";
import { DIFFICULTIES, type DifficultyId } from "@/game/difficulty";

export function MainMenu() {
	const world = useWorld();
	const campaign = useTrait(world, CampaignProgress);
	const [showDifficultyChoices, setShowDifficultyChoices] = useState(false);

	const hasSave = Boolean(campaign?.currentMission);
	const currentMission = campaign?.currentMission ? getMissionById(campaign.currentMission) : null;
	const completedCount = Object.values(campaign?.missions ?? {}).filter(
		(entry) => entry.status === "completed",
	).length;
	const totalMissions = CAMPAIGN.length;

	const continueLabel = useMemo(() => {
		if (!currentMission) return "No active campaign";
		return `Resume ${currentMission.name}`;
	}, [currentMission]);

	const startNewGame = (difficulty: DifficultyId) => {
		world.set(CampaignProgress, {
			missions: {},
			currentMission: CAMPAIGN[0]?.id ?? "mission_1",
			difficulty,
		});
		world.set(CompletedResearch, { ids: new Set<string>() });
		world.set(AppScreen, { screen: "campaign" });
	};

	const continueCampaign = () => {
		if (!hasSave) return;
		world.set(AppScreen, { screen: "campaign" });
	};

	// US-092: Keyboard navigation — Escape closes difficulty panel
	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === "Escape" && showDifficultyChoices) {
				setShowDifficultyChoices(false);
			}
		},
		[showDifficultyChoices],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	return (
		<div
			role="main"
			aria-label="Main Menu"
			className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#1c362c_0%,#0d1614_42%,#080c0c_100%)] text-foreground"
		>
			<div className="riverine-camo absolute inset-0 opacity-70" />
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(212,165,116,0.18),transparent_20%),radial-gradient(circle_at_80%_28%,rgba(74,128,108,0.16),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.3))]" />

			<div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
				<header className="flex flex-col items-center justify-center gap-2 text-center">
					<div className="rounded border border-accent/25 bg-black/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.32em] text-accent">
						Copper-Silt Reach
					</div>
					<h1 className="font-heading text-4xl uppercase tracking-[0.22em] text-primary sm:text-5xl lg:text-6xl">
						Otter Elite Force
					</h1>
					<p className="max-w-2xl font-body text-[11px] uppercase tracking-[0.22em] text-muted-foreground sm:text-xs">
						Campaign-first river-jungle warfare. Buy once. Start campaign. Keep moving.
					</p>
				</header>

				<div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)] lg:gap-12 lg:py-10">
					<section
						aria-label="Campaign Actions"
						className="mx-auto flex w-full max-w-md flex-col justify-center gap-4 lg:mx-0 lg:min-h-[32rem]"
					>
						<nav aria-label="Main Navigation" className="grid gap-3">
							<Button
								variant="command"
								size="lg"
								aria-expanded={showDifficultyChoices}
								aria-controls="difficulty-choices"
								className="justify-between px-5 py-6 text-left"
								onClick={() => setShowDifficultyChoices((value) => !value)}
							>
								<span className="font-heading text-xl uppercase tracking-[0.18em]">New Game</span>
								<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
									Start Campaign
								</span>
							</Button>

							{showDifficultyChoices ? (
								<div
									id="difficulty-choices"
									role="group"
									aria-label="Difficulty Selection"
									className="grid gap-2 rounded-lg border border-accent/20 bg-black/30 p-3 backdrop-blur-sm"
								>
									{DIFFICULTIES.map((option) => (
										<button
											key={option.id}
											type="button"
											onClick={() => startNewGame(option.id)}
											className="rounded-md border border-border/70 bg-background/40 px-4 py-3 text-left transition hover:border-accent/40 hover:bg-background/55"
										>
											<div className="font-heading text-lg uppercase tracking-[0.16em] text-primary">
												{option.label}
											</div>
											<div className="mt-1 font-body text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
												{option.note}
											</div>
										</button>
									))}
								</div>
							) : null}

							<Button
								variant="command"
								size="lg"
								className="justify-between px-5 py-6 text-left"
								onClick={continueCampaign}
								disabled={!hasSave}
							>
								<span className="font-heading text-xl uppercase tracking-[0.18em]">Continue</span>
								<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
									{continueLabel}
								</span>
							</Button>

							<Button
								variant="command"
								size="lg"
								className="justify-between px-5 py-6 text-left"
								onClick={() => world.set(AppScreen, { screen: "skirmish" })}
							>
								<span className="font-heading text-xl uppercase tracking-[0.18em]">Skirmish</span>
								<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
									Single-Player Battle
								</span>
							</Button>

							<Button
								variant="command"
								size="lg"
								className="justify-between px-5 py-6 text-left"
								onClick={() => world.set(AppScreen, { screen: "settings" })}
							>
								<span className="font-heading text-xl uppercase tracking-[0.18em]">Settings</span>
								<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
									Audio • Controls • Readability
								</span>
							</Button>
						</nav>

						<div className="rounded-lg border border-border/70 bg-black/24 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-sm">
							{completedCount} / {totalMissions} missions completed
						</div>
					</section>

					<section className="command-landing-hero relative mx-auto flex w-full max-w-3xl items-center overflow-hidden rounded-[1.5rem] border border-accent/20 bg-[linear-gradient(135deg,rgba(7,12,12,0.88),rgba(19,32,28,0.9))] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.38)] sm:p-6 lg:mx-0 lg:min-h-[32rem] lg:p-8">
						<div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(212,165,116,0.12),transparent_22%),radial-gradient(circle_at_76%_40%,rgba(106,138,90,0.14),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.16))]" />
						<div className="relative z-10 grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] lg:gap-6">
							<div className="rounded-2xl border border-accent/20 bg-[linear-gradient(180deg,rgba(93,67,42,0.48),rgba(24,20,16,0.3))] p-5">
								<div className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
									Player
								</div>
								<div className="mt-3 font-heading text-2xl uppercase tracking-[0.18em] text-primary sm:text-3xl">
									Otter Elite Force
								</div>
								<div className="mt-5 flex h-56 items-end rounded-[1.25rem] border border-accent/15 bg-[radial-gradient(circle_at_48%_28%,rgba(255,214,170,0.18),transparent_18%),radial-gradient(circle_at_50%_36%,rgba(118,86,54,0.95),rgba(56,39,27,0.95)_58%,rgba(12,10,8,0.95)_100%)] p-4 sm:h-72">
									<div className="font-body text-[11px] uppercase tracking-[0.16em] text-foreground/88">
										Mud, discipline, and river crossings.
									</div>
								</div>
							</div>

							<div className="hidden items-center justify-center lg:flex">
								<div className="flex h-16 w-16 items-center justify-center rounded-full border border-accent/25 bg-black/30 font-heading text-2xl uppercase tracking-[0.24em] text-accent">
									VS
								</div>
							</div>

							<div className="rounded-2xl border border-emerald-500/15 bg-[linear-gradient(180deg,rgba(35,68,48,0.44),rgba(14,24,18,0.34))] p-5">
								<div className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-200">
									Enemy
								</div>
								<div className="mt-3 font-heading text-2xl uppercase tracking-[0.18em] text-emerald-100 sm:text-3xl">
									Scale-Guard
								</div>
								<div className="mt-5 flex h-56 items-end rounded-[1.25rem] border border-emerald-300/10 bg-[radial-gradient(circle_at_52%_26%,rgba(165,224,181,0.16),transparent_18%),radial-gradient(circle_at_50%_34%,rgba(60,108,67,0.95),rgba(29,57,34,0.95)_58%,rgba(10,16,12,0.96)_100%)] p-4 sm:h-72">
									<div className="font-body text-[11px] uppercase tracking-[0.16em] text-emerald-50/82">
										Entrenched chokepoints and brute attrition.
									</div>
								</div>
							</div>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
