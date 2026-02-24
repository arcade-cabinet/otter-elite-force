/**
 * Raft Vehicle
 * Tactical riverine transport for navigating fast-moving rapids.
 * Features authentic log construction, rope bindings, and proper propeller
 */

import type { TransformNode } from "@babylonjs/core";
import { Color3 } from "@babylonjs/core";
import { forwardRef, useEffect, useRef } from "react";
import { useScene } from "reactylon";

interface RaftProps {
	position: [number, number, number];
	rotation?: number;
	isPiloted?: boolean;
}

interface LogData {
	x: number;
	diameterTop: number;
	diameterBottom: number;
	length: number;
	color: Color3;
	roughness: number;
	offsetZ: number;
}

const LOG_CONFIGS: LogData[] = [
	{
		x: -0.9,
		diameterTop: 0.4,
		diameterBottom: 0.38,
		length: 3,
		color: new Color3(0.36, 0.25, 0.22),
		roughness: 0.9,
		offsetZ: 0,
	},
	{
		x: -0.45,
		diameterTop: 0.46,
		diameterBottom: 0.44,
		length: 3,
		color: new Color3(0.24, 0.16, 0.12),
		roughness: 0.95,
		offsetZ: 0.05,
	},
	{
		x: 0,
		diameterTop: 0.4,
		diameterBottom: 0.38,
		length: 3.2,
		color: new Color3(0.36, 0.25, 0.22),
		roughness: 0.9,
		offsetZ: 0,
	},
	{
		x: 0.45,
		diameterTop: 0.46,
		diameterBottom: 0.44,
		length: 3,
		color: new Color3(0.24, 0.16, 0.12),
		roughness: 0.95,
		offsetZ: 0.05,
	},
	{
		x: 0.9,
		diameterTop: 0.4,
		diameterBottom: 0.38,
		length: 3,
		color: new Color3(0.36, 0.25, 0.22),
		roughness: 0.9,
		offsetZ: 0,
	},
];

const ROPE_X_OFFSETS = [-0.7, 0, 0.7];
const BLADE_INDICES = [0, 1, 2];

const ropeColor = new Color3(0.55, 0.45, 0.33);
const metalColor = new Color3(0.2, 0.2, 0.2);
const motorGreenColor = new Color3(0.16, 0.29, 0.16);
const darkWoodColor = new Color3(0.24, 0.16, 0.12);
const crateColor = new Color3(0.18, 0.24, 0.1);
const strapColor = new Color3(0.1, 0.1, 0.1);
const markingColor = new Color3(0.07, 0.07, 0.07);
const bladeColor = new Color3(0.27, 0.27, 0.27);
const sprayColor = new Color3(0.53, 0.6, 0.67);
const blackColor = new Color3(0.07, 0.07, 0.07);

