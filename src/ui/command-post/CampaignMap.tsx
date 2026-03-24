/**
 * CampaignMap — Weathered parchment map with mission markers (command-post theme).
 *
 * Displays unlocked missions as markers on a stylized atlas.
 * Clicking a marker navigates to BriefingScreen.
 * Reads CampaignProgress from Koota to determine which missions are available.
 */
import { useTrait, useWorld } from "koota/react";
import { CampaignProgress, AppScreen } from "@/ecs/traits/state";
import { cn } from "@/ui/lib/utils";

interface MissionMarker {
	id: string;
	name: string;
	chapter: number;
	x: number;
	y: number;
}

const CAMPAIGN_MARKERS: MissionMarker[] = [
	{ id: "mission_1", name: "Beachhead", chapter: 1, x: 15, y: 70 },
	{ id: "mission_2", name: "Causeway", chapter: 1, x: 25, y: 60 },
	{ id: "mission_3", name: "Firebase Delta", chapter: 1, x: 35, y: 55 },
	{ id: "mission_4", name: "Whiskers' Last Stand", chapter: 1, x: 45, y: 50 },
	{ id: "mission_5", name: "Siphon Valley", chapter: 2, x: 30, y: 40 },
	{ id: "mission_6", name: "Monsoon Ambush", chapter: 2, x: 40, y: 35 },
	{ id: "mission_7", name: "River Rats", chapter: 2, x: 50, y: 30 },
	{ id: "mission_8", name: "Underwater Cache", chapter: 2, x: 60, y: 35 },
	{ id: "mission_9", name: "Fog of War", chapter: 3, x: 55, y: 25 },
	{ id: "mission_10", name: "Scorched Earth", chapter: 3, x: 65, y: 20 },
	{ id: "mission_11", name: "Tidal Fortress", chapter: 3, x: 70, y: 30 },
	{ id: "mission_12", name: "Fang Rescue", chapter: 3, x: 75, y: 25 },
	{ id: "mission_13", name: "The Great Siphon", chapter: 4, x: 70, y: 15 },
	{ id: "mission_14", name: "Iron Delta", chapter: 4, x: 78, y: 12 },
	{ id: "mission_15", name: "Serpent King", chapter: 4, x: 82, y: 18 },
	{ id: "mission_16", name: "Last Stand", chapter: 4, x: 88, y: 10 },
];

export function CampaignMap() {
	const world = useWorld();
	const campaign = useTrait(world, CampaignProgress);

	const missions = campaign?.missions ?? {};

	const isMissionUnlocked = (index: number): boolean => {
		if (index === 0) return true;
		const prev = CAMPAIGN_MARKERS[index - 1];
		return missions[prev.id]?.status === "completed";
	};

	const selectMission = (id: string) => {
		world.set(CampaignProgress, {
			...campaign!,
			currentMission: id,
		});
		world.set(AppScreen, { screen: "briefing" });
	};

	return (
		<div
			data-testid="campaign-map"
			className={cn("relative min-h-screen overflow-hidden", "bg-background text-foreground")}
		>
			{/* Parchment header */}
			<div className="flex items-center justify-between px-6 py-4 border-b-2 border-border">
				<h2 className="font-heading text-xl uppercase tracking-widest text-primary">
					Campaign Map
				</h2>
				<button
					type="button"
					onClick={() => world.set(AppScreen, { screen: "menu" })}
					className="font-body text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
				>
					HQ
				</button>
			</div>

			{/* Map area */}
			<div className="relative mx-auto my-8 aspect-video max-w-4xl border-2 border-border bg-card">
				{CAMPAIGN_MARKERS.map((marker, index) => {
					const unlocked = isMissionUnlocked(index);
					const completed = missions[marker.id]?.status === "completed";
					const stars = missions[marker.id]?.stars ?? 0;

					return (
						<button
							key={marker.id}
							type="button"
							disabled={!unlocked}
							onClick={() => unlocked && selectMission(marker.id)}
							className={cn(
								"absolute flex flex-col items-center gap-0.5",
								"-translate-x-1/2 -translate-y-1/2",
							)}
							style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
						>
							{/* Marker dot */}
							<div
								className={cn(
									"h-4 w-4 border-2",
									completed && "border-accent bg-accent/30",
									unlocked && !completed && "border-primary bg-primary/20",
									!unlocked && "border-muted-foreground bg-muted opacity-40",
								)}
							/>
							{/* Label */}
							<span
								className={cn(
									"whitespace-nowrap font-body text-[9px] uppercase tracking-wider",
									unlocked ? "text-foreground" : "text-muted-foreground opacity-40",
								)}
							>
								{marker.name}
							</span>
							{/* Stars */}
							{completed && stars > 0 && (
								<span className="font-mono text-[8px] text-accent">{"*".repeat(stars)}</span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
