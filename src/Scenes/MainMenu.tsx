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
 *
 * Design: Vietnam-era command briefing aesthetic
 * - Oppressive humidity and heat haze
 * - Military typewriter and stencil fonts
 * - Jungle night palette with noise texture
 */

import { CHARACTERS, type DifficultyMode, useGameStore } from "../stores/gameStore";
import { DIFFICULTY_CONFIGS, DIFFICULTY_ORDER, RANKS } from "../utils/constants";
import DESIGN_TOKENS from "../theme/designTokens";
import { SVGDecoration } from "../theme/svgDecorations";

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
		<div className="min-h-screen w-full bg-jungle-night bg-noise bg-blend-overlay flex items-center justify-center p-4 animate-heat-wave">
			{/* Command Briefing Container */}
			<div className="max-w-2xl w-full bg-jungle-dark/90 border-2 border-olive-drab shadow-haze backdrop-blur-sm relative">
				{/* SVG Corner Decorations */}
				<SVGDecoration 
					type="stencilStar" 
					className="absolute top-2 left-2 w-8 h-8 opacity-30 pointer-events-none" 
				/>
				<SVGDecoration 
					type="stencilStar" 
					className="absolute top-2 right-2 w-8 h-8 opacity-30 pointer-events-none" 
				/>
				
				{/* Header: Main Title */}
				<div className="bg-olive-drab border-b-2 border-canvas-tan p-6 text-center relative overflow-hidden">
					{/* Background helicopter silhouette */}
					<SVGDecoration 
						type="helicopter" 
						className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 opacity-10 pointer-events-none animate-chopper-wobble" 
					/>
					
					{/* URA Insignia */}
					<SVGDecoration 
						type="uraInsignia" 
						className="absolute left-4 top-1/2 -translate-y-1/2 w-16 h-16 opacity-40 pointer-events-none" 
					/>
					
					<div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />
					<h1 className="font-stencil text-stencil-lg text-chalk-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] tracking-widest relative z-10 text-stencil-shadow">
						OTTER
						<br />
						ELITE FORCE
					</h1>
					<div className="font-typewriter text-briefing text-haze-yellow mt-2 tracking-wide relative z-10">
						{DESIGN_TOKENS.brand.tagline}
					</div>
					
					{/* Barbed wire border decoration */}
					<SVGDecoration 
						type="barbedWire" 
						className="absolute bottom-0 left-0 right-0 h-2 opacity-50 pointer-events-none" 
					/>
				</div>

				{/* Main Panel */}
				<div className="p-6 space-y-6">
					{/* Current Campaign Status - Terminal Readout Style */}
					<div className="bg-gunmetal/40 border border-cordite-gray p-4 space-y-2">
						<div className="flex justify-between items-center font-terminal text-sm text-haze-yellow">
							<span className="text-canvas-tan">PLATOON COMMANDER</span>
							<span className="text-chalk-white tracking-wider">
								{CHARACTERS[selectedCharacterId].traits.name}
							</span>
						</div>
						{hasSaveData && (
							<>
								<div className="flex justify-between items-center font-terminal text-sm text-haze-yellow">
									<span className="text-canvas-tan">RANK</span>
									<span className="text-chalk-white tracking-wider">{RANKS[saveData.rank]}</span>
								</div>
								{saveData.territoryScore > 0 && (
									<div className="flex justify-between items-center font-terminal text-sm text-haze-yellow">
										<span className="text-canvas-tan">TERRITORY SECURED</span>
										<span className="text-ura-orange tracking-wider font-bold">
											{saveData.territoryScore}
										</span>
									</div>
								)}
								{saveData.peacekeepingScore > 0 && (
									<div className="flex justify-between items-center font-terminal text-sm text-haze-yellow">
										<span className="text-canvas-tan">PEACEKEEPING SCORE</span>
										<span className="text-ura-orange tracking-wider font-bold">
											{saveData.peacekeepingScore}
										</span>
									</div>
								)}
							</>
						)}
						<div className="flex justify-between items-center font-terminal text-sm text-haze-yellow">
							<span className="text-canvas-tan">DIFFICULTY</span>
							<span className="text-warning-amber tracking-wider font-bold">
								{saveData.difficultyMode}
							</span>
						</div>
					</div>

					{/* Campaign Actions - Primary Game Loader Interface */}
					<div className="space-y-3">
						{hasSaveData ? (
							<>
								<button
									type="button"
									onClick={handleContinue}
									className="w-full bg-olive-drab hover:bg-canvas-tan border-2 border-warning-amber text-chalk-white hover:text-typewriter-black font-stencil text-base py-3 px-6 transition-all duration-200 hover:scale-105 hover:shadow-haze tracking-widest"
								>
									CONTINUE CAMPAIGN
								</button>
								<button
									type="button"
									onClick={handleNewGame}
									className="w-full bg-gunmetal/60 hover:bg-olive-drab/80 border-2 border-cordite-gray hover:border-canvas-tan text-canvas-tan hover:text-chalk-white font-typewriter text-sm py-2 px-4 transition-all duration-200"
								>
									RESTART CAMPAIGN
								</button>
							</>
						) : (
							<button
								type="button"
								onClick={handleNewGame}
								className="w-full bg-olive-drab hover:bg-canvas-tan border-2 border-warning-amber text-chalk-white hover:text-typewriter-black font-stencil text-base py-3 px-6 transition-all duration-200 hover:scale-105 hover:shadow-haze tracking-widest"
							>
								NEW GAME
							</button>
						)}
					</div>

					{/* Canteen Access */}
					<button
						type="button"
						onClick={() => setMode("CANTEEN")}
						className="w-full bg-gunmetal/60 hover:bg-olive-drab/80 border-2 border-cordite-gray hover:border-canvas-tan text-canvas-tan hover:text-chalk-white font-typewriter text-sm py-2 px-4 transition-all duration-200"
					>
						VISIT CANTEEN (FOB)
					</button>

					{/* Difficulty Selection - Escalation Only */}
					<div className="border-t-2 border-olive-drab/40 pt-6">
						<h3 className="font-stencil text-stencil-sm text-warning-amber mb-1 tracking-widest">
							CAMPAIGN DIFFICULTY
						</h3>
						<p className="font-typewriter text-report text-haze-yellow/70 mb-4">
							Difficulty can be increased but never decreased
						</p>
						<div
							className="grid grid-cols-3 gap-3"
							role="radiogroup"
							aria-label="Select Campaign Difficulty"
						>
							{(["SUPPORT", "TACTICAL", "ELITE"] as const).map((mode) => {
								const config = DIFFICULTY_CONFIGS[mode];
								const isCurrent = saveData.difficultyMode === mode;
								const canUpgrade = canUpgradeDifficulty(mode);
								const isLocked = !canUpgrade && !isCurrent;

								// Difficulty-specific colors
								const colorClasses = {
									SUPPORT: "border-ura-orange hover:bg-ura-orange/20",
									TACTICAL: "border-warning-amber hover:bg-warning-amber/20",
									ELITE: "border-ura-blood hover:bg-ura-blood/20",
								}[mode];

								const selectedClasses = {
									SUPPORT: "bg-ura-orange/30 border-ura-orange shadow-[0_0_20px_rgba(255,136,0,0.4)]",
									TACTICAL:
										"bg-warning-amber/30 border-warning-amber shadow-[0_0_20px_rgba(255,191,0,0.4)]",
									ELITE: "bg-ura-blood/30 border-ura-blood shadow-[0_0_20px_rgba(139,0,0,0.4)]",
								}[mode];

								const badgeClasses = {
									SUPPORT: "bg-ura-orange text-jungle-dark",
									TACTICAL: "bg-warning-amber text-jungle-dark",
									ELITE: "bg-ura-blood text-chalk-white",
								}[mode];

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
										className={`
											relative border-2 p-3 transition-all duration-200 font-typewriter text-xs
											${isCurrent ? selectedClasses : colorClasses}
											${isLocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:scale-105"}
										`}
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
										<div className="font-stencil text-chalk-white text-xs tracking-wide">
											{config.displayName}
										</div>
										{mode === "TACTICAL" && (
											<div
												className={`mt-2 text-[10px] px-2 py-1 ${badgeClasses} font-terminal tracking-wider`}
											>
												THE FALL
											</div>
										)}
										{mode === "ELITE" && (
											<div
												className={`mt-2 text-[10px] px-2 py-1 ${badgeClasses} font-terminal tracking-wider`}
											>
												PERMADEATH
											</div>
										)}
									</button>
								);
							})}
						</div>
					</div>

					{/* Character Selection */}
					<div className="border-t-2 border-olive-drab/40 pt-6">
						<h3 className="font-stencil text-stencil-sm text-warning-amber mb-1 tracking-widest">
							SELECT WARRIOR
						</h3>
						<p className="font-typewriter text-report text-haze-yellow/70 mb-4">
							Rescue allies in the field to unlock new warriors
						</p>
						<div className="grid grid-cols-2 gap-3">
							{Object.values(CHARACTERS).map((char) => {
								const isUnlocked = saveData.unlockedCharacters.includes(char.traits.id);
								const isSelected = selectedCharacterId === char.traits.id;
								return (
									<button
										type="button"
										key={char.traits.id}
										className={`
											border-2 p-3 transition-all duration-200 font-typewriter text-xs
											${
												isSelected
													? "bg-olive-drab/40 border-ura-orange shadow-[0_0_15px_rgba(255,136,0,0.3)] scale-105"
													: "border-cordite-gray hover:border-canvas-tan"
											}
											${isUnlocked ? "hover:bg-olive-drab/20 cursor-pointer" : "opacity-50 cursor-not-allowed"}
										`}
										onClick={() => isUnlocked && selectCharacter(char.traits.id)}
										disabled={!isUnlocked}
										title={isUnlocked ? undefined : char.traits.unlockRequirement}
									>
										<div className="font-stencil text-chalk-white text-sm tracking-wide mb-2">
											{char.traits.name}
										</div>
										<div className="font-terminal text-[10px] text-haze-yellow tracking-wider">
											{isUnlocked
												? char.gear.weaponId?.replace("-", " ").toUpperCase()
												: "RESCUE TO UNLOCK"}
										</div>
									</button>
								);
							})}
						</div>
					</div>

					{/* LZ Status */}
					{saveData.isLZSecured && (
						<div className="bg-scale-emerald/20 border-2 border-ura-orange p-4">
							<div className="flex items-center justify-between">
								<span className="font-stencil text-ura-orange tracking-wide">✓ LZ SECURED</span>
								<span className="font-terminal text-haze-yellow text-xs">
									Base components: {saveData.baseComponents.length}
								</span>
							</div>
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
						className="w-full bg-gunmetal/40 hover:bg-ura-blood/60 border border-cordite-gray hover:border-ura-blood text-haze-yellow/60 hover:text-chalk-white font-terminal text-xs py-2 px-4 transition-all duration-200"
					>
						RESET ALL DATA
					</button>
				</div>
			</div>
		</div>
	);
}