export const Raft = forwardRef<TransformNode, RaftProps>(
	({ position, rotation = 0, isPiloted = false }, ref) => {
		const scene = useScene();
		const groupRef = useRef<TransformNode>(null);
		const propellerRef = useRef<TransformNode>(null);

		useEffect(() => {
			if (!scene) return;

			const observer = scene.onBeforeRenderObservable.add(() => {
				if (!groupRef.current) return;
				const t = performance.now() / 1000;

				// Realistic water bobbing
				groupRef.current.position.y = Math.sin(t * 1.8) * 0.06 + Math.sin(t * 2.5) * 0.03 + 0.1;
				groupRef.current.rotation.z = Math.sin(t * 1.4) * 0.025;
				groupRef.current.rotation.x = Math.cos(t * 1.1) * 0.02;

				// Animate propeller when piloted
				if (isPiloted && propellerRef.current) {
					propellerRef.current.rotation.z = t * 25;
				}
			});

			return () => {
				scene.onBeforeRenderObservable.remove(observer);
			};
		}, [scene, isPiloted]);

		return (
			<transformNode
				name="raft"
				ref={ref}
				positionX={position[0]}
				positionY={position[1]}
				positionZ={position[2]}
				rotationY={rotation}
			>
				<transformNode name="raftBody" ref={groupRef}>
					{/* === MAIN LOG DECK === */}
					{LOG_CONFIGS.map((log, i) => (
						<cylinder
							key={`log-${i}`}
							name={`log-${i}`}
							options={{
								diameterTop: log.diameterTop,
								diameterBottom: log.diameterBottom,
								height: log.length,
								tessellation: 12,
							}}
							positionX={log.x}
							positionY={0}
							positionZ={log.offsetZ}
							rotationX={Math.PI / 2}
						>
							<standardMaterial name={`logMat-${i}`} diffuseColor={log.color} />
						</cylinder>
					))}

					{/* === ROPE BINDINGS === */}
					{/* Front binding */}
					<transformNode name="ropeFrontGroup" positionX={0} positionY={0.15} positionZ={1.1}>
						{ROPE_X_OFFSETS.map((x, i) => (
							<cylinder
								key={`rope-front-${i}`}
								name={`rope-front-${i}`}
								options={{ diameterTop: 0.06, diameterBottom: 0.06, height: 0.5, tessellation: 12 }}
								positionX={x}
								positionY={0}
								positionZ={0}
								rotationZ={Math.PI / 2}
							>
								<standardMaterial name={`ropeFrontMat-${i}`} diffuseColor={ropeColor} />
							</cylinder>
						))}
					</transformNode>
					{/* Rear binding */}
					<transformNode name="ropeRearGroup" positionX={0} positionY={0.15} positionZ={-1.1}>
						{ROPE_X_OFFSETS.map((x, i) => (
							<cylinder
								key={`rope-rear-${i}`}
								name={`rope-rear-${i}`}
								options={{ diameterTop: 0.06, diameterBottom: 0.06, height: 0.5, tessellation: 12 }}
								positionX={x}
								positionY={0}
								positionZ={0}
								rotationZ={Math.PI / 2}
							>
								<standardMaterial name={`ropeRearMat-${i}`} diffuseColor={ropeColor} />
							</cylinder>
						))}
					</transformNode>
					{/* Cross rope */}
					<cylinder
						name="crossRope"
						options={{ diameterTop: 0.04, diameterBottom: 0.04, height: 2.2, tessellation: 6 }}
						positionX={0}
						positionY={0.2}
						positionZ={0}
						rotationX={Math.PI / 2}
					>
						<standardMaterial name="crossRopeMat" diffuseColor={ropeColor} />
					</cylinder>

					{/* === TACTICAL CARGO === */}
					{/* Ammo crate */}
					<transformNode name="crateGroup" positionX={0} positionY={0.45} positionZ={-0.6}>
						<box name="crate" options={{ width: 0.7, height: 0.5, depth: 0.5 }}>
							<standardMaterial name="crateMat" diffuseColor={crateColor} />
						</box>
						{/* Crate strap */}
						<box
							name="crateStrap"
							options={{ width: 0.75, height: 0.02, depth: 0.1 }}
							positionX={0}
							positionY={0.26}
							positionZ={0}
						>
							<standardMaterial name="strapMat" diffuseColor={strapColor} />
						</box>
						{/* Stencil marking */}
						<box
							name="crateMarking"
							options={{ width: 0.3, height: 0.2, depth: 0.02 }}
							positionX={0}
							positionY={0}
							positionZ={0.26}
						>
							<standardMaterial
								name="markingMat"
								emissiveColor={markingColor}
								diffuseColor={markingColor}
							/>
						</box>
					</transformNode>

					{/* === OUTBOARD MOTOR === */}
					<transformNode name="motorGroup" positionX={0} positionY={0.1} positionZ={-1.6}>
						{/* Motor housing */}
						<box
							name="motorHousing"
							options={{ width: 0.25, height: 0.5, depth: 0.25 }}
							positionX={0}
							positionY={0.2}
							positionZ={0}
						>
							<standardMaterial name="metalMat" diffuseColor={metalColor} />
						</box>
						{/* Motor cowling */}
						<cylinder
							name="motorCowling"
							options={{ diameterTop: 0.24, diameterBottom: 0.3, height: 0.15, tessellation: 8 }}
							positionX={0}
							positionY={0.5}
							positionZ={0}
						>
							<standardMaterial name="cowlingMat" diffuseColor={motorGreenColor} />
						</cylinder>
						{/* Drive shaft */}
						<cylinder
							name="driveShaft"
							options={{ diameterTop: 0.08, diameterBottom: 0.08, height: 0.6, tessellation: 8 }}
							positionX={0}
							positionY={-0.3}
							positionZ={0}
						>
							<standardMaterial name="shaftMat" diffuseColor={metalColor} />
						</cylinder>

						{/* === PROPELLER - 3-blade === */}
						<transformNode
							name="propeller"
							ref={propellerRef}
							positionX={0}
							positionY={-0.55}
							positionZ={0}
						>
							{/* Hub */}
							<sphere name="propHub" options={{ diameter: 0.12, segments: 8 }}>
								<standardMaterial name="hubMat" diffuseColor={metalColor} />
							</sphere>
							{/* Three angled blades */}
							{BLADE_INDICES.map((i) => (
								<transformNode
									key={`blade-${i}`}
									name={`bladeGroup-${i}`}
									rotationZ={(i * Math.PI * 2) / 3}
								>
									<box
										name={`blade-${i}`}
										options={{ width: 0.25, height: 0.02, depth: 0.08 }}
										positionX={0.18}
										positionY={0}
										positionZ={0}
										rotationX={0.1}
										rotationY={0.3}
									>
										<standardMaterial name={`bladeMat-${i}`} diffuseColor={bladeColor} />
									</box>
								</transformNode>
							))}
						</transformNode>

						{/* Tiller handle */}
						<cylinder
							name="tillerHandle"
							options={{ diameterTop: 0.06, diameterBottom: 0.06, height: 0.5, tessellation: 6 }}
							positionX={0.3}
							positionY={0.3}
							positionZ={0}
							rotationZ={-0.5}
						>
							<standardMaterial name="tillerMat" diffuseColor={darkWoodColor} />
						</cylinder>
						{/* Grip */}
						<cylinder
							name="tillerGrip"
							options={{ diameterTop: 0.08, diameterBottom: 0.08, height: 0.12, tessellation: 8 }}
							positionX={0.5}
							positionY={0.15}
							positionZ={0}
							rotationZ={-0.5}
						>
							<standardMaterial name="gripMat" diffuseColor={blackColor} />
						</cylinder>
					</transformNode>

					{/* Water spray effect when piloted */}
					{isPiloted && (
						<sphere
							name="waterSpray"
							options={{ diameter: 0.3, segments: 8 }}
							positionX={0}
							positionY={-0.1}
							positionZ={-1.8}
						>
							<standardMaterial name="sprayMat" diffuseColor={sprayColor} alpha={0.3} />
						</sphere>
					)}
				</transformNode>
			</transformNode>
		);
	},
);

Raft.displayName = "Raft";
