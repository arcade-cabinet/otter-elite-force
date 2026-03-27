/**
 * TutorialOverlay -- Dismissible contextual tutorial prompts for missions 1-4.
 *
 * Shows step-by-step prompts teaching the player core mechanics:
 *   Mission 1: select, move, gather
 *   Mission 2: queue orders, build watchtower
 *   Mission 3: attack-move
 *   Mission 4: box selection
 *
 * Prompts are dismissed on click, Escape key, or after 8 seconds.
 * Dismissed IDs persist in localStorage so they only show once.
 * Respects "Skip Tutorials" setting when wired to bridge.
 */

import { type Component, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";

interface TutorialPrompt {
	id: string;
	missionId: string;
	text: string;
	step: number;
}

const TUTORIAL_PROMPTS: TutorialPrompt[] = [
	// Mission 1: Basic unit control + gathering
	{
		id: "m1-select",
		missionId: "mission_1",
		text: "Click a River Rat to select",
		step: 1,
	},
	{
		id: "m1-move",
		missionId: "mission_1",
		text: "Right-click terrain to move",
		step: 2,
	},
	{
		id: "m1-gather",
		missionId: "mission_1",
		text: "Click a tree to gather timber",
		step: 3,
	},
	// Mission 2: Order queuing + building
	{
		id: "m2-queue",
		missionId: "mission_2",
		text: "Hold shift to queue orders",
		step: 1,
	},
	{
		id: "m2-build",
		missionId: "mission_2",
		text: "Build a watchtower for vision",
		step: 2,
	},
	// Mission 3: Attack-move
	{
		id: "m3-attackmove",
		missionId: "mission_3",
		text: "Use attack-move (A + click) to advance cautiously",
		step: 1,
	},
	// Mission 4: Box selection
	{
		id: "m4-boxselect",
		missionId: "mission_4",
		text: "Select multiple units by dragging a box",
		step: 1,
	},
];

const DISMISSED_KEY = "oef-dismissed-tutorials";

function getDismissed(): Set<string> {
	try {
		const raw = localStorage.getItem(DISMISSED_KEY);
		if (raw) return new Set(JSON.parse(raw) as string[]);
	} catch {
		// Ignore parse errors
	}
	return new Set();
}

function persistDismissed(ids: Set<string>): void {
	try {
		localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
	} catch {
		// Ignore storage errors
	}
}

export const TutorialOverlay: Component<{
	missionId: string;
	/** When true, all prompts are suppressed (wired to "Skip Tutorials" setting) */
	skipTutorials?: boolean;
}> = (props) => {
	const [dismissed, setDismissed] = createSignal(getDismissed());

	const prompts = createMemo(() =>
		TUTORIAL_PROMPTS.filter((p) => p.missionId === props.missionId && !dismissed().has(p.id)).sort(
			(a, b) => a.step - b.step,
		),
	);

	const activePrompt = createMemo(() => prompts()[0] ?? null);

	const dismiss = () => {
		const prompt = activePrompt();
		if (!prompt) return;
		const next = new Set(dismissed());
		next.add(prompt.id);
		setDismissed(next);
		persistDismissed(next);
	};

	// Auto-dismiss after 8 seconds
	let autoTimer: ReturnType<typeof setTimeout> | undefined;

	const resetAutoTimer = () => {
		if (autoTimer) clearTimeout(autoTimer);
		const prompt = activePrompt();
		if (prompt) {
			autoTimer = setTimeout(dismiss, 8000);
		}
	};

	onMount(() => {
		resetAutoTimer();
	});

	// Re-start timer when active prompt changes
	// (using a simple effect via the reactive read in the template)

	// Escape key dismisses
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Escape" && activePrompt()) {
			dismiss();
		}
	};

	onMount(() => {
		window.addEventListener("keydown", onKeyDown);
	});

	onCleanup(() => {
		window.removeEventListener("keydown", onKeyDown);
		if (autoTimer) clearTimeout(autoTimer);
	});

	return (
		<Show when={!props.skipTutorials && activePrompt()}>
			{(prompt) => {
				// Reset auto-dismiss timer when the active prompt changes
				resetAutoTimer();

				return (
					<div
						role="alert"
						aria-label="Tutorial hint"
						data-testid="tutorial-overlay"
						class="pointer-events-auto absolute bottom-24 left-1/2 z-30 w-full max-w-md -translate-x-1/2"
					>
						<div class="canvas-grain relative overflow-hidden border border-green-500/30 bg-slate-950/96 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
							{/* Camo background */}
							<div class="riverine-camo absolute inset-0 opacity-10" />

							<div class="relative z-10 p-4">
								{/* Header */}
								<div class="mb-3 flex items-center justify-between gap-2">
									<span class="rounded border border-green-500/25 bg-green-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.28em] text-green-400">
										Field Briefing
									</span>
									<span class="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
										{prompt().missionId.replace("_", " ")}
									</span>
								</div>

								{/* Prompt text */}
								<p class="mb-3 font-body text-xs uppercase tracking-[0.14em] leading-relaxed text-slate-100">
									{prompt().text}
								</p>

								{/* Footer */}
								<div class="flex items-center justify-between gap-2">
									<button
										type="button"
										class="rounded border border-slate-600/60 bg-slate-900/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-300 transition-colors hover:border-green-500/40 hover:bg-slate-800/80"
										onClick={dismiss}
									>
										Dismiss
									</button>
									<span class="font-mono text-[8px] uppercase tracking-[0.2em] text-slate-600">
										ESC or wait to auto-dismiss
									</span>
								</div>
							</div>
						</div>
					</div>
				);
			}}
		</Show>
	);
};
