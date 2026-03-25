/**
 * PauseOverlay — In-game pause menu (US-020).
 *
 * Triggered by Escape during gameplay. Shows Resume, Save Game, Settings,
 * and Quit to Menu buttons. Resume or Escape again unpauses.
 * Game loop doesn't tick while paused (GamePhase = "paused").
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export interface PauseOverlayProps {
	onResume: () => void;
	onSaveGame: () => void;
	onSettings: () => void;
	onQuitToMenu: () => void;
}

export function PauseOverlay({
	onResume,
	onSaveGame,
	onSettings,
	onQuitToMenu,
}: PauseOverlayProps) {
	const [showQuitConfirm, setShowQuitConfirm] = useState(false);

	const handleQuit = useCallback(() => {
		if (showQuitConfirm) {
			onQuitToMenu();
		} else {
			setShowQuitConfirm(true);
		}
	}, [showQuitConfirm, onQuitToMenu]);

	// Escape key resumes or cancels quit confirmation
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			event.preventDefault();
			if (showQuitConfirm) {
				setShowQuitConfirm(false);
			} else {
				onResume();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [onResume, showQuitConfirm]);

	return (
		<div
			data-testid="pause-overlay"
			className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
		>
			<div className="relative w-full max-w-sm rounded-lg border border-accent/25 bg-[linear-gradient(180deg,rgba(13,22,20,0.98),rgba(7,12,12,0.99))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
				<div className="riverine-camo absolute inset-0 rounded-lg opacity-30" />
				<div className="relative z-10 grid gap-4">
					<div className="text-center">
						<div className="rounded border border-accent/25 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-accent inline-block">
							Mission Paused
						</div>
						<h2 className="mt-3 font-heading text-2xl uppercase tracking-[0.22em] text-primary">
							Operations Hold
						</h2>
					</div>

					<div className="grid gap-2">
						<Button
							variant="accent"
							size="lg"
							className="w-full justify-center"
							onClick={onResume}
							data-testid="pause-resume"
						>
							Resume
						</Button>
						<Button
							variant="command"
							size="lg"
							className="w-full justify-center"
							onClick={onSaveGame}
							data-testid="pause-save"
						>
							Save Game
						</Button>
						<Button
							variant="command"
							size="lg"
							className="w-full justify-center"
							onClick={onSettings}
							data-testid="pause-settings"
						>
							Settings
						</Button>
						<Button
							variant={showQuitConfirm ? "destructive" : "command"}
							size="lg"
							className="w-full justify-center"
							onClick={handleQuit}
							data-testid="pause-quit"
						>
							{showQuitConfirm ? "Confirm Quit" : "Quit to Menu"}
						</Button>
						{showQuitConfirm ? (
							<div className="text-center">
								<p className="font-body text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
									Unsaved progress will be lost. Press again to confirm.
								</p>
								<Button
									variant="ghost"
									size="sm"
									className="mt-1"
									onClick={() => setShowQuitConfirm(false)}
								>
									Cancel
								</Button>
							</div>
						) : null}
					</div>

					<div className="text-center font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
						Press ESC to resume
					</div>
				</div>
			</div>
		</div>
	);
}
