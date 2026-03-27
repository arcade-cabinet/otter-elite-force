/**
 * CampaignView — SolidJS campaign progression screen (US-F03).
 *
 * Shows 16 missions organized by 4 chapters of 4 missions each.
 * Completed missions show star rating, locked missions show padlock.
 * Clicking an unlocked mission navigates to the briefing screen.
 */

import { type Component, createMemo, For, Show } from "solid-js";
import { CAMPAIGN } from "@/entities/missions";
import type { MissionDef } from "@/entities/types";
import type { AppState } from "../appState";

/** Chapter labels for the 4 chapters. */
const CHAPTER_NAMES = ["First Landing", "Deep Operations", "Turning Tide", "Final Offensive"];

type MissionStatus = "locked" | "available" | "completed";

interface MissionSlot {
	def: MissionDef;
	status: MissionStatus;
	stars: number;
}

interface ChapterGroup {
	chapter: number;
	name: string;
	missions: MissionSlot[];
}

/**
 * Determine mission status based on campaign progress.
 * For now, mission 1 is always available; subsequent missions are available
 * if the previous mission is completed. In the full version, this would
 * read from persisted campaign progress.
 */
function getMissionSlots(): MissionSlot[] {
	return CAMPAIGN.map((def, index) => {
		// First mission always available, rest locked until wired to persistence
		const status: MissionStatus = index === 0 ? "available" : "locked";
		return { def, status, stars: 0 };
	});
}

/** Group missions into 4 chapters of 4 missions each. */
function getChapters(slots: MissionSlot[]): ChapterGroup[] {
	const chapters: ChapterGroup[] = [];
	for (let c = 1; c <= 4; c++) {
		chapters.push({
			chapter: c,
			name: CHAPTER_NAMES[c - 1],
			missions: slots.filter((s) => s.def.chapter === c),
		});
	}
	return chapters;
}

/** Star rating display. */
const StarRating: Component<{ stars: number }> = (props) => {
	return (
		<div class="flex gap-0.5 text-xs">
			<For each={[1, 2, 3]}>
				{(i) => (
					<span
						class={
							i <= props.stars
								? props.stars === 3
									? "text-highlight"
									: props.stars === 2
										? "text-khaki-300"
										: "text-faded-yellow"
								: "text-muted-foreground/40"
						}
					>
						{i <= props.stars ? "\u2605" : "\u2606"}
					</span>
				)}
			</For>
		</div>
	);
};

/** Individual mission card. */
const MissionCard: Component<{
	slot: MissionSlot;
	onClick: () => void;
}> = (props) => {
	const isLocked = () => props.slot.status === "locked";
	const isCompleted = () => props.slot.status === "completed";

	return (
		<button
			type="button"
			disabled={isLocked()}
			onClick={props.onClick}
			class={`group relative border px-3 py-3 text-left transition ${
				isLocked()
					? "cursor-not-allowed border-border/30 bg-card/15 opacity-50"
					: isCompleted()
						? "border-primary/35 bg-primary/8 hover:border-primary/55 hover:bg-primary/12"
						: "border-accent/30 bg-card/30 hover:border-accent/55 hover:bg-card/45"
			}`}
		>
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0 flex-1">
					<div class="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
						{props.slot.def.chapter}-{props.slot.def.mission}
					</div>
					<div
						class={`mt-0.5 font-heading text-sm uppercase tracking-[0.14em] ${
							isLocked() ? "text-muted-foreground" : "text-foreground"
						}`}
					>
						{props.slot.def.name}
					</div>
					<div class="mt-1 line-clamp-1 font-body text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">
						{props.slot.def.subtitle}
					</div>
				</div>
				<div class="flex shrink-0 flex-col items-end gap-1">
					<Show when={isLocked()}>
						<span role="img" class="font-mono text-sm text-muted-foreground/50" aria-label="Locked">
							&#x1F512;
						</span>
					</Show>
					<Show when={isCompleted()}>
						<StarRating stars={props.slot.stars} />
					</Show>
					<Show when={!isLocked() && !isCompleted()}>
						<span class="border border-accent/25 bg-accent/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-accent">
							Available
						</span>
					</Show>
				</div>
			</div>
		</button>
	);
};

export const CampaignView: Component<{ app: AppState }> = (props) => {
	const slots = createMemo(() => getMissionSlots());
	const chapters = createMemo(() => getChapters(slots()));
	const completedCount = createMemo(() => slots().filter((s) => s.status === "completed").length);

	const handleMissionClick = (missionId: string) => {
		const slot = slots().find((s) => s.def.id === missionId);
		if (!slot || slot.status === "locked") return;
		props.app.setCurrentMissionId(missionId);
		props.app.setScreen("briefing");
	};

	return (
		<div class="canvas-grain relative flex min-h-screen w-screen flex-col items-center bg-background text-foreground">
			<div class="riverine-camo absolute inset-0 opacity-15" />
			<div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.5)_100%)]" />
			<div class="relative z-10 flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
				{/* Header */}
				<div class="flex flex-col items-center gap-2 text-center">
					<div class="inline-block border border-accent/25 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
						Copper-Silt Reach
					</div>
					<h2 class="font-heading text-2xl uppercase tracking-[0.22em] text-primary">Campaign</h2>
					<p class="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
						{completedCount()} of {CAMPAIGN.length} missions completed
					</p>
				</div>

				{/* Mission chapters */}
				<div class="grid gap-6">
					<For each={chapters()}>
						{(chapter) => (
							<div>
								<div class="mb-3 flex items-center gap-2">
									<span class="rounded border border-accent/20 bg-accent/8 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.24em] text-accent">
										Chapter {chapter.chapter}
									</span>
									<span class="font-heading text-sm uppercase tracking-[0.16em] text-foreground">
										{chapter.name}
									</span>
								</div>
								<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
									<For each={chapter.missions}>
										{(slot) => (
											<MissionCard slot={slot} onClick={() => handleMissionClick(slot.def.id)} />
										)}
									</For>
								</div>
							</div>
						)}
					</For>
				</div>

				{/* Back button */}
				<div class="flex justify-center">
					<button
						type="button"
						class="min-h-11 border border-border/50 bg-card/60 px-6 py-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
						onClick={() => props.app.setScreen("main-menu")}
					>
						Back to Menu
					</button>
				</div>
			</div>
		</div>
	);
};
