import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useTrait, useWorld } from "koota/react";
import { Badge } from "@/components/ui/badge";
import { getPortrait } from "@/entities/registry";
import { Objectives } from "@/ecs/traits/state";
import { ActionBar } from "@/ui/hud/ActionBar";
import { CommandTransmissionPanel } from "@/ui/hud/CommandTransmissionPanel";
import { Minimap } from "@/ui/hud/Minimap";
import { UnitPanel } from "@/ui/hud/UnitPanel";
import { getMissionById, CAMPAIGN } from "@/entities/missions";
import { Selected } from "@/ecs/traits/identity";
import { EventBus } from "@/game/EventBus";
import { cn } from "@/ui/lib/utils";

interface ConsoleTransmission {
	id: string;
	missionId: string;
	speaker: string;
	text: string;
	portrait?: string;
	duration?: number;
}

interface DirectiveObjective {
	id: string;
	description: string;
	status: "pending" | "active" | "completed" | "failed";
	bonus: boolean;
}

function resolveSpeakerPortraitId(
	portraitId: string | undefined,
	speaker: string | undefined,
	fallbackPortraitId: string | undefined,
) {
	const normalizedSpeakerId = speaker
		?.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");

	for (const candidate of [portraitId, normalizedSpeakerId, fallbackPortraitId]) {
		if (candidate && getPortrait(candidate)) return candidate;
	}

	return undefined;
}

