/**
 * Victory Scene  
 * Displayed after successful mission extraction
 * MIGRATED TO BABYLON.JS (Simplified - fireworks TODO)
 */

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
<div className="screen active victory-screen">
<div className="victory-3d">
<BabylonEngine>
<Scene clearColor={[0.05, 0.05, 0.1, 1]}>
<ArcRotateCamera position={[0, 2, 8]} target={[0, 0, 0]} radius={8} />
<HemisphericLight intensity={0.6} />
<DirectionalLight position={[5, 10, 5]} intensity={0.8} />
<Ground width={50} height={50} color={[0.15, 0.25, 0.15]} />

{/* Victory podium placeholder */}
<Box position={[0, 0.5, 0]} size={1} color={[1, 0.84, 0]} />
<Box position={[-2, 0.3, 0]} size={0.8} color={[0.75, 0.75, 0.75]} />
<Box position={[2, 0.3, 0]} size={0.8} color={[0.8, 0.5, 0.2]} />
</Scene>
</BabylonEngine>
</div>

<div className="victory-overlay">
<h1 className="victory-title">🦦 MISSION COMPLETE</h1>
<div className="victory-stats">
<div className="stat">
<span className="stat-label">Territory Secured:</span>
<span className="stat-value">{saveData.territoryScore}</span>
</div>
<div className="stat">
<span className="stat-label">Enemies Neutralized:</span>
<span className="stat-value">{saveData.kills}</span>
</div>
<div className="stat">
<span className="stat-label">Credits Earned:</span>
<span className="stat-value">{saveData.credits}</span>
</div>
<div className="stat">
<span className="stat-label">Peacekeeping Score:</span>
<span className="stat-value">{saveData.peacekeepingScore}</span>
</div>
</div>
<button type="button" className="victory-button" onClick={handleContinue}>
RETURN TO BASE
</button>
</div>
</div>
);
}
