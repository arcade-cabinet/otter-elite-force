/**
 * Base Building Components
 * Reusable pieces for constructing the URA Forward Operating Base
 */

import { Color3 } from "@babylonjs/core";

export function BaseFloor({
	position,
	rotation = [0, 0, 0],
	ghost = false,
}: {
	position: [number, number, number];
	rotation?: [number, number, number];
	ghost?: boolean;
}) {
	const color = ghost ? new Color3(0.4, 0.8, 1) : new Color3(0.24, 0.17, 0.12);
	return (
		<box
			name="baseFloor"
			options={{ width: 4, height: 0.2, depth: 4 }}
			positionX={position[0]}
			positionY={position[1]}
			positionZ={position[2]}
			rotationX={rotation[0]}
			rotationY={rotation[1]}
			rotationZ={rotation[2]}
		>
			<standardMaterial name="floorMat" diffuseColor={color} alpha={ghost ? 0.5 : 1} />
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
	const color = ghost ? new Color3(0.4, 0.8, 1) : new Color3(0.24, 0.17, 0.12);
	return (
		<box
			name="baseWall"
			options={{ width: 4, height: 2, depth: 0.1 }}
			positionX={position[0]}
			positionY={position[1]}
			positionZ={position[2]}
			rotationX={rotation[0]}
			rotationY={rotation[1]}
			rotationZ={rotation[2]}
		>
			<standardMaterial name="wallMat" diffuseColor={color} alpha={ghost ? 0.5 : 1} />
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
	const color = ghost ? new Color3(0.4, 0.8, 1) : new Color3(0.83, 0.77, 0.66);
	return (
		<cylinder
			name="baseRoof"
			options={{ diameterTop: 0, diameterBottom: 6, height: 1.5, tessellation: 4 }}
			positionX={position[0]}
			positionY={position[1]}
			positionZ={position[2]}
			rotationX={rotation[0]}
			rotationY={rotation[1]}
			rotationZ={rotation[2]}
		>
			<standardMaterial name="roofMat" diffuseColor={color} alpha={ghost ? 0.5 : 1} />
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
	const color = ghost ? new Color3(0.4, 0.8, 1) : new Color3(0.18, 0.12, 0.08);
	return (
		<cylinder
			name="baseStilt"
			options={{ diameterTop: 0.2, diameterBottom: 0.2, height: 2, tessellation: 8 }}
			positionX={position[0]}
			positionY={position[1]}
			positionZ={position[2]}
		>
			<standardMaterial name="stiltMat" diffuseColor={color} alpha={ghost ? 0.5 : 1} />
		</cylinder>
	);
}
