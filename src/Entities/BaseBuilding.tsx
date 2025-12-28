/**
 * Base Building Components
 * Reusable pieces for constructing the URA Forward Operating Base
 */

export function BaseFloor({
	position,
	rotation = [0, 0, 0],
}: {
	position: [number, number, number];
	rotation?: [number, number, number];
}) {
	return (
		<mesh position={position} rotation={rotation} receiveShadow>
			<boxGeometry args={[4, 0.2, 4]} />
			<meshStandardMaterial color="#3d2b1f" roughness={1} />
		</mesh>
	);
}

export function BaseWall({
	position,
	rotation = [0, 0, 0],
}: {
	position: [number, number, number];
	rotation?: [number, number, number];
}) {
	return (
		<mesh position={position} rotation={rotation} castShadow receiveShadow>
			<boxGeometry args={[4, 2, 0.1]} />
			<meshStandardMaterial color="#3d2b1f" roughness={1} />
		</mesh>
	);
}

export function BaseRoof({
	position,
	rotation = [0, 0, 0],
}: {
	position: [number, number, number];
	rotation?: [number, number, number];
}) {
	return (
		<mesh position={position} rotation={rotation} castShadow>
			<cylinderGeometry args={[0, 3, 1.5, 4]} />
			<meshStandardMaterial color="#d4c4a8" roughness={1} />
		</mesh>
	);
}

export function BaseStilt({ position }: { position: [number, number, number] }) {
	return (
		<mesh position={position} castShadow>
			<cylinderGeometry args={[0.1, 0.1, 2]} />
			<meshStandardMaterial color="#2d1f15" />
		</mesh>
	);
}
