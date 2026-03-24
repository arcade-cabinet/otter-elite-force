/**
 * Screen Orientation Lock — locks to landscape during gameplay.
 *
 * Uses the Web Screen Orientation API (supported in modern browsers)
 * as a fallback when Capacitor ScreenOrientation plugin is not available.
 * Capacitor plugin support can be added when the native build is set up.
 */

/** Lock screen to landscape orientation for gameplay. */
export async function lockLandscape(): Promise<void> {
	try {
		const orientation = screen.orientation as {
			lock?: (orientation: string) => Promise<void>;
		};
		if (orientation?.lock) {
			await orientation.lock("landscape");
		}
	} catch {
		// lock() may throw on desktop browsers — that's fine, they don't need it
	}
}

/** Unlock screen orientation (e.g., when returning to menu). */
export function unlockOrientation(): void {
	try {
		const orientation = screen.orientation as {
			unlock?: () => void;
		};
		if (orientation?.unlock) {
			orientation.unlock();
		}
	} catch {
		// Ignore errors on platforms that don't support orientation lock
	}
}
