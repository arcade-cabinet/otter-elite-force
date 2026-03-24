/**
 * App — Root component with theme switching and screen routing.
 *
 * Reads AppScreen trait from Koota to determine active screen.
 * Sets `data-theme` on <html> to activate the correct CSS theme.
 * Wraps everything in WorldProvider so all children can read Koota.
 *
 * Flow: menu → campaign → briefing → game → victory → settings
 */
import { useRef, useEffect } from "react";
import { WorldProvider, useTrait, useWorld } from "koota/react";
import { world } from "@/ecs/world";
import { initSingletons } from "@/ecs/singletons";
import { AppScreen, type AppScreenType } from "@/ecs/traits/state";
import { PhaserGame, type IRefPhaserGame } from "./PhaserGame";

// UI screens
import { MainMenu } from "@/ui/command-post/MainMenu";
import { CampaignMap } from "@/ui/command-post/CampaignMap";
import { SettingsPanel } from "@/ui/command-post/SettingsPanel";
import { BriefingScreen } from "@/ui/briefing/BriefingScreen";

// HUD overlay (shown during gameplay)
import { ResourceBar } from "@/ui/hud/ResourceBar";
import { Minimap } from "@/ui/hud/Minimap";
import { UnitPanel } from "@/ui/hud/UnitPanel";
import { ActionBar } from "@/ui/hud/ActionBar";
import { AlertBanner } from "@/ui/hud/AlertBanner";

// Initialize singleton state traits once at module load
initSingletons(world);

/** Map screen → CSS theme name */
const SCREEN_THEMES: Record<AppScreenType, string> = {
	menu: "command-post",
	campaign: "command-post",
	settings: "command-post",
	briefing: "briefing",
	game: "tactical",
	victory: "tactical",
};

function App() {
	return (
		<WorldProvider world={world}>
			<AppRouter />
		</WorldProvider>
	);
}

/** Reads AppScreen from Koota and renders the active screen. */
function AppRouter() {
	const w = useWorld();
	const appScreen = useTrait(w, AppScreen);
	const screen = appScreen?.screen ?? "menu";

	// Apply theme to <html> element
	useEffect(() => {
		const theme = SCREEN_THEMES[screen] ?? "command-post";
		document.documentElement.setAttribute("data-theme", theme);
	}, [screen]);

	switch (screen) {
		case "menu":
			return <MainMenu />;
		case "campaign":
			return <CampaignMap />;
		case "settings":
			return <SettingsPanel />;
		case "briefing":
			return <BriefingPlaceholder />;
		case "game":
			return <GameplayScreen />;
		case "victory":
			return <VictoryOverlay />;
		default:
			return <MainMenu />;
	}
}

/** Briefing screen with placeholder briefing data (will be driven by mission defs). */
function BriefingPlaceholder() {
	const w = useWorld();

	const deploy = () => {
		w.set(AppScreen, { screen: "game" });
	};

	return (
		<BriefingScreen
			briefing={{
				missionId: "mission_1",
				missionName: "First Light",
				subtitle: "Secure the Landing Zone",
				portraitId: "foxhound",
				lines: [
					{ speaker: "FOXHOUND", text: "Sergeant, welcome to The Soup." },
					{ speaker: "FOXHOUND", text: "Intel says Scale-Guard patrols are thin in this sector." },
					{
						speaker: "FOXHOUND",
						text: "Establish a perimeter and gather resources. FOXHOUND out.",
					},
				],
			}}
			onDeploy={deploy}
		/>
	);
}

/** Gameplay screen: Phaser canvas + tactical HUD overlay. */
function GameplayScreen() {
	const phaserRef = useRef<IRefPhaserGame>(null);

	return (
		<div className="relative h-screen w-screen overflow-hidden">
			{/* Phaser canvas */}
			<PhaserGame ref={phaserRef} />

			{/* Tactical HUD overlay */}
			<div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
				{/* Top bar */}
				<div className="pointer-events-auto">
					<ResourceBar />
				</div>

				{/* Middle: alerts float top-right */}
				<div className="flex-1">
					<AlertBanner />
				</div>

				{/* Bottom bar */}
				<div className="pointer-events-auto flex items-end gap-2">
					<Minimap />
					<div className="flex flex-1 flex-col">
						<UnitPanel />
						<ActionBar />
					</div>
				</div>
			</div>
		</div>
	);
}

/** Victory overlay — shown after mission completion. */
function VictoryOverlay() {
	const w = useWorld();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-foreground">
			<h2 className="font-heading text-3xl uppercase tracking-widest text-accent">
				Mission Complete
			</h2>
			<button
				type="button"
				onClick={() => w.set(AppScreen, { screen: "campaign" })}
				className="border-2 border-border bg-card px-6 py-3 font-heading text-sm uppercase tracking-widest text-card-foreground hover:border-primary hover:text-primary"
			>
				Continue Campaign
			</button>
		</div>
	);
}

export default App;
