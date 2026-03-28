/**
 * BriefingOverlay — SolidJS mission briefing screen (US-F04).
 *
 * Classified military dossier aesthetic: manila folder paper, "CLASSIFIED"
 * stamp, mission code in stencil, typewriter briefing text, commander portrait
 * placeholder, objectives list with checkbox-style bullets, prominent DEPLOY
 * button, and pawprint seal at bottom.
 */

import { type Component, createEffect, createMemo, For, Show } from "solid-js";
import { getPortraitCanvas } from "@/canvas/portraitRenderer";
import { getMissionById } from "@/entities/missions";
import type { AppState } from "../appState";

/** Commander portrait rendered from the canvas portrait renderer. */
const BriefingPortrait: Component<{ portraitId: string | null }> = (props) => {
	let containerRef: HTMLDivElement | undefined;

	createEffect(() => {
		if (!containerRef || !props.portraitId) return;
		if (typeof document === "undefined") return;
		const canvas = getPortraitCanvas(props.portraitId);
		if (!canvas) return;
		while (containerRef.firstChild) {
			containerRef.removeChild(containerRef.firstChild);
		}
		const clone = canvas.cloneNode(true) as HTMLCanvasElement;
		clone.style.width = "64px";
		clone.style.height = "64px";
		clone.style.imageRendering = "pixelated";
		clone.style.display = "block";
		clone.setAttribute("role", "img");
		clone.setAttribute("aria-label", `Commander portrait`);
		containerRef.appendChild(clone);
	});

	return (
		<div
			ref={containerRef}
			class="hidden h-20 w-16 shrink-0 items-center justify-center border border-rust-600/30 bg-rust-800/10 sm:flex"
		>
			<Show when={!props.portraitId}>
				<span class="font-mono text-[8px] uppercase tracking-[0.2em] text-rust-700/50">CDR</span>
			</Show>
		</div>
	);
};

/** Decorative pawprint SVG (otter paw "stamp" signature / seal). */
const PawprintSeal: Component = () => {
	return (
		<div class="flex flex-col items-center gap-1">
			<svg aria-hidden="true" viewBox="0 0 40 44" class="h-12 w-12" fill="none">
				<ellipse cx="20" cy="28" rx="9" ry="10" fill="#6b3a26" opacity="0.5" />
				<ellipse cx="11" cy="15" rx="4" ry="5" fill="#6b3a26" opacity="0.4" />
				<ellipse cx="20" cy="11" rx="4" ry="5" fill="#6b3a26" opacity="0.4" />
				<ellipse cx="29" cy="15" rx="4" ry="5" fill="#6b3a26" opacity="0.4" />
			</svg>
			<span class="font-mono text-[7px] uppercase tracking-[0.3em] text-rust-700/50">Verified</span>
		</div>
	);
};

