import { Button } from "@/components/ui/button";
import { getPortrait } from "@/entities/registry";
import { TransmissionPortrait } from "@/ui/hud/TransmissionPortrait";
import { cn } from "@/ui/lib/utils";

export function CommandTransmissionPanel({
	missionName,
	speaker,
	text,
	portraitId,
	compact,
	embedded,
	isRevealing,
	isLastLine,
	advanceLabel,
	onAdvance,
	onSkipAll,
}: {
	missionName: string;
	speaker: string;
	text: string;
	portraitId?: string | null;
	compact?: boolean;
	embedded?: boolean;
	isRevealing?: boolean;
	isLastLine: boolean;
	advanceLabel?: string;
	onAdvance: () => void;
	/** Skip all remaining dialogue lines instantly (US-036) */
	onSkipAll?: () => void;
}) {
	const portrait = portraitId ? getPortrait(portraitId) : undefined;
	const speakerTone = portrait?.dialogueColor;

	return (
		<div
			data-testid="command-transmission"
			tabIndex={0}
			onClick={onAdvance}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onAdvance();
				}
			}}
			className={cn(
				"command-transmission-panel gameplay-viewport-card relative overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
				embedded
					? "rounded-none border-0 bg-transparent shadow-none"
					: "rounded-lg border border-accent/25 bg-[linear-gradient(180deg,rgba(13,22,20,0.95),rgba(7,12,12,0.96))] shadow-[0_18px_40px_rgba(0,0,0,0.4)]",
				compact ? "w-full max-w-md" : "w-full max-w-136",
			)}
		>
			<div className={cn("riverine-camo absolute inset-0 opacity-45", embedded && "opacity-25")} />
			<div
				className={cn(
					"relative z-10 grid gap-3 px-4 py-4",
					compact ? "grid-cols-1" : "grid-cols-[auto_minmax(0,1fr)]",
				)}
			>
				<TransmissionPortrait portraitId={portraitId} speaker={speaker} compact={compact} />
				<div className="grid min-w-0 gap-3">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
							<span className="rounded border border-accent/25 bg-accent/10 px-2 py-1 text-accent">
								Command Net
							</span>
							<span>{missionName}</span>
						</div>
						<div
							className="rounded border bg-background/30 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em]"
							style={
								speakerTone
									? {
											borderColor: `${speakerTone}66`,
											color: speakerTone,
											backgroundColor: `${speakerTone}14`,
										}
									: undefined
							}
						>
							{speaker}
						</div>
						<div
							data-testid="command-transmission-status"
							className={cn(
								"rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em]",
								isRevealing
									? "border-accent/35 bg-accent/10 text-accent"
									: "border-primary/35 bg-primary/10 text-primary",
							)}
						>
							{isRevealing ? "Receiving" : "Ready"}
						</div>
					</div>

					<div className="rounded-md border border-border/70 bg-background/35 px-4 py-4">
						<p
							data-testid="command-transmission-text"
							className="font-body text-sm uppercase tracking-[0.12em] leading-relaxed text-foreground"
						>
							{text}
							{isRevealing ? (
								<span aria-hidden="true" className="typewriter-cursor">
									▋
								</span>
							) : null}
						</p>
					</div>

					<div className="flex items-center justify-end gap-2">
						{onSkipAll ? (
							<Button
								variant="ghost"
								size="sm"
								className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
								onClick={(event) => {
									event.stopPropagation();
									onSkipAll();
								}}
							>
								Skip All
							</Button>
						) : null}
						<Button
							variant="accent"
							size="sm"
							onClick={(event) => {
								event.stopPropagation();
								onAdvance();
							}}
						>
							{advanceLabel ?? (isLastLine ? "Move Out" : "Acknowledge")}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
