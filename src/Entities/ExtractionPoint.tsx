/**
 * ExtractionPoint Entity
 * Landing zone / extraction area for completing missions
 * Helicopter landing pad aesthetic with beacon lights
 */

import type { PointLight as BabylonPointLight, TransformNode } from "@babylonjs/core";
import { Color3, Vector3 } from "@babylonjs/core";
import { useEffect, useRef } from "react";
import { useScene } from "reactylon";

interface ExtractionPointProps {
	position: [number, number, number];
	isActive?: boolean;
	isSecured?: boolean;
}

const CORNER_INDICES = [0, 1, 2, 3];
const RING_INDICES = [0, 1, 2];

export function ExtractionPoint({
	position,
	isActive = true,
	isSecured = false,
}: ExtractionPointProps) {
	const scene = useScene();
	const ringsRef = useRef<TransformNode>(null);
	const beaconRef = useRef<BabylonPointLight>(null);
	const smokeRef = useRef<TransformNode>(null);

	useEffect(() => {
		if (!scene) return;

		const obs = scene.onBeforeRenderObservable.add(() => {
			const t = performance.now() / 1000;

			// Rotating beacon rings
			if (ringsRef.current) {
				ringsRef.current.rotation.y = t * 0.5;
			}

			// Pulsing beacon light
			if (beaconRef.current && isActive) {
				beaconRef.current.intensity = 2 + Math.sin(t * 3) * 1;
			}

			// Rising smoke
			if (smokeRef.current) {
				const children = smokeRef.current.getChildTransformNodes();
				children.forEach((smoke, i) => {
					const y = ((t * 0.5 + i * 0.3) % 3) * 2;
					smoke.position.y = y;
					const s = 0.5 + y * 0.3;
					smoke.scaling.set(s, s, s);
				});
			}
		});

		return () => {
			scene.onBeforeRenderObservable.remove(obs);
		};
	}, [scene, isActive]);

	const markerColor = isSecured ? new Color3(0, 1, 0) : new Color3(1, 0.667, 0);
	const padColor = isSecured ? new Color3(0.165, 0.29, 0.165) : new Color3(0.165, 0.227, 0.165);
	const beaconColor = isSecured ? new Color3(0, 1, 0) : new Color3(1, 0.667, 0);
	const postColor = new Color3(0.2, 0.2, 0.2);

	return (
		<transformNode
			name="extractionPoint"
			positionX={position[0]}
			positionY={position[1]}
			positionZ={position[2]}
		>
			{/* Landing pad base */}
			<cylinder
				name="landingPad"
				options={{ diameterTop: 12, diameterBottom: 12, height: 0.1, tessellation: 32 }}
				positionX={0}
				positionY={0.05}
				positionZ={0}
			>
				<standardMaterial name="padMat" diffuseColor={padColor} />
			</cylinder>

			{/* Outer ring marking */}
			<cylinder
				name="outerRing"
				options={{ diameterTop: 11, diameterBottom: 11, height: 0.02, tessellation: 32 }}
				positionX={0}
				positionY={0.06}
				positionZ={0}
			>
				<standardMaterial name="ringMat" diffuseColor={markerColor} emissiveColor={markerColor} />
			</cylinder>

			{/* H marking - vertical bars */}
			<box
				name="hVertLeft"
				options={{ width: 0.5, height: 0.02, depth: 4 }}
				positionX={-1.5}
				positionY={0.07}
				positionZ={0}
			>
				<standardMaterial name="hMat1" diffuseColor={markerColor} emissiveColor={markerColor} />
			</box>
			<box
				name="hVertRight"
				options={{ width: 0.5, height: 0.02, depth: 4 }}
				positionX={1.5}
				positionY={0.07}
				positionZ={0}
			>
				<standardMaterial name="hMat2" diffuseColor={markerColor} emissiveColor={markerColor} />
			</box>
			{/* H horizontal bar */}
			<box
				name="hHoriz"
				options={{ width: 3.5, height: 0.02, depth: 0.5 }}
				positionX={0}
				positionY={0.07}
				positionZ={0}
			>
				<standardMaterial name="hMat3" diffuseColor={markerColor} emissiveColor={markerColor} />
			</box>

			{/* Corner markers */}
			{CORNER_INDICES.map((i) => {
				const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
				const dist = 5.2;
				const cx = Math.cos(angle) * dist;
				const cz = Math.sin(angle) * dist;
				return (
					<transformNode
						key={`corner-${i}`}
						name={`cornerGroup-${i}`}
						positionX={cx}
						positionY={0.1}
						positionZ={cz}
					>
						<cylinder
							name={`cornerPost-${i}`}
							options={{ diameterTop: 0.2, diameterBottom: 0.2, height: 0.8, tessellation: 8 }}
							positionX={0}
							positionY={0}
							positionZ={0}
						>
							<standardMaterial name={`postMat-${i}`} diffuseColor={postColor} />
						</cylinder>
						<sphere
							name={`cornerLight-${i}`}
							options={{ diameter: 0.24, segments: 8 }}
							positionX={0}
							positionY={0.5}
							positionZ={0}
						>
							<standardMaterial
								name={`cornerLightMat-${i}`}
								diffuseColor={markerColor}
								emissiveColor={markerColor}
							/>
						</sphere>
						<pointLight
							name={`cornerPointLight-${i}`}
							position={new Vector3(0, 0.5, 0)}
							diffuse={markerColor}
							specular={markerColor}
							intensity={0.5}
							range={3}
						/>
					</transformNode>
				);
			})}

			{/* Rotating beacon rings */}
			{isActive && (
				<transformNode
					name="beaconRings"
					ref={ringsRef}
					positionX={0}
					positionY={0.5}
					positionZ={0}
				>
					{RING_INDICES.map((i) => (
						<cylinder
							key={`ring-${i}`}
							name={`ring-${i}`}
							options={{
								diameterTop: (4 - i * 0.5) * 2,
								diameterBottom: (4 - i * 0.5) * 2,
								height: 0.1,
								tessellation: 32,
							}}
							positionX={0}
							positionY={i * 0.3}
							positionZ={0}
						>
							<standardMaterial
								name={`ringMat-${i}`}
								diffuseColor={beaconColor}
								emissiveColor={beaconColor}
								alpha={0.5 - i * 0.15}
							/>
						</cylinder>
					))}
				</transformNode>
			)}

			{/* Central beacon */}
			<cylinder
				name="beaconBase"
				options={{ diameterTop: 0.6, diameterBottom: 0.8, height: 0.3, tessellation: 12 }}
				positionX={0}
				positionY={0.1}
				positionZ={0}
			>
				<standardMaterial name="beaconBaseMat" diffuseColor={new Color3(0.133, 0.133, 0.133)} />
			</cylinder>
			<sphere
				name="beaconGlobe"
				options={{ diameter: 0.5, segments: 12 }}
				positionX={0}
				positionY={0.4}
				positionZ={0}
			>
				<standardMaterial
					name="beaconGlobeMat"
					diffuseColor={beaconColor}
					emissiveColor={beaconColor}
					alpha={0.8}
				/>
			</sphere>
			<pointLight
				name="beaconLight"
				ref={beaconRef}
				position={new Vector3(0, 1, 0)}
				diffuse={beaconColor}
				specular={beaconColor}
				intensity={2}
				range={20}
			/>

			{/* Smoke signal */}
			<transformNode name="smokeSignal" ref={smokeRef} positionX={3} positionY={0} positionZ={0}>
				{[0, 1, 2, 3, 4].map((i) => (
					<transformNode
						key={`smokeNode-${i}`}
						name={`smokeNode-${i}`}
						positionX={0}
						positionY={0}
						positionZ={0}
					>
						<sphere
							name={`smokePuff-${i}`}
							options={{ diameter: 1, segments: 8 }}
							positionX={0}
							positionY={0}
							positionZ={0}
						>
							<standardMaterial
								name={`smokeMat-${i}`}
								diffuseColor={isSecured ? new Color3(0.667, 1, 0.667) : new Color3(1, 0.667, 0)}
								alpha={0.3}
							/>
						</sphere>
					</transformNode>
				))}
			</transformNode>

			{/* Secured status indicator */}
			{isSecured && (
				<box
					name="securedIndicator"
					options={{ width: 3, height: 0.6, depth: 0.05 }}
					positionX={0}
					positionY={3}
					positionZ={0}
				>
					<standardMaterial name="securedMat" diffuseColor={new Color3(0, 0, 0)} alpha={0.7} />
				</box>
			)}
		</transformNode>
	);
}
