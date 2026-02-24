/**
 * Villager Entity
 * Mustelid civilian living in the Copper-Silt Reach
 */

import type { TransformNode } from "@babylonjs/core";
import { Color3 } from "@babylonjs/core";
import { useEffect, useRef } from "react";
import { useScene } from "reactylon";

const LEG_POSITIONS: [number, number, number][] = [
	[-0.2, -0.2, -0.2],
	[0.2, -0.2, -0.2],
	[-0.2, -0.2, 0.2],
	[0.2, -0.2, 0.2],
];

const EYE_SIDES = [-1, 1] as const;

export function Villager({ position }: { position: [number, number, number] }) {
	const scene = useScene();
	const groupRef = useRef<TransformNode>(null);
	const headRef = useRef<TransformNode>(null);
	const tailRef = useRef<TransformNode>(null);

	useEffect(() => {
		if (!scene) return;

		const obs = scene.onBeforeRenderObservable.add(() => {
			if (!groupRef.current || !headRef.current) return;
			const t = performance.now() / 1000;

			// Idle animation (sway and head look)
			groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.05;
			headRef.current.rotation.y = Math.sin(t * 1.5) * 0.15;
			headRef.current.position.y = 0.5 + Math.sin(t * 3) * 0.01;

			if (tailRef.current) {
				tailRef.current.rotation.z = Math.sin(t * 2) * 0.1;
			}
		});

		return () => {
			scene.onBeforeRenderObservable.remove(obs);
		};
	}, [scene]);

	const furColor = new Color3(0.553, 0.431, 0.388);
	const snoutColor = new Color3(0.631, 0.533, 0.498);
	const hatColor = new Color3(0.831, 0.769, 0.659);
	const eyeColor = new Color3(0.067, 0.067, 0.067);

	return (
		<transformNode
			name="villager"
			ref={groupRef}
			positionX={position[0]}
			positionY={position[1]}
			positionZ={position[2]}
		>
			{/* Quadrupedal Villager Body */}
			<transformNode name="villagerBody" positionX={0} positionY={0.4} positionZ={0}>
				{/* Torso */}
				<cylinder
					name="torso"
					options={{ diameterTop: 0.56, diameterBottom: 0.56, height: 0.6, tessellation: 12 }}
					positionX={0}
					positionY={0}
					positionZ={0}
					rotationX={Math.PI / 2}
				>
					<standardMaterial name="torsoMat" diffuseColor={furColor} />
				</cylinder>

				{/* 4 Simple Legs */}
				{LEG_POSITIONS.map((pos, i) => (
					<sphere
						key={`leg-${i}`}
						name={`leg-${i}`}
						options={{ diameter: 0.2, segments: 12 }}
						positionX={pos[0]}
						positionY={pos[1]}
						positionZ={pos[2]}
					>
						<standardMaterial name={`legMat-${i}`} diffuseColor={furColor} />
					</sphere>
				))}

				{/* Tail */}
				<transformNode name="tailGroup" ref={tailRef} positionX={0} positionY={0} positionZ={-0.4}>
					<cylinder
						name="tail"
						options={{ diameterTop: 0.24, diameterBottom: 0.24, height: 0.5, tessellation: 12 }}
						positionX={0}
						positionY={0}
						positionZ={0}
						rotationX={Math.PI / 2}
					>
						<standardMaterial name="tailMat" diffuseColor={furColor} />
					</cylinder>
				</transformNode>

				{/* Head & Neck */}
				<transformNode name="headGroup" ref={headRef} positionX={0} positionY={0.1} positionZ={0.4}>
					{/* Neck */}
					<sphere
						name="neck"
						options={{ diameter: 0.4, segments: 16 }}
						positionX={0}
						positionY={0.15}
						positionZ={0.1}
						rotationX={-Math.PI / 4}
					>
						<standardMaterial name="neckMat" diffuseColor={furColor} />
					</sphere>

					{/* Head */}
					<sphere
						name="head"
						options={{ diameter: 0.44, segments: 24 }}
						positionX={0}
						positionY={0.35}
						positionZ={0.15}
					>
						<standardMaterial name="headMat" diffuseColor={furColor} />
					</sphere>

					{/* Snout */}
					<sphere
						name="snout"
						options={{ diameter: 0.24, segments: 16 }}
						positionX={0}
						positionY={0.3}
						positionZ={0.33}
					>
						<standardMaterial name="snoutMat" diffuseColor={snoutColor} />
					</sphere>

					{/* Eyes */}
					{EYE_SIDES.map((side) => (
						<sphere
							key={`eye-${side}`}
							name={`eye-${side}`}
							options={{ diameter: 0.06, segments: 12 }}
							positionX={side * 0.1}
							positionY={0.43}
							positionZ={0.3}
						>
							<standardMaterial
								name={`eyeMat-${side}`}
								diffuseColor={eyeColor}
								emissiveColor={eyeColor}
							/>
						</sphere>
					))}

					{/* Villager Straw Hat */}
					<cylinder
						name="strawHat"
						options={{ diameterTop: 0.9, diameterBottom: 0.9, height: 0.04, tessellation: 32 }}
						positionX={0}
						positionY={0.57}
						positionZ={0.15}
						rotationX={0.1}
					>
						<standardMaterial name="hatMat" diffuseColor={hatColor} />
					</cylinder>
				</transformNode>
			</transformNode>
		</transformNode>
	);
}

export function Hut({ position }: { position: [number, number, number] }) {
	const wallColor = new Color3(0.239, 0.169, 0.122);
	const thatchColor = new Color3(0.831, 0.769, 0.659);

	return (
		<transformNode
			name="hut"
			positionX={position[0]}
			positionY={position[1]}
			positionZ={position[2]}
		>
			{/* Base */}
			<box
				name="hutBase"
				options={{ width: 4, height: 2, depth: 4 }}
				positionX={0}
				positionY={1}
				positionZ={0}
			>
				<standardMaterial name="hutBaseMat" diffuseColor={wallColor} />
			</box>
			{/* Thatched Roof */}
			<cylinder
				name="hutRoof"
				options={{ diameterTop: 0, diameterBottom: 6, height: 1.5, tessellation: 4 }}
				positionX={0}
				positionY={2.5}
				positionZ={0}
			>
				<standardMaterial name="hutRoofMat" diffuseColor={thatchColor} />
			</cylinder>
			{/* Doorway */}
			<box
				name="hutDoor"
				options={{ width: 1, height: 1.6, depth: 0.05 }}
				positionX={0}
				positionY={0.8}
				positionZ={2.01}
			>
				<standardMaterial name="doorMat" diffuseColor={new Color3(0, 0, 0)} />
			</box>
		</transformNode>
	);
}
