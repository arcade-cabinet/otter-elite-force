/**
 * Cutscene Scene
 * Handles introductory dialogue and story beats
 * MIGRATED TO BABYLON.JS
 */

import { useState } from "react";
import { BabylonEngine } from "../babylon/BabylonEngine";
import { Scene } from "../babylon/Scene";
import { ArcRotateCamera } from "../babylon/Camera";
import { HemisphericLight, DirectionalLight } from "../babylon/Light";
import { Ground } from "../babylon/primitives/Ground";
import type { Scene as BabylonScene } from "@babylonjs/core";
import { CHARACTERS, useGameStore } from "../stores/gameStore";

interface DialogueLine {
	name: string;
	text: string;
}

const INTRO_DIALOGUE: DialogueLine[] = [
	{
		name: "GEN. WHISKERS",
		text: "Listen up, River-Rats! The Scale-Guard just hit our observation post at the Mouth.",
	},
	{
		name: "SGT. BUBBLES",
		text: "They're pushing deeper into the Reach, General. The soup is getting thick.",
	},
	{
		name: "GEN. WHISKERS",
		text: "They're installing siphons directly into the Ancestral Beds. If they choke the river, we're done.",
	},
	{
		name: "SGT. BUBBLES",
		text: "My platoon is prepped. We'll dismantle their rigs and send 'em back to the mud.",
	},
];

// Cinematic camera animation handled in Scene onSceneMount

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

	const handleSceneMount = (scene: BabylonScene) => {
		// Cinematic camera rotation animation
		scene.onBeforeRenderObservable.add(() => {
			const camera = scene.activeCamera;
			if (camera) {
				const t = performance.now() / 1000;
				camera.position.x = Math.sin(t * 0.2) * 10;
				camera.position.z = Math.cos(t * 0.2) * 10 + 15;
				camera.setTarget(new (scene as any).Vector3(0, 0.5, 0));
			}
		});
	};

	return (
		<div className="screen active cutscene-screen">
			<div className="cutscene-background" />
			<div className="cutscene-3d">
				<BabylonEngine>
					<Scene clearColor={[0.4, 0.6, 0.9, 1]} onSceneMount={handleSceneMount}>
						<ArcRotateCamera position={[0, 5, 20]} target={[0, 0.5, 0]} radius={20} />
						<HemisphericLight intensity={0.5} />
						<DirectionalLight position={[10, 10, 5]} intensity={1} />
						
						{/* TODO: Port PlayerRig entities to Babylon.js */}
						{/* For now, just show ground */}
						<Ground width={100} height={100} color={[0.18, 0.31, 0.09]} />
					</Scene>
				</BabylonEngine>
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
