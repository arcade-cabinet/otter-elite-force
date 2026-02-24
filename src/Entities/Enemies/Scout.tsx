/**
 * Scout Predator
 * Light, fast reconnaissance lizard that signals heavy units when spotting players
 * Vietnam-era aesthetic: radio-equipped, darting movements, creates "alert" state
 */

import { Color3, Vector3 } from "@babylonjs/core";
import { useEffect, useRef, useState } from "react";
import { useScene } from "reactylon";
import type { EnemyProps, ScoutData } from "./types";

/**
 * Behavior tuning constants for Scout predators.
 *
 * All distances are in world units.
 * Time values are in seconds of simulation time.
 *
 * - DETECTION_RANGE: How far ahead the Scout can "see" the player to trigger
 *   an alert. Tuned so Scouts pick up players just beyond typical engagement
 *   range, giving heavies time to respond without feeling omniscient.
 * - SIGNAL_COOLDOWN: Minimum time between radio calls / alert signals.
 *   Prevents constant spam; 8s keeps tension without overwhelming the player.
 * - FLEE_DISTANCE: Panic radius. When the player gets inside this radius, the
 *   Scout prioritizes evasive movement to keep its "eyes on" role instead of
 *   trading damage.
 */
const DETECTION_RANGE = 30;
const SIGNAL_COOLDOWN = 8;
const FLEE_DISTANCE = 12;

