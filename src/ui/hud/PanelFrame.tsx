/**
 * PanelFrame — Corner bracket and rivet decorations for HUD panels (US-039).
 *
 * Renders L-shaped bracket marks at each corner of the panel,
 * with optional rivet dots at bracket intersections.
 * Purely decorative — sits as an absolute overlay.
 */
import type { ReactNode } from "react";
import { cn } from "@/ui/lib/utils";

interface PanelFrameProps {
	children: ReactNode;
	className?: string;
	/** Show rivet dots at bracket corners (default: true) */
	rivets?: boolean;
	/** Bracket inset from panel edge in pixels (default: 6) */
	inset?: number;
	/** Bracket arm length in pixels (default: 12) */
	armLength?: number;
}

const BRACKET_COLOR = "rgba(138, 255, 156, 0.25)";
const RIVET_COLOR = "rgba(138, 255, 156, 0.35)";

function CornerBracket({
	position,
	inset,
	armLength,
	showRivet,
}: {
	position: "tl" | "tr" | "bl" | "br";
	inset: number;
	armLength: number;
	showRivet: boolean;
}) {
	const isTop = position === "tl" || position === "tr";
	const isLeft = position === "tl" || position === "bl";

	const style: React.CSSProperties = {
		position: "absolute",
		width: `${armLength}px`,
		height: `${armLength}px`,
		...(isTop ? { top: `${inset}px` } : { bottom: `${inset}px` }),
		...(isLeft ? { left: `${inset}px` } : { right: `${inset}px` }),
		borderColor: BRACKET_COLOR,
		borderStyle: "solid",
		borderWidth: 0,
		...(isTop ? { borderTopWidth: "1px" } : { borderBottomWidth: "1px" }),
		...(isLeft ? { borderLeftWidth: "1px" } : { borderRightWidth: "1px" }),
		pointerEvents: "none",
	};

	return (
		<>
			<div style={style} />
			{showRivet ? (
				<div
					style={{
						position: "absolute",
						width: "3px",
						height: "3px",
						borderRadius: "50%",
						backgroundColor: RIVET_COLOR,
						...(isTop ? { top: `${inset - 1}px` } : { bottom: `${inset - 1}px` }),
						...(isLeft ? { left: `${inset - 1}px` } : { right: `${inset - 1}px` }),
						pointerEvents: "none",
					}}
				/>
			) : null}
		</>
	);
}

export function PanelFrame({
	children,
	className,
	rivets = true,
	inset = 6,
	armLength = 12,
}: PanelFrameProps) {
	return (
		<div className={cn("relative", className)}>
			{children}
			<CornerBracket position="tl" inset={inset} armLength={armLength} showRivet={rivets} />
			<CornerBracket position="tr" inset={inset} armLength={armLength} showRivet={rivets} />
			<CornerBracket position="bl" inset={inset} armLength={armLength} showRivet={rivets} />
			<CornerBracket position="br" inset={inset} armLength={armLength} showRivet={rivets} />
		</div>
	);
}
