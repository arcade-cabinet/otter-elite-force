/**
 * Canteen Scene
 * Forward Operating Base for upgrades and loadout management
 * Babylon.js 3D backdrop + NativeWind UI overlay
 */

import type { Scene as BabylonScene } from "@babylonjs/core";
import { Color3, Color4, Vector3 } from "@babylonjs/core";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Scene } from "reactylon";
import { Engine } from "reactylon/web";
import { useGameStore } from "../stores/gameStore";

type Tab = "WEAPONS" | "EQUIPMENT" | "INTEL";

export function Canteen() {
	const { setMode, saveData } = useGameStore();
	const [activeTab, setActiveTab] = useState<Tab>("WEAPONS");

	const handleReturn = () => setMode("MENU");

	const onSceneReady = (scene: BabylonScene) => {
		scene.clearColor = new Color4(0.12, 0.09, 0.07, 1);
	};

	const xpToNext = (saveData.rank + 1) * 200;
	const xpPct = Math.min(100, Math.round((saveData.xp / xpToNext) * 100));

	return (
		<View className="flex-1 bg-black">
			{/* 3D backdrop */}
			<View className="absolute inset-0 opacity-60">
				<Engine canvasId="canteen-canvas">
					<Scene onSceneReady={onSceneReady}>
						<arcRotateCamera
							name="camera"
							alpha={Math.PI / 4}
							beta={Math.PI / 3}
							radius={5}
							target={new Vector3(0, 1, 0)}
						/>
						<hemisphericLight name="ambient" direction={new Vector3(0, 1, 0)} intensity={0.5} />
						<directionalLight
							name="key"
							direction={new Vector3(-1, -2, -1)}
							position={new Vector3(3, 5, 3)}
							intensity={0.8}
						/>
						<ground name="ground" options={{ width: 20, height: 20 }}>
							<standardMaterial name="groundMat" diffuseColor={new Color3(0.25, 0.2, 0.15)} />
						</ground>
						<box
							name="rack"
							options={{ width: 3, height: 2, depth: 0.2 }}
							positionX={-2}
							positionY={1}
							positionZ={-1}
						>
							<standardMaterial name="woodMat" diffuseColor={new Color3(0.4, 0.3, 0.2)} />
						</box>
						<box
							name="crate"
							options={{ width: 1, height: 1, depth: 1 }}
							positionX={2}
							positionY={0.5}
							positionZ={-1}
						>
							<standardMaterial name="metalMat" diffuseColor={new Color3(0.45, 0.45, 0.4)} />
						</box>
						<cylinder
							name="barrel"
							options={{ diameter: 0.5, height: 0.9, tessellation: 16 }}
							positionX={1.5}
							positionY={0.45}
							positionZ={0.8}
						>
							<standardMaterial name="barrelMat" diffuseColor={new Color3(0.3, 0.28, 0.2)} />
						</cylinder>
					</Scene>
				</Engine>
			</View>

			{/* UI Overlay */}
			<View className="flex-1">
				{/* Header */}
				<View className="items-center pt-12 pb-4 px-4">
					<Text className="text-2xl font-bold text-otter-orange tracking-widest">
						FORWARD OPERATING BASE
					</Text>
					<Text className="text-xs text-gray-500 tracking-wider mt-1">CANTEEN &amp; ARMORY</Text>
				</View>

				{/* Tabs */}
				<View className="flex-row mx-4 mb-4 border border-gray-700">
					{(["WEAPONS", "EQUIPMENT", "INTEL"] as Tab[]).map((tab) => (
						<TouchableOpacity
							key={tab}
							onPress={() => setActiveTab(tab)}
							className={`flex-1 py-3 items-center ${activeTab === tab ? "bg-otter-orange" : "bg-transparent"}`}
						>
							<Text
								className={`text-xs font-bold tracking-widest ${activeTab === tab ? "text-black" : "text-gray-400"}`}
							>
								{tab}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				<ScrollView
					className="flex-1 px-4"
					contentContainerStyle={{ paddingBottom: 120 }}
					showsVerticalScrollIndicator={false}
				>
					{activeTab === "WEAPONS" && (
						<View>
							<View className="bg-black/80 border border-gray-800 p-4 mb-3">
								<Text className="text-otter-orange text-xs font-bold tracking-widest mb-3">
									ARSENAL
								</Text>
								<View className="flex-row justify-between mb-2">
									<Text className="text-gray-300 text-sm">Credits</Text>
									<Text className="text-otter-orange font-bold">{saveData.coins}c</Text>
								</View>
								{(["pistol", "smg", "rifle", "shotgun"] as const).map((w) => {
									const owned = (saveData.upgrades.weaponLvl[w] ?? 0) > 0;
									return (
										<View
											key={w}
											className="flex-row justify-between items-center py-2 border-t border-gray-800"
										>
											<Text className={`text-sm ${owned ? "text-white" : "text-gray-600"}`}>
												{w.toUpperCase()}
											</Text>
											{owned ? (
												<Text className="text-green-500 text-xs font-bold">UNLOCKED</Text>
											) : (
												<Text className="text-gray-500 text-xs">LOCKED</Text>
											)}
										</View>
									);
								})}
							</View>
						</View>
					)}

					{activeTab === "EQUIPMENT" && (
						<View>
							<View className="bg-black/80 border border-gray-800 p-4 mb-3">
								<Text className="text-otter-orange text-xs font-bold tracking-widest mb-3">
									FIELD UPGRADES
								</Text>
								{(
									[
										{ label: "Speed Boost", key: "speedBoost", max: 5 },
										{ label: "Health Boost", key: "healthBoost", max: 5 },
										{ label: "Damage Boost", key: "damageBoost", max: 5 },
									] as const
								).map(({ label, key, max }) => {
									const lvl = saveData.upgrades[key] as number;
									return (
										<View key={key} className="mb-4">
											<View className="flex-row justify-between mb-1">
												<Text className="text-gray-300 text-sm">{label}</Text>
												<Text className="text-otter-orange text-xs font-bold">
													{lvl} / {max}
												</Text>
											</View>
											<View className="flex-row gap-1">
												{Array.from({ length: max }).map((_, i) => (
													<View
														key={i}
														className={`flex-1 h-2 rounded-sm ${i < lvl ? "bg-otter-orange" : "bg-gray-800"}`}
													/>
												))}
											</View>
										</View>
									);
								})}
							</View>
						</View>
					)}

					{activeTab === "INTEL" && (
						<View>
							<View className="bg-black/80 border border-gray-800 p-4 mb-3">
								<Text className="text-otter-orange text-xs font-bold tracking-widest mb-3">
									MISSION INTELLIGENCE
								</Text>
								<View className="flex-row justify-between py-2 border-b border-gray-800">
									<Text className="text-gray-400 text-xs tracking-wide">PEACEKEEPING SCORE</Text>
									<Text className="text-white font-bold">{saveData.peacekeepingScore}</Text>
								</View>
								<View className="flex-row justify-between py-2 border-b border-gray-800">
									<Text className="text-gray-400 text-xs tracking-wide">TERRITORY SECURED</Text>
									<Text className="text-white font-bold">{saveData.territoryScore} zones</Text>
								</View>
								<View className="flex-row justify-between py-2 border-b border-gray-800">
									<Text className="text-gray-400 text-xs tracking-wide">SIPHONS DISMANTLED</Text>
									<Text className="text-white font-bold">
										{saveData.strategicObjectives.siphonsDismantled}
									</Text>
								</View>
								<View className="flex-row justify-between py-2">
									<Text className="text-gray-400 text-xs tracking-wide">ALLIES RESCUED</Text>
									<Text className="text-white font-bold">
										{saveData.strategicObjectives.alliesRescued}
									</Text>
								</View>
							</View>
							<View className="bg-black/80 border border-gray-800 p-4">
								<Text className="text-otter-orange text-xs font-bold tracking-widest mb-3">
									RANK PROGRESSION
								</Text>
								<View className="flex-row justify-between mb-2">
									<Text className="text-gray-400 text-xs">XP</Text>
									<Text className="text-otter-orange text-xs font-bold">
										{saveData.xp} / {xpToNext}
									</Text>
								</View>
								<View className="bg-gray-800 h-2 rounded-full overflow-hidden">
									<View
										className="bg-otter-orange h-full rounded-full"
										style={{ width: `${xpPct}%` }}
									/>
								</View>
							</View>
						</View>
					)}
				</ScrollView>

				<View className="px-4 pb-8">
					<TouchableOpacity
						onPress={handleReturn}
						activeOpacity={0.8}
						className="bg-otter-orange py-4 items-center"
					>
						<Text className="text-black text-sm font-bold tracking-widest">RETURN TO COMMAND</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}
