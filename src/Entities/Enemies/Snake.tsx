/**
 * Snake Predator
 * Tree-dwelling ambushers that hang from mangroves and strike from above
 */

import { Color3, Vector3 } from "@babylonjs/core";
import { useEffect, useRef, useState } from "react";
import { useScene } from "reactylon";
import { randomRange } from "../../utils/math";
import type { EnemyProps, SnakeData } from "./types";

const SEGMENT_COUNT = 12;

export function Snake({ data, targetPosition, onDeath }: EnemyProps<SnakeData>) {
	const scene = useScene();

	const [isStriking, setIsStriking] = useState(false);
	const strikeTimer = useRef(0);
	// initialY is stable for the lifetime of this component
	const initialY = useRef(data.position.y + randomRange(4, 7)).current;

	// Mutable segment positions for animation (not React state to avoid re-renders)
	const segPositions = useRef<{ x: number; y: number; z: number }[]>(
		Array.from({ length: SEGMENT_COUNT }, (_, i) => ({
			x: 0,
			y: initialY - i * 0.4,
			z: 0,
		})),
	);
	const lastTimeRef = useRef<number | null>(null);

	// Animation loop
	useEffect(() => {
		if (!scene) return;

		const obs = scene.onBeforeRenderObservable.add(() => {
			const now = performance.now() / 1000;
			if (lastTimeRef.current === null) {
				lastTimeRef.current = now;
				return;
			}
			const delta = now - lastTimeRef.current;
			lastTimeRef.current = now;

			const dx = data.position.x - targetPosition.x;
			const dz = data.position.z - targetPosition.z;
			const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);

			if (distanceToPlayer < 8 && strikeTimer.current <= 0) {
				setIsStriking(true);
				strikeTimer.current = 4;
			}

			if (strikeTimer.current > 0) {
				strikeTimer.current -= delta;
				if (strikeTimer.current < 2) setIsStriking(false);
			}

			// Suppression prevents striking
			if (data.suppression > 0.5) {
				setIsStriking(false);
			}

			const t = now;
			const swayX = Math.sin(t * 0.5) * 0.2;
			const swayZ = Math.cos(t * 0.7) * 0.2;

			for (let i = 0; i < SEGMENT_COUNT; i++) {
				const targetSegY = isStriking ? initialY - i * 0.8 : initialY - i * 0.35;
				const seg = segPositions.current[i];
				seg.y = seg.y + (targetSegY - seg.y) * 0.1;
				seg.x = swayX * (i * 0.5);
				seg.z = swayZ * (i * 0.5);
			}
		});

		return () => {
			scene.onBeforeRenderObservable.remove(obs);
		};
	}, [
		scene,
		data.position.x,
		data.position.z,
		data.suppression,
		isStriking,
		targetPosition,
		initialY,
	]);

	// Death callback
	useEffect(() => {
		if (data.hp <= 0 && onDeath) {
			onDeath(data.id);
		}
	}, [data.hp, data.id, onDeath]);

	const bodyColor = new Color3(0.102, 0.2, 0.102);
	const patternColor = new Color3(0.239, 0.302, 0.161);
	const eyeColor = new Color3(1.0, 0.667, 0.0);
	const anchorColor = new Color3(0.2, 0.133, 0.067);
	const fangColor = new Color3(0.933, 0.933, 0.933);

	return (
		<transformNode
			name={`snake-${data.id}`}
			position={new Vector3(data.position.x, 0, data.position.z)}
		>
			{/* Anchor point (branch attachment) */}
			<box
				name={`anchor-${data.id}`}
				options={{ width: 0.2, height: 0.2, depth: 0.2 }}
				positionY={initialY + 0.5}
			>
				<standardMaterial name={`anchorMat-${data.id}`} diffuseColor={anchorColor} />
			</box>

			{/* Snake body segments - static positions from initial state */}
			{Array.from({ length: SEGMENT_COUNT }, (_, i) => {
				const diameter = Math.max(0.04, 0.3 - i * 0.01);
				const color = i % 2 === 0 ? bodyColor : patternColor;
				const segY = initialY - i * 0.4;
				const isHead = i === SEGMENT_COUNT - 1;

				return (
					<transformNode
						key={`snakeSeg-${data.id}-${i}`}
						name={`snakeSeg-${data.id}-${i}`}
						positionY={segY}
					>
						<sphere name={`segMesh-${data.id}-${i}`} options={{ diameter, segments: 12 }}>
							<standardMaterial name={`segMat-${data.id}-${i}`} diffuseColor={color} />
						</sphere>

						{isHead && (
							<>
								{/* Eyes */}
								<sphere
									name={`eye-l-${data.id}`}
									options={{ diameter: 0.04, segments: 8 }}
									positionX={-0.08}
									positionY={0.05}
									positionZ={0.1}
								>
									<standardMaterial name={`eyeLMat-${data.id}`} emissiveColor={eyeColor} />
								</sphere>
								<sphere
									name={`eye-r-${data.id}`}
									options={{ diameter: 0.04, segments: 8 }}
									positionX={0.08}
									positionY={0.05}
									positionZ={0.1}
								>
									<standardMaterial name={`eyeRMat-${data.id}`} emissiveColor={eyeColor} />
								</sphere>
								{/* Fang / jaw */}
								<sphere
									name={`fang-${data.id}`}
									options={{ diameter: 0.16, segments: 12 }}
									positionY={-0.05}
									positionZ={0.12}
								>
									<standardMaterial name={`fangMat-${data.id}`} diffuseColor={fangColor} />
								</sphere>
							</>
						)}
					</transformNode>
				);
			})}
		</transformNode>
	);
}
