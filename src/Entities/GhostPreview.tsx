import { useGameStore } from "../stores/gameStore";
import { BaseFloor, BaseRoof, BaseStilt, BaseWall } from "./BaseBuilding";

export function GhostPreview() {
	const { selectedBuildItem, playerPos } = useGameStore();

	if (!selectedBuildItem) return null;

	// Calculate snapped position
	const pos: [number, number, number] = [
		Math.round(playerPos[0] / 4) * 4,
		Math.round(playerPos[1]),
		Math.round(playerPos[2] / 4) * 4,
	];

	// Map template ID to component type
	let componentType: "FLOOR" | "WALL" | "ROOF" | "STILT" = "FLOOR";
	if (selectedBuildItem.id.includes("wall")) componentType = "WALL";
	else if (selectedBuildItem.id.includes("roof")) componentType = "ROOF";
	else if (selectedBuildItem.id.includes("stilt")) componentType = "STILT";
	else if (selectedBuildItem.id.includes("watchtower")) componentType = "STILT";

	return (
		<group position={pos} scale={[1.01, 1.01, 1.01]}>
			{componentType === "FLOOR" && <BaseFloor position={[0, 0, 0]} ghost />}
			{componentType === "WALL" && <BaseWall position={[0, 0, 0]} ghost />}
			{componentType === "ROOF" && <BaseRoof position={[0, 0, 0]} ghost />}
			{componentType === "STILT" && <BaseStilt position={[0, 0, 0]} ghost />}
		</group>
	);
}
