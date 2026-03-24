/**
 * BriefingScreen — Pre-mission briefing (briefing theme).
 *
 * Dark background with spotlight vignette, large portrait,
 * typewriter dialogue animation, dossier/intel report layout.
 * Single CTA: "DEPLOY >>" button.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { BriefingShell, ShellPanel } from "@/ui/layout/shells";
import { DeployButton } from "./DeployButton";
import { PortraitDisplay } from "./PortraitDisplay";

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
	const [typedLength, setTypedLength] = useState(0);
	const currentLine = briefing.lines[lineIndex];
	const fullText = currentLine?.text ?? "";
	const missionLabel = useMemo(
		() => briefing.missionId.replace(/_/g, " ").toUpperCase(),
		[briefing.missionId],
	);

	useEffect(() => {
		setTypedLength(0);
		if (!fullText) return;

		const interval = window.setInterval(() => {
			setTypedLength((value) => {
				if (value >= fullText.length) {
					window.clearInterval(interval);
					return value;
				}
				return value + 1;
			});
		}, 16);

		return () => window.clearInterval(interval);
	}, [fullText]);

	const advance = useCallback(() => {
		if (typedLength < fullText.length) {
			setTypedLength(fullText.length);
			return;
		}

		if (lineIndex < briefing.lines.length - 1) {
			setLineIndex((value) => value + 1);
		}
	}, [typedLength, fullText.length, lineIndex, briefing.lines.length]);

	const displayedText = fullText.slice(0, typedLength);

	return (
		<BriefingShell
			className="briefing-screen"
			title={briefing.missionName}
			subtitle={briefing.subtitle}
			meta={
				<div className="flex flex-wrap gap-2">
					<Badge variant="accent">{missionLabel}</Badge>
					<Badge variant="primary">PRE-DEPLOYMENT DOSSIER</Badge>
				</div>
			}
			aside={
				<PortraitDisplay
					portraitId={briefing.portraitId}
					className="h-full min-h-[20rem] w-full sm:min-h-[26rem]"
				/>
			}
			footer={
				<div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
					<div className="grid gap-1">
						<p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
							Tap the transmission panel or press space to advance the signal feed.
						</p>
						<div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent/80">
							Transmission {lineIndex + 1}/{briefing.lines.length} • Window open
						</div>
					</div>
					<DeployButton onClick={onDeploy} />
				</div>
			}
		>
			<div className="grid gap-6">
				<ShellPanel
					title="Signal Traffic"
					description="Listen through the briefing feed before deployment."
				>
					<div
						data-testid="dialogue"
						className="dialogue cursor-pointer rounded-lg border border-border/70 bg-background/35 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
						onClick={advance}
						onKeyDown={(e) => (e.key === " " || e.key === "Enter") && advance()}
						role="button"
						tabIndex={0}
					>
						{currentLine ? (
							<>
								<div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
									<span className="font-heading text-xs uppercase tracking-[0.24em] text-accent">
										{currentLine.speaker}
									</span>
									<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
										Signal {String(lineIndex + 1).padStart(2, "0")}
									</span>
								</div>
								<p className="mt-3 min-h-28 font-body text-sm uppercase tracking-[0.12em] leading-relaxed text-foreground sm:text-base">
									{displayedText}
									{typedLength < fullText.length ? (
										<span className="typewriter-cursor">▋</span>
									) : null}
								</p>
								<div className="grid gap-2 rounded-md border border-accent/12 bg-accent/6 px-3 py-2">
									<div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent/80">
										Field Note
									</div>
									<p className="font-body text-[11px] uppercase tracking-[0.14em] leading-relaxed text-muted-foreground">
										Advance through the signal feed, confirm the threat picture, and make the final
										deploy click feel deliberate.
									</p>
								</div>
							</>
						) : null}

						<div className="mt-4 flex gap-1">
							{briefing.lines.map((_, i) => (
								<div
									key={i}
									className={i <= lineIndex ? "h-1.5 w-8 bg-accent" : "h-1.5 w-8 bg-muted"}
								/>
							))}
						</div>
					</div>
				</ShellPanel>

				<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
					<ShellPanel
						title="Operational Notes"
						description="Mission tone, doctrine, and threat picture."
					>
						<div className="grid gap-3 md:grid-cols-3">
							<NoteBlock
								label="Theater"
								value="Copper-Silt Reach"
								body="Dense canopy, poor visibility, and shifting mud routes favor disciplined movement."
							/>
							<NoteBlock
								label="Command"
								value="FIELD BRIEF"
								body="Use the briefing to set tempo, clarify the objective chain, and keep the next click readable."
							/>
							<NoteBlock
								label="Priority"
								value="DEPLOY CLEAN"
								body="Proceed only after the briefing feed is clear and the objective chain is understood."
							/>
						</div>
					</ShellPanel>

					<ShellPanel title="Deploy Status" description="Final checks before insertion.">
						<div className="grid gap-3">
							<Badge variant="primary">PORTRAIT LOCKED</Badge>
							<Badge variant="accent">
								TRANSMISSION {lineIndex + 1}/{briefing.lines.length}
							</Badge>
							<Badge>{briefing.portraitId.replace(/_/g, " ").toUpperCase()}</Badge>
							<div className="rounded-lg border border-border/70 bg-background/20 p-3">
								<div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
									Drop Condition
								</div>
								<div className="mt-2 font-heading text-sm uppercase tracking-[0.18em] text-foreground">
									Green
								</div>
								<p className="mt-2 font-body text-[11px] uppercase tracking-[0.14em] leading-relaxed text-muted-foreground">
									Signal chain intact. Objective package loaded. Awaiting final command.
								</p>
							</div>
						</div>
					</ShellPanel>
				</div>
			</div>
		</BriefingShell>
	);
}

function NoteBlock({ label, value, body }: { label: string; value: string; body: string }) {
	return (
		<div className="rounded-lg border border-border/70 bg-background/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
			<div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
				{label}
			</div>
			<div className="mt-2 font-heading text-sm uppercase tracking-[0.18em] text-primary">
				{value}
			</div>
			<p className="mt-2 font-body text-xs uppercase tracking-[0.14em] leading-relaxed text-muted-foreground">
				{body}
			</p>
		</div>
	);
}
