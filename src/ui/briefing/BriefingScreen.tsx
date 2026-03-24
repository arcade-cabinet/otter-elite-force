/**
 * BriefingScreen — Pre-mission briefing (briefing theme).
 *
 * Dark background with spotlight vignette, large portrait,
 * typewriter dialogue animation, dossier/intel report layout.
 * Single CTA: "DEPLOY >>" button.
 */
import { useState, useCallback } from "react";
import { cn } from "@/ui/lib/utils";
import { PortraitDisplay } from "./PortraitDisplay";
import { DeployButton } from "./DeployButton";

export interface BriefingLine {
	speaker: string;
	text: string;
}

export interface BriefingData {
	missionId: string;
	missionName: string;
	subtitle: string;
	portraitId: string;
	lines: BriefingLine[];
}

interface BriefingScreenProps {
	briefing: BriefingData;
	onDeploy?: () => void;
}

export function BriefingScreen({ briefing, onDeploy }: BriefingScreenProps) {
	const [lineIndex, setLineIndex] = useState(0);
	const currentLine = briefing.lines[lineIndex];

	const advance = useCallback(() => {
		if (lineIndex < briefing.lines.length - 1) {
			setLineIndex((i) => i + 1);
		}
	}, [lineIndex, briefing.lines.length]);

	return (
		<div
			className={cn(
				"briefing-screen",
				"flex min-h-screen flex-col items-center justify-center gap-8 px-6",
				"bg-background text-foreground",
			)}
		>
			{/* Mission header */}
			<div className="text-center">
				<h2 className="font-heading text-2xl uppercase tracking-widest text-primary">
					{briefing.missionName}
				</h2>
				<p className="mt-1 font-body text-xs uppercase tracking-wider text-muted-foreground">
					{briefing.subtitle}
				</p>
			</div>

			{/* Portrait + Dialogue */}
			<div className="flex w-full max-w-2xl items-start gap-6">
				<PortraitDisplay portraitId={briefing.portraitId} />

				{/* Dialogue area */}
				<div
					data-testid="dialogue"
					className="dialogue flex-1 cursor-pointer"
					onClick={advance}
					onKeyDown={(e) => e.key === " " && advance()}
					role="button"
					tabIndex={0}
				>
					{currentLine && (
						<>
							<span className="font-heading text-xs uppercase tracking-widest text-accent">
								{currentLine.speaker}
							</span>
							<p className="mt-2 font-body text-sm leading-relaxed text-foreground">
								{currentLine.text}
							</p>
						</>
					)}

					{/* Line progress indicator */}
					<div className="mt-4 flex gap-1">
						{briefing.lines.map((_, i) => (
							<div key={i} className={cn("h-1 w-4", i <= lineIndex ? "bg-accent" : "bg-muted")} />
						))}
					</div>
				</div>
			</div>

			{/* Deploy button */}
			<DeployButton onClick={onDeploy} />
		</div>
	);
}
