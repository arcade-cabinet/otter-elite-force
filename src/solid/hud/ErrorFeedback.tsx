/**
 * ErrorFeedback — Toast-style error message banner.
 *
 * Shows error messages that auto-dismiss after a configurable timeout.
 * Uses red/amber styling consistent with the military HUD theme.
 *
 * State management lives in errorState.ts for testability.
 */

import { type Component, For } from "solid-js";

// Re-export state management for consumers
export { createErrorFeedback, type ErrorMessage } from "./errorState";

export const ErrorFeedback: Component<{
	errors: () => import("./errorState").ErrorMessage[];
}> = (props) => {
	return (
		<div
			role="alert"
			aria-live="assertive"
			data-testid="error-feedback"
			class="pointer-events-none flex flex-col gap-1.5"
		>
			<For each={props.errors()}>
				{(error) => (
					<div class="rounded-[2px] border border-rose-500/50 bg-rose-950/15 px-3 py-2 shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
						<div class="flex items-center gap-2">
							<span class="font-mono text-[10px] uppercase tracking-[0.22em] text-rose-400">
								{error.message}
							</span>
						</div>
					</div>
				)}
			</For>
		</div>
	);
};