/** Checkbox-style bullet for objectives. */
const ObjectiveBullet: Component<{ completed?: boolean }> = (props) => {
	return (
		<span class="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center border border-rust-600/50 bg-rust-800/20">
			<Show when={props.completed}>
				<span class="text-[8px] text-green-700">&#x2713;</span>
			</Show>
		</span>
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
		<div class="flex min-h-screen w-screen flex-col items-center bg-background text-foreground">
			<div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.7)_100%)]" />

			<div class="relative z-10 flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
				<div class="flex flex-col items-center gap-2 text-center">
					<div class="inline-block border border-accent/30 bg-accent/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.32em] text-accent">
						Mission Briefing
					</div>
				</div>

				<div class="briefing-manila-paper relative overflow-hidden border border-rust-600/40 p-6 text-slate-900 sm:p-8">
					<div class="briefing-paper-grain pointer-events-none absolute inset-0" />
					<div class="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-gradient-to-b from-transparent via-rust-800/15 to-transparent" />
					<div class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-rust-800/10 to-transparent" />
					<div
						class="pointer-events-none absolute bottom-8 right-12 h-16 w-16 rounded-full opacity-[0.04]"
						style={{ background: "radial-gradient(circle, #5c3a1a, transparent 70%)" }}
						aria-hidden="true"
					/>
					<div
						class="pointer-events-none absolute right-5 top-5 rotate-[-8deg] border-[2.5px] border-red-700/60 px-4 py-1.5 font-heading text-sm uppercase tracking-[0.35em] text-red-700/70 sm:right-8 sm:top-8"
						aria-hidden="true"
					>
						CLASSIFIED
					</div>

					<div class="relative mb-5">
						<div class="font-heading text-xl uppercase tracking-[0.28em] text-rust-900 sm:text-2xl">
							{missionCode()}
						</div>
						<div class="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-rust-700/70">
							Field Operations Dossier
						</div>
					</div>

					<div class="relative mb-5 flex gap-2" aria-hidden="true">
						<div class="h-3 w-20 bg-slate-900/80" />
						<div class="h-3 w-32 bg-slate-900/80" />
						<div class="h-3 w-14 bg-slate-900/80" />
					</div>

					<div class="relative mb-5 flex items-start gap-4">
						<BriefingPortrait portraitId={mission()?.briefing.portraitId ?? null} />
						<div class="flex-1">
							<Show when={mission()}>
								{(m) => (
									<>
										<h2 class="font-heading text-2xl uppercase tracking-[0.22em] text-rust-900">
											{m().name}
										</h2>
										<p class="mt-1 font-body text-xs uppercase tracking-[0.12em] text-rust-700/70">
											{m().subtitle}
										</p>
									</>
								)}
							</Show>
						</div>
					</div>

					<Show when={mission()}>
						{(m) => (
							<>
								<div class="relative mt-4 space-y-3">
									<For each={m().briefing.lines}>
										{(line) => (
											<div class="border-l-2 border-rust-600/30 pl-3">
												<div class="font-mono text-[9px] uppercase tracking-[0.24em] text-rust-700/60">
													{line.speaker}
												</div>
												<p class="mt-0.5 font-body text-sm leading-relaxed tracking-[0.06em] text-slate-800/90">
													{line.text}
												</p>
											</div>
										)}
									</For>
								</div>
								<div class="relative mt-6">
									<div class="mb-2 font-mono text-[10px] uppercase tracking-[0.26em] text-rust-700/80">
										Primary Objectives
									</div>
									<ul class="space-y-2">
										<For each={m().objectives.primary}>
											{(obj) => (
												<li class="flex items-start gap-2.5">
													<ObjectiveBullet />
													<span class="font-body text-xs uppercase tracking-[0.08em] text-slate-800">
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
						<p class="relative font-body text-sm uppercase tracking-[0.12em] text-rust-700/70">
							Intel is being compiled. Deploy when ready, Captain.
						</p>
					</Show>

					<div class="relative mt-8 border-t border-rust-600/30 pt-4">
						<div class="flex items-end justify-between gap-4">
							<div class="grid gap-1">
								<div class="font-mono text-[9px] uppercase tracking-[0.24em] text-rust-700/60">
									Authorized by
								</div>
								<div class="font-heading text-sm uppercase tracking-[0.22em] text-rust-900">
									CDR. LUTRA
								</div>
								<div class="mt-1 h-px w-24 bg-rust-700/30" />
							</div>
							<PawprintSeal />
						</div>
					</div>
				</div>

				<div class="flex flex-col items-center gap-3">
					<button
						type="button"
						onClick={() => props.app.setScreen("game")}
						class="group relative min-h-12 w-full max-w-md overflow-hidden border-2 border-accent/60 bg-accent/15 px-6 py-3.5 font-heading text-base uppercase tracking-[0.22em] text-accent transition-all duration-200 hover:border-accent/80 hover:bg-accent/25 hover:shadow-[0_0_24px_rgba(255,226,138,0.15)]"
					>
						<div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
							<div class="radar-sweep absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-accent/10 to-transparent" />
						</div>
						<span class="relative z-10">Deploy</span>
					</button>
					<button
						type="button"
						onClick={() => props.app.setScreen("campaign")}
						class="min-h-11 w-full max-w-md border border-border/50 bg-card/60 px-6 py-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
					>
						Back
					</button>
				</div>
			</div>
		</div>
	);
};
