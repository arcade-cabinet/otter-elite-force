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
	const color = ghost ? [0.4, 0.8, 1] : [0.24, 0.17, 0.12];
	return (
		<box name="baseFloor" width={4} height={0.2} depth={4} position={position} rotation={rotation}>
			<standardMaterial
				name="floorMat"
				diffuseColor={color}
				roughness={1}
				alpha={ghost ? 0.5 : 1}
			/>
		</box>
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
	const color = ghost ? [0.4, 0.8, 1] : [0.24, 0.17, 0.12];
	return (
		<box name="baseWall" width={4} height={2} depth={0.1} position={position} rotation={rotation}>
			<standardMaterial name="wallMat" diffuseColor={color} roughness={1} alpha={ghost ? 0.5 : 1} />
		</box>
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
	const color = ghost ? [0.4, 0.8, 1] : [0.83, 0.77, 0.66];
	return (
		<cylinder
			name="baseRoof"
			diameterTop={0}
			diameterBottom={6}
			height={1.5}
			tessellation={4}
			position={position}
			rotation={rotation}
		>
			<standardMaterial name="roofMat" diffuseColor={color} roughness={1} alpha={ghost ? 0.5 : 1} />
		</cylinder>
	);
}

export function BaseStilt({
	position,
	ghost = false,
}: {
	position: [number, number, number];
	ghost?: boolean;
}) {
	const color = ghost ? [0.4, 0.8, 1] : [0.18, 0.12, 0.08];
	return (
		<cylinder
			name="baseStilt"
			diameterTop={0.2}
			diameterBottom={0.2}
			height={2}
			position={position}
		>
			<standardMaterial name="stiltMat" diffuseColor={color} alpha={ghost ? 0.5 : 1} />
		</cylinder>
	);
}
