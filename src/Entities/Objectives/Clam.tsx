/**
 * Ancestral Clam Entity
 * The "Flag" in our CTF scenario. A heavy, bioluminescent artifact.
 */

import { useScene } from "reactylon";
import { useEffect, useRef } from "react";
import type { TransformNode, PointLight as BabylonPointLight } from "@babylonjs/core";

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
		<transformNode name="clamGroup" ref={groupRef} position={position}>
			{/* Clam Shells */}
			<sphere
				name="clamShellTop"
				diameter={0.8}
				segments={16}
				rotation={[Math.PI / 4, 0, 0]}
			>
				<standardMaterial
					name="clamShellMat"
					diffuseColor={[1, 1, 1]}
					metallic={0.8}
					roughness={0.2}
				/>
			</sphere>
			<sphere
				name="clamShellBottom"
				diameter={0.8}
				segments={16}
				rotation={[-Math.PI / 4, 0, 0]}
				position={[0, -0.1, 0]}
			>
				<standardMaterial
					name="clamShellMat2"
					diffuseColor={[1, 1, 1]}
					metallic={0.8}
					roughness={0.2}
				/>
			</sphere>

			{/* Bioluminescent Pearl */}
			<sphere name="pearl" diameter={0.3} segments={16} position={[0, 0, 0]}>
				<standardMaterial
					name="pearlMat"
					emissiveColor={[0, 0.8, 1]}
					diffuseColor={[0, 0.8, 1]}
				/>
			</sphere>
			<pointLight
				name="pearlLight"
				ref={lightRef}
				diffuse={[0, 0.8, 1]}
				specular={[0, 0.8, 1]}
				intensity={1.5}
				range={5}
				position={[0, 0, 0]}
			/>
		</transformNode>
	);
}

export function ExtractionPoint({ position }: { position: [number, number, number] }) {
	return (
		<transformNode name="extractionPoint" position={position}>
			{/* Signal Flare / Marker */}
			<disc name="extractionMarker" radius={3} tessellation={32} position={[0, 0.1, 0]}>
				<standardMaterial
					name="markerMat"
					emissiveColor={[1, 0.67, 0]}
					alpha={0.2}
				/>
			</disc>
			<cylinder
				name="extractionBeam"
				diameterTop={0.1}
				diameterBottom={0.1}
				height={10}
				position={[0, 5, 0]}
			>
				<standardMaterial name="beamMat" emissiveColor={[1, 0.67, 0]} alpha={0.1} />
			</cylinder>
			<pointLight
				name="extractionLight"
				position={[0, 1, 0]}
				diffuse={[1, 0.67, 0]}
				specular={[1, 0.67, 0]}
				intensity={2}
				range={10}
			/>
		</transformNode>
	);
}
