/**
 * PauseOverlay — SolidJS in-game pause screen (US-F04).
 *
 * Semi-transparent dark overlay with military styling.
 * "MISSION PAUSED" title, Resume, Save, Settings, Quit buttons.
 * Save button shows feedback (Saving... / Saved!).
 */

import { type Component, createSignal, onCleanup, onMount, Show } from "solid-js";
import type { SolidBridgeEmit } from "@/engine/bridge/solidBridge";
import type { AppState } from "../appState";

const BTN =
	"min-h-11 w-full border px-4 py-2.5 font-mono text-xs uppercase tracking-[0.2em] transition-all duration-150";

export const PauseOverlay: Component<{ app: AppState; emit?: SolidBridgeEmit }> = (props) => {
	const [showQuitConfirm, setShowQuitConfirm] = createSignal(false);
	const [saveStatus, setSaveStatus] = createSignal<"idle" | "saving" | "saved">("idle");

	const handleResume = () => props.app.setScreen("game");
	const handleSettings = () => props.app.setScreen("settings");
	const handleQuit = () => {
		if (showQuitConfirm()) {
			props.app.setScreen("main-menu");
		} else {
			setShowQuitConfirm(true);
		}
	};

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key !== "Escape") return;
		event.preventDefault();
		if (showQuitConfirm()) {
			setShowQuitConfirm(false);
		} else {
			handleResume();
		}
	};

	onMount(() => window.addEventListener("keydown", onKeyDown));
	onCleanup(() => window.removeEventListener("keydown", onKeyDown));

	return (
		<div
			data-testid="pause-overlay"
			class="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
		>
			<div class="canvas-grain relative w-full max-w-sm overflow-hidden border border-accent/20 bg-background shadow-[0_32px_80px_rgba(0,0,0,0.6)]">
				<div class="riverine-camo absolute inset-0 opacity-20" />
				<div class="command-post-grid absolute inset-0 opacity-15" />

				<div class="relative z-10 grid gap-5 p-6">
					<div class="text-center">
						<div class="inline-block border border-accent/30 bg-accent/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.32em] text-accent">
							Mission Paused
						</div>
						<h2 class="mt-3 font-heading text-2xl uppercase tracking-[0.24em] text-primary">
							Operations Hold
						</h2>
						<div class="mx-auto mt-3 flex items-center justify-center gap-2">
							<div class="h-px w-8 bg-accent/25" />
							<div class="h-1 w-1 rotate-45 bg-accent/30" />
							<div class="h-px w-8 bg-accent/25" />
						</div>
					</div>

					<div class="grid gap-2">
						<button
							type="button"
							onClick={handleResume}
							class={`${BTN} border-accent/50 bg-accent/12 text-accent hover:border-accent/70 hover:bg-accent/20`}
						>
							Resume
						</button>
						<button
							type="button"
							onClick={() => {
								if (props.emit && saveStatus() !== "saving") {
									setSaveStatus("saving");
									props.emit.saveGame();
									setTimeout(() => setSaveStatus("saved"), 500);
									setTimeout(() => setSaveStatus("idle"), 2500);
								}
							}}
							disabled={saveStatus() === "saving"}
							class={`${BTN} disabled:opacity-50 ${saveStatus() === "saved" ? "border-green-500/50 bg-green-500/15 text-green-400" : "border-green-600/40 bg-green-900/15 text-green-300 hover:border-green-500/60 hover:bg-green-900/25"}`}
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
							class={`${BTN} border-border/50 bg-card/60 text-foreground hover:border-accent/40 hover:bg-card/80`}
						>
							Settings
						</button>
						<button
							type="button"
							onClick={handleQuit}
							class={`${BTN} ${showQuitConfirm() ? "border-destructive/50 bg-destructive/15 text-destructive hover:bg-destructive/25" : "border-border/50 bg-card/60 text-foreground hover:border-accent/40 hover:bg-card/80"}`}
						>
							{showQuitConfirm() ? "Confirm Quit" : "Quit to Menu"}
						</button>
						<Show when={showQuitConfirm()}>
							<div class="text-center">
								<p class="font-body text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
									Unsaved progress will be lost.
								</p>
								<button
									type="button"
									onClick={() => setShowQuitConfirm(false)}
									class="mt-1 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
								>
									Cancel
								</button>
							</div>
						</Show>
					</div>

					<div class="text-center font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/40">
						Press ESC to resume
					</div>
				</div>
			</div>
		</div>
	);
};
