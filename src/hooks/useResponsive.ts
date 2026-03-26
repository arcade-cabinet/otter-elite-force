/**
 * Responsive Hook for Browser Device Detection
 *
 * Properly detects:
 * - Screen dimensions (window.innerWidth / innerHeight)
 * - Orientation (portrait/landscape)
 * - Device type (phone/tablet/desktop)
 * - Resize and orientation-change events
 */

import { useEffect, useState } from "react";

export type Orientation = "portrait" | "landscape";
export type DeviceType = "phone" | "tablet" | "foldable" | "desktop";

interface ResponsiveState {
	width: number;
	height: number;
	orientation: Orientation;
	deviceType: DeviceType;
	isSmall: boolean; // < 400px width
	isMedium: boolean; // 400-768px width
	isLarge: boolean; // 768-1024px width
	isXLarge: boolean; // > 1024px width
	aspectRatio: number;
	scale: number;
	fontScale: number;
}

/**
 * Determine device type based on dimensions
 */
function getDeviceType(width: number, height: number): DeviceType {
	const shortEdge = Math.min(width, height);
	const longEdge = Math.max(width, height);

	// Foldable detection: unusual aspect ratios or very large screens on mobile
	const aspectRatio = longEdge / shortEdge;
	if (aspectRatio > 2.2 || (shortEdge > 600 && longEdge > 2000)) {
		return "foldable";
	}

	// Tablet: short edge > 600px
	if (shortEdge >= 600 && shortEdge < 1024) {
		return "tablet";
	}

	// Desktop: short edge >= 1024px
	if (shortEdge >= 1024) {
		return "desktop";
	}

	return "phone";
}

function getWindowDimensions(): { width: number; height: number } {
	return {
		width: typeof window !== "undefined" ? window.innerWidth : 1024,
		height: typeof window !== "undefined" ? window.innerHeight : 768,
	};
}

/**
 * Custom hook for responsive layout
 */
export function useResponsive(): ResponsiveState {
	const [dimensions, setDimensions] = useState(getWindowDimensions);

	useEffect(() => {
		function handleResize() {
			setDimensions(getWindowDimensions());
		}

		window.addEventListener("resize", handleResize);
		window.addEventListener("orientationchange", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("orientationchange", handleResize);
		};
	}, []);

	const { width, height } = dimensions;
	const orientation: Orientation = width > height ? "landscape" : "portrait";
	const deviceType = getDeviceType(width, height);
	const aspectRatio = height > 0 ? width / height : 1;
	const scale = typeof window !== "undefined" ? window.devicePixelRatio : 1;
	const fontScale = 1;

	return {
		width,
		height,
		orientation,
		deviceType,
		isSmall: width < 400,
		isMedium: width >= 400 && width < 768,
		isLarge: width >= 768 && width < 1024,
		isXLarge: width >= 1024,
		aspectRatio,
		scale,
		fontScale,
	};
}

/**
 * Hook to detect when device orientation changes
 */
export function useOrientation(): Orientation {
	const { orientation } = useResponsive();
	return orientation;
}

/**
 * Hook to detect foldable device state
 */
export function useFoldable() {
	const { deviceType, width, height } = useResponsive();

	const isFoldable = deviceType === "foldable";
	const isFolded = isFoldable && Math.min(width, height) < 500;
	const isUnfolded = isFoldable && !isFolded;

	return {
		isFoldable,
		isFolded,
		isUnfolded,
	};
}
