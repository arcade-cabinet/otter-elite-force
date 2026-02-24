/**
 * Cutscene Scene
 * Handles introductory dialogue and story beats
 * Babylon.js / Reactylon + NativeWind UI overlay
 */

import type { Scene as BabylonScene } from "@babylonjs/core";
import { Color3, Color4, Vector3 } from "@babylonjs/core";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Scene } from "reactylon";
import { Engine } from "reactylon/web";
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

	const onSceneReady = (scene: BabylonScene) => {
		scene.clearColor = new Color4(0.4, 0.6, 0.9, 1);
		// Subtle jungle-river atmosphere for the briefing
		scene.fogMode = 3; // FOGMODE_EXP2
		scene.fogColor = new Color3(0.4, 0.6, 0.9);
		scene.fogDensity = 0.01;
	};

	return (
		<View className="flex-1 bg-black">
			{/* 3D scene backdrop */}
			<View className="flex-1">
				<Engine canvasId="cutscene-canvas">
					<Scene onSceneReady={onSceneReady}>
						<arcRotateCamera
							name="camera"
							alpha={0}
							beta={Math.PI / 4}
							radius={20}
							target={new Vector3(0, 0.5, 0)}
						/>
						<hemisphericLight name="ambient" direction={new Vector3(0, 1, 0)} intensity={0.5} />
						<directionalLight
							name="sun"
							direction={new Vector3(-1, -2, -1)}
							position={new Vector3(10, 10, 5)}
							intensity={1}
						/>

						{/* Ground plane */}
						<ground name="ground" options={{ width: 100, height: 100 }}>
							<standardMaterial name="groundMat" diffuseColor={new Color3(0.18, 0.31, 0.09)} />
						</ground>

						{/* Briefing table stand-in */}
						<box
							name="table"
							options={{ width: 3, height: 0.1, depth: 1.5 }}
							position={new Vector3(0, 0.05, 0)}
						>
							<standardMaterial name="tableMat" diffuseColor={new Color3(0.35, 0.25, 0.12)} />
						</box>

						{/* Map marker left (General) */}
						<cylinder
							name="markerLeft"
							options={{ diameter: 0.15, height: 0.4, tessellation: 8 }}
							position={new Vector3(-1.5, 0.35, 0)}
						>
							<standardMaterial name="markerLeftMat" diffuseColor={new Color3(0.8, 0.2, 0.1)} />
						</cylinder>

						{/* Map marker right (Sgt. Bubbles) */}
						<cylinder
							name="markerRight"
							options={{ diameter: 0.15, height: 0.4, tessellation: 8 }}
							position={new Vector3(1.5, 0.35, 0)}
						>
							<standardMaterial name="markerRightMat" diffuseColor={new Color3(0.1, 0.4, 0.8)} />
						</cylinder>

						{/* TODO: Add PlayerRig entities for character portraits */}
					</Scene>
				</Engine>
			</View>

			{/* Dialogue UI overlay */}
			<View className="absolute bottom-0 left-0 right-0 p-6">
				<View className="bg-black/90 p-6 rounded-lg">
					<Text className="text-otter-orange text-xl font-bold mb-2">
						{isSgtBubbles ? character.traits.name : currentLine.name}
					</Text>
					<Text className="text-white text-lg mb-4">{currentLine.text}</Text>
					<TouchableOpacity
						onPress={handleNext}
						className="bg-otter-orange px-6 py-3 rounded active:scale-95"
					>
						<Text className="text-black text-lg font-bold text-center">
							{index < INTRO_DIALOGUE.length - 1 ? "NEXT >>" : "BEGIN MISSION"}
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}