export function CommandConsole({
	missionId,
	compact,
	showUnitPanel,
	showMinimap = true,
	onActiveTransmissionChange,
}: {
	missionId: string;
	compact: boolean;
	showUnitPanel: boolean;
	showMinimap?: boolean;
	onActiveTransmissionChange?: (
		transmission: {
			speaker: string;
			text: string;
			portraitId?: string;
			isScenario: boolean;
		} | null,
	) => void;
}) {
	const world = useWorld();
	const mission = useMemo(() => getMissionById(missionId) ?? CAMPAIGN[0], [missionId]);
	const liveObjectives = useTrait(world, Objectives)?.list ?? [];
	const selected = useQuery(Selected);
	const [lineIndex, setLineIndex] = useState(0);
	const [dismissedMissionId, setDismissedMissionId] = useState<string | null>(null);
	const [queuedTransmissions, setQueuedTransmissions] = useState<ConsoleTransmission[]>([]);
	const [revealedCharacters, setRevealedCharacters] = useState(0);
	const transmissionSequenceRef = useRef(0);

	useEffect(() => {
		setLineIndex(0);
		setDismissedMissionId(null);
		setQueuedTransmissions([]);
		setRevealedCharacters(0);
		transmissionSequenceRef.current = 0;
	}, [missionId]);

	useEffect(() => {
		const onTransmission = (payload: Omit<ConsoleTransmission, "id">) => {
			if (payload.missionId !== missionId) return;
			setQueuedTransmissions((current) => [
				...current,
				{
					...payload,
					id: `tx-${missionId}-${++transmissionSequenceRef.current}`,
				},
			]);
		};

		EventBus.on("command-transmission", onTransmission);
		return () => {
			EventBus.off("command-transmission", onTransmission);
		};
	}, [missionId]);

	const briefingLine = mission.briefing.lines[lineIndex];
	const hasMissionBriefing = mission.briefing.lines.length > 0 && dismissedMissionId !== missionId;
	const activeQueuedTransmission = queuedTransmissions[0] ?? null;
	const activeTransmission = activeQueuedTransmission
		? {
				id: activeQueuedTransmission.id,
				speaker: activeQueuedTransmission.speaker,
				text: activeQueuedTransmission.text,
				portraitId: resolveSpeakerPortraitId(
					activeQueuedTransmission.portrait,
					activeQueuedTransmission.speaker,
					mission.briefing.portraitId,
				),
				duration: activeQueuedTransmission.duration,
				isScenario: true,
			}
		: hasMissionBriefing
			? {
					id: `briefing-${missionId}-${lineIndex}`,
					speaker: briefingLine?.speaker ?? "Command",
					text: briefingLine?.text ?? "Move out.",
					portraitId: resolveSpeakerPortraitId(
						undefined,
						briefingLine?.speaker,
						mission.briefing.portraitId,
					),
					duration: undefined,
					isScenario: false,
				}
			: null;
	const hasTransmission = activeTransmission !== null;
	const isLastBriefingLine = lineIndex >= mission.briefing.lines.length - 1;
	const visibleText = activeTransmission?.text.slice(0, revealedCharacters) ?? "";
	const isTransmissionRevealing =
		activeTransmission !== null && revealedCharacters < activeTransmission.text.length;

	useEffect(() => {
		setRevealedCharacters(activeTransmission ? 0 : 0);
	}, [activeTransmission?.id]);

	useEffect(() => {
		if (!activeTransmission || !isTransmissionRevealing) return;

		const nextCharacter = activeTransmission.text[revealedCharacters];
		const delay =
			nextCharacter === "." || nextCharacter === "!" || nextCharacter === "?"
				? 38
				: nextCharacter === "," || nextCharacter === ";" || nextCharacter === ":"
					? 28
					: 16;

		const timeoutId = window.setTimeout(() => {
			setRevealedCharacters((current) => Math.min(current + 1, activeTransmission.text.length));
		}, delay);

		return () => window.clearTimeout(timeoutId);
	}, [activeTransmission, isTransmissionRevealing, revealedCharacters]);

	const advanceTransmission = () => {
		if (!activeTransmission) return;
		if (activeTransmission.isScenario) {
			setQueuedTransmissions((current) => current.slice(1));
			return;
		}

		if (isLastBriefingLine) {
			setDismissedMissionId(missionId);
			return;
		}
		setLineIndex((current) => Math.min(current + 1, mission.briefing.lines.length - 1));
	};

	const handleTransmissionInput = () => {
		if (!activeTransmission) return;
		if (isTransmissionRevealing) {
			setRevealedCharacters(activeTransmission.text.length);
			return;
		}
		advanceTransmission();
	};

	useEffect(() => {
		onActiveTransmissionChange?.(
			hasTransmission
				? {
						speaker: activeTransmission.speaker,
						text: activeTransmission.text,
						portraitId: activeTransmission.portraitId,
						isScenario: activeTransmission.isScenario,
					}
				: null,
		);
	}, [activeTransmission, hasTransmission, onActiveTransmissionChange]);

	useEffect(() => {
		if (!hasTransmission) return;

		const onKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
			if (event.code !== "Space") return;
			event.preventDefault();
			handleTransmissionInput();
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [hasTransmission, activeTransmission, isTransmissionRevealing, isLastBriefingLine, missionId]);

	const directiveObjectives = useMemo<DirectiveObjective[]>(() => {
		if (liveObjectives.length > 0) {
			return [...liveObjectives].sort((a, b) => Number(a.bonus) - Number(b.bonus));
		}

		return [
			...mission.objectives.primary.map((objective) => ({
				id: objective.id,
				description: objective.description,
				status: "active" as const,
				bonus: false,
			})),
			...mission.objectives.bonus.map((objective) => ({
				id: objective.id,
				description: objective.description,
				status: "active" as const,
				bonus: true,
			})),
		];
	}, [liveObjectives, mission.objectives.bonus, mission.objectives.primary]);

	return (
		<div
			data-testid="command-console"
			className="relative overflow-hidden rounded-md border border-accent/22 bg-[linear-gradient(180deg,rgba(9,18,15,0.95),rgba(8,12,11,0.98))] shadow-[0_22px_48px_rgba(0,0,0,0.42)]"
		>
			<div className="riverine-camo absolute inset-0 opacity-18" />
			<div
				className={cn(
					"relative grid gap-0",
					showMinimap
						? compact
							? "grid-cols-[8rem_minmax(0,1fr)]"
							: "grid-cols-[10.5rem_minmax(0,1fr)_18rem]"
						: compact
							? "grid-cols-1"
							: "grid-cols-[minmax(0,1fr)_18rem]",
				)}
			>
				{showMinimap ? (
					<div className="order-1 border-b border-r border-border/55 p-3">
						<Minimap compact embedded />
					</div>
				) : null}
				<div
					className={cn(
						"min-w-0 p-3",
						showMinimap
							? compact
								? "order-3 col-span-2 border-t border-border/55"
								: "order-2 border-r border-border/55"
							: compact
								? "order-1"
								: "order-1 border-r border-border/55",
					)}
				>
					{hasTransmission ? (
						<CommandTransmissionPanel
							missionName={mission.name}
							speaker={activeTransmission.speaker}
							text={visibleText}
							portraitId={activeTransmission.portraitId}
							compact={compact}
							embedded
							isRevealing={isTransmissionRevealing}
							isLastLine={activeTransmission.isScenario ? true : isLastBriefingLine}
							advanceLabel={
								isTransmissionRevealing
									? "Reveal"
									: activeTransmission.isScenario
										? "Acknowledge"
										: undefined
							}
							onAdvance={handleTransmissionInput}
						/>
					) : showUnitPanel && selected.length > 0 ? (
						<UnitPanel compact={compact} embedded />
					) : (
						<MissionDirectivePanel
							missionName={mission.name}
							subtitle={mission.subtitle}
							objectives={directiveObjectives}
						/>
					)}
				</div>
				<div
					className={cn(
						"p-3",
						showMinimap
							? compact
								? "order-2 border-b border-border/55"
								: "order-3"
							: compact
								? "order-2 border-t border-border/55"
								: "order-2",
					)}
				>
					<ActionBar compact={compact} embedded />
				</div>
			</div>
		</div>
	);
}

function MissionDirectivePanel({
	missionName,
	subtitle,
	objectives,
}: {
	missionName: string;
	subtitle?: string;
	objectives: DirectiveObjective[];
}) {
	const primaryObjectives = objectives.filter((objective) => !objective.bonus);
	const bonusObjectives = objectives.filter((objective) => objective.bonus);
	const completedPrimaryCount = primaryObjectives.filter(
		(objective) => objective.status === "completed",
	).length;
	const completedBonusCount = bonusObjectives.filter(
		(objective) => objective.status === "completed",
	).length;
	const visibleObjectives = objectives.slice(0, 4);

	return (
		<div className="grid gap-3">
			<div className="grid gap-1">
				<div className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent/80">
					Mission Directives
				</div>
				<div className="font-heading text-sm uppercase tracking-[0.16em] text-foreground">
					{missionName}
				</div>
				{subtitle ? (
					<div className="font-body text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
						{subtitle}
					</div>
				) : null}
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Badge
					variant={
						completedPrimaryCount === primaryObjectives.length && primaryObjectives.length > 0
							? "primary"
							: "accent"
					}
				>
					{completedPrimaryCount}/{primaryObjectives.length || 0} primary
				</Badge>
				{bonusObjectives.length > 0 ? (
					<Badge>
						{completedBonusCount}/{bonusObjectives.length} bonus
					</Badge>
				) : null}
			</div>
			<div className="grid gap-2">
				{visibleObjectives.map((objective) => {
					const isCompleted = objective.status === "completed";
					const isFailed = objective.status === "failed";

					return (
						<div
							key={objective.id}
							className={cn(
								"rounded-md border px-3 py-2",
								isCompleted && "border-primary/35 bg-primary/8",
								isFailed && "border-destructive/35 bg-destructive/8",
								!isCompleted && !isFailed && "border-border/70 bg-background/28",
							)}
						>
							<div className="flex items-start gap-3">
								<div
									className={cn(
										"mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
										isCompleted && "bg-primary",
										isFailed && "bg-destructive",
										objective.status === "pending" && "bg-muted-foreground/70",
										objective.status === "active" && "bg-accent",
									)}
								/>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<div
											className={cn(
												"font-body text-[10px] uppercase tracking-[0.14em] text-foreground/88",
												isCompleted && "text-primary line-through decoration-primary/70",
												isFailed && "text-destructive",
											)}
										>
											{objective.description}
										</div>
										{objective.bonus ? <Badge>Bonus</Badge> : null}
									</div>
									<div
										className={cn(
											"mt-1 font-mono text-[9px] uppercase tracking-[0.2em]",
											isCompleted && "text-primary/80",
											isFailed && "text-destructive/80",
											objective.status === "pending" && "text-muted-foreground",
											objective.status === "active" && "text-accent/80",
										)}
									>
										{objective.status === "completed"
											? "Complete"
											: objective.status === "failed"
												? "Failed"
												: objective.status === "pending"
													? "Pending"
													: "Active"}
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
