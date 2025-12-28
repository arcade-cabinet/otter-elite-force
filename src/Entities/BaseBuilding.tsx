/**
 * Base Building Components
 * Reusable pieces for constructing the URA Forward Operating Base
 */

export function BaseFloor({
	position,
	rotation = [0, 0, 0],
	ghost = false,
}: {
	position: [number, number, number];
	rotation?: [number, number, number];
	ghost?: boolean;
}) {
	return (
		<mesh position={position} rotation={rotation} receiveShadow={!ghost}>
			<boxGeometry args={[4, 0.2, 4]} />
			<meshStandardMaterial
				color={ghost ? "#66ff66" : "#3d2b1f"}
				transparent={ghost}
				opacity={ghost ? 0.4 : 1}
				roughness={1}
				depthWrite={!ghost}
			/>
		</mesh>
	);
}

export function BaseWall({
	position,
	rotation = [0, 0, 0],
	ghost = false,
}: {
	position: [number, number, number];
	rotation?: [number, number, number];
	ghost?: boolean;
}) {
	return (
		<mesh position={position} rotation={rotation} castShadow={!ghost} receiveShadow={!ghost}>
			<boxGeometry args={[4, 2, 0.1]} />
			<meshStandardMaterial
				color={ghost ? "#66ff66" : "#3d2b1f"}
				transparent={ghost}
				opacity={ghost ? 0.4 : 1}
				roughness={1}
				depthWrite={!ghost}
			/>
		</mesh>
	);
}

export function BaseRoof({
	position,
	rotation = [0, 0, 0],
	ghost = false,
}: {
	position: [number, number, number];
	rotation?: [number, number, number];
	ghost?: boolean;
}) {
	return (
		<mesh position={position} rotation={rotation} castShadow={!ghost}>
			<cylinderGeometry args={[0, 3, 1.5, 4]} />
			<meshStandardMaterial
				color={ghost ? "#66ff66" : "#d4c4a8"}
				transparent={ghost}
				opacity={ghost ? 0.4 : 1}
				roughness={1}
				depthWrite={!ghost}
			/>
		</mesh>
	);
}

export function BaseStilt({
	position,
	ghost = false,
}: {
	position: [number, number, number];
	ghost?: boolean;
}) {
	return (
		<mesh position={position} castShadow={!ghost}>
			<cylinderGeometry args={[0.1, 0.1, 2]} />
			<meshStandardMaterial
				color={ghost ? "#66ff66" : "#2d1f15"}
				transparent={ghost}
				opacity={ghost ? 0.4 : 1}
				depthWrite={!ghost}
			/>
		</mesh>
	);
}
