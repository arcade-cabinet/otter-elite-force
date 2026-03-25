/**
 * useAudioUnlock — Initialize the Tone.js audio context on first user gesture.
 *
 * WebKit (Safari/iOS) and Chrome require `Tone.start()` to be called
 * inside a user gesture handler (click, tap, keypress). This hook
 * registers a one-shot listener on the document that initializes the
 * AudioEngine on the first pointer or keyboard event.
 *
 * The hook is idempotent — multiple calls won't create duplicate listeners
 * or re-initialize the engine. Call it once in the root App component.
 *
 * US-029: Audio unlock on first user gesture
 * US-089: Lazy-loads Tone.js via dynamic import (not in initial bundle)
 */

import { useEffect, useRef, useState } from "react";

// Lazy reference to the audio engine — loaded on first user gesture
let audioEngineRef: Awaited<typeof import("@/audio/engine")>["audioEngine"] | null = null;

/**
 * Hook that unlocks the Web Audio context on first user gesture.
 * Returns a boolean indicating whether audio is ready.
 */
export function useAudioUnlock(): boolean {
	const [ready, setReady] = useState(false);
	const initializingRef = useRef(false);

	useEffect(() => {
		if (audioEngineRef?.isReady) {
			setReady(true);
			return;
		}

		const handleGesture = async () => {
			if (initializingRef.current) return;
			if (audioEngineRef?.isReady) {
				setReady(true);
				removeListeners();
				return;
			}
			initializingRef.current = true;

			try {
				// Lazy-load the audio engine (and Tone.js) on first user gesture
				const { audioEngine } = await import("@/audio/engine");
				audioEngineRef = audioEngine;
				await audioEngine.init();
				setReady(true);
			} catch {
				// Audio initialization failed — degrade gracefully.
				// The game remains playable without audio.
				initializingRef.current = false;
			}

			// Remove listeners after successful init
			if (audioEngineRef?.isReady) {
				removeListeners();
			}
		};

		const events = ["pointerdown", "mousedown", "touchstart", "keydown"] as const;

		const removeListeners = () => {
			for (const event of events) {
				document.removeEventListener(event, handleGesture, true);
			}
		};

		for (const event of events) {
			document.addEventListener(event, handleGesture, { capture: true, once: false });
		}

		return removeListeners;
	}, []);

	return ready;
}
