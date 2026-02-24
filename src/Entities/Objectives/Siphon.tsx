/**
 * Siphon - Scale-Guard Militia oil extraction point
 * When active: Pumps pollutants into the river, emits smoke, red warning light
 * When secured: Destroyed/disabled, no smoke, green "cleared" light
 */

import type { TransformNode } from "@babylonjs/core";
import { Color3, Vector3 } from "@babylonjs/core";
import { useEffect, useRef } from "react";
import { useScene } from "reactylon";

interface SiphonProps {
	position: [number, number, number];
	secured?: boolean;
}

const PIPE_INDICES = [0, 1, 2];
const SMOKE_INDICES = [0, 1, 2, 3, 4];
const DEBRIS_INDICES = [0, 1, 2, 3];

export function Siphon({ position, secured = false }: SiphonProps) {
	const scene = useScene();
	const smokeGroupRef = useRef<TransformNode>(null);
	const structureRef = useRef<TransformNode>(null);

	useEffect(() => {
		if (!scene) return;

		const obs = scene.onBeforeRenderObservable.add(() => {
			// Animate smoke puffs when active
			if (!secured && smokeGroupRef.current) {
				for (const child of smokeGroupRef.current.getChildTransformNodes()) {
					child.position.y += 0.05;
					const s = child.scaling.x + 0.01;
					child.scaling.set(s, s, s);
					if (child.position.y > 5) {
						child.position.y = 0;
						child.scaling.set(0.2, 0.2, 0.2);
					}
				}
			}

			// Secured siphons slowly tilt/sink
			if (secured && structureRef.current) {
				structureRef.current.rotation.z += (0.3 - structureRef.current.rotation.z) * 0.016 * 0.5;
				structureRef.current.position.y += (-1 - structureRef.current.position.y) * 0.016 * 0.5;
			}
		});

		return () => {
			scene.onBeforeRenderObservable.remove(obs);
		};
	}, [scene, secured]);

	const structureColor = secured
		? new Color3(0.102, 0.102, 0.102)
		: new Color3(0.067, 0.067, 0.067);
	const pipeColor = secured ? new Color3(0.2, 0.2, 0.2) : new Color3(0.133, 0.133, 0.133);
	const lightColor = secured ? new Color3(0, 1, 0) : new Color3(1, 0, 0);
	const smokeColor = new Color3(0.2, 0.2, 0.2);
	const debrisColor = new Color3(0.133, 0.133, 0.133);

	return (
		<transformNode
			name="siphon"
			positionX={position[0]}
			positionY={position[1]}
			positionZ={position[2]}
		>
			<transformNode name="siphonStructure" ref={structureRef}>
				{/* Main Siphon Body */}
				<cylinder
					name="siphonBody"
					options={{ diameterTop: 3, diameterBottom: 4, height: 4, tessellation: 32 }}
					positionX={0}
					positionY={0}
					positionZ={0}
				>
					<standardMaterial name="siphonMat" diffuseColor={structureColor} />
				</cylinder>

				{/* Pumping Pipes */}
				{PIPE_INDICES.map((i) => (
					<cylinder
						key={`pipe-${i}`}
						name={`pipe-${i}`}
						options={{ diameterTop: 0.6, diameterBottom: 0.6, height: 5, tessellation: 16 }}
						positionX={0}
						positionY={-1}
						positionZ={0}
						rotationY={(i * Math.PI * 2) / 3}
					>
						<standardMaterial name={`pipeMat-${i}`} diffuseColor={pipeColor} />
					</cylinder>
				))}

				{/* Dirty Smoke Effect - only when active */}
				{!secured && (
					<transformNode
						name="smokeGroup"
						ref={smokeGroupRef}
						positionX={0}
						positionY={2}
						positionZ={0}
					>
						{SMOKE_INDICES.map((i) => (
							<transformNode
								key={`smoke-${i}`}
								name={`smokeParticle-${i}`}
								positionX={0}
								positionY={i * 1}
								positionZ={0}
								scalingX={0.2}
								scalingY={0.2}
								scalingZ={0.2}
							>
								<sphere
									name={`smokeSphere-${i}`}
									options={{ diameter: 1, segments: 16 }}
									positionX={0}
									positionY={0}
									positionZ={0}
								>
									<standardMaterial name={`smokeMat-${i}`} diffuseColor={smokeColor} alpha={0.4} />
								</sphere>
							</transformNode>
						))}
					</transformNode>
				)}

				{/* Secured: Show wreckage debris */}
				{secured && (
					<transformNode name="debrisGroup" positionX={0} positionY={0.5} positionZ={0}>
						{DEBRIS_INDICES.map((i) => (
							<box
								key={`debris-${i}`}
								name={`debris-${i}`}
								options={{ width: 0.4, height: 0.2, depth: 0.3 }}
								positionX={Math.cos(i * 1.5) * 2}
								positionY={0.25}
								positionZ={Math.sin(i * 1.5) * 2}
								rotationX={i * 0.7}
								rotationY={i * 0.5}
								rotationZ={i * 0.3}
							>
								<standardMaterial name={`debrisMat-${i}`} diffuseColor={debrisColor} />
							</box>
						))}
					</transformNode>
				)}

				{/* Status Light */}
				<pointLight
					name="statusLight"
					position={new Vector3(0, 0, 0)}
					diffuse={lightColor}
					specular={lightColor}
					intensity={secured ? 0.5 : 2}
					range={secured ? 5 : 10}
				/>
			</transformNode>
		</transformNode>
	);
}
