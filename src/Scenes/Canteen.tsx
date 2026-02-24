/**
 * Canteen Scene
 * Forward Operating Base for upgrades and loadout management
 * USING REACTYLON
 */

import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Canvas } from "reactylon/web";
import { useGameStore } from "../stores/gameStore";

export function Canteen() {
	const { setMode, saveData } = useGameStore();

	const handleReturn = () => {
		setMode("MENU");
	};

	return (
		<View className="flex-1 bg-black">
			<View className="flex-1">
				<Canvas>
					<scene clearColor={[0.2, 0.15, 0.1, 1]}>
						<arcRotateCamera
							name="camera"
							alpha={0}
							beta={Math.PI / 6}
							radius={5}
							target={[0, 1, 0]}
						/>
						<hemisphericLight name="ambient" intensity={0.5} />
						<directionalLight name="sun" intensity={0.7} position={[3, 5, 3]} />

						<ground name="ground" width={20} height={20}>
							<standardMaterial name="groundMat" diffuseColor={[0.3, 0.25, 0.2]} />
						</ground>

						{/* Weapon rack */}
						<box name="rack" width={3} height={2} depth={0.2} position={[-2, 1, -1]}>
							<standardMaterial name="wood" diffuseColor={[0.4, 0.3, 0.2]} />
						</box>

						{/* Crate */}
						<box name="crate" size={1} position={[2, 0.5, -1]}>
							<standardMaterial name="metal" diffuseColor={[0.5, 0.5, 0.5]} />
						</box>
					</scene>
				</Canvas>
			</View>

			<View className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
				<View className="items-center mt-10 pointer-events-auto">
					<Text className="text-3xl font-bold text-otter-orange mb-6">
						🏪 FORWARD OPERATING BASE
					</Text>
				</View>

				<ScrollView
					className="flex-1 px-6 pointer-events-auto"
					contentContainerStyle={{ paddingBottom: 100 }}
				>
					<View className="bg-black/80 p-6 rounded-lg mb-4">
						<Text className="text-2xl font-bold text-white mb-4">Arsenal</Text>
						<View className="flex-row justify-between mb-2">
							<Text className="text-white text-lg">Credits:</Text>
							<Text className="text-otter-orange text-lg font-bold">{saveData.credits}</Text>
						</View>
						<Text className="text-gray-400 mt-4">
							Upgrades available when weapons system is implemented
						</Text>
					</View>

					<View className="bg-black/80 p-6 rounded-lg">
						<Text className="text-2xl font-bold text-white mb-4">Intelligence</Text>
						<View className="flex-row justify-between mb-2">
							<Text className="text-white text-lg">Peacekeeping Score:</Text>
							<Text className="text-otter-orange text-lg font-bold">
								{saveData.peacekeepingScore}
							</Text>
						</View>
						<View className="flex-row justify-between">
							<Text className="text-white text-lg">Territory Secured:</Text>
							<Text className="text-otter-orange text-lg font-bold">{saveData.territoryScore}</Text>
						</View>
					</View>
				</ScrollView>

				<View className="items-center pb-8 pointer-events-auto">
					<TouchableOpacity
						onPress={handleReturn}
						className="bg-otter-orange px-8 py-4 rounded-lg active:scale-95"
					>
						<Text className="text-black text-xl font-bold">RETURN TO MAIN MENU</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}
