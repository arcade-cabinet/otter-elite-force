/**
 * TutorialOverlay — Dismissible tutorial prompts for missions 1-4 (US-096).
 *
 * Shows contextual tutorial tips the first time a player encounters each
 * mission mechanic. Prompts are stored per mission and dismissed on click
 * or after a timeout. "Skip Tutorials" in settings disables all prompts.
 *
 * Mission 1: gathering, building
 * Mission 2: waypoint escort
 * Mission 3: capture zone
 * Mission 4: stealth detection
 */

import { useTrait, useWorld } from "koota/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserSettings } from "@/ecs/traits/state";

interface TutorialPrompt {
	id: string;
	missionId: string;
	text: string;
	/** Which step within the mission (shown in order) */
	step: number;
}

const TUTORIAL_PROMPTS: TutorialPrompt[] = [
	{
		id: "m1-gather",
		missionId: "mission_1",
		text: "Click a worker, then right-click a tree to gather resources.",
		step: 1,
	},
	{
		id: "m1-build",
		missionId: "mission_1",
		text: "Click a worker, then click Build to place a Barracks.",
		step: 2,
	},
	{
		id: "m2-waypoint",
		missionId: "mission_2",
		text: "Set waypoints for your escort. Right-click to place path markers along the route.",
		step: 1,
	},
	{
		id: "m3-capture",
		missionId: "mission_3",
		text: "Move units into the highlighted capture zone and hold position to claim it.",
		step: 1,
	},
	{
		id: "m4-stealth",
		missionId: "mission_4",
		text: "Enemy watchtowers have detection zones. Move through tall grass to avoid being spotted.",
		step: 1,
	},
];

const DISMISSED_KEY = "oef-dismissed-tutorials";

function getDismissed(): Set<string> {
	try {
		const raw = localStorage.getItem(DISMISSED_KEY);
		if (raw) return new Set(JSON.parse(raw));
	} catch {
		// Ignore parse errors
	}
	return new Set();
}

function setDismissed(ids: Set<string>) {
	try {
		localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
	} catch {
		// Ignore storage errors
	}
}

export function TutorialOverlay({ missionId }: { missionId: string }) {
	const world = useWorld();
	const settings = useTrait(world, UserSettings);
	const skipTutorials = settings?.skipTutorials ?? false;

	const [dismissed, setDismissedState] = useState(() => getDismissed());
	const [currentStep, setCurrentStep] = useState(0);

	const prompts = useMemo(
		() =>
			TUTORIAL_PROMPTS.filter(
				(prompt) => prompt.missionId === missionId && !dismissed.has(prompt.id),
			).sort((a, b) => a.step - b.step),
		[missionId, dismissed],
	);

	const activePrompt = prompts[currentStep] ?? null;

	const dismiss = useCallback(() => {
		if (!activePrompt) return;
		const next = new Set(dismissed);
		next.add(activePrompt.id);
		setDismissedState(next);
		setDismissed(next);
		setCurrentStep(0);
	}, [activePrompt, dismissed]);

	// Auto-dismiss after 8 seconds
	useEffect(() => {
		if (!activePrompt) return;
		const timer = window.setTimeout(dismiss, 8000);
		return () => window.clearTimeout(timer);
	}, [activePrompt, dismiss]);

	// Escape key dismisses
	useEffect(() => {
		if (!activePrompt) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				dismiss();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [activePrompt, dismiss]);

	// Reset step when mission changes
	useEffect(() => {
		setCurrentStep(0);
	}, [missionId]);

	if (skipTutorials || !activePrompt) return null;

	return (
		<div
			role="alert"
			aria-label="Tutorial hint"
			className="pointer-events-auto absolute bottom-24 left-1/2 z-30 w-full max-w-md -translate-x-1/2"
		>
			<div className="relative overflow-hidden rounded-md border border-accent/30 bg-[linear-gradient(180deg,rgba(9,18,15,0.96),rgba(8,12,11,0.98))] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
				<div className="riverine-camo absolute inset-0 opacity-10" />
				<div className="relative z-10 grid gap-3">
					<div className="flex items-center justify-between gap-2">
						<span className="rounded border border-accent/25 bg-accent/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.28em] text-accent">
							Field Briefing
						</span>
						<span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
							{activePrompt.missionId.replace("_", " ")}
						</span>
					</div>
					<p className="font-body text-xs uppercase tracking-[0.14em] leading-relaxed text-foreground">
						{activePrompt.text}
					</p>
					<div className="flex items-center justify-between gap-2">
						<Button variant="ghost" size="xs" onClick={dismiss}>
							Dismiss
						</Button>
						<span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
							Press ESC or wait to auto-dismiss
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
