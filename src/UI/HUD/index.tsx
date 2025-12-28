/**
 * HUD (Heads-Up Display)
 * In-game UI overlay - modular composition
 *
 * Mobile-first design with:
 * - 48px minimum touch targets
 * - Visible joystick zones
 * - First-objective prompts
 * - Directional damage indicators
 * - Build mode with palette UI
 */

import { useCallback, useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import { audioEngine } from "../../Core/AudioEngine";
import type { BuildableTemplate } from "../../ecs/data/buildableTemplates";
import { useGameStore } from "../../stores/gameStore";
import type { BaseComponentType } from "../../stores/types";
import { BuildPalette } from "../BuildPalette";
import { HUDActions } from "./HUDActions";
import { DamageIndicator, FallWarning, FirstObjectivePrompt } from "./HUDOverlays";
import { HUDStats } from "./HUDStats";
import { JoystickZones } from "./JoystickZones";

export function HUD() {
	const {
		health,
		maxHealth,
		kills,
		mudAmount,
		playerPos,
		saveData,
		isBuildMode,
		selectedBuildItem,
		lastDamageDirection,
	} = useGameStore(
		useShallow((state) => ({
			health: state.health,
			maxHealth: state.maxHealth,
			kills: state.kills,
			mudAmount: state.mudAmount,
			playerPos: state.playerPos,
			saveData: state.saveData,
			isBuildMode: state.isBuildMode,
			selectedBuildItem: state.selectedBuildItem,
			lastDamageDirection: state.lastDamageDirection,
		})),
	);

	const toggleZoom = useGameStore((state) => state.toggleZoom);
	const setBuildMode = useGameStore((state) => state.setBuildMode);
	const setSelectedBuildItem = useGameStore((state) => state.setSelectedBuildItem);
	const placeComponent = useGameStore((state) => state.placeComponent);
	const setHudReady = useGameStore((state) => state.setHudReady);
	const spendResources = useGameStore((state) => state.spendResources);
	const isNearLZ = useGameStore((state) => state.isNearLZ);
	const secureLZ = useGameStore((state) => state.secureLZ);

	// Signal HUD mount/unmount for input system initialization
	useEffect(() => {
		setHudReady(true);
		return () => setHudReady(false);
	}, [setHudReady]);

	// Track damage flash for directional indicator
	const [showDamageFlash, setShowDamageFlash] = useState(false);
	const [prevHealth, setPrevHealth] = useState(health);

	useEffect(() => {
		if (health < prevHealth) {
			setShowDamageFlash(true);
			if (navigator.vibrate) {
				navigator.vibrate(100);
			}
			const timer = setTimeout(() => setShowDamageFlash(false), 300);
			return () => clearTimeout(timer);
		}
		setPrevHealth(health);
	}, [health, prevHealth]);

	const showFirstObjective =
		!saveData.isLZSecured && Object.keys(saveData.discoveredChunks).length < 3;
	const showTheFall = saveData.difficultyMode === "TACTICAL" && saveData.isFallTriggered;
	const nearLZ = isNearLZ();

	const handleSelectItem = useCallback(
		(item: BuildableTemplate) => {
			setSelectedBuildItem(item);
			setBuildMode(false);
		},
		[setSelectedBuildItem, setBuildMode],
	);

	const handleConfirmPlacement = useCallback(() => {
		if (!selectedBuildItem) return;

		const pos: [number, number, number] = [
			Math.round(playerPos[0] / 4) * 4,
			Math.round(playerPos[1]),
			Math.round(playerPos[2] / 4) * 4,
		];

		if (
			spendResources(
				selectedBuildItem.cost.wood,
				selectedBuildItem.cost.metal,
				selectedBuildItem.cost.supplies,
			)
		) {
			let componentType: BaseComponentType = "FLOOR";
			if (selectedBuildItem.id.includes("wall")) componentType = "WALL";
			else if (selectedBuildItem.id.includes("roof")) componentType = "ROOF";
			else if (selectedBuildItem.id.includes("stilt")) componentType = "STILT";
			else if (selectedBuildItem.id.includes("watchtower")) componentType = "STILT";

			placeComponent({ type: componentType, position: pos, rotation: [0, 0, 0] });
			audioEngine.playSFX("pickup");

			if (!saveData.isLZSecured && selectedBuildItem.id === "watchtower-kit") {
				secureLZ();
			}
			setSelectedBuildItem(null);
		}
	}, [
		playerPos,
		placeComponent,
		spendResources,
		saveData.isLZSecured,
		secureLZ,
		selectedBuildItem,
		setSelectedBuildItem,
	]);

	const handleClosePalette = useCallback(() => {
		setBuildMode(false);
		setSelectedBuildItem(null);
	}, [setBuildMode, setSelectedBuildItem]);

	return (
		<div className="hud-container">
			<div className="mud-overlay" style={{ opacity: mudAmount }} />

			<DamageIndicator show={showDamageFlash} direction={lastDamageDirection} />
			<FirstObjectivePrompt show={showFirstObjective} nearLZ={nearLZ} playerPos={playerPos} />
			<FallWarning show={showTheFall} />

			<HUDStats
				health={health}
				maxHealth={maxHealth}
				kills={kills}
				playerPos={playerPos}
				territoryScore={saveData.territoryScore}
				peacekeepingScore={saveData.peacekeepingScore}
				resources={saveData.resources}
			/>

			<HUDActions
				selectedBuildItem={selectedBuildItem}
				isBuildMode={isBuildMode}
				nearLZ={nearLZ}
				difficultyMode={saveData.difficultyMode}
				onConfirmPlacement={handleConfirmPlacement}
				onCancelPlacement={() => setSelectedBuildItem(null)}
				onToggleZoom={toggleZoom}
				onToggleBuildMode={() => setBuildMode(!isBuildMode)}
			/>

			{isBuildMode && <BuildPalette onSelectItem={handleSelectItem} onClose={handleClosePalette} />}

			<JoystickZones />
		</div>
	);
}
