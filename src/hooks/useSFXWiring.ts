/**
 * useSFXWiring — Installs the SFX event bridge when audio is ready.
 *
 * US-030: Connects EventBus gameplay events to AudioEngine.playSFX().
 * US-089: Lazy-loads the SFX bridge (and Tone.js) via dynamic import.
 *
 * Place in the root AppRouter component, after useAudioUnlock.
 */

import { useEffect } from "react";

/**
 * Hook that installs the SFX bridge when the audio engine is ready.
 * Pass the `audioReady` boolean from useAudioUnlock().
 */
export function useSFXWiring(audioReady: boolean): void {
	useEffect(() => {
		if (!audioReady) return;

		let teardown: (() => void) | null = null;

		(async () => {
			try {
				const [{ audioEngine }, { installSFXBridge }] = await Promise.all([
					import("@/audio/engine"),
					import("@/audio/sfxBridge"),
				]);
				teardown = installSFXBridge(audioEngine);
			} catch {
				// Audio bridge failed to load — degrade gracefully
			}
		})();

		return () => {
			teardown?.();
		};
	}, [audioReady]);
}
