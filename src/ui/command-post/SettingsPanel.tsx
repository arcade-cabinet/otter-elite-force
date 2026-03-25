/**
 * SettingsPanel — Game settings (command-post theme).
 *
 * Controls: music volume, SFX volume, haptics toggle, camera speed,
 * touch mode, show grid, reduce FX, skip tutorials.
 */
import { useTrait, useWorld } from "koota/react";
import { useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AppScreen, UserSettings } from "@/ecs/traits/state";
import { CommandPostShell, ShellPanel } from "@/ui/layout/shells";
import {
	DEFAULT_USER_SETTINGS,
	SettingsOperatorNotes,
	SliderSetting,
	ToggleSetting,
} from "./SettingsControls";

export function SettingsPanel() {
	const world = useWorld();
	const settings = useTrait(world, UserSettings);
	const resolvedSettings = settings ?? DEFAULT_USER_SETTINGS;

	const update = (patch: Partial<typeof resolvedSettings>) => {
		world.set(UserSettings, { ...resolvedSettings, ...patch });
	};

	// US-092: Keyboard navigation — Escape returns to menu
	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === "Escape") {
				world.set(AppScreen, { screen: "menu" });
			}
		},
		[world],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	return (
		<CommandPostShell
			title="Settings"
			subtitle="Field controls for audio, haptics, grid overlays, and touch readability."
			footer={
				<Button variant="ghost" onClick={() => world.set(AppScreen, { screen: "menu" })}>
					Back
				</Button>
			}
		>
			<div
				data-testid="settings-panel"
				role="form"
				aria-label="Game Settings"
				className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
			>
				<ShellPanel
					title="Field Controls"
					description="Readable on desktop and touch-first on mobile."
				>
					<div className="flex max-w-xl flex-col gap-4">
						<SliderSetting
							label="Music Volume"
							value={resolvedSettings.musicVolume}
							onChange={(v) => update({ musicVolume: v })}
						/>
						<SliderSetting
							label="SFX Volume"
							value={resolvedSettings.sfxVolume}
							onChange={(v) => update({ sfxVolume: v })}
						/>
						<SliderSetting
							label="Camera Speed"
							value={resolvedSettings.cameraSpeed}
							onChange={(v) => update({ cameraSpeed: v })}
						/>
						<ToggleSetting
							label="Haptics"
							value={resolvedSettings.hapticsEnabled}
							onChange={(v) => update({ hapticsEnabled: v })}
						/>
						<ToggleSetting
							label="Show Grid"
							value={resolvedSettings.showGrid}
							onChange={(v) => update({ showGrid: v })}
						/>
						<ToggleSetting
							label="Reduce FX"
							value={resolvedSettings.reduceFx}
							onChange={(v) => update({ reduceFx: v })}
						/>
						<ToggleSetting
							label="Skip Tutorials"
							value={resolvedSettings.skipTutorials}
							onChange={(v) => update({ skipTutorials: v })}
						/>
					</div>
				</ShellPanel>

				<ShellPanel
					title="Operator Notes"
					description="Settings should feel like calibrated field gear, not a generic form stack."
				>
					<SettingsOperatorNotes />
				</ShellPanel>
			</div>
		</CommandPostShell>
	);
}
