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

function toInitials(label: string) {
	return label
		.replace(/_/g, " ")
		.split(/\s+/)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("")
		.slice(0, 3);
}

export function TransmissionPortrait({
	portraitId,
	speaker,
	compact,
	className,
}: {
	portraitId?: string | null;
	speaker: string;
	compact?: boolean;
	className?: string;
}) {
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

	const label = (portraitId ?? speaker).replace(/_/g, " ").toUpperCase();
	const portraitFrame =
		(portraitId ? atlas?.frames[portraitId] : null) ??
		(portraitId ? atlas?.frames[`${portraitId}_idle_0`] : null) ??
		null;
	const targetWidth = compact ? 72 : 92;
	const spriteStyle = useMemo(() => {
		if (!atlas || !portraitFrame) return null;
		const displayScale = targetWidth / portraitFrame.frame.w;
		return {
			backgroundImage: `url(/assets/portraits/${atlas.meta.image})`,
			backgroundPosition: `-${portraitFrame.frame.x * displayScale}px -${portraitFrame.frame.y * displayScale}px`,
			backgroundSize: `${atlas.meta.size.w * displayScale}px ${atlas.meta.size.h * displayScale}px`,
			width: `${targetWidth}px`,
			height: `${portraitFrame.frame.h * displayScale}px`,
			imageRendering: "pixelated" as const,
		};
	}, [atlas, portraitFrame, targetWidth]);

	return (
		<div
			data-testid="transmission-portrait"
			className={cn(
				"relative overflow-hidden rounded-md border border-accent/18 bg-[linear-gradient(180deg,rgba(19,20,17,0.94),rgba(8,11,10,0.98))]",
				className,
			)}
		>
			<div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.03)_0,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_5px)] opacity-30" />
			<div className={cn("relative grid gap-2 p-2", compact ? "w-22" : "w-27")}>
				<div className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
					CO Feed
				</div>
				<div className="relative overflow-hidden rounded border border-accent/20 bg-[radial-gradient(circle_at_top,rgba(212,165,116,0.22),rgba(0,0,0,0.06))]">
					{portraitFrame && spriteStyle ? (
						<div
							role="img"
							aria-label={`${speaker} portrait`}
							className="mx-auto bg-no-repeat"
							style={spriteStyle}
						/>
					) : (
						<div
							role="img"
							aria-label={`${speaker} portrait`}
							className={cn(
								"flex items-center justify-center font-heading uppercase tracking-[0.24em] text-muted-foreground/70",
								compact ? "h-27 text-lg" : "h-34 text-xl",
							)}
						>
							{toInitials(label)}
						</div>
					)}
				</div>
				<div className="border-t border-border/60 pt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-accent/85">
					{label}
				</div>
			</div>
		</div>
	);
}
