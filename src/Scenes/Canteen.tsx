/**
 * Canteen Scene
 * Forward Operating Base for character selection and upgrades
 *
 * Redesigned with:
 * - Fixed camera view (no user-controlled orbit)
 * - Modal-based preview system for gear/character changes
 * - Proper touch handling for scrollable content
 */

import { Environment } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";
import { PlayerRig } from "../Entities/PlayerRig";
import { CHAR_PRICES, CHARACTERS, UPGRADE_COSTS, useGameStore } from "../stores/gameStore";

// Color constants for theming
const GROUND_PLANE_COLOR = "#332211";

// Upgrade configuration for DRY rendering
const UPGRADE_CONFIG = [
	{ key: "speed", name: "SPEED BOOST", storeKey: "speedBoost" as const, cost: UPGRADE_COSTS.speed },
	{ key: "health", name: "HEALTH BOOST", storeKey: "healthBoost" as const, cost: UPGRADE_COSTS.health },
	{ key: "damage", name: "DAMAGE BOOST", storeKey: "damageBoost" as const, cost: UPGRADE_COSTS.damage },
] as const;

/** Slowly rotating character display for modal preview */
function RotatingCharacterDisplay({
	traits,
	gear,
}: {
	traits: (typeof CHARACTERS)[string]["traits"];
	gear: (typeof CHARACTERS)[string]["gear"];
}) {
	const groupRef = useRef<Group>(null);

	useFrame((_, delta) => {
		if (groupRef.current) {
			groupRef.current.rotation.y += delta * 0.5;
		}
	});

	return (
		<group ref={groupRef}>
			<PlayerRig traits={traits} gear={gear} position={[0, 0, 0]} rotation={0} />
		</group>
	);
}

