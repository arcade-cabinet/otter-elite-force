/**
 * BriefingDialogue — StarCraft-style mission briefing + mid-mission dialogue.
 *
 * Full-screen modal overlay with:
 * - Left portrait: command speaker (FOXHOUND, Gen. Whiskers)
 * - Typewriter text advancing one character at a time
 * - Space/tap to complete current line, then advance to next
 * - Right portrait: HQ officer responding (Col. Bubbles, etc.)
 * - "BEGIN MISSION" screen after all briefing lines
 *
 * Also used for mid-mission dialogue triggered by scenario events.
 * The EventBus "show-dialogue" event opens this overlay with a single
 * exchange or short sequence.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getPortraitCanvas } from "@/canvas/portraitRenderer";
import { cn } from "@/ui/lib/utils";

// ─── Types ───

export interface BriefingLine {
	speaker: string;
	text: string;
	/** Portrait ID override. If omitted, derived from speaker name. */
	portraitId?: string;
}

export interface BriefingDialogueProps {
	missionName: string;
	subtitle?: string;
	lines: BriefingLine[];
	onComplete: () => void;
	/** If true, shows BEGIN MISSION button at end. If false, just closes. */
	isMissionBriefing?: boolean;
}

// ─── Speaker → portrait resolution ───

const SPEAKER_PORTRAITS: Record<string, string> = {
	foxhound: "foxhound",
	"col. bubbles": "sgt_bubbles",
	col_bubbles: "sgt_bubbles",
	"sgt. bubbles": "sgt_bubbles",
	sgt_bubbles: "sgt_bubbles",
	"gen. whiskers": "gen_whiskers",
	gen_whiskers: "gen_whiskers",
	"cpl. splash": "cpl_splash",
	"sgt. fang": "sgt_fang",
	"medic marina": "medic_marina",
	"pvt. muskrat": "pvt_muskrat",
};

// Characters who speak from the RIGHT side (player/responder)
const RESPONDERS = new Set([
	"col. bubbles",
	"col_bubbles",
	"sgt. bubbles",
	"sgt_bubbles",
	"gen. whiskers",
	"gen_whiskers",
	"cpl. splash",
	"sgt. fang",
	"medic marina",
	"pvt. muskrat",
]);

function resolvePortraitId(speaker: string, override?: string): string {
	if (override) return override;
	return SPEAKER_PORTRAITS[speaker.toLowerCase()] ?? "foxhound";
}

// ─── Typewriter hook ───

function useTypewriter(text: string, charsPerSecond = 40) {
	const [displayedChars, setDisplayedChars] = useState(0);
	const isComplete = displayedChars >= text.length;

	useEffect(() => {
		setDisplayedChars(0);
	}, [text]);

	useEffect(() => {
		if (isComplete) return;
		const interval = setInterval(() => {
			setDisplayedChars((prev) => {
				const next = Math.min(prev + 1, text.length);
				// Play typewriter clack every 3rd character (subtle, not overwhelming)
				if (next % 3 === 0 && next < text.length) {
					try {
						const actx = new (
							window.AudioContext ||
							(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
						)();
						const osc = actx.createOscillator();
						const gain = actx.createGain();
						osc.type = "square";
						osc.frequency.setValueAtTime(800 + (next % 5) * 40, actx.currentTime);
						gain.gain.setValueAtTime(0.02, actx.currentTime);
						gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.03);
						osc.connect(gain);
						gain.connect(actx.destination);
						osc.start();
						osc.stop(actx.currentTime + 0.03);
					} catch {
						/* audio not available */
					}
				}
				return next;
			});
		}, 1000 / charsPerSecond);
		return () => clearInterval(interval);
	}, [text, charsPerSecond, isComplete]);

	const complete = useCallback(() => {
		setDisplayedChars(text.length);
	}, [text.length]);

	return { displayed: text.slice(0, displayedChars), isComplete, complete };
}

// ─── Portrait canvas component ───

function PortraitImage({ portraitId, size = 96 }: { portraitId: string; size?: number }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const portrait = getPortraitCanvas(portraitId);
		if (!portrait) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.imageSmoothingEnabled = false;
		ctx.clearRect(0, 0, size, size);
		// Draw portrait scaled to fit the square, cropping to face area
		// Portrait is 128x192 (2x scale of 64x96). Show the top 128x128 (face area).
		const srcH = Math.min(portrait.width, portrait.height);
		ctx.drawImage(portrait, 0, 0, portrait.width, srcH, 0, 0, size, size);
	}, [portraitId, size]);

	return (
		<canvas
			ref={canvasRef}
			width={size}
			height={size}
			style={{ width: size, height: size, imageRendering: "pixelated" }}
		/>
	);
}