export function Scout({ data, targetPosition, onDeath, onSignal }: EnemyProps<ScoutData>) {
	const scene = useScene();

	const [isSignaling, setIsSignaling] = useState(false);
	const [hasSpottedPlayer, setHasSpottedPlayer] = useState(false);
	const signalCooldown = useRef(0);
	const signalTimer = useRef(0);

	const positionRef = useRef({ x: data.position.x, z: data.position.z });
	const lastTimeRef = useRef<number | null>(null);

	// Animation and AI loop
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

			const dx = positionRef.current.x - targetPosition.x;
			const dz = positionRef.current.z - targetPosition.z;
			const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);

			// Cooldown management
			signalCooldown.current = Math.max(0, signalCooldown.current - delta);

			// Detection logic
			if (distanceToPlayer < DETECTION_RANGE && !hasSpottedPlayer) {
				setHasSpottedPlayer(true);
			}

			// Signaling logic
			if (hasSpottedPlayer && signalCooldown.current <= 0 && !isSignaling) {
				setIsSignaling(true);
				signalTimer.current = 2;
				signalCooldown.current = SIGNAL_COOLDOWN;
				onSignal?.(data.id, { x: positionRef.current.x, y: 0, z: positionRef.current.z });
			}

			// Signal timer
			if (isSignaling) {
				signalTimer.current -= delta;
				if (signalTimer.current <= 0) {
					setIsSignaling(false);
				}
			}

			// Speed based on state
			let speed: number;
			if (distanceToPlayer < FLEE_DISTANCE) {
				speed = 12;
			} else {
				speed = hasSpottedPlayer ? 8 : 3;
			}
			speed *= 1 - data.suppression * 0.8;

			// Flee movement: move away from player
			if (speed > 0 && distanceToPlayer > 0.001) {
				const moveDist = speed * delta;
				positionRef.current.x += (dx / distanceToPlayer) * moveDist;
				positionRef.current.z += (dz / distanceToPlayer) * moveDist;
			}
		});

		return () => {
			scene.onBeforeRenderObservable.remove(obs);
		};
	}, [scene, data.suppression, hasSpottedPlayer, isSignaling, targetPosition, onSignal, data.id]);

	// Death callback
	useEffect(() => {
		if (data.hp <= 0 && onDeath) {
			onDeath(data.id);
		}
	}, [data.hp, data.id, onDeath]);

	const bodyColor = new Color3(0.29, 0.353, 0.227);
	const underbellyColor = new Color3(0.416, 0.478, 0.353);
	const radioColor = new Color3(0.165, 0.165, 0.102);
	const eyeColor = hasSpottedPlayer ? new Color3(1.0, 0.4, 0.0) : new Color3(1.0, 0.8, 0.0);
	const antennaColor = isSignaling ? new Color3(1.0, 0.267, 0.0) : new Color3(0.2, 0.2, 0.2);
	const antennaEmissive = isSignaling ? new Color3(1.0, 0.133, 0.0) : new Color3(0, 0, 0);

	return (
		<transformNode
			name={`scout-${data.id}`}
			position={new Vector3(data.position.x, 0, data.position.z)}
		>
			{/* Main body */}
			<cylinder
				name={`body-${data.id}`}
				options={{ diameterTop: 0.5, diameterBottom: 0.5, height: 0.8, tessellation: 10 }}
				positionY={0.4}
			>
				<standardMaterial name={`bodyMat-${data.id}`} diffuseColor={bodyColor} />
			</cylinder>

			{/* Underbelly */}
			<cylinder
				name={`belly-${data.id}`}
				options={{ diameterTop: 0.4, diameterBottom: 0.4, height: 0.6, tessellation: 10 }}
				positionY={0.35}
			>
				<standardMaterial name={`bellyMat-${data.id}`} diffuseColor={underbellyColor} />
			</cylinder>

			{/* Head */}
			<transformNode name={`head-${data.id}`} positionY={0.5} positionZ={0.6}>
				<sphere name={`skull-${data.id}`} options={{ diameter: 0.36, segments: 12 }}>
					<standardMaterial name={`skullMat-${data.id}`} diffuseColor={bodyColor} />
				</sphere>
				{/* Snout */}
				<cylinder
					name={`snout-${data.id}`}
					options={{ diameterTop: 0.0, diameterBottom: 0.2, height: 0.2, tessellation: 8 }}
					positionZ={0.15}
					rotationX={-1.37}
				>
					<standardMaterial name={`snoutMat-${data.id}`} diffuseColor={bodyColor} />
				</cylinder>
				{/* Eyes */}
				<sphere
					name={`eye-l-${data.id}`}
					options={{ diameter: 0.08, segments: 8 }}
					positionX={-0.1}
					positionY={0.08}
					positionZ={0.1}
				>
					<standardMaterial name={`eyeLMat-${data.id}`} emissiveColor={eyeColor} />
				</sphere>
				<sphere
					name={`eye-r-${data.id}`}
					options={{ diameter: 0.08, segments: 8 }}
					positionX={0.1}
					positionY={0.08}
					positionZ={0.1}
				>
					<standardMaterial name={`eyeRMat-${data.id}`} emissiveColor={eyeColor} />
				</sphere>
			</transformNode>

			{/* Tail */}
			<cylinder
				name={`tail-${data.id}`}
				options={{ diameterTop: 0.0, diameterBottom: 0.24, height: 0.8, tessellation: 8 }}
				positionY={0.35}
				positionZ={-0.5}
				rotationX={0.2}
			>
				<standardMaterial name={`tailMat-${data.id}`} diffuseColor={bodyColor} />
			</cylinder>

			{/* Radio pack */}
			<transformNode name={`radio-${data.id}`} positionY={0.65} positionZ={-0.1}>
				<box name={`radioPack-${data.id}`} options={{ width: 0.25, height: 0.15, depth: 0.2 }}>
					<standardMaterial name={`radioMat-${data.id}`} diffuseColor={radioColor} />
				</box>
				{/* Antenna */}
				<cylinder
					name={`antenna-${data.id}`}
					options={{ diameterTop: 0.016, diameterBottom: 0.02, height: 0.4, tessellation: 6 }}
					positionX={0.08}
					positionY={0.2}
				>
					<standardMaterial
						name={`antennaMat-${data.id}`}
						diffuseColor={antennaColor}
						emissiveColor={antennaEmissive}
					/>
				</cylinder>
			</transformNode>

			{/* Legs */}
			{/* Front-left */}
			<cylinder
				name={`leg-fl-${data.id}`}
				options={{ diameterTop: 0.1, diameterBottom: 0.1, height: 0.25, tessellation: 6 }}
				positionX={-0.2}
				positionY={0.25}
				positionZ={0.3}
				rotationZ={-0.5}
			>
				<standardMaterial name={`legFLMat-${data.id}`} diffuseColor={bodyColor} />
			</cylinder>
			{/* Front-right */}
			<cylinder
				name={`leg-fr-${data.id}`}
				options={{ diameterTop: 0.1, diameterBottom: 0.1, height: 0.25, tessellation: 6 }}
				positionX={0.2}
				positionY={0.25}
				positionZ={0.3}
				rotationZ={0.5}
			>
				<standardMaterial name={`legFRMat-${data.id}`} diffuseColor={bodyColor} />
			</cylinder>
			{/* Back-left */}
			<cylinder
				name={`leg-bl-${data.id}`}
				options={{ diameterTop: 0.1, diameterBottom: 0.1, height: 0.3, tessellation: 6 }}
				positionX={-0.2}
				positionY={0.25}
				positionZ={-0.3}
				rotationZ={-0.4}
			>
				<standardMaterial name={`legBLMat-${data.id}`} diffuseColor={bodyColor} />
			</cylinder>
			{/* Back-right */}
			<cylinder
				name={`leg-br-${data.id}`}
				options={{ diameterTop: 0.1, diameterBottom: 0.1, height: 0.3, tessellation: 6 }}
				positionX={0.2}
				positionY={0.25}
				positionZ={-0.3}
				rotationZ={0.4}
			>
				<standardMaterial name={`legBRMat-${data.id}`} diffuseColor={bodyColor} />
			</cylinder>

			{/* Signal rings when signaling */}
			{isSignaling && (
				<>
					<cylinder
						name={`wave0-${data.id}`}
						options={{ diameterTop: 0.6, diameterBottom: 0.6, height: 0.04, tessellation: 24 }}
						positionY={0.6}
					>
						<standardMaterial
							name={`wave0Mat-${data.id}`}
							diffuseColor={new Color3(1, 0.267, 0)}
							emissiveColor={new Color3(1, 0.267, 0)}
							alpha={0.6}
						/>
					</cylinder>
					<cylinder
						name={`wave1-${data.id}`}
						options={{ diameterTop: 1.1, diameterBottom: 1.1, height: 0.04, tessellation: 24 }}
						positionY={0.7}
					>
						<standardMaterial
							name={`wave1Mat-${data.id}`}
							diffuseColor={new Color3(1, 0.267, 0)}
							emissiveColor={new Color3(1, 0.267, 0)}
							alpha={0.4}
						/>
					</cylinder>
					<cylinder
						name={`wave2-${data.id}`}
						options={{ diameterTop: 1.6, diameterBottom: 1.6, height: 0.04, tessellation: 24 }}
						positionY={0.8}
					>
						<standardMaterial
							name={`wave2Mat-${data.id}`}
							diffuseColor={new Color3(1, 0.267, 0)}
							emissiveColor={new Color3(1, 0.267, 0)}
							alpha={0.2}
						/>
					</cylinder>
					<pointLight
						name={`signalLight-${data.id}`}
						position={new Vector3(0, 0.6, 0)}
						intensity={2}
						diffuse={new Color3(1, 0.267, 0)}
					/>
				</>
			)}

			{/* Health bar background */}
			<box
				name={`hpBg-${data.id}`}
				options={{ width: 0.8, height: 0.06, depth: 0.01 }}
				positionY={1.2}
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
				options={{ width: 0.8 * (data.hp / data.maxHp), height: 0.06, depth: 0.011 }}
				positionY={1.2}
				positionX={-(1 - data.hp / data.maxHp) * 0.4}
			>
				<standardMaterial
					name={`hpFillMat-${data.id}`}
					diffuseColor={new Color3(0.533, 1.0, 0.533)}
					emissiveColor={new Color3(0.2, 0.5, 0.2)}
				/>
			</box>
		</transformNode>
	);
}
