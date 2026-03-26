/**
 * CommandTransmission — Military radio transmission dialogue panel.
 *
 * Shows dialogue speaker name and text with a command-net radio theme.
 * Includes a dismiss button to close the transmission.
 *
 * Reads from solidBridge dialogue() signal.
 */

import { Show, createSignal, createMemo, type Component } from "solid-js";
import type { SolidBridgeAccessors } from "@/engine/bridge/solidBridge";

export const CommandTransmission: Component<{
	bridge: SolidBridgeAccessors;
	onDismiss?: () => void;
}> = (props) => {
	const dialogue = () => props.bridge.dialogue();
	const [lineIndex, setLineIndex] = createSignal(0);

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

	const advance = () => {
		if (isLastLine()) {
			setLineIndex(0);
			props.onDismiss?.();
		} else {
			setLineIndex((prev) => prev + 1);
		}
	};

	return (
		<Show when={currentLine()}>
			{(line) => (
				<div
					data-testid="command-transmission"
					class="w-full max-w-xl border border-green-500/25 bg-slate-950/95 shadow-[0_18px_40px_rgba(0,0,0,0.4)]"
				>
					<div class="p-4">
						{/* Header */}
						<div class="mb-3 flex items-center justify-between gap-2">
							<div class="flex items-center gap-2">
								<span class="rounded border border-green-500/25 bg-green-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-green-400">
									Command Net
								</span>
							</div>
							<div class="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300">
								{line().speaker}
							</div>
						</div>

						{/* Message text */}
						<div class="mb-3 rounded-md border border-slate-600/70 bg-slate-900/35 px-4 py-4">
							<p
								data-testid="command-transmission-text"
								class="text-sm uppercase tracking-[0.12em] leading-relaxed text-slate-100"
							>
								{line().text}
							</p>
						</div>

						{/* Actions */}
						<div class="flex items-center justify-end gap-2">
							<button
								type="button"
								class="rounded border border-green-500/40 bg-green-500/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-green-400 hover:bg-green-500/20 transition-colors"
								onClick={advance}
							>
								{isLastLine() ? "Dismiss" : "Acknowledge"}
							</button>
						</div>
					</div>
				</div>
			)}
		</Show>
	);
};