// ─── Main Component ───

export function BriefingDialogue({
	missionName,
	subtitle,
	lines,
	onComplete,
	isMissionBriefing = true,
}: BriefingDialogueProps) {
	const [lineIndex, setLineIndex] = useState(0);
	const allDone = lineIndex >= lines.length;
	const currentLine = allDone ? null : lines[lineIndex];

	const { displayed, isComplete, complete } = useTypewriter(currentLine?.text ?? "", 40);

	const advance = useCallback(() => {
		if (!isComplete) {
			complete();
		} else if (lineIndex < lines.length - 1) {
			setLineIndex((i) => i + 1);
		} else {
			setLineIndex(lines.length);
		}
	}, [isComplete, complete, lineIndex, lines.length]);

	// Space/Enter/tap to advance
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === " " || e.key === "Enter") {
				e.preventDefault();
				if (allDone) onComplete();
				else advance();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [advance, allDone, onComplete]);

	// ─── All done screen ───
	if (allDone) {
		if (!isMissionBriefing) {
			// Mid-mission dialogue — just close
			onComplete();
			return null;
		}

		return (
			<div
				className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
				onClick={onComplete}
				role="dialog"
				aria-label="Mission ready"
			>
				<div className="text-center">
					<div className="font-mono text-xs uppercase tracking-[0.3em] text-amber-600/80">
						Operation
					</div>
					<h1 className="mt-2 font-heading text-4xl uppercase tracking-[0.2em] text-amber-400">
						{missionName}
					</h1>
					{subtitle && (
						<p className="mt-2 font-body text-sm uppercase tracking-[0.14em] text-slate-400">
							{subtitle}
						</p>
					)}
					<button
						type="button"
						className="mt-8 border-2 border-amber-600 bg-amber-900/40 px-8 py-3 font-heading text-lg uppercase tracking-[0.2em] text-amber-300 transition hover:bg-amber-800/60 focus:outline-none focus:ring-2 focus:ring-amber-500"
						onClick={onComplete}
					>
						Begin Mission
					</button>
					<p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
						Press Space to deploy
					</p>
				</div>
			</div>
		);
	}

	// ─── Active dialogue ───
	const speakerName = currentLine?.speaker ?? "";
	const portraitId = resolvePortraitId(speakerName, currentLine?.portraitId);
	const isResponder = RESPONDERS.has(speakerName.toLowerCase());

	return (
		<div
			className="fixed inset-0 z-50 flex flex-col items-center justify-end bg-black/85 pb-6 md:pb-10"
			onClick={advance}
			role="dialog"
			aria-label={`${speakerName} speaking`}
		>
			{/* Mission title at top */}
			<div className="absolute left-0 right-0 top-4 text-center md:top-6">
				<div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-600/60">
					Mission Briefing
				</div>
				<h2 className="mt-1 font-heading text-lg uppercase tracking-[0.18em] text-amber-400/80 md:text-xl">
					{missionName}
				</h2>
			</div>

			{/* Line counter */}
			<div className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600 md:right-6 md:top-6">
				{lineIndex + 1} / {lines.length}
			</div>

			{/* Dialogue box — portrait + text */}
			<div
				className={cn(
					"flex w-full max-w-3xl items-end gap-3 px-4 md:gap-4",
					isResponder && "flex-row-reverse",
				)}
			>
				{/* Portrait */}
				<div className="flex flex-shrink-0 flex-col items-center gap-1">
					<div className="overflow-hidden border-2 border-slate-600 bg-slate-900">
						<PortraitImage portraitId={portraitId} size={80} />
					</div>
					<span
						className={cn(
							"font-mono text-[9px] uppercase tracking-[0.2em]",
							isResponder ? "text-sky-400" : "text-amber-500",
						)}
					>
						{speakerName}
					</span>
				</div>

				{/* Text bubble */}
				<div
					className={cn(
						"flex-1 border-2 bg-slate-900/95 p-3 md:p-4",
						isResponder
							? "border-slate-700 border-r-sky-700"
							: "border-slate-700 border-l-amber-700",
					)}
				>
					<p className="min-h-[3em] font-body text-sm leading-relaxed text-slate-200 md:text-base">
						{displayed}
						{!isComplete && <span className="animate-pulse text-amber-400">|</span>}
					</p>
				</div>
			</div>

			{/* Advance hint */}
			<div className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 md:mt-3">
				{isComplete ? "Space / Tap to continue" : "Space / Tap to skip"}
			</div>
		</div>
	);
}
