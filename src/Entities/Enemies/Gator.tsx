/**
 * Gator Predator
 * Gritty biological crocodilians with mud camo and ambush mechanics
 */

import { Color3, Vector3 } from "@babylonjs/core";
import { useEffect, useRef, useState } from "react";
import { useScene } from "reactylon";
import { lerp } from "../../utils/math";
import type { EnemyProps, GatorData } from "./types";

const AMBUSH_TRIGGER_DISTANCE = 15;
const AMBUSH_DURATION_S = 3;
const AMBUSH_COOLDOWN_MIN_S = 5;
const AMBUSH_COOLDOWN_RANDOM_S = 5;

export function Gator({ data, targetPosition, onDeath }: EnemyProps<GatorData>) {
	const scene = useScene();

	// Ambush state
	const [isAmbushing, setIsAmbushing] = useState(false);
	const ambushCooldown = useRef(0);
	const ambushTimer = useRef(0);

	// Refs for animated values
	const positionRef = useRef({ x: data.position.x, y: 0, z: data.position.z });
	const rotationYRef = useRef(0);
	const bodyYRef = useRef(0.15);
	const bodyRotXRef = useRef(0);
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

			const baseSpeed = data.isHeavy ? 4 : 7;

			const dx = positionRef.current.x - targetPosition.x;
			const dz = positionRef.current.z - targetPosition.z;
			const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);

			// Ambush cooldown
			ambushCooldown.current -= delta;

			if (
				!isAmbushing &&
				distanceToPlayer < AMBUSH_TRIGGER_DISTANCE &&
				ambushCooldown.current <= 0
			) {
				setIsAmbushing(true);
				ambushCooldown.current = AMBUSH_COOLDOWN_MIN_S + Math.random() * AMBUSH_COOLDOWN_RANDOM_S;
				ambushTimer.current = AMBUSH_DURATION_S;
			}

			if (isAmbushing) {
				ambushTimer.current -= delta;
				if (ambushTimer.current <= 0) {
					setIsAmbushing(false);
				}
			}

			// Target Y and speed based on state
			let targetY = 0.15;
			let targetSpeed = baseSpeed;

			if (isAmbushing) {
				targetY = 0.8;
				targetSpeed = 0;
			}

			if (data.suppression > 0.1) {
				targetY = -0.2;
				targetSpeed = baseSpeed * (1 - data.suppression * 0.5);
				if (isAmbushing) targetSpeed = 0;
			}

			// Move toward target
			if (!isAmbushing && targetSpeed > 0) {
				const dist = Math.max(distanceToPlayer, 0.001);
				const moveDist = Math.min(targetSpeed * delta, dist);
				positionRef.current.x += (-dx / dist) * moveDist;
				positionRef.current.z += (-dz / dist) * moveDist;
			}

			// Smooth body Y and rotation
			bodyYRef.current = lerp(bodyYRef.current, targetY, 0.1);
			bodyRotXRef.current = lerp(bodyRotXRef.current, isAmbushing ? -0.4 : 0, 0.1);

			// Facing direction
			if (isAmbushing) {
				const ldx = targetPosition.x - positionRef.current.x;
				const ldz = targetPosition.z - positionRef.current.z;
				const targetAngle = Math.atan2(ldx, ldz);
				rotationYRef.current = lerp(rotationYRef.current, targetAngle, 0.1);
			} else if (targetSpeed > 0 && distanceToPlayer > 0.1) {
				const angle = Math.atan2(-dx, -dz);
				rotationYRef.current = angle;
			}
		});

		return () => {
			scene.onBeforeRenderObservable.remove(obs);
		};
	}, [scene, data.isHeavy, data.suppression, isAmbushing, targetPosition]);

	// Death callback
	useEffect(() => {
		if (data.hp <= 0 && onDeath) {
			onDeath(data.id);
		}
	}, [data.hp, data.id, onDeath]);

	const scale = data.isHeavy ? 1.6 : 1.1;
	const bodyColor = new Color3(
		data.isHeavy ? 0.1 : 0.176,
		data.isHeavy ? 0.141 : 0.239,
		data.isHeavy ? 0.1 : 0.176,
	);
	const darkColor = new Color3(0.067, 0.067, 0.067);
	const strapColor = new Color3(0.1, 0.1, 0.1);
	const eyeColor = new Color3(1.0, 0.667, 0.0);
	const armorColor = new Color3(0.2, 0.2, 0.2);

	return (
		<transformNode
			name={`gator-${data.id}`}
			position={new Vector3(data.position.x, 0, data.position.z)}
		>
			{/* Body group */}
			<transformNode name={`gator-body-${data.id}`} positionY={0.15}>
				{/* Head */}
				<transformNode
					name={`gator-head-${data.id}`}
					positionY={0.15 * scale}
					positionZ={1.2 * scale}
				>
					<sphere name={`skull-${data.id}`} options={{ diameter: 0.7 * scale, segments: 16 }}>
						<standardMaterial name={`skullMat-${data.id}`} diffuseColor={bodyColor} />
					</sphere>
					<cylinder
						name={`snout-${data.id}`}
						options={{
							diameterTop: 0.5 * scale,
							diameterBottom: 0.5 * scale,
							height: 0.6 * scale,
							tessellation: 12,
						}}
						positionY={-0.05 * scale}
						positionZ={0.4 * scale}
					>
						<standardMaterial name={`snoutMat-${data.id}`} diffuseColor={bodyColor} />
					</cylinder>
					{/* Eyes */}
					<sphere
						name={`eye-l-${data.id}`}
						options={{ diameter: 0.12 * scale, segments: 10 }}
						positionX={-0.18 * scale}
						positionY={0.22 * scale}
						positionZ={0.1 * scale}
					>
						<standardMaterial name={`eyeLMat-${data.id}`} emissiveColor={eyeColor} />
					</sphere>
					<sphere
						name={`eye-r-${data.id}`}
						options={{ diameter: 0.12 * scale, segments: 10 }}
						positionX={0.18 * scale}
						positionY={0.22 * scale}
						positionZ={0.1 * scale}
					>
						<standardMaterial name={`eyeRMat-${data.id}`} emissiveColor={eyeColor} />
					</sphere>
					{/* Armor plate */}
					<cylinder
						name={`headArmor-${data.id}`}
						options={{
							diameterTop: 0.6 * scale,
							diameterBottom: 0.7 * scale,
							height: 0.1 * scale,
							tessellation: 16,
						}}
						positionY={0.22 * scale}
					>
						<standardMaterial name={`headArmorMat-${data.id}`} diffuseColor={armorColor} />
					</cylinder>
				</transformNode>

				{/* Body Segments */}
				{[...Array(5)].map((_, i) => (
					<transformNode
						key={`seg-${data.id}-${i}`}
						name={`segment-${i + 1}-${data.id}`}
						positionY={0.15 * scale}
						positionZ={(0.4 - i * 0.75) * scale}
					>
						<sphere
							name={`segBody-${data.id}-${i}`}
							options={{ diameter: (0.9 - i * 0.1) * scale, segments: 16 }}
						>
							<standardMaterial name={`segMat-${data.id}-${i}`} diffuseColor={bodyColor} />
						</sphere>
						{/* Back scutes */}
						<box
							name={`scute-${data.id}-${i}`}
							options={{ width: (0.2 - i * 0.02) * scale, height: 0.1 * scale, depth: 0.4 * scale }}
							positionY={(0.35 - i * 0.05) * scale}
						>
							<standardMaterial name={`scuteMat-${data.id}-${i}`} diffuseColor={darkColor} />
						</box>
						{/* Gear straps - represented as thin box ring */}
						<box
							name={`strap-${data.id}-${i}`}
							options={{
								width: (0.97 - i * 0.1) * scale,
								height: 0.05 * scale,
								depth: 0.05 * scale,
							}}
						>
							<standardMaterial name={`strapMat-${data.id}-${i}`} diffuseColor={strapColor} />
						</box>
					</transformNode>
				))}

				{/* Tail */}
				<transformNode name={`tail-${data.id}`} positionY={0.1 * scale} positionZ={-3.2 * scale}>
					<cylinder
						name={`tailMesh-${data.id}`}
						options={{
							diameterTop: 0.1 * scale,
							diameterBottom: 0.3 * scale,
							height: 2 * scale,
							tessellation: 8,
						}}
					>
						<standardMaterial name={`tailMat-${data.id}`} diffuseColor={bodyColor} />
					</cylinder>
				</transformNode>

				{/* Front-left leg */}
				<cylinder
					name={`leg-fl-${data.id}`}
					options={{
						diameterTop: 0.24 * scale,
						diameterBottom: 0.24 * scale,
						height: 0.3 * scale,
						tessellation: 8,
					}}
					positionX={-0.4 * scale}
					positionZ={0.8 * scale}
					rotationZ={-0.5}
				>
					<standardMaterial name={`legFLMat-${data.id}`} diffuseColor={bodyColor} />
				</cylinder>
				{/* Front-right leg */}
				<cylinder
					name={`leg-fr-${data.id}`}
					options={{
						diameterTop: 0.24 * scale,
						diameterBottom: 0.24 * scale,
						height: 0.3 * scale,
						tessellation: 8,
					}}
					positionX={0.4 * scale}
					positionZ={0.8 * scale}
					rotationZ={0.5}
				>
					<standardMaterial name={`legFRMat-${data.id}`} diffuseColor={bodyColor} />
				</cylinder>
				{/* Back-left leg */}
				<cylinder
					name={`leg-bl-${data.id}`}
					options={{
						diameterTop: 0.24 * scale,
						diameterBottom: 0.24 * scale,
						height: 0.3 * scale,
						tessellation: 8,
					}}
					positionX={-0.4 * scale}
					positionZ={-1.0 * scale}
					rotationZ={-0.5}
				>
					<standardMaterial name={`legBLMat-${data.id}`} diffuseColor={bodyColor} />
				</cylinder>
				{/* Back-right leg */}
				<cylinder
					name={`leg-br-${data.id}`}
					options={{
						diameterTop: 0.24 * scale,
						diameterBottom: 0.24 * scale,
						height: 0.3 * scale,
						tessellation: 8,
					}}
					positionX={0.4 * scale}
					positionZ={-1.0 * scale}
					rotationZ={0.5}
				>
					<standardMaterial name={`legBRMat-${data.id}`} diffuseColor={bodyColor} />
				</cylinder>
			</transformNode>

			{/* Health bar background */}
			<box
				name={`hpBg-${data.id}`}
				options={{ width: 1.4, height: 0.08, depth: 0.01 }}
				positionY={2 * scale}
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
				options={{ width: 1.4 * (data.hp / data.maxHp), height: 0.08, depth: 0.011 }}
				positionY={2 * scale}
				positionX={-(1 - data.hp / data.maxHp) * 0.7}
			>
				<standardMaterial
					name={`hpFillMat-${data.id}`}
					diffuseColor={new Color3(1, 0.267, 0)}
					emissiveColor={new Color3(0.5, 0.1, 0)}
				/>
			</box>
		</transformNode>
	);
}
