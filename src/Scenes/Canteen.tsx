/**
 * Canteen Scene
 * Forward Operating Base for upgrades and loadout management
 * USING NATIVEWIND
 */

import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { BabylonEngine } from "../babylon/BabylonEngine";
import { Scene } from "../babylon/Scene";
import { ArcRotateCamera } from "../babylon/Camera";
import { HemisphericLight, DirectionalLight } from "../babylon/Light";
import { Ground } from "../babylon/primitives/Ground";
import { Box } from "../babylon/primitives/Box";
import { useGameStore } from "../stores/gameStore";

export function Canteen() {
const { setMode, saveData } = useGameStore();

const handleReturn = () => {
setMode("MENU");
};

return (
<View className="flex-1 bg-black">
<View className="flex-1">
<BabylonEngine>
<Scene clearColor={[0.2, 0.15, 0.1, 1]}>
<ArcRotateCamera position={[0, 1.5, 4]} target={[0, 1, 0]} radius={5} />
<HemisphericLight intensity={0.5} />
<DirectionalLight position={[3, 5, 3]} intensity={0.7} />
<Ground width={20} height={20} color={[0.3, 0.25, 0.2]} />

{/* Weapon rack */}
<Box position={[-2, 1, -1]} width={3} height={2} depth={0.2} color={[0.4, 0.3, 0.2]} />
<Box position={[2, 0.5, -1]} size={1} color={[0.5, 0.5, 0.5]} />
</Scene>
</BabylonEngine>
</View>

<View className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
<View className="items-center mt-10 pointer-events-auto">
<Text className="text-3xl font-bold text-otter-orange mb-6">
🏪 FORWARD OPERATING BASE
</Text>
</View>

<ScrollView className="flex-1 px-6 pointer-events-auto" contentContainerStyle={{ paddingBottom: 100 }}>
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
<Text className="text-otter-orange text-lg font-bold">{saveData.peacekeepingScore}</Text>
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
