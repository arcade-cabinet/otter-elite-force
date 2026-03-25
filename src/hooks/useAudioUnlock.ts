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
 */

import { useEffect, useRef, useState } from "react";
import { audioEngine } from "@/audio/engine";

/**
 * Hook that unlocks the Web Audio context on first user gesture.
 * Returns a boolean indicating whether audio is ready.
 */
export function useAudioUnlock(): boolean {
	const [ready, setReady] = useState(audioEngine.isReady);
	const initializingRef = useRef(false);

	useEffect(() => {
		if (audioEngine.isReady) {
			setReady(true);
			return;
		}

		const handleGesture = async () => {
			if (initializingRef.current || audioEngine.isReady) return;
			initializingRef.current = true;

			try {
				await audioEngine.init();
				setReady(true);
			} catch {
				// Audio initialization failed — degrade gracefully.
				// The game remains playable without audio.
				initializingRef.current = false;
			}

			// Remove listeners after successful init
			if (audioEngine.isReady) {
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
