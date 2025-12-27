/**
 * Main Menu Scene
 * Initial screen with campaign selection
 */

import { CHARACTERS, useGameStore } from "../stores/gameStore";
import { LEVELS, RANKS } from "../utils/constants";

export function MainMenu() {
	const {
		saveData,
		setMode,
		setLevel,
		resetData,
		selectedCharacterId,
		selectCharacter,
		setDifficulty,
	} = useGameStore();

	const handleCampaign = () => {
		setMode("CUTSCENE");
	};

	const handleLevelSelect = (levelId: number) => {
		if (levelId < saveData.unlocked) {
			setLevel(levelId);
			setMode("CUTSCENE");
		}
	};

	return (
		<div className="screen active menu-screen">
			<div className="menu-header">
				<h1>
					OTTER
					<br />
					ELITE FORCE
				</h1>
				<div className="subtitle">DEFEND THE RIVER</div>
			</div>

			<div className="panel">
				<div className="stat-row">
					<span>PLATOON COMMANDER</span>
					<span className="stat-val">{CHARACTERS[selectedCharacterId].traits.name}</span>
				</div>
				<div className="stat-row">
					<span>RANK</span>
					<span className="stat-val">{RANKS[saveData.rank]}</span>
				</div>
				<div className="stat-row">
					<span>MEDALS</span>
					<span className="stat-val">{saveData.medals}</span>
				</div>
				<div className="stat-row">
					<span>DIFFICULTY</span>
					<span className="stat-val">{saveData.difficultyMode}</span>
				</div>

				<h3 style={{ marginTop: "20px", color: "var(--primary)", fontSize: "0.9rem" }}>
					CAMPAIGN DIFFICULTY
				</h3>
				<div className="difficulty-grid">
					{["SUPPORT", "TACTICAL", "ELITE"].map((mode) => {
						const order = ["SUPPORT", "TACTICAL", "ELITE"];
						const isCurrent = saveData.difficultyMode === mode;
						const canIncrease = order.indexOf(mode) > order.indexOf(saveData.difficultyMode);
						return (
							<button
								type="button"
								key={mode}
								className={`diff-card ${isCurrent ? "selected" : ""} ${!canIncrease && !isCurrent ? "locked" : ""}`}
								onClick={() => setDifficulty(mode as any)}
								disabled={!canIncrease}
							>
								{mode}
							</button>
						);
					})}
				</div>

				<h3 style={{ marginTop: "20px", color: "var(--primary)", fontSize: "0.9rem" }}>
					SELECT WARRIOR
				</h3>
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
							>
								<div className="char-name">{char.traits.name}</div>
								<div className="char-special">{char.gear.weaponId?.replace("-", " ")}</div>
							</button>
						);
					})}
				</div>

				<button type="button" onClick={handleCampaign} style={{ marginTop: "30px" }}>
					START CAMPAIGN
				</button>

				<button type="button" className="secondary" onClick={() => setMode("CANTEEN")}>
					VISIT CANTEEN
				</button>

				<h3 style={{ marginTop: "20px", color: "var(--primary)", fontSize: "0.9rem" }}>MISSIONS</h3>
				<div className="level-grid">
					{LEVELS.map((level) => {
						const isUnlocked = level.id < saveData.unlocked;
						return (
							<button
								type="button"
								key={level.id}
								className={`level-card ${isUnlocked ? "unlocked" : "locked"}`}
								onClick={() => handleLevelSelect(level.id)}
								disabled={!isUnlocked}
							>
								<div>
									<div className="level-title">{level.title}</div>
									<div className="level-desc">{level.desc}</div>
								</div>
								<div className="level-goal">{level.goal} TARGETS</div>
							</button>
						);
					})}
				</div>

				<button type="button" onClick={resetData} className="secondary">
					RESET PLATOON DATA
				</button>
			</div>
		</div>
	);
}
