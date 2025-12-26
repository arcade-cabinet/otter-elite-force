/**
 * Main Menu Scene
 * Initial screen with campaign selection
 */

import { useGameStore } from "../stores/gameStore";
import { RANKS, LEVELS } from "../utils/constants";

export function MainMenu() {
	const { saveData, setMode, setLevel, resetData } = useGameStore();

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
					<span>OPERATIVE</span>
					<span className="stat-val">SGT. BUBBLES</span>
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
					<span>XP</span>
					<span className="stat-val">{saveData.xp}</span>
				</div>

				<button type="button" onClick={handleCampaign}>
					CAMPAIGN
				</button>

				<div className="level-grid">
					{LEVELS.map((level) => {
						const isUnlocked = level.id < saveData.unlocked;
						return (
							<div
								key={level.id}
								className={`level-card ${isUnlocked ? "unlocked" : "locked"}`}
								onClick={() => handleLevelSelect(level.id)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleLevelSelect(level.id);
								}}
							>
								<div>
									<div className="level-title">{level.title}</div>
									<div className="level-desc">{level.desc}</div>
								</div>
								<div className="level-goal">
									ELIMINATE {level.goal} TARGETS
								</div>
							</div>
						);
					})}
				</div>

				<button
					type="button"
					onClick={resetData}
					className="secondary"
				>
					RESET DATA
				</button>
			</div>
		</div>
	);
}
