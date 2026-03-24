/**
 * SettingsPanel — Game settings (command-post theme).
 *
 * Controls: music volume, SFX volume, haptics toggle, camera speed,
 * touch mode, show grid, reduce FX.
 * Reads and writes UserSettings trait on the Koota world.
 */
import { useTrait, useWorld } from "koota/react";
import { UserSettings, AppScreen } from "@/ecs/traits/state";
import { cn } from "@/ui/lib/utils";

export function SettingsPanel() {
	const world = useWorld();
	const settings = useTrait(world, UserSettings);

	if (!settings) return null;

	const update = (patch: Partial<typeof settings>) => {
		world.set(UserSettings, { ...settings, ...patch });
	};

	return (
		<div
			data-testid="settings-panel"
			className={cn(
				"flex min-h-screen flex-col items-center justify-center gap-8",
				"bg-background text-foreground",
			)}
		>
			<h2 className="font-heading text-2xl uppercase tracking-widest text-primary">Settings</h2>

			<div className="flex w-80 flex-col gap-4">
				<SliderSetting
					label="Music Volume"
					value={settings.musicVolume}
					onChange={(v) => update({ musicVolume: v })}
				/>
				<SliderSetting
					label="SFX Volume"
					value={settings.sfxVolume}
					onChange={(v) => update({ sfxVolume: v })}
				/>
				<SliderSetting
					label="Camera Speed"
					value={settings.cameraSpeed}
					onChange={(v) => update({ cameraSpeed: v })}
				/>
				<ToggleSetting
					label="Haptics"
					value={settings.hapticsEnabled}
					onChange={(v) => update({ hapticsEnabled: v })}
				/>
				<ToggleSetting
					label="Show Grid"
					value={settings.showGrid}
					onChange={(v) => update({ showGrid: v })}
				/>
				<ToggleSetting
					label="Reduce FX"
					value={settings.reduceFx}
					onChange={(v) => update({ reduceFx: v })}
				/>
			</div>

			<button
				type="button"
				onClick={() => world.set(AppScreen, { screen: "menu" })}
				className={cn(
					"px-6 py-2 font-heading text-xs uppercase tracking-widest",
					"border-2 border-border bg-card text-card-foreground",
					"hover:border-primary hover:text-primary",
				)}
			>
				Back
			</button>
		</div>
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
		<div className="flex flex-col gap-1">
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
			className="flex items-center justify-between py-1"
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
