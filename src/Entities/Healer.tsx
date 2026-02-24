/**
 * Healer Entity
 * A mustelid medic who can restore player health
 * Distinct from regular villagers with medical supplies and green cross markings
 */

import type { PointLight as BabylonPointLight, TransformNode } from "@babylonjs/core";
import { Color3, Vector3 } from "@babylonjs/core";
import { useEffect, useRef } from "react";
import { useScene } from "reactylon";

interface HealerProps {
	position: [number, number, number];
	isInteracting?: boolean;
}

const EYE_OFFSETS = [-0.15, 0.15];
const PARTICLE_COUNT = [0, 1, 2, 3, 4, 5];

export function Healer({ position, isInteracting = false }: HealerProps) {
	const scene = useScene();
	const groupRef = useRef<TransformNode>(null);
	const headRef = useRef<TransformNode>(null);
	const glowRef = useRef<BabylonPointLight>(null);

	useEffect(() => {
		if (!scene) return;

		const obs = scene.onBeforeRenderObservable.add(() => {
			if (!groupRef.current || !headRef.current) return;
			const t = performance.now() / 1000;

			// Gentle idle animation
			groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.1;
			headRef.current.rotation.y = Math.sin(t * 1.5) * 0.15;
			headRef.current.position.y = 1.2 + Math.sin(t * 3) * 0.02;

			// Healing glow effect when interacting
			if (glowRef.current) {
				glowRef.current.intensity = isInteracting ? 2 + Math.sin(t * 8) * 0.5 : 0.5;
			}
		});

		return () => {
			scene.onBeforeRenderObservable.remove(obs);
		};
	}, [scene, isInteracting]);

	const furColor = new Color3(0.553, 0.431, 0.388);
	const snoutColor = new Color3(0.631, 0.533, 0.498);
	const coatColor = new Color3(0.91, 0.91, 0.878);
	const medGreenColor = new Color3(0.18, 0.49, 0.196);
	const healGlowColor = new Color3(0.4, 0.733, 0.416);

	return (
		<transformNode
			name="healer"
			ref={groupRef}
			positionX={position[0]}
			positionY={position[1]}
			positionZ={position[2]}
		>
			{/* Body - White/cream medical coat */}
			<cylinder
				name="healerBody"
				options={{ diameterTop: 0.8, diameterBottom: 0.7, height: 1.2, tessellation: 8 }}
				positionX={0}
				positionY={0.6}
				positionZ={0}
			>
				<standardMaterial name="coatMat" diffuseColor={coatColor} />
			</cylinder>

			{/* Green cross on chest - vertical bar */}
			<box
				name="crossVert"
				options={{ width: 0.08, height: 0.25, depth: 0.02 }}
				positionX={0}
				positionY={0.7}
				positionZ={0.36}
			>
				<standardMaterial name="crossMatV" diffuseColor={medGreenColor} />
			</box>
			{/* Green cross on chest - horizontal bar */}
			<box
				name="crossHoriz"
				options={{ width: 0.25, height: 0.08, depth: 0.02 }}
				positionX={0}
				positionY={0.7}
				positionZ={0.36}
			>
				<standardMaterial name="crossMatH" diffuseColor={medGreenColor} />
			</box>

			{/* Head */}
			<transformNode name="healerHead" ref={headRef} positionX={0} positionY={1.2} positionZ={0}>
				<sphere
					name="healerHeadSphere"
					options={{ diameter: 0.7, segments: 16 }}
					positionX={0}
					positionY={0}
					positionZ={0}
				>
					<standardMaterial name="headMat" diffuseColor={furColor} />
				</sphere>

				{/* Snout - scaled via parent transformNode */}
				<transformNode
					name="snoutNode"
					positionX={0}
					positionY={-0.05}
					positionZ={0.25}
					scalingX={1}
					scalingY={0.8}
					scalingZ={1.2}
				>
					<sphere
						name="snout"
						options={{ diameter: 0.4, segments: 12 }}
						positionX={0}
						positionY={0}
						positionZ={0}
					>
						<standardMaterial name="snoutMat" diffuseColor={snoutColor} />
					</sphere>
				</transformNode>

				{/* Eyes */}
				{EYE_OFFSETS.map((x, i) => (
					<sphere
						key={`eye-${i}`}
						name={`eye-${i}`}
						options={{ diameter: 0.08, segments: 8 }}
						positionX={x}
						positionY={0.1}
						positionZ={0.25}
					>
						<standardMaterial
							name={`eyeMat-${i}`}
							diffuseColor={medGreenColor}
							emissiveColor={medGreenColor}
						/>
					</sphere>
				))}

				{/* Medical headband */}
				<cylinder
					name="headband"
					options={{ diameterTop: 0.72, diameterBottom: 0.72, height: 0.08, tessellation: 24 }}
					positionX={0}
					positionY={0.25}
					positionZ={0}
					rotationX={-0.1}
				>
					<standardMaterial name="headbandMat" diffuseColor={new Color3(1, 1, 1)} />
				</cylinder>
				<box
					name="headbandCross"
					options={{ width: 0.1, height: 0.1, depth: 0.02 }}
					positionX={0}
					positionY={0.32}
					positionZ={0.25}
				>
					<standardMaterial
						name="headbandCrossMat"
						diffuseColor={new Color3(0.776, 0.157, 0.157)}
					/>
				</box>
			</transformNode>

			{/* Medical satchel */}
			<box
				name="satchel"
				options={{ width: 0.25, height: 0.3, depth: 0.15 }}
				positionX={-0.35}
				positionY={0.5}
				positionZ={0.1}
			>
				<standardMaterial name="satchelMat" diffuseColor={new Color3(0.365, 0.251, 0.216)} />
			</box>
			{/* Cross on satchel - horizontal */}
			<box
				name="satchelCrossH"
				options={{ width: 0.12, height: 0.04, depth: 0.01 }}
				positionX={-0.35}
				positionY={0.5}
				positionZ={0.18}
			>
				<standardMaterial name="satchelCrossMatH" diffuseColor={new Color3(0.776, 0.157, 0.157)} />
			</box>
			{/* Cross on satchel - vertical */}
			<box
				name="satchelCrossV"
				options={{ width: 0.04, height: 0.12, depth: 0.01 }}
				positionX={-0.35}
				positionY={0.5}
				positionZ={0.18}
			>
				<standardMaterial name="satchelCrossMatV" diffuseColor={new Color3(0.776, 0.157, 0.157)} />
			</box>

			{/* Healing glow */}
			<pointLight
				name="healGlow"
				ref={glowRef}
				position={new Vector3(0, 1, 0)}
				diffuse={healGlowColor}
				specular={healGlowColor}
				intensity={0.5}
				range={3}
			/>

			{/* Healing particles when interacting */}
			{isInteracting &&
				PARTICLE_COUNT.map((i) => (
					<sphere
						key={`particle-${i}`}
						name={`healParticle-${i}`}
						options={{ diameter: 0.1, segments: 6 }}
						positionX={Math.cos(i * 1.05) * 0.5}
						positionY={1.5}
						positionZ={Math.sin(i * 1.05) * 0.5}
					>
						<standardMaterial
							name={`particleMat-${i}`}
							diffuseColor={healGlowColor}
							emissiveColor={healGlowColor}
							alpha={0.7}
						/>
					</sphere>
				))}
		</transformNode>
	);
}
