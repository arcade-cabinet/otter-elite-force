/**
 * Snapper Bunker
 * Stationary, heavily armored turtles with mounted heavy weapons
 */

import { Color3, Vector3 } from "@babylonjs/core";
import { useEffect, useRef, useState } from "react";
import { useScene } from "reactylon";
import type { EnemyProps, SnapperData } from "./types";

export function Snapper({ data, targetPosition, onDeath }: EnemyProps<SnapperData>) {
	const scene = useScene();
	const [isFiring, setIsFiring] = useState(false);
	const lastTimeRef = useRef<number | null>(null);

	// Death callback
	useEffect(() => {
		if (data.hp <= 0 && onDeath) {
			onDeath(data.id);
		}
	}, [data.hp, data.id, onDeath]);

	// Firing logic via observable
	useEffect(() => {
		if (!scene) return;

		const obs = scene.onBeforeRenderObservable.add(() => {
			const now = performance.now() / 1000;
			if (lastTimeRef.current === null) {
				lastTimeRef.current = now;
				return;
			}
			lastTimeRef.current = now;

			const dx = data.position.x - targetPosition.x;
			const dz = data.position.z - targetPosition.z;
			const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);

			if (distanceToPlayer < 25 && data.suppression <= 0.7) {
				setIsFiring(Math.sin(now * 10) > 0.8);
			} else {
				setIsFiring(false);
			}
		});

		return () => {
			scene.onBeforeRenderObservable.remove(obs);
		};
	}, [scene, data.position.x, data.position.z, data.suppression, targetPosition]);

	const shellColor = new Color3(0.239, 0.2, 0.161);
	const bodyColor = new Color3(0.176, 0.239, 0.098);
	const darkMetal = new Color3(0.067, 0.067, 0.067);
	const muzzleColor = new Color3(1.0, 0.667, 0.0);

	// Turret facing angle toward target
	const dx = targetPosition.x - data.position.x;
	const dz = targetPosition.z - data.position.z;
	const turretAngle = Math.atan2(dx, dz);

	return (
		<transformNode
			name={`snapper-${data.id}`}
			position={new Vector3(data.position.x, 0.2, data.position.z)}
		>
			{/* Dome shell - upper hemisphere approximated as sphere with offset */}
			<sphere name={`shell-${data.id}`} options={{ diameter: 3, segments: 20 }} positionY={0}>
				<standardMaterial name={`shellMat-${data.id}`} diffuseColor={shellColor} />
			</sphere>

			{/* Rim spikes around shell */}
			{Array.from({ length: 8 }, (_, i) => {
				const angle = (i / 8) * Math.PI * 2;
				return (
					<sphere
						key={`spike-${data.id}-${i}`}
						name={`spike-${data.id}-${i}`}
						options={{ diameter: 0.4, segments: 10 }}
						positionX={Math.cos(angle) * 1.2}
						positionY={0.5}
						positionZ={Math.sin(angle) * 1.2}
					>
						<standardMaterial name={`spikeMat-${data.id}-${i}`} diffuseColor={shellColor} />
					</sphere>
				);
			})}

			{/* Turret mount */}
			<transformNode name={`turret-${data.id}`} positionY={0.8} rotationY={turretAngle}>
				{/* Turret body */}
				<cylinder
					name={`turretBody-${data.id}`}
					options={{ diameterTop: 0.4, diameterBottom: 0.4, height: 0.8, tessellation: 12 }}
				>
					<standardMaterial name={`turretBodyMat-${data.id}`} diffuseColor={darkMetal} />
				</cylinder>
				{/* Barrel */}
				<cylinder
					name={`barrel-${data.id}`}
					options={{ diameterTop: 0.2, diameterBottom: 0.2, height: 1.5, tessellation: 16 }}
					positionZ={0.8}
					rotationX={Math.PI / 2}
				>
					<standardMaterial
						name={`barrelMat-${data.id}`}
						diffuseColor={new Color3(0.133, 0.133, 0.133)}
					/>
				</cylinder>

				{/* Muzzle flash when firing */}
				{isFiring && (
					<>
						<sphere
							name={`flash-${data.id}`}
							options={{ diameter: 0.6, segments: 12 }}
							positionZ={1.6}
						>
							<standardMaterial
								name={`flashMat-${data.id}`}
								diffuseColor={muzzleColor}
								emissiveColor={muzzleColor}
								alpha={0.8}
							/>
						</sphere>
						<pointLight
							name={`muzzleLight-${data.id}`}
							position={new Vector3(0, 0, 1.6)}
							intensity={2}
							diffuse={muzzleColor}
						/>
					</>
				)}
			</transformNode>

			{/* Head/Neck peeking out front */}
			<sphere
				name={`head-${data.id}`}
				options={{ diameter: 0.8, segments: 12 }}
				positionY={0.3}
				positionZ={1.4}
			>
				<standardMaterial name={`headMat-${data.id}`} diffuseColor={bodyColor} />
			</sphere>

			{/* Health bar background */}
			<box
				name={`hpBg-${data.id}`}
				options={{ width: 2.0, height: 0.1, depth: 0.01 }}
				positionY={2.5}
			>
				<standardMaterial
					name={`hpBgMat-${data.id}`}
					diffuseColor={new Color3(0, 0, 0)}
					alpha={0.5}
				/>
			</box>
			{/* Health bar fill */}
			<box
				name={`hpFill-${data.id}`}
				options={{ width: 2.0 * (data.hp / data.maxHp), height: 0.1, depth: 0.011 }}
				positionY={2.5}
				positionX={-(1 - data.hp / data.maxHp) * 1.0}
			>
				<standardMaterial
					name={`hpFillMat-${data.id}`}
					diffuseColor={new Color3(1.0, 1.0, 0.0)}
					emissiveColor={new Color3(0.5, 0.5, 0)}
				/>
			</box>
		</transformNode>
	);
}
