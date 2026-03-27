/**
 * PauseOverlay — SolidJS in-game pause screen (US-F04).
 *
 * Semi-transparent overlay with Resume, Save, Settings, and Quit to Menu buttons.
 * Save dispatches saveGame() through the bridge command queue.
 */

import { type Component, createSignal, onCleanup, onMount, Show } from "solid-js";
import type { SolidBridgeEmit } from "@/engine/bridge/solidBridge";
import type { AppState } from "../appState";

export const PauseOverlay: Component<{ app: AppState; emit?: SolidBridgeEmit }> = (props) => {
	const [showQuitConfirm, setShowQuitConfirm] = createSignal(false);
	const [saveStatus, setSaveStatus] = createSignal<"idle" | "saving" | "saved">("idle");

	const handleResume = () => {
		props.app.setScreen("game");
	};

	const handleSettings = () => {
		props.app.setScreen("settings");
	};

	const handleQuit = () => {
		if (showQuitConfirm()) {
			props.app.setScreen("main-menu");
		} else {
			setShowQuitConfirm(true);
		}
	};

	// Escape key resumes or cancels quit confirmation
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key !== "Escape") return;
		event.preventDefault();
		if (showQuitConfirm()) {
			setShowQuitConfirm(false);
		} else {
			handleResume();
		}
	};

	onMount(() => {
		window.addEventListener("keydown", onKeyDown);
	});

	onCleanup(() => {
		window.removeEventListener("keydown", onKeyDown);
	});

	return (
		<div
			data-testid="pause-overlay"
			class="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
		>
			<div class="relative w-full max-w-sm rounded-none border border-accent/25 bg-gradient-to-b from-slate-950/98 to-slate-900/99 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
				<div class="riverine-camo absolute inset-0 rounded-none opacity-30" />
				<div class="relative z-10 grid gap-4">
					{/* Header */}
					<div class="text-center">
						<div class="inline-block rounded border border-accent/25 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
							Mission Paused
						</div>
						<h2 class="mt-3 font-heading text-2xl uppercase tracking-[0.22em] text-primary">
							Operations Hold
						</h2>
					</div>

					{/* Buttons */}
					<div class="grid gap-2">
						<button
							type="button"
							onClick={handleResume}
							class="min-h-11 w-full rounded border border-accent/60 bg-accent/15 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent/25"
						>
							Resume
						</button>
						<button
							type="button"
							onClick={() => {
								if (props.emit && saveStatus() !== "saving") {
									setSaveStatus("saving");
									props.emit.saveGame();
									// Optimistic feedback — the actual save is async in the runtime
									setTimeout(() => setSaveStatus("saved"), 500);
									setTimeout(() => setSaveStatus("idle"), 2500);
								}
							}}
							disabled={saveStatus() === "saving"}
							class="min-h-11 w-full rounded border border-emerald-600/60 bg-emerald-900/20 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-emerald-300 transition-colors hover:bg-emerald-900/40 disabled:opacity-50"
						>
							{saveStatus() === "saving"
								? "Saving..."
								: saveStatus() === "saved"
									? "Saved"
									: "Save Game"}
						</button>
						<button
							type="button"
							onClick={handleSettings}
							class="min-h-11 w-full rounded border border-slate-600/70 bg-slate-900/85 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-slate-100 transition-colors hover:border-accent/50 hover:bg-slate-800/85"
						>
							Settings
						</button>
						<button
							type="button"
							onClick={handleQuit}
							class={`min-h-11 w-full rounded border px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
								showQuitConfirm()
									? "border-red-600/60 bg-red-900/30 text-red-300 hover:bg-red-900/50"
									: "border-slate-600/70 bg-slate-900/85 text-slate-100 hover:border-accent/50 hover:bg-slate-800/85"
							}`}
						>
							{showQuitConfirm() ? "Confirm Quit" : "Quit to Menu"}
						</button>
						<Show when={showQuitConfirm()}>
							<div class="text-center">
								<p class="font-body text-[10px] uppercase tracking-[0.14em] text-slate-500">
									Unsaved progress will be lost. Press again to confirm.
								</p>
								<button
									type="button"
									onClick={() => setShowQuitConfirm(false)}
									class="mt-1 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400 transition-colors hover:text-slate-100"
								>
									Cancel
								</button>
							</div>
						</Show>
					</div>

					<div class="text-center font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
						Press ESC to resume
					</div>
				</div>
			</div>
		</div>
	);
};
