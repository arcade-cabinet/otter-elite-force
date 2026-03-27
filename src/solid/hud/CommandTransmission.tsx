/**
 * CommandTransmission -- Military radio transmission dialogue panel.
 *
 * Features restored from old React version:
 * - TransmissionPortrait with atlas lookup
 * - Typewriter text reveal animation with blinking cursor
 * - "Receiving" / "Ready" status badges
 * - "Skip All" button for skipping remaining dialogue
 * - Speaker-specific dialogue colors
 * - Contextual advance labels ("Acknowledge" vs "Move Out")
 * - Riverine-camo background texture
 *
 * Reads from solidBridge dialogue() signal.
 */

import { type Component, createEffect, createMemo, createSignal, Show } from "solid-js";
import type { SolidBridgeAccessors } from "@/engine/bridge/solidBridge";
import { createTypewriter } from "./createTypewriter";
import { TransmissionPortrait } from "./TransmissionPortrait";

/** Map speakers to portrait IDs and dialogue colors. */
const SPEAKER_CONFIG: Record<string, { portraitId: string; color: string }> = {
	"Col. Bubbles": { portraitId: "col_bubbles", color: "text-amber-300" },
	FOXHOUND: { portraitId: "foxhound", color: "text-cyan-300" },
	"Gen. Whiskers": { portraitId: "gen_whiskers", color: "text-yellow-200" },
};

export const CommandTransmission: Component<{
	bridge: SolidBridgeAccessors;
	onDismiss?: () => void;
}> = (props) => {
	const dialogue = () => props.bridge.dialogue();
	const [lineIndex, setLineIndex] = createSignal(0);

	// Reset line index when dialogue changes
	createEffect(() => {
		const _d = dialogue(); // track dependency
		setLineIndex(0);
	});

	const currentLine = createMemo(() => {
		const d = dialogue();
		if (!d || d.lines.length === 0) return null;
		const idx = Math.min(lineIndex(), d.lines.length - 1);
		return d.lines[idx];
	});

	const isLastLine = createMemo(() => {
		const d = dialogue();
		if (!d) return true;
		return lineIndex() >= d.lines.length - 1;
	});

	const lineCount = createMemo(() => dialogue()?.lines.length ?? 0);

	// Typewriter effect for the current line text
	const currentText = createMemo(() => currentLine()?.text ?? "");
	const typewriter = createTypewriter(currentText, {
		charsPerSecond: 40,
	});

	const advance = () => {
		// If typewriter is still revealing, skip to full text first
		if (!typewriter.isComplete()) {
			typewriter.skip();
			return;
		}

		if (isLastLine()) {
			setLineIndex(0);
			props.onDismiss?.();
		} else {
			setLineIndex((prev) => prev + 1);
		}
	};

	const skipAll = () => {
		setLineIndex(0);
		props.onDismiss?.();
	};

	const speakerConfig = createMemo(() => {
		const line = currentLine();
		if (!line) return null;
		return SPEAKER_CONFIG[line.speaker] ?? null;
	});

	const speakerColor = createMemo(() => speakerConfig()?.color ?? "text-amber-300");

	const advanceLabel = createMemo(() => {
		if (isLastLine()) return "Move Out";
		return "Acknowledge";
	});

	const statusLabel = createMemo(() => (typewriter.isComplete() ? "Ready" : "Receiving"));

	return (
		<Show when={currentLine()}>
			{(line) => (
				<div
					data-testid="command-transmission"
					class="canvas-grain relative w-full max-w-lg overflow-hidden border border-green-500/25 bg-slate-950/92 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
				>
					{/* Camo background */}
					<div class="riverine-camo absolute inset-0 opacity-8" />

					<div class="relative z-10 flex gap-2 p-2 sm:gap-3 sm:p-3">
						{/* Portrait (compact, smaller) */}
						<div class="hidden shrink-0 sm:block">
							<TransmissionPortrait
								portraitId={speakerConfig()?.portraitId ?? null}
								speaker={line().speaker}
								compact
							/>
						</div>

						<div class="flex flex-1 flex-col gap-1.5">
							{/* Header row — single line with speaker + status */}
							<div class="flex items-center justify-between gap-2">
								<div class="flex items-center gap-1.5">
									<span
										class={`rounded border border-slate-600/50 bg-slate-900/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] ${speakerColor()}`}
									>
										{line().speaker}
									</span>
									<span
										class={`rounded border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] ${
											typewriter.isComplete()
												? "border-green-500/30 bg-green-500/10 text-green-400"
												: "border-amber-500/30 bg-amber-500/10 text-amber-300"
										}`}
									>
										{statusLabel()}
									</span>
									<Show when={lineCount() > 1}>
										<span class="font-mono text-[8px] text-slate-600">
											{lineIndex() + 1}/{lineCount()}
										</span>
									</Show>
								</div>
							</div>

							{/* Message text — compact */}
							<div class="rounded-[2px] border border-slate-600/70 bg-slate-900/35 px-3 py-2">
								<p
									data-testid="command-transmission-text"
									class="text-xs uppercase tracking-[0.1em] leading-snug text-slate-100"
								>
									{typewriter.revealedText()}
									<Show when={typewriter.showCursor()}>
										<span class="typewriter-cursor ml-0.5 inline-block w-1.5 bg-green-400 text-transparent">
											_
										</span>
									</Show>
								</p>
							</div>

							{/* Actions — compact inline */}
							<div class="flex items-center justify-end gap-2">
								<Show when={lineCount() > 1 && !isLastLine()}>
									<button
										type="button"
										class="rounded border border-slate-600/40 bg-slate-900/60 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-slate-500 transition-colors hover:border-slate-500/50 hover:text-slate-300"
										onClick={skipAll}
									>
										Skip All
									</button>
								</Show>
								<button
									type="button"
									class="rounded border border-green-500/40 bg-green-500/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-green-400 transition-colors hover:bg-green-500/20"
									onClick={advance}
								>
									{advanceLabel()}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</Show>
	);
};
