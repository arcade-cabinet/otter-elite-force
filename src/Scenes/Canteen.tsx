/**
 * Canteen Scene
 * Where players spend coins on character unlocks and gear
 */

import { Environment, OrbitControls, Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { PlayerRig } from "../Entities/PlayerRig";
import { CHAR_PRICES, CHARACTERS, useGameStore, UPGRADE_COSTS } from "../stores/gameStore";

export function Canteen() {
	const { saveData, unlockCharacter, spendCoins, setMode, buyUpgrade } = useGameStore();
	const [selectedId, setSelectedId] = useState("bubbles");
	const [view, setView] = useState<"PLATOON" | "UPGRADES">("PLATOON");

	const selectedChar = CHARACTERS[selectedId];
	const isUnlocked = saveData.unlockedCharacters.includes(selectedId);
	const price = CHAR_PRICES[selectedId];

	const handlePurchase = () => {
		if (spendCoins(price)) {
			unlockCharacter(selectedId);
		}
	};

	return (
		<div className="screen active canteen-screen">
			<div className="canteen-3d">
				<Canvas shadows camera={{ position: [0, 2, 5], fov: 45 }}>
					<ambientLight intensity={0.5} />
					<directionalLight position={[5, 5, 5]} intensity={1} castShadow />
					<Sky sunPosition={[100, 10, 100]} />
					<Environment preset="sunset" />

					<PlayerRig
						traits={selectedChar.traits}
						gear={selectedChar.gear}
						position={[0, 0, 0]}
						rotation={0}
					/>

					<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
						<planeGeometry args={[10, 10]} />
						<meshStandardMaterial color="#332211" />
					</mesh>

					<OrbitControls
						enableZoom={false}
						minPolarAngle={Math.PI / 3}
						maxPolarAngle={Math.PI / 2}
					/>
				</Canvas>
			</div>

			<div className="canteen-ui">
				<div className="canteen-header">
					<h2>FORWARD OPERATING BASE</h2>
					<div className="coin-display">SUPPLY CREDITS: {saveData.coins}</div>
				</div>

				<div className="canteen-tabs">
					<button type="button" className={view === "PLATOON" ? "active" : ""} onClick={() => setView("PLATOON")}>PLATOON</button>
					<button type="button" className={view === "UPGRADES" ? "active" : ""} onClick={() => setView("UPGRADES")}>UPGRADES</button>
				</div>

				{view === "PLATOON" ? (
					<>
						<div className="platoon-list">
							{Object.values(CHARACTERS).map((char) => {
								const unlocked = saveData.unlockedCharacters.includes(char.traits.id);
								const active = selectedId === char.traits.id;
								return (
									<button
										type="button"
										key={char.traits.id}
										className={`platoon-item ${active ? "active" : ""} ${unlocked ? "unlocked" : "locked"}`}
										onClick={() => setSelectedId(char.traits.id)}
									>
										{char.traits.name}
									</button>
								);
							})}
						</div>

						<div className="purchase-panel">
							<h3>{selectedChar.traits.name}</h3>
							<p>
								{selectedChar.traits.grizzled
									? "A battle-hardened veteran of the early campaigns."
									: "Fresh meat, but ready for the soup."}
							</p>

							{isUnlocked ? (
								<div className="status-unlocked">DEPLOYED</div>
							) : (
								<button
									type="button"
									className="purchase-btn"
									onClick={handlePurchase}
									disabled={saveData.coins < price}
								>
									REQUISITION: {price} CREDITS
								</button>
							)}
						</div>
					</>
				) : (
					<div className="upgrades-list">
						<div className="upgrade-item">
							<span>SPEED BOOST (Lvl {saveData.upgrades.speedBoost})</span>
							<button type="button" onClick={() => buyUpgrade("speed", UPGRADE_COSTS.speed)} disabled={saveData.coins < UPGRADE_COSTS.speed}>
								BUY: {UPGRADE_COSTS.speed}
							</button>
						</div>
						<div className="upgrade-item">
							<span>HEALTH BOOST (Lvl {saveData.upgrades.healthBoost})</span>
							<button type="button" onClick={() => buyUpgrade("health", UPGRADE_COSTS.health)} disabled={saveData.coins < UPGRADE_COSTS.health}>
								BUY: {UPGRADE_COSTS.health}
							</button>
						</div>
						<div className="upgrade-item">
							<span>DAMAGE BOOST (Lvl {saveData.upgrades.damageBoost})</span>
							<button type="button" onClick={() => buyUpgrade("damage", UPGRADE_COSTS.damage)} disabled={saveData.coins < UPGRADE_COSTS.damage}>
								BUY: {UPGRADE_COSTS.damage}
							</button>
						</div>
					</div>
				)}

				<button type="button" className="secondary" onClick={() => setMode("MENU")}>
					RETURN TO PERIMETER
				</button>
			</div>
		</div>
	);
}
