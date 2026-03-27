/**
 * TransmissionPortrait -- Character portrait from sprite atlas or canvas renderer.
 *
 * Renders the portrait for Col. Bubbles, FOXHOUND, or Gen. Whiskers
 * in the command transmission panel. Tries loading portrait atlas JSON first,
 * then falls back to the procedural canvas portrait renderer, and finally
 * to speaker initials if neither is available.
 *
 * Reads from solidBridge dialogue() signal.
 */

import { type Component, createEffect, createMemo, createSignal, type JSX, onMount, Show } from "solid-js";
import { getPortraitCanvas } from "@/canvas/portraitRenderer";

interface AtlasFrame {
	frame: { x: number; y: number; w: number; h: number };
	sourceSize: { w: number; h: number };
}

interface PortraitAtlas {
	meta: { image: string; size: { w: number; h: number }; scale: number };
	frames: Record<string, AtlasFrame>;
}

let portraitAtlasPromise: Promise<PortraitAtlas> | null = null;

function loadPortraitAtlas(): Promise<PortraitAtlas> {
	if (!portraitAtlasPromise) {
		portraitAtlasPromise = fetch(
			`${import.meta.env.BASE_URL}assets/portraits/portraits_3x.json`,
		).then((response) => {
			if (!response.ok) {
				throw new Error(`Failed to load portrait atlas: ${response.status}`);
			}
			return response.json() as Promise<PortraitAtlas>;
		});
	}
	return portraitAtlasPromise;
}

function toInitials(label: string): string {
	return label
		.replace(/_/g, " ")
		.split(/\s+/)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("")
		.slice(0, 3);
}

/**
 * CanvasPortrait -- renders a procedural portrait canvas into the DOM.
 * Uses getPortraitCanvas() from the portrait renderer module.
 */
const CanvasPortrait: Component<{
	portraitId: string;
	speaker: string;
	targetWidth: number;
	compact?: boolean;
}> = (props) => {
	let containerRef: HTMLDivElement | undefined;

	createEffect(() => {
		if (!containerRef) return;
		const canvas = getPortraitCanvas(props.portraitId);
		if (!canvas) return;
		// Remove all existing children safely
		while (containerRef.firstChild) {
			containerRef.removeChild(containerRef.firstChild);
		}
		// Clone the cached canvas to avoid removing it from the cache
		const clone = canvas.cloneNode(true) as HTMLCanvasElement;
		clone.style.width = `${props.targetWidth}px`;
		clone.style.height = `${props.targetWidth}px`;
		clone.style.imageRendering = "pixelated";
		clone.style.display = "block";
		clone.style.margin = "0 auto";
		clone.setAttribute("role", "img");
		clone.setAttribute("aria-label", `${props.speaker} portrait`);
		containerRef.appendChild(clone);
	});

	return <div ref={containerRef} />;
};

export const TransmissionPortrait: Component<{
	/** Portrait frame ID in the atlas (e.g. "col_bubbles") */
	portraitId?: string | null;
	/** Speaker name for label display and fallback initials */
	speaker: string;
	/** Compact mode for smaller panels */
	compact?: boolean;
	/** Extra CSS classes */
	class?: string;
}> = (props) => {
	const [atlas, setAtlas] = createSignal<PortraitAtlas | null>(null);

	onMount(() => {
		loadPortraitAtlas()
			.then((data) => setAtlas(data))
			.catch(() => setAtlas(null));
	});

	const label = createMemo(() =>
		(props.portraitId ?? props.speaker).replace(/_/g, " ").toUpperCase(),
	);

	const portraitFrame = createMemo((): AtlasFrame | null => {
		const a = atlas();
		const pid = props.portraitId;
		if (!a || !pid) return null;
		return a.frames[pid] ?? a.frames[`${pid}_idle_0`] ?? null;
	});

	const targetWidth = createMemo(() => (props.compact ? 72 : 92));

	const spriteStyle = createMemo((): JSX.CSSProperties | null => {
		const a = atlas();
		const frame = portraitFrame();
		if (!a || !frame) return null;

		const displayScale = targetWidth() / frame.frame.w;
		return {
			"background-image": `url(${import.meta.env.BASE_URL}assets/portraits/${a.meta.image})`,
			"background-position": `-${frame.frame.x * displayScale}px -${frame.frame.y * displayScale}px`,
			"background-size": `${a.meta.size.w * displayScale}px ${a.meta.size.h * displayScale}px`,
			width: `${targetWidth()}px`,
			height: `${frame.frame.h * displayScale}px`,
			"image-rendering": "pixelated",
			"background-repeat": "no-repeat",
		};
	});

	/** Whether the canvas-based portrait renderer has this portrait. */
	const hasCanvasPortrait = createMemo(() => {
		const pid = props.portraitId;
		if (!pid) return false;
		if (typeof document === "undefined") return false;
		return getPortraitCanvas(pid) !== null;
	});

	return (
		<div
			data-testid="transmission-portrait"
			class={`relative overflow-hidden rounded-[2px] border border-green-500/18 bg-[linear-gradient(180deg,rgba(19,20,17,0.94),rgba(8,11,10,0.98))] ${props.class ?? ""}`}
		>
			{/* Scanline overlay */}
			<div
				aria-hidden="true"
				class="absolute inset-0 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.03)_0,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_5px)] opacity-30"
			/>

			<div class={`relative grid gap-2 p-2 ${props.compact ? "w-[88px]" : "w-[108px]"}`}>
				{/* Label */}
				<div class="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-500">CO Feed</div>

				{/* Portrait frame */}
				<div class="relative overflow-hidden rounded-[1px] border border-green-500/20 bg-[radial-gradient(circle_at_top,rgba(212,165,116,0.22),rgba(0,0,0,0.06))]">
					<Show
						when={spriteStyle()}
						fallback={
							<Show
								when={hasCanvasPortrait() ? props.portraitId : null}
								fallback={
									<div
										role="img"
										aria-label={`${props.speaker} portrait`}
										class={`flex items-center justify-center font-heading uppercase tracking-[0.24em] text-slate-600 ${
											props.compact ? "h-[108px] text-lg" : "h-[136px] text-xl"
										}`}
									>
										{toInitials(label())}
									</div>
								}
							>
								{(pid) => (
									<CanvasPortrait
										portraitId={pid()}
										speaker={props.speaker}
										targetWidth={targetWidth()}
										compact={props.compact}
									/>
								)}
							</Show>
						}
					>
						{(style) => (
							<div
								role="img"
								aria-label={`${props.speaker} portrait`}
								class="mx-auto"
								style={style()}
							/>
						)}
					</Show>
				</div>

				{/* Speaker name */}
				<div class="border-t border-slate-600/60 pt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-green-400/85">
					{label()}
				</div>
			</div>
		</div>
	);
};
