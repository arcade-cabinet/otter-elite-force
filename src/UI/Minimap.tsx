/**
 * Minimap Radar
 * High-contrast tactical display of nearby territory and threats
 */

import { CHUNK_SIZE, useGameStore } from "../stores/gameStore";

export function Minimap() {
	const { saveData, playerPos } = useGameStore();
	const px = playerPos[0];
	const pz = playerPos[2];

	// Map zoom level
	const zoom = 0.5;

	return (
		<div className="minimap-container">
			<div className="minimap-radar">
				{/* Player Marker */}
				<div className="player-dot" />

				{/* Nearby Chunks & Entities */}
				{Object.values(saveData.discoveredChunks).map((chunk) => {
					const dx = (chunk.x * CHUNK_SIZE - px) * zoom;
					const dz = (chunk.z * CHUNK_SIZE - pz) * zoom;

					// Only show if reasonably close
					if (Math.abs(dx) > 100 || Math.abs(dz) > 100) return null;

					const territoryClass = chunk.territoryState?.toLowerCase() || "neutral";

					return (
						<div
							key={chunk.id}
							className={`chunk-marker ${chunk.secured ? "secured" : ""} territory-${territoryClass}`}
							style={{
								transform: `translate(${dx}px, ${dz}px)`,
							}}
						>
							{chunk.entities.map((entity) => {
								const ex = entity.position[0] * zoom;
								const ez = entity.position[2] * zoom;

								return (
									<div
										key={entity.id}
										className={`entity-dot ${entity.type.toLowerCase()}`}
										style={{
											transform: `translate(${ex}px, ${ez}px)`,
										}}
									/>
								);
							})}
						</div>
					);
				})}
			</div>
			<div className="minimap-coords">
				GRID: {Math.floor(px / CHUNK_SIZE)}, {Math.floor(pz / CHUNK_SIZE)}
			</div>
		</div>
	);
}