/** Modal for previewing and confirming character/gear selection */
function PreviewModal({
	char,
	isUnlocked,
	price,
	coins,
	onConfirm,
	onCancel,
}: {
	char: (typeof CHARACTERS)[string];
	isUnlocked: boolean;
	price: number;
	coins: number;
	onConfirm: () => void;
	onCancel: () => void;
}) {
	const canAfford = coins >= price;
	const modalRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	// Focus trap and keyboard handling
	useEffect(() => {
		// Focus the close button when modal opens
		closeButtonRef.current?.focus();

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onCancel();
				return;
			}

			// Focus trapping with Tab key
			if (event.key === "Tab" && modalRef.current) {
				const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
					'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
				);
				const firstElement = focusableElements[0];
				const lastElement = focusableElements[focusableElements.length - 1];

				if (event.shiftKey && document.activeElement === firstElement) {
					event.preventDefault();
					lastElement?.focus();
				} else if (!event.shiftKey && document.activeElement === lastElement) {
					event.preventDefault();
					firstElement?.focus();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onCancel]);

	return (
		/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape key handled via useEffect */
		/* biome-ignore lint/a11y/noStaticElementInteractions: Backdrop needs click handler for modal UX */
		<div className="canteen-modal-overlay" onClick={onCancel}>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: onClick only used to stop propagation, not for interaction */}
			<div
				ref={modalRef}
				className="canteen-modal"
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="canteen-modal-title"
			>
				<div className="canteen-modal-3d">
					<Canvas shadows camera={{ position: [0, 1.5, 4], fov: 35 }}>
						<ambientLight intensity={0.6} />
						<directionalLight position={[3, 5, 3]} intensity={1.2} castShadow />
						<pointLight position={[-2, 2, 2]} intensity={0.4} color="#ffa" />
						<Environment preset="sunset" />

						<RotatingCharacterDisplay traits={char.traits} gear={char.gear} />

						{/* Ground plane */}
						<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
							<circleGeometry args={[2, 32]} />
							<meshStandardMaterial color={GROUND_PLANE_COLOR} />
						</mesh>
					</Canvas>
				</div>

				<div className="canteen-modal-content">
					<h3 id="canteen-modal-title">{char.traits.name}</h3>
					<p className="char-bio">
						{char.traits.grizzled
							? "A battle-hardened veteran of the early campaigns."
							: "Fresh meat, but ready for the soup."}
					</p>

					<div className="char-stats">
						<div className="stat-row">
							<span>SPEED</span>
							<span className="stat-value">{char.traits.baseSpeed}</span>
						</div>
						<div className="stat-row">
							<span>HEALTH</span>
							<span className="stat-value">{char.traits.baseHealth}</span>
						</div>
						<div className="stat-row">
							<span>CLIMB</span>
							<span className="stat-value">{char.traits.climbSpeed}</span>
						</div>
					</div>

					<div className="modal-actions">
						{isUnlocked ? (
							<div className="status-unlocked">✓ DEPLOYED</div>
						) : (
							<button
								type="button"
								className="purchase-btn"
								onClick={onConfirm}
								disabled={!canAfford}
							>
								{canAfford ? `REQUISITION: ${price} CREDITS` : `NEED ${price - coins} MORE`}
							</button>
						)}
						<button
							ref={closeButtonRef}
							type="button"
							className="cancel-btn"
							onClick={onCancel}
						>
							{isUnlocked ? "CLOSE" : "CANCEL"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export function Canteen() {
	const { saveData, unlockCharacter, spendCoins, setMode, buyUpgrade } = useGameStore();
	const [view, setView] = useState<"PLATOON" | "UPGRADES">("PLATOON");
	const [previewCharId, setPreviewCharId] = useState<string | null>(null);

	const previewChar = previewCharId ? CHARACTERS[previewCharId] : null;
	const isPreviewUnlocked = previewCharId
		? saveData.unlockedCharacters.includes(previewCharId)
		: false;
	const previewPrice = previewCharId ? CHAR_PRICES[previewCharId] : 0;

	const handlePurchase = () => {
		if (previewCharId && spendCoins(previewPrice)) {
			unlockCharacter(previewCharId);
			setPreviewCharId(null); // Auto-close modal after successful purchase
		}
	};

	return (
		<div className="screen active canteen-screen">
			{/* Scrollable UI container - full screen now */}
			<div className="canteen-ui-full">
				<div className="canteen-header">
					<h2>FORWARD OPERATING BASE</h2>
					<div className="coin-display">SUPPLY CREDITS: {saveData.coins}</div>
				</div>

				<div className="canteen-tabs">
					<button
						type="button"
						className={view === "PLATOON" ? "active" : ""}
						onClick={() => setView("PLATOON")}
					>
						PLATOON
					</button>
					<button
						type="button"
						className={view === "UPGRADES" ? "active" : ""}
						onClick={() => setView("UPGRADES")}
					>
						UPGRADES
					</button>
				</div>

				<div className="canteen-content">
					{view === "PLATOON" ? (
						<div className="platoon-grid">
							{Object.values(CHARACTERS).map((char) => {
								const unlocked = saveData.unlockedCharacters.includes(char.traits.id);
								const price = CHAR_PRICES[char.traits.id];
								return (
									<button
										type="button"
										key={char.traits.id}
										className={`platoon-card ${unlocked ? "unlocked" : "locked"}`}
										onClick={() => setPreviewCharId(char.traits.id)}
									>
										<div className="platoon-card-name">{char.traits.name}</div>
										<div className="platoon-card-status">
											{unlocked ? (
												<span className="status-deployed">DEPLOYED</span>
											) : (
												<span className="status-locked">{price} CREDITS</span>
											)}
										</div>
									</button>
								);
							})}
						</div>
					) : (
						<div className="upgrades-list">
							{UPGRADE_CONFIG.map((upgrade) => (
								<div key={upgrade.key} className="upgrade-item">
									<div className="upgrade-info">
										<span className="upgrade-name">{upgrade.name}</span>
										<span className="upgrade-level">
											Level {saveData.upgrades[upgrade.storeKey]}
										</span>
									</div>
									<button
										type="button"
										onClick={() => buyUpgrade(upgrade.key, upgrade.cost)}
										disabled={saveData.coins < upgrade.cost}
									>
										{upgrade.cost} CR
									</button>
								</div>
							))}
						</div>
					)}
				</div>

				<button type="button" className="return-btn" onClick={() => setMode("MENU")}>
					RETURN TO PERIMETER
				</button>
			</div>

			{/* Modal preview for character selection */}
			{previewChar && (
				<PreviewModal
					char={previewChar}
					isUnlocked={isPreviewUnlocked}
					price={previewPrice}
					coins={saveData.coins}
					onConfirm={handlePurchase}
					onCancel={() => setPreviewCharId(null)}
				/>
			)}
		</div>
	);
}
