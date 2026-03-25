/**
 * ResponsiveHUD — Breakpoint-adaptive HUD layout for phone, tablet, and desktop.
 *
 * US-061: Touch target sizing validation (44px minimum)
 * US-062: Phone breakpoint (< 600px) — bottom-screen thumb-reachable ActionBar
 * US-063: Tablet breakpoint (600-1024px) — comfortable sidebar option
 * US-064: Desktop breakpoint (> 1024px) — classic RTS sidebar + tooltips
 *
 * Renders the same HUD components at all breakpoints, but rearranges them
 * to match the ergonomics of each device class. Uses CSS classes and the
 * viewport profile hook from @/ui/layout/viewport.
 */

import { type ReactNode, useCallback, useState } from "react";
import { EventBus } from "@/game/EventBus";
import {
	resolveTacticalHudLayout,
	type TacticalHudLayout,
	useViewportProfile,
} from "@/ui/layout/viewport";
import { cn } from "@/ui/lib/utils";

// ---------------------------------------------------------------------------
// US-061: Touch target minimum size constants
// ---------------------------------------------------------------------------

/** Minimum touch target in px — WCAG / Apple HIG / Material Design guideline. */
export const MIN_TOUCH_TARGET = 44;

/** CSS class that enforces 44px min-width and min-height on interactive elements. */
export const touchTargetClass = "min-w-[44px] min-h-[44px]";

// ---------------------------------------------------------------------------
// Minimap enlargement (US-060)
// ---------------------------------------------------------------------------

interface MinimapWrapperProps {
	children: ReactNode;
	hudLayout: TacticalHudLayout;
}

/**
 * US-060: Wraps the minimap with a tap-to-enlarge behavior on mobile/tablet.
 * Tapping the minimap toggles between compact and 40% viewport size.
 */
export function MinimapWrapper({ children, hudLayout }: MinimapWrapperProps) {
	const [enlarged, setEnlarged] = useState(false);

	if (hudLayout === "desktop") {
		// Desktop: no enlargement, render as-is
		return <div data-testid="minimap-wrapper">{children}</div>;
	}

	return (
		<button
			type="button"
			data-testid="minimap-wrapper"
			data-enlarged={enlarged}
			className={cn(
				"block transition-all duration-200 ease-out",
				enlarged
					? "fixed bottom-4 right-4 z-40 h-[40vh] w-[40vh] max-h-[300px] max-w-[300px] rounded-xl border-2 border-accent/40 bg-card/95 shadow-[0_24px_48px_rgba(0,0,0,0.5)]"
					: "relative w-full",
			)}
			onClick={() => setEnlarged((v) => !v)}
			aria-label={enlarged ? "Shrink minimap" : "Enlarge minimap"}
		>
			{children}
		</button>
	);
}

// ---------------------------------------------------------------------------
// US-062/063/064: Breakpoint-specific HUD slot props
// ---------------------------------------------------------------------------

interface ResponsiveHUDProps {
	/** Resource bar (Fish, Timber, Salvage, Pop) */
	resourceBar: ReactNode;
	/** Minimap component */
	minimap: ReactNode;
	/** Unit info panel */
	unitPanel: ReactNode;
	/** Action / command bar */
	actionBar: ReactNode;
	/** Additional alerts */
	alerts?: ReactNode;
	/** Mission info / top bar */
	topBar?: ReactNode;
	/** Tactical rail (portrait + selection + minimap combo) */
	tacticalRail?: ReactNode;
	/** Command console (bottom dock) */
	commandConsole?: ReactNode;
	/** Optional override for layout */
	layout?: TacticalHudLayout;
}

/**
 * Lays out HUD elements according to breakpoint.
 *
 * Phone (< 600px):
 *   - Resource bar: compact across top
 *   - ActionBar: bottom-screen overlay, thumb-reachable
 *   - UnitPanel: compact card above ActionBar
 *   - Minimap: corner, tappable to enlarge to 40%
 *   - No overlap with game canvas (pointer-events: none on non-interactive areas)
 *
 * Tablet (600-1024px):
 *   - Comfortable resource bar spacing
 *   - Optional sidebar layout
 *   - Full stats in UnitPanel
 *   - Smooth phone-to-tablet transition
 *
 * Desktop (> 1024px):
 *   - Classic RTS sidebar with minimap + unit panel + action panel
 *   - Resource bar spans top
 *   - Tooltips on hover
 *   - Command-post aesthetic
 */
export function ResponsiveHUD({
	resourceBar,
	minimap,
	unitPanel,
	actionBar,
	alerts,
	topBar,
	layout,
}: ResponsiveHUDProps) {
	const profile = useViewportProfile();
	const hudLayout = layout ?? resolveTacticalHudLayout(profile);

	const emitLongPressAction = useCallback((actionId: string) => {
		EventBus.emit("mobile-radial-action", { actionId });
	}, []);

	// Suppress unused reference for linter
	void emitLongPressAction;

	if (hudLayout === "mobile") {
		return (
			<PhoneHUD
				resourceBar={resourceBar}
				minimap={minimap}
				unitPanel={unitPanel}
				actionBar={actionBar}
				alerts={alerts}
				topBar={topBar}
			/>
		);
	}

	if (hudLayout === "tablet") {
		return (
			<TabletHUD
				resourceBar={resourceBar}
				minimap={minimap}
				unitPanel={unitPanel}
				actionBar={actionBar}
				alerts={alerts}
				topBar={topBar}
			/>
		);
	}

	return (
		<DesktopHUD
			resourceBar={resourceBar}
			minimap={minimap}
			unitPanel={unitPanel}
			actionBar={actionBar}
			alerts={alerts}
			topBar={topBar}
		/>
	);
}

