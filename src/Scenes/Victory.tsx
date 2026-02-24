/**
 * Victory Scene
 * Displayed after successful mission extraction
 * USING REACTYLON
 */

import { Text, TouchableOpacity, View } from "react-native";
import { Canvas } from "reactylon/web";
import { useGameStore } from "../stores/gameStore";

export function Victory() {
	const { setMode, saveData } = useGameStore();

	const handleContinue = () => {
		setMode("MENU");
	};

	return (
		<View className="flex-1 bg-black">
			<View className="flex-1">
				<Canvas>
					<scene clearColor={[0.05, 0.05, 0.1, 1]}>
						<arcRotateCamera
							name="camera"
							alpha={0}
							beta={Math.PI / 4}
							radius={8}
							target={[0, 0, 0]}
						/>
						<hemisphericLight name="ambient" intensity={0.6} />
						<directionalLight name="sun" intensity={0.8} position={[5, 10, 5]} />

						<ground name="ground" width={50} height={50}>
							<standardMaterial name="groundMat" diffuseColor={[0.15, 0.25, 0.15]} />
						</ground>

						{/* Victory podium - gold */}
						<box name="podium1" size={1} position={[0, 0.5, 0]}>
							<standardMaterial name="gold" diffuseColor={[1, 0.84, 0]} />
						</box>

						{/* Silver */}
						<box name="podium2" size={0.8} position={[-2, 0.3, 0]}>
							<standardMaterial name="silver" diffuseColor={[0.75, 0.75, 0.75]} />
						</box>

						{/* Bronze */}
						<box name="podium3" size={0.8} position={[2, 0.3, 0]}>
							<standardMaterial name="bronze" diffuseColor={[0.8, 0.5, 0.2]} />
						</box>
					</scene>
				</Canvas>
			</View>

			<View className="absolute top-10 left-0 right-0 items-center px-4">
				<Text className="text-4xl font-bold text-otter-orange mb-8">🦦 MISSION COMPLETE</Text>

				<View className="bg-black/80 p-6 rounded-lg w-full max-w-md">
					<View className="flex-row justify-between mb-4">
						<Text className="text-white text-lg">Territory Secured:</Text>
						<Text className="text-otter-orange text-lg font-bold">{saveData.territoryScore}</Text>
					</View>
					<View className="flex-row justify-between mb-4">
						<Text className="text-white text-lg">Enemies Neutralized:</Text>
						<Text className="text-otter-orange text-lg font-bold">{saveData.kills}</Text>
					</View>
					<View className="flex-row justify-between mb-4">
						<Text className="text-white text-lg">Credits Earned:</Text>
						<Text className="text-otter-orange text-lg font-bold">{saveData.credits}</Text>
					</View>
					<View className="flex-row justify-between">
						<Text className="text-white text-lg">Peacekeeping Score:</Text>
						<Text className="text-otter-orange text-lg font-bold">
							{saveData.peacekeepingScore}
						</Text>
					</View>
				</View>

				<TouchableOpacity
					onPress={handleContinue}
					className="mt-8 bg-otter-orange px-8 py-4 rounded-lg active:scale-95"
				>
					<Text className="text-black text-xl font-bold">RETURN TO BASE</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}
