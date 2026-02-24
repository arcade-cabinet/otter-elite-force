/**
 * Raft Vehicle
 * Tactical riverine transport for navigating fast-moving rapids.
 * Features authentic log construction, rope bindings, and proper propeller
 */

import type { TransformNode } from "@babylonjs/core";
import { forwardRef, useEffect, useRef } from "react";
import { useScene } from "reactylon";

interface RaftProps {
	position: [number, number, number];
	rotation?: number;
	isPiloted?: boolean;
}

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

				// Realistic water bobbing - slight delay between roll and pitch
				groupRef.current.position.y = Math.sin(t * 1.8) * 0.06 + Math.sin(t * 2.5) * 0.03 + 0.1;
				groupRef.current.rotation.z = Math.sin(t * 1.4) * 0.025;
				groupRef.current.rotation.x = Math.cos(t * 1.1) * 0.02;

				// Animate propeller when piloted - realistic multi-blade spin
				if (isPiloted && propellerRef.current) {
					propellerRef.current.rotation.z = t * 25;
				}
			});

			return () => {
				scene.onBeforeRenderObservable.remove(observer);
			};
		}, [scene, isPiloted]);

		return (
			<transformNode name="raft" ref={ref} position={position} rotation={[0, rotation, 0]}>
				<transformNode name="raftBody" ref={groupRef}>
					{/* === MAIN LOG DECK === */}
					{/* Logs with slight variation for authenticity */}
					{[-0.9, -0.45, 0, 0.45, 0.9].map((x, i) => {
						const radiusVariation = 0.2 + (i % 2) * 0.03;
						const lengthVariation = 3 + (i === 2 ? 0.2 : 0);
						const color = i % 2 === 0 ? [0.36, 0.25, 0.22] : [0.24, 0.16, 0.12];
						const roughness = i % 2 === 0 ? 0.9 : 0.95;
						return (
							<cylinder
								key={`log-${i}`}
								name={`log-${i}`}
								diameterTop={radiusVariation * 2}
								diameterBottom={radiusVariation * 0.95 * 2}
								height={lengthVariation}
								tessellation={12}
								position={[x, 0, (i % 2) * 0.05]}
								rotation={[Math.PI / 2, 0, 0]}
							>
								<standardMaterial name={`logMat-${i}`} diffuseColor={color} roughness={roughness} />
							</cylinder>
						);
					})}

					{/* === ROPE BINDINGS === */}
					{/* Front binding */}
					<transformNode name="ropeFrontGroup" position={[0, 0.15, 1.1]}>
						{[-0.7, 0, 0.7].map((x, i) => (
							<torus
								key={`rope-front-${i}`}
								name={`rope-front-${i}`}
								diameter={0.5}
								thickness={0.03}
								tessellation={12}
								position={[x, 0, 0]}
								rotation={[0, 0, Math.PI / 2]}
							>
								<standardMaterial
									name={`ropeMat-front-${i}`}
									diffuseColor={[0.55, 0.45, 0.33]}
									roughness={1.0}
								/>
							</torus>
						))}
					</transformNode>
					{/* Rear binding */}
					<transformNode name="ropeRearGroup" position={[0, 0.15, -1.1]}>
						{[-0.7, 0, 0.7].map((x, i) => (
							<torus
								key={`rope-rear-${i}`}
								name={`rope-rear-${i}`}
								diameter={0.5}
								thickness={0.03}
								tessellation={12}
								position={[x, 0, 0]}
								rotation={[0, 0, Math.PI / 2]}
							>
								<standardMaterial
									name={`ropeMat-rear-${i}`}
									diffuseColor={[0.55, 0.45, 0.33]}
									roughness={1.0}
								/>
							</torus>
						))}
					</transformNode>
					{/* Cross rope pattern */}
					<cylinder
						name="crossRope"
						diameterTop={0.04}
						diameterBottom={0.04}
						height={2.2}
						tessellation={6}
						position={[0, 0.2, 0]}
						rotation={[Math.PI / 2, 0, 0]}
					>
						<standardMaterial
							name="crossRopeMat"
							diffuseColor={[0.55, 0.45, 0.33]}
							roughness={1.0}
						/>
					</cylinder>

					{/* === TACTICAL CARGO === */}
					{/* Ammo crate */}
					<transformNode name="crateGroup" position={[0, 0.45, -0.6]}>
						<box name="crate" width={0.7} height={0.5} depth={0.5}>
							<standardMaterial name="crateMat" diffuseColor={[0.18, 0.24, 0.1]} roughness={0.8} />
						</box>
						{/* Crate straps */}
						<box name="crateStrap" width={0.75} height={0.02} depth={0.1} position={[0, 0.26, 0]}>
							<standardMaterial name="strapMat" diffuseColor={[0.1, 0.1, 0.1]} />
						</box>
						{/* Stenciled marking */}
						<plane name="crateMarking" width={0.3} height={0.2} position={[0, 0, 0.26]}>
							<standardMaterial name="markingMat" emissiveColor={[0.07, 0.07, 0.07]} />
						</plane>
					</transformNode>

					{/* === OUTBOARD MOTOR === */}
					<transformNode name="motorGroup" position={[0, 0.1, -1.6]}>
						{/* Motor housing */}
						<box name="motorHousing" width={0.25} height={0.5} depth={0.25} position={[0, 0.2, 0]}>
							<standardMaterial
								name="metalMat"
								diffuseColor={[0.2, 0.2, 0.2]}
								metallic={0.7}
								roughness={0.4}
							/>
						</box>
						{/* Motor cowling */}
						<cylinder
							name="motorCowling"
							diameterTop={0.24}
							diameterBottom={0.3}
							height={0.15}
							tessellation={8}
							position={[0, 0.5, 0]}
						>
							<standardMaterial
								name="cowlingMat"
								diffuseColor={[0.16, 0.29, 0.16]}
								roughness={0.7}
							/>
						</cylinder>
						{/* Drive shaft */}
						<cylinder
							name="driveShaft"
							diameterTop={0.08}
							diameterBottom={0.08}
							height={0.6}
							tessellation={8}
							position={[0, -0.3, 0]}
						>
							<standardMaterial
								name="shaftMat"
								diffuseColor={[0.2, 0.2, 0.2]}
								metallic={0.7}
								roughness={0.4}
							/>
						</cylinder>

						{/* === PROPELLER - Realistic 3-blade === */}
						<transformNode name="propeller" ref={propellerRef} position={[0, -0.55, 0]}>
							{/* Hub */}
							<sphere name="propHub" diameter={0.12} segments={8}>
								<standardMaterial
									name="hubMat"
									diffuseColor={[0.2, 0.2, 0.2]}
									metallic={0.7}
									roughness={0.4}
								/>
							</sphere>
							{/* Three angled blades */}
							{[0, 1, 2].map((i) => (
								<transformNode
									key={`blade-${i}`}
									name={`bladeGroup-${i}`}
									rotation={[0, 0, (i * Math.PI * 2) / 3]}
								>
									<box
										name={`blade-${i}`}
										width={0.25}
										height={0.02}
										depth={0.08}
										position={[0.18, 0, 0]}
										rotation={[0.1, 0.3, 0]}
									>
										<standardMaterial
											name={`bladeMat-${i}`}
											diffuseColor={[0.27, 0.27, 0.27]}
											metallic={0.8}
											roughness={0.3}
										/>
									</box>
								</transformNode>
							))}
						</transformNode>

						{/* Tiller handle */}
						<cylinder
							name="tillerHandle"
							diameterTop={0.06}
							diameterBottom={0.06}
							height={0.5}
							tessellation={6}
							position={[0.3, 0.3, 0]}
							rotation={[0, 0, -0.5]}
						>
							<standardMaterial
								name="tillerMat"
								diffuseColor={[0.24, 0.16, 0.12]}
								roughness={0.95}
							/>
						</cylinder>
						{/* Grip */}
						<cylinder
							name="tillerGrip"
							diameterTop={0.08}
							diameterBottom={0.08}
							height={0.12}
							tessellation={8}
							position={[0.5, 0.15, 0]}
							rotation={[0, 0, -0.5]}
						>
							<standardMaterial name="gripMat" diffuseColor={[0.07, 0.07, 0.07]} roughness={0.9} />
						</cylinder>
					</transformNode>

					{/* Water spray effect when piloted */}
					{isPiloted && (
						<sphere name="waterSpray" diameter={0.3} segments={8} position={[0, -0.1, -1.8]}>
							<standardMaterial name="sprayMat" diffuseColor={[0.53, 0.6, 0.67]} alpha={0.3} />
						</sphere>
					)}
				</transformNode>
			</transformNode>
		);
	},
);

Raft.displayName = "Raft";
