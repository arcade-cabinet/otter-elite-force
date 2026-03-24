/**
 * CampaignMap — Weathered parchment map with mission markers (command-post theme).
 *
 * Displays unlocked missions as markers on a stylized atlas.
 * Clicking a marker navigates to BriefingScreen.
 * Reads CampaignProgress from Koota to determine which missions are available.
 */
import { useTrait, useWorld } from "koota/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CampaignProgress, AppScreen } from "@/ecs/traits/state";
import { CAMPAIGN } from "@/entities/missions";
import { CommandPostShell, ShellPanel } from "@/ui/layout/shells";
import { cn } from "@/ui/lib/utils";

interface MissionMarkerPosition {
	x: number;
	y: number;
}

const CAMPAIGN_MARKERS: Record<string, MissionMarkerPosition> = {
	mission_1: { x: 15, y: 70 },
	mission_2: { x: 25, y: 60 },
	mission_3: { x: 35, y: 55 },
	mission_4: { x: 45, y: 50 },
	mission_5: { x: 30, y: 40 },
	mission_6: { x: 40, y: 35 },
	mission_7: { x: 50, y: 30 },
	mission_8: { x: 60, y: 35 },
	mission_9: { x: 55, y: 25 },
	mission_10: { x: 65, y: 20 },
	mission_11: { x: 70, y: 30 },
	mission_12: { x: 75, y: 25 },
	mission_13: { x: 70, y: 15 },
	mission_14: { x: 78, y: 12 },
	mission_15: { x: 82, y: 18 },
	mission_16: { x: 88, y: 10 },
};

const CHAPTER_LABELS = {
	1: "First Landing",
	2: "River War",
	3: "Heart of Darkness",
	4: "Final Offensive",
} as const;

