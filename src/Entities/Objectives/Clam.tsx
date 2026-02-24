/**
 * Ancestral Clam Entity
 * The "Flag" in our CTF scenario. A heavy, bioluminescent artifact.
 */

import type { PointLight as BabylonPointLight, TransformNode } from "@babylonjs/core";
import { Color3, Vector3 } from "@babylonjs/core";
import { useEffect, useRef } from "react";
import { useScene } from "reactylon";

export function Clam({
	position,
	isCarried = false,
}: {
	position: [number, number, number];
	isCarried?: boolean;
}) {
	const scene = useScene();
	const groupRef = useRef<TransformNode>(null);
	const lightRef = useRef<BabylonPointLight>(null);

	useEffect(() => {
		if (!scene || isCarried) return;

		const observer = scene.onBeforeRenderObservable.add(() => {
			if (isCarried || !groupRef.current) return;
			const t = performance.now() / 1000;

			// Levitate and rotate if not carried
			groupRef.current.position.y = 0.5 + Math.sin(t * 2) * 0.1;
			groupRef.current.rotation.y = t * 0.5;

			if (lightRef.current) {
				lightRef.current.intensity = 1.5 + Math.sin(t * 4) * 0.5;
			}
		});

		return () => {
			scene.onBeforeRenderObservable.remove(observer);
		};
	}, [scene, isCarried]);

	return (
		<transformNode
			name="clamGroup"
			ref={groupRef}
			positionX={position[0]}
			positionY={position[1]}
			positionZ={position[2]}
		>
			{/* Clam Shell Top */}
			<sphere
				name="clamShellTop"
				options={{ diameter: 0.8, segments: 16 }}
				positionX={0}
				positionY={0}
				positionZ={0}
				rotationX={Math.PI / 4}
			>
				<standardMaterial name="clamShellMat" diffuseColor={new Color3(1, 1, 1)} />
			</sphere>

			{/* Clam Shell Bottom */}
			<sphere
				name="clamShellBottom"
				options={{ diameter: 0.8, segments: 16 }}
				positionX={0}
				positionY={-0.1}
				positionZ={0}
				rotationX={-Math.PI / 4}
			>
				<standardMaterial name="clamShellMat2" diffuseColor={new Color3(1, 1, 1)} />
			</sphere>

			{/* Bioluminescent Pearl */}
			<sphere
				name="pearl"
				options={{ diameter: 0.3, segments: 16 }}
				positionX={0}
				positionY={0}
				positionZ={0}
			>
				<standardMaterial
					name="pearlMat"
					emissiveColor={new Color3(0, 0.8, 1)}
					diffuseColor={new Color3(0, 0.8, 1)}
				/>
			</sphere>

			<pointLight
				name="pearlLight"
				ref={lightRef}
				position={new Vector3(0, 0, 0)}
				diffuse={new Color3(0, 0.8, 1)}
				specular={new Color3(0, 0.8, 1)}
				intensity={1.5}
				range={5}
			/>
		</transformNode>
	);
}
