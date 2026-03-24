/**
 * SettingsPanel — Game settings (command-post theme).
 *
 * Controls: music volume, SFX volume, haptics toggle, camera speed,
 * touch mode, show grid, reduce FX.
 */
import { useTrait, useWorld } from "koota/react";
import { Button } from "@/components/ui/button";
import { AppScreen, UserSettings } from "@/ecs/traits/state";
import { CommandPostShell, ShellPanel } from "@/ui/layout/shells";
import { cn } from "@/ui/lib/utils";

export function SettingsPanel() {
	const world = useWorld();
	const settings = useTrait(world, UserSettings);

	if (!settings) return null;

	const update = (patch: Partial<typeof settings>) => {
		world.set(UserSettings, { ...settings, ...patch });
	};

	return (
		<CommandPostShell
			title="Settings"
			subtitle="Command-post controls for audio, haptics, grid overlays, and battlefield readability."
			footer={<Button variant="ghost" onClick={() => world.set(AppScreen, { screen: "menu" })}>Back</Button>}
		>
			<div data-testid="settings-panel" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
				<ShellPanel title="Field Controls" description="Readable on desktop and touch-first on mobile.">
					<div className="flex max-w-xl flex-col gap-4">
						<SliderSetting label="Music Volume" value={settings.musicVolume} onChange={(v) => update({ musicVolume: v })} />
						<SliderSetting label="SFX Volume" value={settings.sfxVolume} onChange={(v) => update({ sfxVolume: v })} />
						<SliderSetting label="Camera Speed" value={settings.cameraSpeed} onChange={(v) => update({ cameraSpeed: v })} />
						<ToggleSetting label="Haptics" value={settings.hapticsEnabled} onChange={(v) => update({ hapticsEnabled: v })} />
						<ToggleSetting label="Show Grid" value={settings.showGrid} onChange={(v) => update({ showGrid: v })} />
						<ToggleSetting label="Reduce FX" value={settings.reduceFx} onChange={(v) => update({ reduceFx: v })} />
					</div>
				</ShellPanel>

				<ShellPanel title="Operator Notes" description="Settings should feel like calibrated field gear, not a generic form stack.">
					<div className="grid gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
						<p>Audio context must still wait for user gesture before playback begins.</p>
						<p>Touch-friendly controls stay readable at narrow mobile widths.</p>
						<p>Keep the visual language gritty and analog rather than futuristic.</p>
					</div>
				</ShellPanel>
			</div>
		</CommandPostShell>
	);
}

function SliderSetting({
	label,
	value,
	onChange,
}: {
	label: string;
	value: number;
	onChange: (v: number) => void;
}) {
	return (
		<div className="flex flex-col gap-1 rounded-lg border border-border/70 bg-background/20 p-3">
			<div className="flex items-center justify-between">
				<span className="font-body text-xs uppercase tracking-wider text-muted-foreground">
					{label}
				</span>
				<span className="font-mono text-xs tabular-nums text-foreground">
					{Math.round(value * 100)}%
				</span>
			</div>
			<input
				type="range"
				min={0}
				max={1}
				step={0.05}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="h-2 w-full cursor-pointer appearance-none bg-muted accent-accent"
			/>
		</div>
	);
}

function ToggleSetting({
	label,
	value,
	onChange,
}: {
	label: string;
	value: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onChange(!value)}
			className="flex items-center justify-between rounded-lg border border-border/70 bg-background/20 px-3 py-3"
		>
			<span className="font-body text-xs uppercase tracking-wider text-muted-foreground">
				{label}
			</span>
			<span
				className={cn(
					"font-mono text-xs uppercase",
					value ? "text-accent" : "text-muted-foreground",
				)}
			>
				{value ? "ON" : "OFF"}
			</span>
		</button>
	);
}
