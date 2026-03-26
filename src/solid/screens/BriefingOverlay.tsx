/**
 * BriefingOverlay — SolidJS mission briefing screen (US-F04).
 *
 * Shows mission title, commander portrait placeholder, mission description,
 * lists primary objectives. "Deploy" button transitions to game screen.
 * Uses mission definition data from CAMPAIGN.
 */

import { type Component, For, Show, createMemo } from "solid-js";
import { getMissionById } from "@/entities/missions";
import type { AppState } from "../appState";

/**
 * Decorative pawprint SVG (otter paw "stamp" signature).
 */
const PawprintSignature: Component = () => {
	return (
		<svg aria-hidden="true" viewBox="0 0 40 44" class="h-10 w-10 opacity-50" fill="none">
			<ellipse cx="20" cy="28" rx="9" ry="10" fill="#6b3a26" opacity="0.7" />
			<ellipse cx="11" cy="15" rx="4" ry="5" fill="#6b3a26" opacity="0.6" />
			<ellipse cx="20" cy="11" rx="4" ry="5" fill="#6b3a26" opacity="0.6" />
			<ellipse cx="29" cy="15" rx="4" ry="5" fill="#6b3a26" opacity="0.6" />
		</svg>
	);
};

export const BriefingOverlay: Component<{ app: AppState }> = (props) => {
	const mission = createMemo(() => {
		const id = props.app.currentMissionId();
		if (!id) return null;
		return getMissionById(id) ?? null;
	});

	const missionCode = createMemo(() => {
		const m = mission();
		if (!m) return "UNKNOWN";
		return `OP-${m.name.toUpperCase().replace(/\s+/g, "-")}`;
	});

	return (
		<div class="flex min-h-screen w-screen flex-col items-center bg-slate-950 text-slate-100">
			<div class="relative z-10 flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
				{/* Mission badge */}
				<div class="flex flex-col items-center gap-2 text-center">
					<div class="inline-block border border-accent/25 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
						Mission Briefing
					</div>
				</div>

				{/* Manila-style briefing card */}
				<div class="relative overflow-hidden rounded-none border border-amber-700/40 bg-gradient-to-b from-amber-50/90 to-amber-100/80 p-6 text-slate-900 shadow-lg sm:p-8">
					{/* Paper grain texture (decorative) */}
					<div class="pointer-events-none absolute inset-0 opacity-20 mix-blend-multiply" />

					{/* Fold line */}
					<div class="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-gradient-to-b from-transparent via-amber-800/20 to-transparent" />

					{/* Classification stamp */}
					<div
						class="pointer-events-none absolute right-6 top-6 rotate-[-8deg] rounded border-2 border-red-700/70 px-4 py-1.5 font-heading text-sm uppercase tracking-[0.3em] text-red-700/80"
						aria-hidden="true"
					>
						CLASSIFIED
					</div>

					{/* Mission code */}
					<div class="mb-4">
						<div class="font-heading text-xl uppercase tracking-[0.28em] text-amber-900 sm:text-2xl">
							{missionCode()}
						</div>
						<div class="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-700">
							Field Operations Dossier
						</div>
					</div>

					{/* Redacted bars (decorative) */}
					<div class="mb-4 flex gap-2" aria-hidden="true">
						<div class="h-3 w-20 rounded-none bg-slate-900/80" />
						<div class="h-3 w-32 rounded-none bg-slate-900/80" />
						<div class="h-3 w-14 rounded-none bg-slate-900/80" />
					</div>

					{/* Mission title and subtitle */}
					<Show when={mission()}>
						{(m) => (
							<>
								<h2 class="font-heading text-2xl uppercase tracking-[0.22em] text-amber-900">
									{m().name}
								</h2>
								<p class="mt-1 font-body text-xs uppercase tracking-[0.12em] text-amber-800/80">
									{m().subtitle}
								</p>

								{/* Briefing lines */}
								<div class="mt-6 space-y-3">
									<For each={m().briefing.lines}>
										{(line) => (
											<div class="border-l-2 border-amber-700/30 pl-3">
												<div class="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-700">
													{line.speaker}
												</div>
												<p class="mt-0.5 font-body text-sm uppercase leading-relaxed tracking-[0.12em] text-slate-800/90">
													{line.text}
												</p>
											</div>
										)}
									</For>
								</div>

								{/* Primary objectives */}
								<div class="mt-6">
									<div class="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-amber-700">
										Primary Objectives
									</div>
									<ul class="space-y-1.5">
										<For each={m().objectives.primary}>
											{(obj) => (
												<li class="flex items-start gap-2">
													<span class="mt-0.5 font-mono text-xs text-amber-700">
														&#x25A0;
													</span>
													<span class="font-body text-xs uppercase tracking-[0.1em] text-slate-800">
														{obj.description}
													</span>
												</li>
											)}
										</For>
									</ul>
								</div>
							</>
						)}
					</Show>

					<Show when={!mission()}>
						<p class="font-body text-sm uppercase tracking-[0.12em] text-amber-800/80">
							Intel is being compiled. Deploy when ready, Captain.
						</p>
					</Show>

					{/* Signature block */}
					<div class="mt-8 border-t border-amber-700/40 pt-4">
						<div class="flex items-end justify-between gap-4">
							<div class="grid gap-1">
								<div class="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-700">
									Authorized by
								</div>
								<div class="font-heading text-sm uppercase tracking-[0.2em] text-amber-900">
									CDR. LUTRA
								</div>
							</div>
							<PawprintSignature />
						</div>
					</div>
				</div>

				{/* Action buttons */}
				<div class="flex flex-col items-center gap-3">
					<button
						type="button"
						onClick={() => props.app.setScreen("game")}
						class="min-h-11 w-full max-w-md rounded border border-accent/60 bg-accent/15 px-6 py-3 font-heading text-sm uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent/25"
					>
						Deploy
					</button>
					<button
						type="button"
						onClick={() => props.app.setScreen("campaign")}
						class="min-h-11 w-full max-w-md rounded border border-slate-600/70 bg-slate-900/85 px-6 py-2 font-mono text-xs uppercase tracking-[0.18em] text-slate-100 transition-colors hover:border-accent/50 hover:bg-slate-800/85"
					>
						Back
					</button>
				</div>
			</div>
		</div>
	);
};
