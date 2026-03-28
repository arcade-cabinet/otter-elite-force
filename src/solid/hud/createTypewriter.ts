/**
 * createTypewriter -- SolidJS reactive primitive for typewriter text reveal.
 *
 * Reveals text character by character at a configurable speed.
 * Returns an accessor for the currently revealed portion and a cursor state.
 * Supports skipping to the full text instantly.
 *
 * Usage:
 *   const { revealedText, isComplete, showCursor, skip } = createTypewriter(
 *     () => dialogue().text,
 *     { charsPerSecond: 40 }
 *   );
 */

import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";

export interface TypewriterOptions {
	/** Characters revealed per second (default: 40) */
	charsPerSecond?: number;
	/** Delay before starting the reveal in ms (default: 0) */
	startDelay?: number;
	/** Called when the full text has been revealed */
	onComplete?: () => void;
}

export interface TypewriterResult {
	/** The portion of text revealed so far */
	revealedText: Accessor<string>;
	/** Whether the full text has been revealed */
	isComplete: Accessor<boolean>;
	/** Whether the blinking cursor should be visible */
	showCursor: Accessor<boolean>;
	/** Skip to the full text immediately */
	skip: () => void;
	/** Reset and restart the typewriter with the current text */
	restart: () => void;
}

export function createTypewriter(
	text: Accessor<string>,
	options?: TypewriterOptions,
): TypewriterResult {
	const charsPerSecond = options?.charsPerSecond ?? 40;
	const startDelay = options?.startDelay ?? 0;
	const intervalMs = 1000 / charsPerSecond;

	const [charIndex, setCharIndex] = createSignal(0);
	const [started, setStarted] = createSignal(startDelay === 0);

	let intervalId: ReturnType<typeof setInterval> | undefined;
	let delayId: ReturnType<typeof setTimeout> | undefined;

	const cleanup = () => {
		if (intervalId !== undefined) {
			clearInterval(intervalId);
			intervalId = undefined;
		}
		if (delayId !== undefined) {
			clearTimeout(delayId);
			delayId = undefined;
		}
	};

	const startReveal = () => {
		cleanup();
		const fullText = text();
		if (fullText.length === 0) return;

		intervalId = setInterval(() => {
			setCharIndex((prev) => {
				const next = prev + 1;
				if (next >= fullText.length) {
					cleanup();
					options?.onComplete?.();
					return fullText.length;
				}
				return next;
			});
		}, intervalMs);
	};

	// React to text changes: reset and restart
	createEffect(() => {
		const _fullText = text(); // track dependency
		setCharIndex(0);
		setStarted(startDelay === 0);

		if (startDelay > 0) {
			cleanup();
			delayId = setTimeout(() => {
				setStarted(true);
				startReveal();
			}, startDelay);
		} else {
			startReveal();
		}
	});

	// Start interval when started becomes true (handles delay case)
	createEffect(() => {
		if (started() && charIndex() === 0 && text().length > 0) {
			startReveal();
		}
	});

	onCleanup(cleanup);

	const revealedText = () => {
		const full = text();
		const idx = charIndex();
		if (!started()) return "";
		return full.slice(0, idx);
	};

	const isComplete = () => {
		const full = text();
		return charIndex() >= full.length;
	};

	const showCursor = () => started() && !isComplete();

	const skip = () => {
		cleanup();
		setCharIndex(text().length);
		setStarted(true);
		options?.onComplete?.();
	};

	const restart = () => {
		setCharIndex(0);
		setStarted(startDelay === 0);
		if (startDelay > 0) {
			cleanup();
			delayId = setTimeout(() => {
				setStarted(true);
				startReveal();
			}, startDelay);
		} else {
			startReveal();
		}
	};

	return {
		revealedText,
		isComplete,
		showCursor,
		skip,
		restart,
	};
}
