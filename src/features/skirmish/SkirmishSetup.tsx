/**
 * Skirmish Setup Screen (US-078)
 *
 * Accessible from main menu "Skirmish" button. Provides:
 *   - Map selection with previews and lock icons
 *   - Difficulty selector: Easy / Medium / Hard / Brutal
 *   - "Play as Scale-Guard" toggle
 *   - Start button to launch the selected map
 *   - Maps unlock based on campaign star count
 */

import { useTrait, useWorld } from "koota/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AppScreen, CampaignProgress } from "@/ecs/traits/state";
import { cn } from "@/ui/lib/utils";
import {
	countCampaignStars,
	hasGoldUnlock,
	isMapUnlocked,
	SKIRMISH_DIFFICULTIES,
	SKIRMISH_MAPS,
	type SkirmishDifficultyOption,
	type SkirmishMapDef,
} from "./types";

export function SkirmishSetup() {
	const world = useWorld();
	const campaign = useTrait(world, CampaignProgress);
	const totalStars = useMemo(
		() => countCampaignStars(campaign?.missions ?? {}),
		[campaign?.missions],
	);
	const allUnlocked = hasGoldUnlock(totalStars);

	const [selectedMapId, setSelectedMapId] = useState<string>(SKIRMISH_MAPS[0].id);
	const [selectedDifficulty, setSelectedDifficulty] = useState<SkirmishDifficultyOption>(
		SKIRMISH_DIFFICULTIES[1], // Medium default
	);
	const [playAsScaleGuard, setPlayAsScaleGuard] = useState(false);

	const selectedMap = SKIRMISH_MAPS.find((m) => m.id === selectedMapId) ?? SKIRMISH_MAPS[0];
	const canStart = allUnlocked || isMapUnlocked(selectedMap, totalStars);

	const handleStart = () => {
		if (!canStart) return;
		// Store skirmish config in world state for the game scene to consume
		// For now, transition to game screen — the game scene will detect
		// skirmish mode from the stored config.
		world.set(AppScreen, { screen: "game" });
	};

	const handleBack = () => {
		world.set(AppScreen, { screen: "menu" });
	};

	return (
		<div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#1c362c_0%,#0d1614_42%,#080c0c_100%)] text-foreground">
			<div className="riverine-camo absolute inset-0 opacity-70" />
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(212,165,116,0.18),transparent_20%),radial-gradient(circle_at_80%_28%,rgba(74,128,108,0.16),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.3))]" />

			<div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
				{/* Header */}
				<header className="flex flex-col items-center gap-2 text-center">
					<div className="rounded border border-accent/25 bg-black/20 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.32em] text-accent">
						Skirmish Operations
					</div>
					<h1 className="font-heading text-3xl uppercase tracking-[0.22em] text-primary sm:text-4xl">
						Skirmish
					</h1>
					<p className="font-body text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
						{totalStars} campaign stars earned
						{allUnlocked ? " — all maps unlocked" : ""}
					</p>
				</header>

				{/* Content */}
				<div className="mt-6 grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
					{/* Map grid */}
					<section>
						<div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
							Select Map
						</div>
						<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{SKIRMISH_MAPS.map((map) => {
								const unlocked = allUnlocked || isMapUnlocked(map, totalStars);
								const isSelected = map.id === selectedMapId;
								return (
									<MapCard
										key={map.id}
										map={map}
										unlocked={unlocked}
										selected={isSelected}
										totalStars={totalStars}
										onSelect={() => unlocked && setSelectedMapId(map.id)}
									/>
								);
							})}
						</div>
					</section>

					{/* Sidebar: difficulty + options */}
					<aside className="flex flex-col gap-4">
						{/* Difficulty */}
						<div>
							<div className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
								Difficulty
							</div>
							<div className="grid gap-2">
								{SKIRMISH_DIFFICULTIES.map((d) => (
									<button
										key={d.id}
										type="button"
										onClick={() => setSelectedDifficulty(d)}
										className={cn(
											"rounded-none border px-4 py-3 text-left transition",
											d.id === selectedDifficulty.id
												? "border-accent/60 bg-accent/15 text-accent"
												: "border-border/70 bg-background/40 text-foreground hover:border-accent/30 hover:bg-background/55",
										)}
									>
										<div className="font-heading text-sm uppercase tracking-[0.16em]">
											{d.label}
										</div>
										<div className="mt-1 font-body text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
											{d.note}
										</div>
									</button>
								))}
							</div>
						</div>

						{/* Play as Scale-Guard toggle */}
						<div className="rounded-none border border-border/70 bg-black/24 p-4">
							<label className="flex cursor-pointer items-center gap-3">
								<input
									type="checkbox"
									checked={playAsScaleGuard}
									onChange={(e) => setPlayAsScaleGuard(e.target.checked)}
									className="size-4 accent-accent"
								/>
								<div>
									<div className="font-heading text-sm uppercase tracking-[0.14em] text-foreground">
										Play as Scale-Guard
									</div>
									<div className="font-body text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
										Swap factions. AI controls OEF.
									</div>
								</div>
							</label>
						</div>

						{/* Map info */}
						<div className="rounded-none border border-border/70 bg-black/24 p-4">
							<div className="font-heading text-lg uppercase tracking-[0.16em] text-primary">
								{selectedMap.name}
							</div>
							<div className="mt-1 font-body text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
								{selectedMap.description}
							</div>
							<div className="mt-3 flex flex-wrap gap-2">
								<span className="rounded border border-accent/25 bg-accent/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
									{selectedMap.size}
								</span>
								<span className="rounded border border-accent/25 bg-accent/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
									{selectedMap.terrainType}
								</span>
							</div>
						</div>

						{/* Actions */}
						<div className="mt-auto flex flex-col gap-2">
							<Button
								variant="accent"
								size="lg"
								className="w-full"
								disabled={!canStart}
								onClick={handleStart}
							>
								Start Skirmish
							</Button>
							<Button variant="command" size="lg" className="w-full" onClick={handleBack}>
								Back to Menu
							</Button>
						</div>
					</aside>
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Map card sub-component
// ---------------------------------------------------------------------------

