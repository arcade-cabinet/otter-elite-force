/**
 * ErrorFeedback — Visual + audio feedback for invalid commands (US-098).
 *
 * Listens for "command-error" events on the EventBus and shows brief
 * floating text or alert banner feedback that auto-dismisses in 1 second.
 *
 * Error types:
 * - "not-enough-resources": error buzz + red flash on lacking resource
 * - "cant-build-here": error buzz + red ghost indicator
 * - "population-cap": error buzz + red flash on population counter
 * - "already-researching": error buzz only
 */

import { useCallback, useEffect, useState } from "react";
import { audioEngine } from "@/audio/engine";
import { EventBus } from "@/game/EventBus";
import { cn } from "@/ui/lib/utils";

export type CommandErrorType =
	| "not-enough-resources"
	| "cant-build-here"
	| "population-cap"
	| "already-researching";

export interface CommandError {
	type: CommandErrorType;
	message: string;
	/** Optional resource that is lacking */
	resource?: "fish" | "timber" | "salvage";
}

const ERROR_MESSAGES: Record<CommandErrorType, string> = {
	"not-enough-resources": "Not enough resources",
	"cant-build-here": "Can't build here",
	"population-cap": "Population cap reached",
	"already-researching": "Already researching",
};

/** Emit a command error from any system. */
export function emitCommandError(error: Partial<CommandError> & { type: CommandErrorType }) {
	EventBus.emit("command-error", {
		...error,
		message: error.message ?? ERROR_MESSAGES[error.type],
	});
}

interface ActiveError {
	id: number;
	type: CommandErrorType;
	message: string;
	resource?: string;
}

let errorIdCounter = 0;

export function ErrorFeedback() {
	const [errors, setErrors] = useState<ActiveError[]>([]);

	const onCommandError = useCallback((error: CommandError) => {
		const id = errorIdCounter++;

		// Play error buzz SFX
		audioEngine.playSFX("errorAction");

		setErrors((prev) => {
			// Keep max 2 visible errors
			const trimmed = prev.slice(-1);
			return [...trimmed, { id, ...error }];
		});

		// Auto-dismiss after 1 second
		window.setTimeout(() => {
			setErrors((prev) => prev.filter((e) => e.id !== id));
		}, 1000);
	}, []);

	useEffect(() => {
		EventBus.on("command-error", onCommandError);
		return () => {
			EventBus.off("command-error", onCommandError);
		};
	}, [onCommandError]);

	if (errors.length === 0) return null;

	return (
		<div
			role="alert"
			aria-live="assertive"
			className="pointer-events-none absolute right-4 top-20 z-30 flex flex-col gap-1.5"
		>
			{errors.map((error) => (
				<div
					key={error.id}
					className={cn(
						"animate-in fade-in-0 slide-in-from-right-4",
						"rounded-[2px] border border-destructive/50 bg-destructive/15 px-3 py-2",
						"shadow-[0_8px_20px_rgba(0,0,0,0.4)]",
					)}
				>
					<div className="flex items-center gap-2">
						<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-destructive">
							{error.message}
						</span>
						{error.resource ? (
							<span className="rounded border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-destructive/80">
								{error.resource}
							</span>
						) : null}
					</div>
				</div>
			))}
		</div>
	);
}
