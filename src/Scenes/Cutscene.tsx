/**
 * Cutscene Scene
 * Handles introductory dialogue and story beats
 * USING REACTYLON
 */

import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Canvas } from "reactylon/web";
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

return (
<View className="flex-1 bg-black">
<View className="flex-1">
<Canvas>
<scene clearColor={[0.4, 0.6, 0.9, 1]}>
<arcRotateCamera 
name="camera"
alpha={0}
beta={Math.PI / 4}
radius={20}
target={[0, 0.5, 0]}
position={[0, 5, 20]}
/>
<hemisphericLight name="ambient" intensity={0.5} direction={[0, 1, 0]} />
<directionalLight name="sun" intensity={1} position={[10, 10, 5]} />

{/* Ground plane */}
<ground name="ground" width={100} height={100}>
<standardMaterial name="groundMat" diffuseColor={[0.18, 0.31, 0.09]} />
</ground>

{/* TODO: Add PlayerRig entities */}
</scene>
</Canvas>
</View>

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
