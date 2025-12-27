/**
 * Cutscene Scene
 * Handles introductory dialogue and story beats
 */

import { useState, useEffect } from "react";
import { useGameStore } from "../stores/gameStore";

interface DialogueLine {
	name: string;
	text: string;
}

const INTRO_DIALOGUE: DialogueLine[] = [
	{ name: "GEN. WHISKERS", text: "Sgt. Bubbles! The Iron Scale Dominion is closing in on the Mekong Delta." },
	{ name: "SGT. BUBBLES", text: "I'm ready, General. What's the situation?" },
	{ name: "GEN. WHISKERS", text: "They're seeking the Primal Clams. If they get them, the river is doomed." },
	{ name: "SGT. BUBBLES", text: "Not on my watch. Deployed and ready for extraction." },
];

export function Cutscene() {
	const { setMode } = useGameStore();
	const [index, setIndex] = useState(0);

	const handleNext = () => {
		if (index < INTRO_DIALOGUE.length - 1) {
			setIndex(index + 1);
		} else {
			setMode("GAME");
		}
	};

	const currentLine = INTRO_DIALOGUE[index];

	return (
		<div className="screen active cutscene-screen">
			{/* Improved level background for cutscene */}
			<div className="cutscene-background" />

			<div className="dialogue-box">
				<div className="dialogue-name">{currentLine.name}</div>
				<div className="dialogue-text">{currentLine.text}</div>
				<button type="button" className="dialogue-next" onClick={handleNext}>
					{index < INTRO_DIALOGUE.length - 1 ? "NEXT >>" : "BEGIN MISSION"}
				</button>
			</div>
		</div>
	);
}
