/**
 * useTypewriter — Character-by-character text reveal hook (US-036).
 *
 * Reveals text at ~40 chars/sec (25ms per character) with configurable
 * punctuation pauses (300ms at periods, 150ms at commas).
 *
 * - Click to complete current line instantly
 * - Click again to advance to next line
 * - Optional typewriter clack SFX via AudioEngine
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { audioEngine } from "@/audio/engine";

/** Characters per second for normal reveal */
const CHARS_PER_SECOND = 40;
const BASE_DELAY_MS = Math.round(1000 / CHARS_PER_SECOND); // ~25ms

/** Pause durations for punctuation */
const PERIOD_PAUSE_MS = 300;
const COMMA_PAUSE_MS = 150;

/** Only play clack sound every N characters to avoid audio spam */
const CLACK_INTERVAL = 3;

interface UseTypewriterOptions {
	/** The full text to reveal */
	text: string;
	/** Unique key that resets the reveal (e.g. line ID) */
	key: string;
	/** Whether to play typewriter clack sounds (default: true) */
	sound?: boolean;
	/** Whether the typewriter is active/enabled (default: true) */
	enabled?: boolean;
}

interface UseTypewriterResult {
	/** The currently visible portion of the text */
	visibleText: string;
	/** Whether characters are still being revealed */
	isRevealing: boolean;
	/** Whether all text has been revealed */
	isComplete: boolean;
	/** Number of characters currently revealed */
	revealedCount: number;
	/** Complete the current line instantly, or advance if already complete */
	handleInput: () => "completed-line" | "already-complete";
	/** Skip all remaining text immediately */
	skipAll: () => void;
}

export function useTypewriter({
	text,
	key,
	sound = true,
	enabled = true,
}: UseTypewriterOptions): UseTypewriterResult {
	const [revealedCount, setRevealedCount] = useState(0);
	const clackCounterRef = useRef(0);
	const prevKeyRef = useRef(key);

	// Reset when key changes (new line of dialogue)
	if (prevKeyRef.current !== key) {
		prevKeyRef.current = key;
		setRevealedCount(0);
		clackCounterRef.current = 0;
	}

	// Reset when disabled
	useEffect(() => {
		if (!enabled) {
			setRevealedCount(text.length);
		}
	}, [enabled, text.length]);

	const isRevealing = enabled && revealedCount < text.length;
	const isComplete = revealedCount >= text.length;

	// Character-by-character reveal timer
	useEffect(() => {
		if (!isRevealing) return;

		const currentChar = text[revealedCount];
		const prevChar = revealedCount > 0 ? text[revealedCount - 1] : "";

		// Calculate delay based on the character we just revealed
		let delay = BASE_DELAY_MS;
		if (prevChar === "." || prevChar === "!" || prevChar === "?") {
			delay = PERIOD_PAUSE_MS;
		} else if (prevChar === "," || prevChar === ";" || prevChar === ":") {
			delay = COMMA_PAUSE_MS;
		}

		const timeoutId = window.setTimeout(() => {
			setRevealedCount((c) => {
				const next = Math.min(c + 1, text.length);

				// Play typewriter clack sound (throttled)
				if (sound && currentChar && currentChar !== " ") {
					clackCounterRef.current++;
					if (clackCounterRef.current % CLACK_INTERVAL === 0) {
						audioEngine.playSFX("typewriterClack");
					}
				}

				return next;
			});
		}, delay);

		return () => window.clearTimeout(timeoutId);
	}, [isRevealing, revealedCount, text, sound]);

	const handleInput = useCallback((): "completed-line" | "already-complete" => {
		if (isRevealing) {
			setRevealedCount(text.length);
			return "completed-line";
		}
		return "already-complete";
	}, [isRevealing, text.length]);

	const skipAll = useCallback(() => {
		setRevealedCount(text.length);
	}, [text.length]);

	return {
		visibleText: text.slice(0, revealedCount),
		isRevealing,
		isComplete,
		revealedCount,
		handleInput,
		skipAll,
	};
}
