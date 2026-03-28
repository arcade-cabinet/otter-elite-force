/**
 * PanelFrame -- Decorative corner bracket and rivet overlay for HUD panels.
 *
 * Renders L-shaped bracket marks at each corner with configurable inset,
 * arm length, and optional rivet dots. Purely decorative -- sits as an
 * absolute overlay using pointer-events:none so it never blocks interaction.
 *
 * Used on ResourceBar, SelectionPanel, BuildMenu, ObjectivesPanel, etc.
 * to give all HUD panels a consistent military aesthetic.
 */

import type { JSX, ParentComponent } from "solid-js";

interface PanelFrameProps {
	/** Extra CSS classes on the outer wrapper */
	class?: string;
	/** Show rivet dots at bracket corners (default: true) */
	rivets?: boolean;
	/** Bracket inset from panel edge in pixels (default: 6) */
	inset?: number;
	/** Bracket arm length in pixels (default: 12) */
	armLength?: number;
}

const BRACKET_COLOR = "rgba(138, 255, 156, 0.25)";
const RIVET_COLOR = "rgba(138, 255, 156, 0.35)";

type Corner = "tl" | "tr" | "bl" | "br";

function bracketStyle(position: Corner, inset: number, armLength: number): JSX.CSSProperties {
	const isTop = position === "tl" || position === "tr";
	const isLeft = position === "tl" || position === "bl";

	return {
		position: "absolute",
		width: `${armLength}px`,
		height: `${armLength}px`,
		...(isTop ? { top: `${inset}px` } : { bottom: `${inset}px` }),
		...(isLeft ? { left: `${inset}px` } : { right: `${inset}px` }),
		"border-color": BRACKET_COLOR,
		"border-style": "solid",
		"border-width": "0",
		...(isTop ? { "border-top-width": "1px" } : { "border-bottom-width": "1px" }),
		...(isLeft ? { "border-left-width": "1px" } : { "border-right-width": "1px" }),
		"pointer-events": "none",
	};
}

function rivetStyle(position: Corner, inset: number): JSX.CSSProperties {
	const isTop = position === "tl" || position === "tr";
	const isLeft = position === "tl" || position === "bl";

	return {
		position: "absolute",
		width: "3px",
		height: "3px",
		"border-radius": "50%",
		"background-color": RIVET_COLOR,
		...(isTop ? { top: `${inset - 1}px` } : { bottom: `${inset - 1}px` }),
		...(isLeft ? { left: `${inset - 1}px` } : { right: `${inset - 1}px` }),
		"pointer-events": "none",
	};
}

const CORNERS: Corner[] = ["tl", "tr", "bl", "br"];

export const PanelFrame: ParentComponent<PanelFrameProps> = (props) => {
	const inset = () => props.inset ?? 6;
	const armLength = () => props.armLength ?? 12;
	const showRivets = () => props.rivets !== false;

	return (
		<div class={`relative ${props.class ?? ""}`}>
			{props.children}
			{/* Corner brackets + rivets (decorative overlay) */}
			{CORNERS.map((corner) => (
				<>
					<div aria-hidden="true" style={bracketStyle(corner, inset(), armLength())} />
					{showRivets() && <div aria-hidden="true" style={rivetStyle(corner, inset())} />}
				</>
			))}
		</div>
	);
};
