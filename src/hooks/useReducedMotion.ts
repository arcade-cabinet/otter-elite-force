/**
 * useReducedMotion — Detects prefers-reduced-motion media query (US-092).
 *
 * Returns true when the user has indicated they prefer reduced motion
 * in their OS accessibility settings. Components should use this to
 * skip typewriter effects, floating text animations, and particle
 * systems.
 */

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(): boolean {
	const [prefersReduced, setPrefersReduced] = useState(() => {
		if (typeof window === "undefined") return false;
		return window.matchMedia(QUERY).matches;
	});

	useEffect(() => {
		const mql = window.matchMedia(QUERY);
		const handler = (event: MediaQueryListEvent) => {
			setPrefersReduced(event.matches);
		};
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, []);

	return prefersReduced;
}
