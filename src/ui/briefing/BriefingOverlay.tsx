/**
 * BriefingOverlay — Manila folder mission briefing treatment (US-035).
 *
 * Warm khaki/manila background with paper grain texture, mission code stamp
 * in stencil font, "CLASSIFIED"/"TOP SECRET" red stamp at angle,
 * redacted black-bar decorative elements, commander's pawprint signature,
 * and typewriter font for briefing text.
 */
import type { ReactNode } from "react";
import { cn } from "@/ui/lib/utils";

interface BriefingOverlayProps {
	/** Mission code displayed as stencil stamp, e.g. "OP-MUDSLIDE-07" */
	missionCode: string;
	/** Classification level stamp */
	classification?: "CLASSIFIED" | "TOP SECRET" | "RESTRICTED";
	/** Briefing body content (paragraphs, transmission panels, etc.) */
	children: ReactNode;
	/** Commander name for the signature block */
	commanderName?: string;
	className?: string;
}

export function BriefingOverlay({
	missionCode,
	classification = "CLASSIFIED",
	children,
	commanderName = "CDR. LUTRA",
	className,
}: BriefingOverlayProps) {
	return (
		<div
			data-testid="briefing-overlay"
			className={cn(
				"briefing-manila-paper relative overflow-hidden rounded-none border border-khaki-400/40 p-6 sm:p-8 lg:p-10",
				className,
			)}
		>
			{/* Paper grain texture */}
			<div className="briefing-paper-grain pointer-events-none absolute inset-0" />

			{/* Subtle fold line */}
			<div className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-gradient-to-b from-transparent via-rust-700/20 to-transparent" />

			{/* Top-left: Mission code stamp */}
			<div className="relative mb-6">
				<div className="font-heading text-xl uppercase tracking-[0.28em] text-rust-700 sm:text-2xl lg:text-3xl">
					{missionCode}
				</div>
				<div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-khaki-600">
					Field Operations Dossier
				</div>
			</div>

			{/* Classification stamp — rotated red stamp */}
			<div
				className="pointer-events-none absolute right-6 top-6 rotate-[-8deg] rounded border-2 border-red-700/70 px-4 py-1.5 font-heading text-sm uppercase tracking-[0.3em] text-red-700/80 sm:right-8 sm:top-8 sm:text-base"
				aria-hidden="true"
			>
				{classification}
			</div>

			{/* Redacted bars — decorative */}
			<div className="mb-4 flex gap-2" aria-hidden="true">
				<div className="h-3 w-20 rounded-none bg-steel-900/80" />
				<div className="h-3 w-32 rounded-none bg-steel-900/80" />
				<div className="h-3 w-14 rounded-none bg-steel-900/80" />
			</div>

			{/* Briefing content */}
			<div className="relative z-10 font-body text-sm uppercase leading-relaxed tracking-[0.12em] text-steel-900/90 sm:text-base">
				{children}
			</div>

			{/* Bottom: signature block */}
			<div className="relative mt-8 border-t border-khaki-400/50 pt-4">
				<div className="flex items-end justify-between gap-4">
					<div className="grid gap-1">
						<div className="font-mono text-[9px] uppercase tracking-[0.22em] text-khaki-600">
							Authorized by
						</div>
						<div className="font-heading text-sm uppercase tracking-[0.2em] text-rust-700">
							{commanderName}
						</div>
					</div>

					{/* Commander's pawprint signature */}
					<PawprintSignature />
				</div>
			</div>
		</div>
	);
}

/**
 * Decorative pawprint — SVG otter paw rendered as a "stamp" signature.
 */
function PawprintSignature() {
	return (
		<svg aria-hidden="true" viewBox="0 0 40 44" className="h-10 w-10 opacity-50" fill="none">
			{/* Main pad */}
			<ellipse cx="20" cy="28" rx="9" ry="10" fill="#6b3a26" opacity="0.7" />
			{/* Top toe beans */}
			<ellipse cx="11" cy="15" rx="4" ry="5" fill="#6b3a26" opacity="0.6" />
			<ellipse cx="20" cy="11" rx="4" ry="5" fill="#6b3a26" opacity="0.6" />
			<ellipse cx="29" cy="15" rx="4" ry="5" fill="#6b3a26" opacity="0.6" />
		</svg>
	);
}