// ---------------------------------------------------------------------------
// US-062: Phone layout (< 600px)
// ---------------------------------------------------------------------------

function PhoneHUD({
	resourceBar,
	minimap,
	unitPanel,
	actionBar,
	alerts,
	topBar,
}: Omit<ResponsiveHUDProps, "layout" | "tacticalRail" | "commandConsole">) {
	return (
		<div
			data-testid="hud-phone"
			data-hud-layout="mobile"
			className="pointer-events-none absolute inset-0 z-20 grid grid-rows-[auto_1fr_auto] gap-1 p-1"
		>
			{/* Top: compact resource bar */}
			<div className="pointer-events-auto" data-hud-region="top">
				{topBar ?? resourceBar}
			</div>

			{/* Middle: alerts + minimap corner */}
			<div className="relative min-h-0">
				{alerts ? (
					<div className="pointer-events-auto absolute left-1 top-1 right-1 z-10">{alerts}</div>
				) : null}
				<div className="pointer-events-auto absolute bottom-1 right-1 z-10">
					<MinimapWrapper hudLayout="mobile">{minimap}</MinimapWrapper>
				</div>
			</div>

			{/* Bottom: unit panel + action bar (thumb-reachable) */}
			<div className="pointer-events-auto grid gap-1" data-hud-region="bottom">
				<div className="max-h-24 overflow-hidden">{unitPanel}</div>
				<div
					className={cn(
						"rounded-t-lg border-t border-accent/20 bg-card/92",
						"[&_button]:min-h-[44px] [&_button]:min-w-[44px]",
					)}
				>
					{actionBar}
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// US-063: Tablet layout (600-1024px)
// ---------------------------------------------------------------------------

function TabletHUD({
	resourceBar,
	minimap,
	unitPanel,
	actionBar,
	alerts,
	topBar,
}: Omit<ResponsiveHUDProps, "layout" | "tacticalRail" | "commandConsole">) {
	return (
		<div
			data-testid="hud-tablet"
			data-hud-layout="tablet"
			className="pointer-events-none absolute inset-0 z-20 grid grid-rows-[auto_1fr_auto] gap-2 p-2"
		>
			{/* Top: resource bar with comfortable spacing */}
			<div className="pointer-events-auto" data-hud-region="top">
				{topBar ?? resourceBar}
			</div>

			{/* Middle: optional sidebar + minimap */}
			<div className="relative min-h-0 grid grid-cols-[1fr_auto] gap-2">
				<div className="relative">
					{alerts ? (
						<div className="pointer-events-auto absolute left-0 top-0 right-0 z-10">{alerts}</div>
					) : null}
				</div>
				<div className="pointer-events-auto flex flex-col gap-2 min-w-[180px]">
					<MinimapWrapper hudLayout="tablet">{minimap}</MinimapWrapper>
					<div className="flex-1 overflow-auto">{unitPanel}</div>
				</div>
			</div>

			{/* Bottom: action bar with adequate spacing */}
			<div className="pointer-events-auto" data-hud-region="bottom">
				<div
					className={cn(
						"rounded-lg border border-accent/20 bg-card/90",
						"[&_button]:min-h-[44px] [&_button]:min-w-[44px]",
					)}
				>
					{actionBar}
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// US-064: Desktop layout (> 1024px)
// ---------------------------------------------------------------------------

function DesktopHUD({
	resourceBar,
	minimap,
	unitPanel,
	actionBar,
	alerts,
	topBar,
}: Omit<ResponsiveHUDProps, "layout" | "tacticalRail" | "commandConsole">) {
	return (
		<div
			data-testid="hud-desktop"
			data-hud-layout="desktop"
			className="pointer-events-none absolute inset-0 z-20 grid grid-cols-[1fr_16rem] grid-rows-[auto_1fr] gap-3 p-3"
		>
			{/* Top: full resource bar spanning width */}
			<div className="pointer-events-auto col-span-2" data-hud-region="top">
				{topBar ?? resourceBar}
			</div>

			{/* Left: alerts area (floating over canvas) */}
			<div className="relative min-h-0">
				{alerts ? (
					<div className="pointer-events-auto absolute left-0 top-0 z-10 max-w-sm">{alerts}</div>
				) : null}
			</div>

			{/* Right: classic RTS sidebar — minimap + unit panel + action bar */}
			<div
				className="pointer-events-auto flex flex-col gap-3 overflow-auto"
				data-hud-region="sidebar"
			>
				<div>{minimap}</div>
				<div className="flex-1 overflow-auto">{unitPanel}</div>
				<div
					className={cn(
						"[&_button]:min-h-[44px] [&_button]:min-w-[44px]",
						"[&_button[title]]:cursor-help",
					)}
				>
					{actionBar}
				</div>
			</div>
		</div>
	);
}
