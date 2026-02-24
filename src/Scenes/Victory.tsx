/**
 * Victory Scene
 * Displayed after successful mission extraction.
 * Babylon.js 3D backdrop + NativeWind UI overlay
 */

import type { Scene as BabylonScene } from "@babylonjs/core";
import { Color3, Color4, Vector3 } from "@babylonjs/core";
import { useRef } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Scene } from "reactylon";
import { Engine } from "reactylon/web";
import { useGameStore } from "../stores/gameStore";
import { RANKS } from "../utils/constants";

const RANK_LABELS = RANKS as unknown as readonly string[];

function getRankLabel(rank: number): string {
	return RANK_LABELS[Math.min(rank, RANK_LABELS.length - 1)] ?? "UNKNOWN";
}

export function Victory() {
	const { setMode, saveData, kills } = useGameStore();
	const spinRef = useRef(0);

	const xpToNext = (saveData.rank + 1) * 200;
	const xpPct = Math.min(100, Math.round((saveData.xp / xpToNext) * 100));

	const onSceneReady = (scene: BabylonScene) => {
		scene.clearColor = new Color4(0.04, 0.04, 0.07, 1);
		const trophy = scene.getMeshByName("trophy");
		scene.registerBeforeRender(() => {
			spinRef.current += 0.008;
			if (trophy) trophy.rotation.y = spinRef.current;
		});
	};

	return (
		<View className="flex-1 bg-black">
			{/* 3D Background */}
			<View className="absolute inset-0 opacity-70">
				<Engine canvasId="victory-canvas">
					<Scene onSceneReady={onSceneReady}>
						<arcRotateCamera
							name="camera"
							alpha={Math.PI / 5}
							beta={Math.PI / 3}
							radius={7}
							target={new Vector3(0, 0.5, 0)}
						/>
						<hemisphericLight name="ambient" direction={new Vector3(0, 1, 0)} intensity={0.4} />
						<directionalLight
							name="key"
							direction={new Vector3(-1, -2, -1)}
							position={new Vector3(5, 8, 4)}
							intensity={1.2}
						/>

						<ground name="ground" options={{ width: 30, height: 30 }}>
							<standardMaterial name="groundMat" diffuseColor={new Color3(0.08, 0.12, 0.08)} />
						</ground>
						<cylinder
							name="podiumBase"
							options={{ diameter: 3, height: 0.3, tessellation: 32 }}
							position={new Vector3(0, 0.15, 0)}
						>
							<standardMaterial name="baseMat" diffuseColor={new Color3(0.35, 0.28, 0.15)} />
						</cylinder>
						<cylinder
							name="trophy"
							options={{ diameter: 1.2, height: 2.5, tessellation: 24 }}
							position={new Vector3(0, 1.55, 0)}
						>
							<standardMaterial
								name="goldMat"
								diffuseColor={new Color3(1, 0.84, 0)}
								specularColor={new Color3(1, 0.9, 0.4)}
							/>
						</cylinder>
						<box
							name="silver"
							options={{ width: 1, height: 1.2, depth: 1 }}
							position={new Vector3(-2.2, 0.6, 0)}
						>
							<standardMaterial name="silverMat" diffuseColor={new Color3(0.7, 0.72, 0.75)} />
						</box>
						<box
							name="bronze"
							options={{ width: 1, height: 0.8, depth: 1 }}
							position={new Vector3(2.2, 0.4, 0)}
						>
							<standardMaterial name="bronzeMat" diffuseColor={new Color3(0.72, 0.45, 0.2)} />
						</box>
					</Scene>
				</Engine>
			</View>

			{/* UI Overlay */}
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 40 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<View className="items-center pt-12 pb-6 px-4">
					<View
						className="border-2 border-yellow-500 px-8 py-4 mb-2"
						style={{ backgroundColor: "rgba(255,215,0,0.1)" }}
					>
						<Text className="text-2xl font-bold text-yellow-400 tracking-widest text-center">
							MISSION COMPLETE
						</Text>
					</View>
					<Text className="text-xs text-gray-500 tracking-widest">URA EXTRACTION SUCCESSFUL</Text>
				</View>

				{/* Rank */}
				<View
					className="mx-4 mb-3 border border-otter-orange p-4 items-center"
					style={{ backgroundColor: "rgba(255,140,0,0.1)" }}
				>
					<Text className="text-gray-500 text-xs tracking-widest mb-1">CURRENT RANK</Text>
					<Text className="text-otter-orange text-xl font-bold tracking-widest">
						{getRankLabel(saveData.rank)}
					</Text>
					<View className="flex-row mt-3 gap-1">
						{RANK_LABELS.map((r, i) => (
							<View
								key={r}
								className={`w-8 h-1 rounded-sm ${i <= saveData.rank ? "bg-otter-orange" : "bg-gray-800"}`}
							/>
						))}
					</View>
				</View>

				{/* Combat Debrief */}
				<View
					className="mx-4 mb-3 border border-gray-800 p-4"
					style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
				>
					<Text className="text-otter-orange text-xs font-bold tracking-widest mb-3">
						COMBAT DEBRIEF
					</Text>
					{[
						{ label: "ENEMIES NEUTRALIZED", value: kills },
						{ label: "TERRITORY SECURED", value: `${saveData.territoryScore} zones` },
						{ label: "PEACEKEEPING SCORE", value: saveData.peacekeepingScore },
						{ label: "CREDITS EARNED", value: `${saveData.spoilsOfWar.creditsEarned}c` },
						{ label: "ALLIES RESCUED", value: saveData.strategicObjectives.alliesRescued },
						{ label: "SIPHONS DISMANTLED", value: saveData.strategicObjectives.siphonsDismantled },
					].map(({ label, value }) => (
						<View key={label} className="flex-row justify-between py-2 border-b border-gray-800">
							<Text className="text-gray-500 text-xs tracking-wide">{label}</Text>
							<Text className="text-white text-xs font-bold">{value}</Text>
						</View>
					))}
				</View>

				{/* XP Progression */}
				<View
					className="mx-4 mb-6 border border-gray-800 p-4"
					style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
				>
					<Text className="text-otter-orange text-xs font-bold tracking-widest mb-3">
						RANK PROGRESSION
					</Text>
					<View className="flex-row justify-between mb-2">
						<Text className="text-gray-500 text-xs">XP PROGRESS</Text>
						<Text className="text-otter-orange text-xs font-bold">
							{saveData.xp} / {xpToNext}
						</Text>
					</View>
					<View className="bg-gray-800 h-2 rounded-full overflow-hidden mb-2">
						<View className="bg-otter-orange h-full rounded-full" style={{ width: `${xpPct}%` }} />
					</View>
					<Text className="text-gray-600 text-xs">
						{xpPct}% to {getRankLabel(saveData.rank + 1)}
					</Text>
				</View>

				{/* Actions */}
				<View className="px-4 gap-3">
					<TouchableOpacity
						onPress={() => setMode("MENU")}
						activeOpacity={0.8}
						className="bg-otter-orange py-4 items-center"
					>
						<Text className="text-black font-bold tracking-widest">RETURN TO COMMAND</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => setMode("CANTEEN")}
						activeOpacity={0.8}
						className="border border-otter-orange py-4 items-center"
						style={{ backgroundColor: "rgba(255,140,0,0.1)" }}
					>
						<Text className="text-otter-orange font-bold tracking-widest">VISIT CANTEEN (FOB)</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</View>
	);
}
