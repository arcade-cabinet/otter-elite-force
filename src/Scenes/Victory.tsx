/**
 * Victory Scene  
 * Displayed after successful mission extraction
 * USING NATIVEWIND
 */

import { View, Text, TouchableOpacity } from "react-native";
import { BabylonEngine } from "../babylon/BabylonEngine";
import { Scene } from "../babylon/Scene";
import { ArcRotateCamera } from "../babylon/Camera";
import { HemisphericLight, DirectionalLight } from "../babylon/Light";
import { Ground } from "../babylon/primitives/Ground";
import { Box } from "../babylon/primitives/Box";
import { useGameStore } from "../stores/gameStore";

export function Victory() {
const { setMode, saveData } = useGameStore();

const handleContinue = () => {
setMode("MENU");
};

return (
<View className="flex-1 bg-black">
<View className="flex-1">
<BabylonEngine>
<Scene clearColor={[0.05, 0.05, 0.1, 1]}>
<ArcRotateCamera position={[0, 2, 8]} target={[0, 0, 0]} radius={8} />
<HemisphericLight intensity={0.6} />
<DirectionalLight position={[5, 10, 5]} intensity={0.8} />
<Ground width={50} height={50} color={[0.15, 0.25, 0.15]} />

{/* Victory podium */}
<Box position={[0, 0.5, 0]} size={1} color={[1, 0.84, 0]} />
<Box position={[-2, 0.3, 0]} size={0.8} color={[0.75, 0.75, 0.75]} />
<Box position={[2, 0.3, 0]} size={0.8} color={[0.8, 0.5, 0.2]} />
</Scene>
</BabylonEngine>
</View>

<View className="absolute top-10 left-0 right-0 items-center">
<Text className="text-4xl font-bold text-otter-orange mb-8">
🦦 MISSION COMPLETE
</Text>

<View className="bg-black/80 p-6 rounded-lg">
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
<Text className="text-otter-orange text-lg font-bold">{saveData.peacekeepingScore}</Text>
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
