/**
 * PortraitDisplay — Large character portrait for briefings.
 *
 * Rendered large with spotlight vignette effect.
 * Uses the compiled SP-DSL portrait atlas output.
 */
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/ui/lib/utils";

interface AtlasFrame {
	frame: { x: number; y: number; w: number; h: number };
	sourceSize: { w: number; h: number };
}

interface PortraitAtlas {
	meta: { image: string; size: { w: number; h: number }; scale: number };
	frames: Record<string, AtlasFrame>;
}

let portraitAtlasPromise: Promise<PortraitAtlas> | null = null;

function loadPortraitAtlas() {
	if (!portraitAtlasPromise) {
		portraitAtlasPromise = fetch("/assets/portraits/portraits_3x.json").then((response) => {
			if (!response.ok) {
				throw new Error(`Failed to load portrait atlas: ${response.status}`);
			}
			return response.json() as Promise<PortraitAtlas>;
		});
	}

	return portraitAtlasPromise;
}

interface PortraitDisplayProps {
	portraitId: string;
	className?: string;
}

export function PortraitDisplay({ portraitId, className }: PortraitDisplayProps) {
	const [atlas, setAtlas] = useState<PortraitAtlas | null>(null);

	useEffect(() => {
		let cancelled = false;
		loadPortraitAtlas()
			.then((data) => {
				if (!cancelled) setAtlas(data);
			})
			.catch(() => {
				if (!cancelled) setAtlas(null);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	const portraitFrame = atlas?.frames[portraitId] ?? atlas?.frames[`${portraitId}_idle_0`] ?? null;
	const spriteStyle = useMemo(() => {
		if (!atlas || !portraitFrame) return null;
		const targetWidth = 224;
		const displayScale = targetWidth / portraitFrame.frame.w;
		return {
			backgroundImage: `url(/assets/portraits/${atlas.meta.image})`,
			backgroundPosition: `-${portraitFrame.frame.x * displayScale}px -${portraitFrame.frame.y * displayScale}px`,
			backgroundSize: `${atlas.meta.size.w * displayScale}px ${atlas.meta.size.h * displayScale}px`,
			width: `${targetWidth}px`,
			height: `${portraitFrame.frame.h * displayScale}px`,
			imageRendering: "pixelated" as const,
		};
	}, [atlas, portraitFrame]);
	const callsign = portraitId.replace(/_/g, " ").toUpperCase();

	return (
		<div
			data-testid="portrait"
			className={cn(
				"portrait relative flex min-h-88 items-center justify-center overflow-hidden rounded-lg border border-border/80 bg-[radial-gradient(circle_at_top,rgba(245,230,200,0.14),transparent_34%),linear-gradient(180deg,rgba(18,16,13,0.96),rgba(6,6,6,0.98))]",
				className,
			)}
		>
			<div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.03)_0,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_5px)] opacity-40" />
			<div className="absolute inset-4 border border-accent/20" />
			<div className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
				Field Dossier
			</div>
			<div className="absolute right-4 top-4 rounded-full border border-accent/30 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
				LOCKED
			</div>
			<div className="relative z-10 flex w-full max-w-[18rem] flex-col gap-4">
				<div className="briefing-portrait-frame relative mx-auto flex min-h-[22rem] w-full items-center justify-center overflow-hidden rounded-lg border border-accent/25 bg-[radial-gradient(circle_at_top,rgba(212,165,116,0.24),rgba(0,0,0,0.08))] p-5 shadow-[0_0_60px_rgba(245,230,200,0.08)]">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_42%)]" />
					<div className="absolute inset-3 border border-accent/15" />
					{portraitFrame && spriteStyle ? (
						<div
							role="img"
							aria-label={`${callsign} portrait`}
							className="briefing-portrait-sprite relative rounded-md border border-accent/20 bg-no-repeat"
							style={spriteStyle}
						/>
					) : (
						<div
							role="alert"
							className="briefing-portrait-error relative flex h-full items-center justify-center rounded-md border border-destructive/40 bg-destructive/10"
						>
							<div className="text-center font-mono text-xs uppercase tracking-[0.2em] text-destructive/80">
								MISSING: {portraitId}
							</div>
						</div>
					)}
				</div>
				<div className="grid gap-2 rounded-lg border border-border/70 bg-background/20 px-4 py-3">
					<div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
						Visual Source
					</div>
					<div className="font-body text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
						SP-DSL compiled atlas{" "}
						{portraitFrame
							? `${atlas?.meta.scale ?? 0}x locked`
							: `ERROR — frame "${portraitId}" not found in atlas`}
					</div>
				</div>
			</div>
			<div className="absolute bottom-5 left-5 right-5 z-10 border-t border-border/70 pt-3">
				<div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
					Callsign
				</div>
				<div className="mt-1 font-heading text-lg uppercase tracking-[0.22em] text-primary">
					{callsign}
				</div>
			</div>
		</div>
	);
}
