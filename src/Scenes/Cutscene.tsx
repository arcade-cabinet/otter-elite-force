/**
 * Cutscene Scene
 * Handles introductory dialogue and story beats
 */

import { Environment, Sky } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useState } from "react";
import { PlayerRig } from "../Entities/PlayerRig";
import { CHARACTERS, useGameStore } from "../stores/gameStore";

interface DialogueLine {
	name: string;
	text: string;
}

const INTRO_DIALOGUE: DialogueLine[] = [
	{
		name: "GEN. WHISKERS",
		text: "Bubbles! The Iron Scale just hit our observation post at Clam Point.",
	},
	{
		name: "SGT. BUBBLES",
		text: "Dammit, General. I told you we needed more patrols in the soup.",
	},
	{
		name: "GEN. WHISKERS",
		text: "They're moving their heavy siphons into position. If they drain that sector, we lose the river.",
	},
	{
		name: "SGT. BUBBLES",
		text: "Understood. My platoon is locked and loaded. We're going in hot.",
	},
];

function CinematicCamera() {
	useFrame((state) => {
		const t = state.clock.elapsedTime;
		state.camera.position.x = Math.sin(t * 0.2) * 10;
		state.camera.position.z = Math.cos(t * 0.2) * 10 + 15;
		state.camera.lookAt(0, 2, 0);
	});
	return null;
}

export function Cutscene() {
	const { setMode, selectedCharacterId } = useGameStore();
	const [index, setIndex] = useState(0);
	const character = CHARACTERS[selectedCharacterId] || CHARACTERS.bubbles;

	const handleNext = () => {
		if (index < INTRO_DIALOGUE.length - 1) {
			setIndex(index + 1);
		} else {
			setMode("GAME");
		}
	};

	const currentLine = INTRO_DIALOGUE[index];
	const isSgtBubbles = currentLine.name === "SGT. BUBBLES";

	return (
		<div className="screen active cutscene-screen">
			<div className="cutscene-background" />
			<div className="cutscene-3d">
				<Canvas shadows camera={{ position: [0, 5, 20], fov: 45 }}>
					<ambientLight intensity={0.5} />
					<directionalLight position={[10, 10, 5]} intensity={1} castShadow />
					<Sky sunPosition={[100, 10, 100]} />
					<Environment preset="sunset" />

					<PlayerRig
						traits={CHARACTERS.whiskers.traits}
						gear={CHARACTERS.whiskers.gear}
						position={[-2, 0, 0]}
						rotation={0.5}
					/>
					<PlayerRig
						traits={character.traits}
						gear={character.gear}
						position={[2, 0, 0]}
						rotation={-0.5}
					/>

					<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
						<planeGeometry args={[100, 100]} />
						<meshStandardMaterial color="#2d5016" />
					</mesh>

					<CinematicCamera />
				</Canvas>
			</div>

			<div className="dialogue-box">
				<div className="dialogue-name">
					{isSgtBubbles ? character.traits.name : currentLine.name}
				</div>
				<div className="dialogue-text">{currentLine.text}</div>
				<button type="button" className="dialogue-next" onClick={handleNext}>
					{index < INTRO_DIALOGUE.length - 1 ? "NEXT >>" : "BEGIN MISSION"}
				</button>
			</div>
		</div>
	);
}
