/**
 * Main Menu Scene - Game Loader Interface
 *
 * This is the central command interface for OTTER: ELITE FORCE.
 * It serves as a game loader (New Game / Continue / Canteen), NOT a level selector.
 *
 * Key Design Principles:
 * - NO level select (the game is one persistent open world)
 * - Difficulty can go UP but never DOWN (escalation only)
 * - Characters are rescued in-world, not purchased here
 */

import { CHARACTERS, type DifficultyMode, useGameStore } from "../stores/gameStore";
import { DIFFICULTY_CONFIGS, DIFFICULTY_ORDER, RANKS } from "../utils/constants";

export function MainMenu() {
	const { saveData, setMode, resetData, selectedCharacterId, selectCharacter, setDifficulty } =
		useGameStore();

	// Check if this is a new game (no discovered chunks) or a continue
	const hasSaveData = Object.keys(saveData.discoveredChunks).length > 0;

	const handleNewGame = () => {
		// For new game, go to cutscene which will transition to game
		setMode("CUTSCENE");
	};

	const handleContinue = () => {
		// For continue, go directly to game (skip cutscene)
		setMode("GAME");
	};

	const canUpgradeDifficulty = (targetMode: DifficultyMode): boolean => {
		// Use centralized DIFFICULTY_ORDER constant
		return (
			DIFFICULTY_ORDER.indexOf(targetMode) > DIFFICULTY_ORDER.indexOf(saveData.difficultyMode) ||
			DIFFICULTY_ORDER.indexOf(targetMode) > DIFFICULTY_ORDER.indexOf(saveData.highestDifficulty)
		);
	};

	const getDifficultyWarning = (targetMode: DifficultyMode): string | null => {
		if (targetMode === "TACTICAL") {
			return "Warning: In TACTICAL mode, dropping below 30% HP triggers The Fall. You must return to LZ for extraction.";
		}
		if (targetMode === "ELITE") {
			return "Warning: ELITE mode enables permadeath. One death ends your campaign entirely.";
		}
		return null;
	};

	return (
		<div className="screen active menu-screen">
			<div className="menu-header">
				<h1>
					OTTER
					<br />
					ELITE FORCE
				</h1>
				<div className="subtitle">DEFEND THE COPPER-SILT REACH</div>
			</div>

			<div className="panel">
				{/* Current Campaign Status - Only show meaningful stats */}
				<div className="stat-row">
					<span>PLATOON COMMANDER</span>
					<span className="stat-val">{CHARACTERS[selectedCharacterId].traits.name}</span>
				</div>
				{hasSaveData && (
					<>
						<div className="stat-row">
							<span>RANK</span>
							<span className="stat-val">{RANKS[saveData.rank]}</span>
						</div>
						{saveData.territoryScore > 0 && (
							<div className="stat-row">
								<span>TERRITORY SECURED</span>
								<span className="stat-val">{saveData.territoryScore}</span>
							</div>
						)}
						{saveData.peacekeepingScore > 0 && (
							<div className="stat-row">
								<span>PEACEKEEPING SCORE</span>
								<span className="stat-val">{saveData.peacekeepingScore}</span>
							</div>
						)}
					</>
				)}
				<div className="stat-row">
					<span>DIFFICULTY</span>
					<span className="stat-val">{saveData.difficultyMode}</span>
				</div>

				{/* Campaign Actions - Primary Game Loader Interface */}
				<div className="campaign-actions" style={{ marginTop: "20px" }}>
					{hasSaveData ? (
						<>
							<button type="button" onClick={handleContinue}>
								CONTINUE CAMPAIGN
							</button>
							<button
								type="button"
								className="secondary"
								onClick={handleNewGame}
								style={{ marginTop: "10px" }}
							>
								RESTART CAMPAIGN
							</button>
						</>
					) : (
						<button type="button" onClick={handleNewGame}>
							NEW GAME
						</button>
					)}
				</div>

				{/* Canteen Access */}
				<button
					type="button"
					className="secondary"
					onClick={() => setMode("CANTEEN")}
					style={{ marginTop: "10px" }}
				>
					VISIT CANTEEN (FOB)
				</button>

				{/* Difficulty Selection - Escalation Only */}
				<h3 style={{ marginTop: "25px", color: "var(--primary)", fontSize: "0.9rem" }}>
					CAMPAIGN DIFFICULTY
				</h3>
				<p style={{ fontSize: "0.7rem", color: "#888", marginBottom: "10px" }}>
					Difficulty can be increased but never decreased
				</p>
				<div className="difficulty-grid" role="radiogroup" aria-label="Select Campaign Difficulty">
					{(["SUPPORT", "TACTICAL", "ELITE"] as const).map((mode) => {
						const config = DIFFICULTY_CONFIGS[mode];
						const isCurrent = saveData.difficultyMode === mode;
						const canUpgrade = canUpgradeDifficulty(mode);
						const isLocked = !canUpgrade && !isCurrent;

						// Build a descriptive label for screen readers
						let ariaLabel = `${config.displayName}: ${config.description}`;
						if (isCurrent) ariaLabel += ". Currently Active.";
						if (isLocked) ariaLabel += ". Locked - Difficulty can only be increased.";

						return (
							// biome-ignore lint/a11y/useSemanticElements: Custom styled radio group using buttons
							<button
								type="button"
								role="radio"
								aria-checked={isCurrent}
								key={mode}
								className={`diff-card ${isCurrent ? "selected" : ""} ${isLocked ? "locked" : ""}`}
								onClick={() => {
									if (canUpgrade) {
										const warning = getDifficultyWarning(mode);
										if (warning && !window.confirm(warning)) {
											return;
										}
										setDifficulty(mode);
									}
								}}
								disabled={isLocked}
								aria-label={ariaLabel}
								title={config.description}
							>
								<div className="diff-name">{config.displayName}</div>
								{mode === "TACTICAL" && <div className="diff-badge">THE FALL</div>}
								{mode === "ELITE" && <div className="diff-badge">PERMADEATH</div>}
							</button>
						);
					})}
				</div>

				{/* Character Selection */}
				<h3 style={{ marginTop: "25px", color: "var(--primary)", fontSize: "0.9rem" }}>
					SELECT WARRIOR
				</h3>
				<p style={{ fontSize: "0.7rem", color: "#888", marginBottom: "10px" }}>
					Rescue allies in the field to unlock new warriors
				</p>
				<div className="character-grid">
					{Object.values(CHARACTERS).map((char) => {
						const isUnlocked = saveData.unlockedCharacters.includes(char.traits.id);
						const isSelected = selectedCharacterId === char.traits.id;
						return (
							<button
								type="button"
								key={char.traits.id}
								className={`char-card ${isSelected ? "selected" : ""} ${isUnlocked ? "unlocked" : "locked"}`}
								onClick={() => isUnlocked && selectCharacter(char.traits.id)}
								disabled={!isUnlocked}
								title={isUnlocked ? undefined : char.traits.unlockRequirement}
							>
								<div className="char-name">{char.traits.name}</div>
								<div className="char-special">
									{isUnlocked
										? char.gear.weaponId?.replace("-", " ").toUpperCase()
										: "RESCUE TO UNLOCK"}
								</div>
							</button>
						);
					})}
				</div>

				{/* LZ Status */}
				{saveData.isLZSecured && (
					<div
						className="lz-status"
						style={{
							marginTop: "20px",
							padding: "10px",
							background: "rgba(0, 200, 0, 0.1)",
							border: "1px solid #0a0",
							borderRadius: "4px",
						}}
					>
						<span style={{ color: "#0a0" }}>✓ LZ SECURED</span>
						<span style={{ color: "#888", marginLeft: "10px" }}>
							Base components: {saveData.baseComponents.length}
						</span>
					</div>
				)}

				{/* Reset Data */}
				<button
					type="button"
					onClick={() => {
						if (
							window.confirm(
								"This will permanently delete all save data including discovered territory, rescued allies, and upgrades. Are you sure?",
							)
						) {
							resetData();
						}
					}}
					className="secondary"
					style={{ marginTop: "20px" }}
				>
					RESET ALL DATA
				</button>
			</div>
		</div>
	);
}
