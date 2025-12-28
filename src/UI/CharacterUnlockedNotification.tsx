/**
 * Character Unlocked Notification
 *
 * Shows a celebratory notification when a character is rescued
 */

import { useEffect, useState } from "react";
import { CHARACTERS } from "../stores/gameStore";

interface CharacterUnlockedProps {
	characterId: string | null;
	onComplete?: () => void;
}

export const CharacterUnlockedNotification: React.FC<CharacterUnlockedProps> = ({
	characterId,
	onComplete,
}) => {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (characterId) {
			setVisible(true);
			const timer = setTimeout(() => {
				setVisible(false);
				if (onComplete) onComplete();
			}, 4000);
			return () => clearTimeout(timer);
		}
	}, [characterId, onComplete]);

	if (!visible || !characterId) return null;

	const character = CHARACTERS[characterId];
	if (!character) return null;

	return (
		<div
			style={{
				position: "fixed",
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
				zIndex: 200,
				animation: "fadeInScale 0.5s ease-out",
			}}
		>
			<div
				style={{
					background: "rgba(0, 0, 0, 0.95)",
					padding: "32px 48px",
					borderRadius: "12px",
					border: "4px solid #8d6e63",
					textAlign: "center",
					boxShadow: "0 0 40px rgba(141, 110, 99, 0.8)",
				}}
			>
				<div
					style={{
						fontSize: "28px",
						fontFamily: "monospace",
						color: "#8d6e63",
						letterSpacing: "4px",
						marginBottom: "16px",
						fontWeight: "bold",
					}}
				>
					★ CHARACTER UNLOCKED ★
				</div>
				<div
					style={{
						fontSize: "36px",
						fontFamily: "monospace",
						color: "#fff",
						letterSpacing: "3px",
						marginBottom: "12px",
						fontWeight: "bold",
					}}
				>
					{character.traits.name}
				</div>
				<div
					style={{
						fontSize: "14px",
						fontFamily: "monospace",
						color: "#aaa",
						letterSpacing: "2px",
					}}
				>
					Now available in Character Roster
				</div>
			</div>
			<style>
				{`
					@keyframes fadeInScale {
						0% {
							opacity: 0;
							transform: translate(-50%, -50%) scale(0.8);
						}
						100% {
							opacity: 1;
							transform: translate(-50%, -50%) scale(1);
						}
					}
				`}
			</style>
		</div>
	);
};
