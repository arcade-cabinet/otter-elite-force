import { cn } from "@/ui/lib/utils";

export interface SettingsValues {
	masterVolume: number;
	musicVolume: number;
	sfxVolume: number;
	hapticsEnabled: boolean;
	cameraSpeed: number;
	uiScale: number;
	touchMode: string;
	showGrid: boolean;
	reduceFx: boolean;
	skipTutorials: boolean;
}

export const DEFAULT_USER_SETTINGS: SettingsValues = {
	masterVolume: 1.0,
	musicVolume: 0.7,
	sfxVolume: 1,
	hapticsEnabled: true,
	cameraSpeed: 1,
	uiScale: 1.0,
	touchMode: "auto",
	showGrid: false,
	reduceFx: false,
	skipTutorials: false,
};

type ControlTone = "command" | "dossier";

const toneStyles: Record<
	ControlTone,
	{
		shell: string;
		label: string;
		value: string;
		range: string;
		toggleOff: string;
		toggleOn: string;
		notes: string;
	}
> = {
	command: {
		shell: "rounded-[2px] border border-border/70 bg-background/20",
		label: "font-body text-xs uppercase tracking-wider text-muted-foreground",
		value: "font-mono text-xs tabular-nums text-foreground",
		range: "h-2 w-full cursor-pointer appearance-none bg-muted accent-accent",
		toggleOff: "text-muted-foreground",
		toggleOn: "text-accent",
		notes: "grid gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground",
	},
	dossier: {
		shell:
			"rounded-[2px] border border-rust-700/50 bg-[linear-gradient(180deg,rgba(245,230,200,0.92),rgba(232,223,193,0.82))] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]",
		label: "font-body text-xs uppercase tracking-wider text-rust-800",
		value: "font-mono text-xs tabular-nums text-rust-900",
		range: "h-2 w-full cursor-pointer appearance-none bg-rust-700/15 accent-rust-800",
		toggleOff: "text-rust-700/70",
		toggleOn: "text-rust-900",
		notes: "grid gap-3 text-xs uppercase tracking-[0.14em] text-rust-800/80",
	},
};

export function SliderSetting({
	label,
	value,
	onChange,
	tone = "command",
}: {
	label: string;
	value: number;
	onChange: (v: number) => void;
	tone?: ControlTone;
}) {
	const styles = toneStyles[tone];

	return (
		<div className={cn("flex flex-col gap-1 p-3", styles.shell)}>
			<div className="flex items-center justify-between">
				<span className={styles.label}>{label}</span>
				<span className={styles.value}>{Math.round(value * 100)}%</span>
			</div>
			<input
				type="range"
				min={0}
				max={1}
				step={0.05}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className={styles.range}
			/>
		</div>
	);
}

export function ToggleSetting({
	label,
	value,
	onChange,
	tone = "command",
}: {
	label: string;
	value: boolean;
	onChange: (v: boolean) => void;
	tone?: ControlTone;
}) {
	const styles = toneStyles[tone];

	return (
		<button
			type="button"
			onClick={() => onChange(!value)}
			className={cn("flex items-center justify-between px-3 py-3", styles.shell)}
		>
			<span className={styles.label}>{label}</span>
			<span
				className={cn("font-mono text-xs uppercase", value ? styles.toggleOn : styles.toggleOff)}
			>
				{value ? "ON" : "OFF"}
			</span>
		</button>
	);
}

export function SettingsOperatorNotes({ tone = "command" }: { tone?: ControlTone }) {
	return (
		<div className={toneStyles[tone].notes}>
			<p>Audio context still waits for user gesture before playback begins.</p>
			<p>Touch-first controls must stay readable at narrow mobile widths.</p>
			<p>Keep the look analog, gritty, and river-war instead of futuristic.</p>
		</div>
	);
}
