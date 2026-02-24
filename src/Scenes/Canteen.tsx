/**
 * Canteen Scene
 * Forward Operating Base for upgrades and loadout management
 * MIGRATED TO BABYLON.JS
 */

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
<div className="screen active canteen-screen">
<div className="canteen-3d">
<BabylonEngine>
<Scene clearColor={[0.2, 0.15, 0.1, 1]}>
<ArcRotateCamera position={[0, 1.5, 4]} target={[0, 1, 0]} radius={5} />
<HemisphericLight intensity={0.5} />
<DirectionalLight position={[3, 5, 3]} intensity={0.7} />
<Ground width={20} height={20} color={[0.3, 0.25, 0.2]} />

{/* Weapon rack placeholder */}
<Box position={[-2, 1, -1]} width={3} height={2} depth={0.2} color={[0.4, 0.3, 0.2]} />
<Box position={[2, 0.5, -1]} size={1} color={[0.5, 0.5, 0.5]} />
</Scene>
</BabylonEngine>
</div>

<div className="canteen-overlay">
<h1 className="canteen-title">🏪 FORWARD OPERATING BASE</h1>
<div className="canteen-content">
<div className="canteen-section">
<h2>Arsenal</h2>
<p>Credits: {saveData.credits}</p>
<p>Upgrades available when weapons system is implemented</p>
</div>
<div className="canteen-section">
<h2>Intelligence</h2>
<p>Peacekeeping Score: {saveData.peacekeepingScore}</p>
<p>Territory Secured: {saveData.territoryScore}</p>
</div>
</div>
<button type="button" className="canteen-button" onClick={handleReturn}>
RETURN TO MAIN MENU
</button>
</div>
</div>
);
}
