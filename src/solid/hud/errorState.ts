/**
 * Error feedback state management — pure TS (no JSX).
 *
 * Separated from ErrorFeedback.tsx so tests can import without
 * needing the Solid JSX transform.
 */

import { createSignal } from "solid-js";

export interface ErrorMessage {
	id: number;
	message: string;
}

let errorIdCounter = 0;

const DEFAULT_TIMEOUT_MS = 2000;

/**
 * Creates a push function and reactive error list.
 * Call pushError(message) to show a new error toast.
 */
export function createErrorFeedback(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
	const [errors, setErrors] = createSignal<ErrorMessage[]>([]);

	function pushError(message: string): void {
		const id = errorIdCounter++;
		setErrors((prev) => [...prev.slice(-1), { id, message }]);

		window.setTimeout(() => {
			setErrors((prev) => prev.filter((e) => e.id !== id));
		}, timeoutMs);
	}

	return { errors, pushError };
}