function MapCard({
	map,
	unlocked,
	selected,
	totalStars,
	onSelect,
}: {
	map: SkirmishMapDef;
	unlocked: boolean;
	selected: boolean;
	totalStars: number;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			disabled={!unlocked}
			className={cn(
				"group relative rounded-none border p-4 text-left transition",
				unlocked
					? selected
						? "border-accent/60 bg-accent/12 shadow-[0_0_0_1px_rgba(255,226,138,0.2)]"
						: "border-border/70 bg-black/28 hover:border-accent/40 hover:bg-black/36"
					: "cursor-not-allowed border-border/40 bg-black/40 opacity-50",
			)}
		>
			{/* Map preview thumbnail */}
			<div
				className={cn(
					"flex h-20 items-center justify-center rounded-none border text-center",
					unlocked
						? "border-accent/15 bg-[radial-gradient(circle,rgba(212,165,116,0.12),transparent_40%)]"
						: "border-border/30 bg-black/30",
				)}
			>
				{unlocked ? (
					<span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/60">
						{map.terrainType} / {map.size}
					</span>
				) : (
					<span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
						{map.starsRequired - totalStars} more stars needed
					</span>
				)}
			</div>

			<div className="mt-2 font-heading text-sm uppercase tracking-[0.14em] text-primary">
				{unlocked ? map.name : "Locked"}
			</div>
			{unlocked && (
				<div className="mt-1 font-body text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
					{map.description}
				</div>
			)}
			{!unlocked && (
				<div className="mt-1 font-body text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
					Requires {map.starsRequired} stars
				</div>
			)}
		</button>
	);
}