export function CampaignMap({ onSelectMission }: { onSelectMission?: (id: string) => void }) {
	const world = useWorld();
	const campaign = useTrait(world, CampaignProgress);

	const missions = campaign?.missions ?? {};
	const grouped = [1, 2, 3, 4].map((chapter) => ({
		chapter,
		missions: CAMPAIGN.filter((mission) => mission.chapter === chapter),
	}));
	const totalStars = Object.values(missions).reduce(
		(sum, mission) => sum + (mission.stars ?? 0),
		0,
	);

	const getChapterLabel = (chapter: number) =>
		CHAPTER_LABELS[chapter as keyof typeof CHAPTER_LABELS];

	const isMissionUnlocked = (index: number): boolean => {
		const mission = CAMPAIGN[index];
		if (!mission) return false;
		if (index === 0) return true;
		if (missions[mission.id] && missions[mission.id]?.status !== "locked") return true;
		const prev = CAMPAIGN[index - 1];
		return prev ? missions[prev.id]?.status === "completed" : false;
	};

	const selectMission = (id: string) => {
		if (onSelectMission) {
			onSelectMission(id);
			return;
		}

		world.set(CampaignProgress, {
			...campaign!,
			currentMission: id,
		});
		world.set(AppScreen, { screen: "briefing" });
	};

	return (
		<CommandPostShell
			title="Campaign Map"
			subtitle="A weathered operational atlas showing chapter progression, rescue pressure, and mission performance across the Copper-Silt Reach."
			meta={
				<div className="flex flex-wrap gap-2">
					<Badge variant="primary">16 MISSIONS</Badge>
					<Badge variant="accent" data-stars={totalStars}>
						{totalStars} TOTAL STARS
					</Badge>
				</div>
			}
			aside={
				<div className="grid gap-6">
					<ShellPanel
						title="Field Summary"
						description="Campaign progress updates after every secured operation."
					>
						<div className="grid gap-3">
							<div className="rounded-lg border border-border/70 bg-background/20 p-4">
								<div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
									Next Operation
								</div>
								<div className="mt-2 font-heading text-base uppercase tracking-[0.16em] text-primary">
									{CAMPAIGN.find(
										(mission) => mission.id === (campaign?.currentMission ?? "mission_1"),
									)?.name ?? "Beachhead"}
								</div>
							</div>
							<div className="rounded-lg border border-border/70 bg-background/20 p-4">
								<div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
									Difficulty
								</div>
								<div className="mt-2 font-heading text-base uppercase tracking-[0.16em] text-accent">
									{campaign?.difficulty ?? "support"}
								</div>
							</div>
						</div>
					</ShellPanel>
					<ShellPanel title="Chapter Brief" description="Four chapters, four operations each.">
						<div className="grid gap-2">
							{grouped.map(({ chapter, missions: chapterMissions }) => (
								<div
									key={chapter}
									className="rounded-lg border border-border/70 bg-background/20 p-3"
								>
									<div className="font-heading text-xs uppercase tracking-[0.2em] text-primary">
										Chapter {chapter}
									</div>
									<div className="mt-1 font-body text-xs uppercase tracking-[0.14em] text-muted-foreground">
										{getChapterLabel(chapter)}
									</div>
									<div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
										{chapterMissions.length} operations
									</div>
								</div>
							))}
						</div>
					</ShellPanel>
				</div>
			}
			footer={
				<Button variant="ghost" onClick={() => world.set(AppScreen, { screen: "menu" })}>
					Back to Command
				</Button>
			}
		>
			<div data-testid="campaign-map" className="campaign-map grid gap-6">
				<ShellPanel
					title="Operational Atlas"
					description="Stamped mission markers trace the 16-operation campaign from first landing to the final offensive."
				>
					<div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border/80 bg-[linear-gradient(180deg,rgba(245,230,200,0.88),rgba(212,165,116,0.28)),radial-gradient(circle_at_top,rgba(255,255,255,0.45),transparent_42%)] px-4 py-4 text-rust-900">
						<div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(58,47,30,0.06)_0,rgba(58,47,30,0.06)_1px,transparent_1px,transparent_72px),repeating-linear-gradient(180deg,rgba(58,47,30,0.05)_0,rgba(58,47,30,0.05)_1px,transparent_1px,transparent_72px)] opacity-60" />
						<svg
							className="absolute inset-0 h-full w-full"
							viewBox="0 0 100 100"
							preserveAspectRatio="none"
						>
							<polyline
								fill="none"
								stroke="rgba(58,31,20,0.35)"
								strokeWidth="0.5"
								strokeDasharray="1.2 1.8"
								points={CAMPAIGN.map((mission) => {
									const point = CAMPAIGN_MARKERS[mission.id];
									return `${point.x},${point.y}`;
								}).join(" ")}
							/>
						</svg>
						{CAMPAIGN.map((mission, index) => {
							const point = CAMPAIGN_MARKERS[mission.id];
							const unlocked = isMissionUnlocked(index);
							const completed = missions[mission.id]?.status === "completed";
							const stars = missions[mission.id]?.stars ?? 0;
							const status = completed ? "completed" : unlocked ? "unlocked" : "locked";

							return (
								<button
									key={mission.id}
									type="button"
									data-mission-id={mission.id}
									data-status={status}
									disabled={!unlocked}
									onClick={() => unlocked && selectMission(mission.id)}
									className={cn(
										"mission-marker absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center transition-transform sm:w-28",
										unlocked && "hover:scale-[1.03]",
										!unlocked && "opacity-60",
									)}
									style={{ left: `${point.x}%`, top: `${point.y}%` }}
								>
									<div
										className={cn(
											"flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-heading uppercase tracking-[0.18em] shadow-sm",
											completed && "border-rust-800 bg-rust-800 text-parchment",
											unlocked && !completed && "border-rust-800 bg-parchment/80 text-rust-900",
											!unlocked && "border-rust-700/50 bg-white/30 text-rust-800/70",
										)}
									>
										{mission.mission}
									</div>
									<span className="mt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-rust-800">
										Mission {mission.mission}
									</span>
									<span className="font-heading text-[10px] uppercase tracking-[0.12em] text-rust-900 sm:text-[11px] sm:tracking-[0.14em]">
										{mission.name}
									</span>
									{completed && stars > 0 ? (
										<span
											className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-rust-800"
											aria-label={`${stars} stars`}
											data-stars={stars}
										>
											{"★".repeat(stars)}
										</span>
									) : null}
								</button>
							);
						})}
					</div>
				</ShellPanel>

				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{grouped.map(({ chapter, missions: chapterMissions }) => (
						<div key={chapter} className="rounded-lg border border-border/70 bg-background/20 p-4">
							<div className="font-heading text-sm uppercase tracking-[0.22em] text-primary">
								Chapter {chapter}
							</div>
							<div className="mt-1 font-body text-xs uppercase tracking-[0.14em] text-muted-foreground">
								{getChapterLabel(chapter)}
							</div>
							<div className="mt-3 grid gap-2">
								{chapterMissions.map((mission) => (
									<div
										key={mission.id}
										className="flex items-center justify-between rounded border border-border/60 bg-card/50 px-3 py-2"
									>
										<span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
											Mission {mission.mission}
										</span>
										<span className="font-heading text-xs uppercase tracking-[0.14em] text-foreground">
											{mission.name}
										</span>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</CommandPostShell>
	);
}
