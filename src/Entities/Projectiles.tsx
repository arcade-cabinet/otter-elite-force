/**
 * Projectile System
 * High-performance bullet rendering using individual Babylon.js box elements
 */

import { Color3 } from "@babylonjs/core";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useScene } from "reactylon";
import { GAME_CONFIG } from "../utils/constants";

export interface Projectile {
	id: string;
	x: number;
	y: number;
	z: number;
	vx: number;
	vy: number;
	vz: number;
	lifetime: number;
}

export interface ProjectilesHandle {
	spawn: (
		position: { x: number; y: number; z: number },
		direction: { x: number; y: number; z: number },
	) => void;
	getProjectiles: () => Projectile[];
	remove: (id: string) => void;
}

const bulletColor = new Color3(1, 1, 0);

export const Projectiles = forwardRef<ProjectilesHandle, object>((_, ref) => {
	const scene = useScene();
	const projectilesRef = useRef<Projectile[]>([]);
	// Trigger re-render when projectile list changes for JSX rendering
	const [, setRenderTick] = useState(0);

	useImperativeHandle(ref, () => ({
		spawn: (position, direction) => {
			const speed = GAME_CONFIG.BULLET_SPEED;
			const len =
				Math.sqrt(
					direction.x * direction.x + direction.y * direction.y + direction.z * direction.z,
				) || 1;
			projectilesRef.current.push({
				// NOSONAR: Math.random is appropriate for non-cryptographic projectile IDs
				id: Math.random().toString(36).substr(2, 9),
				x: position.x,
				y: position.y,
				z: position.z,
				vx: (direction.x / len) * speed,
				vy: (direction.y / len) * speed,
				vz: (direction.z / len) * speed,
				lifetime: 2,
			});
			setRenderTick((t) => t + 1);
		},
		getProjectiles: () => projectilesRef.current,
		remove: (id) => {
			projectilesRef.current = projectilesRef.current.filter((p) => p.id !== id);
			setRenderTick((t) => t + 1);
		},
	}));

	useEffect(() => {
		if (!scene) return;

		let lastTime = performance.now();

		const obs = scene.onBeforeRenderObservable.add(() => {
			const now = performance.now();
			const delta = (now - lastTime) / 1000;
			lastTime = now;

			if (projectilesRef.current.length === 0) return;

			let changed = false;

			for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
				const p = projectilesRef.current[i];
				p.x += p.vx * delta;
				p.y += p.vy * delta;
				p.z += p.vz * delta;
				p.lifetime -= delta;

				if (p.lifetime <= 0) {
					projectilesRef.current.splice(i, 1);
					changed = true;
					continue;
				}

				// Update Babylon.js mesh position directly
				const mesh = scene.getMeshByName(`bullet-${p.id}`);
				if (mesh) {
					mesh.position.x = p.x;
					mesh.position.y = p.y;
					mesh.position.z = p.z;
				}
			}

			if (changed) {
				setRenderTick((t) => t + 1);
			}
		});

		return () => {
			scene.onBeforeRenderObservable.remove(obs);
		};
	}, [scene]);

	return (
		<transformNode name="projectiles">
			{projectilesRef.current.map((p) => (
				<box
					key={p.id}
					name={`bullet-${p.id}`}
					options={{ width: 0.1, height: 0.1, depth: 0.5 }}
					positionX={p.x}
					positionY={p.y}
					positionZ={p.z}
				>
					<standardMaterial
						name={`bulletMat-${p.id}`}
						diffuseColor={bulletColor}
						emissiveColor={bulletColor}
					/>
				</box>
			))}
		</transformNode>
	);
});

Projectiles.displayName = "Projectiles";
