import { useEffect, useState } from "react";

export type ViewportTier = "phone" | "tablet" | "desktop";
export type ShellLayout = "stacked" | "split" | "wide";
export type TacticalHudLayout = "mobile" | "tablet" | "desktop";

export interface ViewportProfile {
	width: number;
	height: number;
	shortestSide: number;
	longestSide: number;
	tier: ViewportTier;
	isPhone: boolean;
	isTablet: boolean;
	isDesktop: boolean;
	isLandscape: boolean;
	isPortrait: boolean;
}

export function classifyViewport(width: number, height: number): ViewportProfile {
	const shortestSide = Math.min(width, height);
	const longestSide = Math.max(width, height);
	const tier: ViewportTier =
		shortestSide < 640 ? "phone" : longestSide < 1280 ? "tablet" : "desktop";

	return {
		width,
		height,
		shortestSide,
		longestSide,
		tier,
		isPhone: tier === "phone",
		isTablet: tier === "tablet",
		isDesktop: tier === "desktop",
		isLandscape: width >= height,
		isPortrait: height > width,
	};
}

export function readViewportProfile(): ViewportProfile {
	if (typeof window === "undefined") {
		return classifyViewport(1280, 720);
	}

	return classifyViewport(window.innerWidth, window.innerHeight);
}

export function useViewportProfile() {
	const [profile, setProfile] = useState<ViewportProfile>(() => readViewportProfile());

	useEffect(() => {
		const update = () => setProfile(readViewportProfile());
		window.addEventListener("resize", update);
		window.addEventListener("orientationchange", update);
		return () => {
			window.removeEventListener("resize", update);
			window.removeEventListener("orientationchange", update);
		};
	}, []);

	return profile;
}

export function resolveCommandShellLayout(profile: ViewportProfile): ShellLayout {
	if (profile.isDesktop) return "wide";
	if (profile.isTablet) return "split";
	return "stacked";
}

export function resolveBriefingShellLayout(profile: ViewportProfile): ShellLayout {
	if (profile.isDesktop && profile.isLandscape) return "split";
	return "stacked";
}

export function resolveTacticalHudLayout(profile: ViewportProfile): TacticalHudLayout {
	if (profile.isPhone) return "mobile";
	if (profile.isTablet) return "tablet";
	return "desktop";
}
