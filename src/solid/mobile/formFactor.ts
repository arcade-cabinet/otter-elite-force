/**
 * Form factor detection — reactive signal for phone/tablet/desktop.
 *
 * Separated from JSX so pure-TS tests can import without
 * needing the Solid JSX transform.
 */

export type FormFactor = "phone" | "tablet" | "desktop";

/**
 * Breakpoint thresholds (CSS logical pixels, portrait & landscape).
 *   phone:   < 768px
 *   tablet:  768px - 1199px
 *   desktop: >= 1200px
 */
export const TABLET_QUERY = "(min-width: 768px)";
export const DESKTOP_QUERY = "(min-width: 1200px)";

export function resolveFormFactor(): FormFactor {
	if (typeof window === "undefined") return "desktop";
	if (window.matchMedia(DESKTOP_QUERY).matches) return "desktop";
	if (window.matchMedia(TABLET_QUERY).matches) return "tablet";
	return "phone";
}
