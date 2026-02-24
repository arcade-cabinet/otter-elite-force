/**
 * Weapon Component
 * Procedural weapons that can be mounted on characters
 * Each weapon has distinct silhouette and tactical aesthetic
 */

import type { TransformNode } from "@babylonjs/core";
import { Color3 } from "@babylonjs/core";
import { useEffect, useMemo, useRef } from "react";
import { useScene } from "reactylon";
import { WEAPONS } from "../stores/gameStore";

interface WeaponProps {
	weaponId: string;
	level?: number;
	muzzleRef?: React.RefObject<TransformNode>;
	isFiring?: boolean;
}

export function Weapon({ weaponId, muzzleRef, isFiring = false }: WeaponProps) {
	const weapon = useMemo(() => WEAPONS[weaponId] || WEAPONS["service-pistol"], [weaponId]);
	const scene = useScene();
	const flashIntensity = useRef(0);
	const lastTimeRef = useRef<number>(performance.now());

	// Muzzle flash animation
	useEffect(() => {
		if (!scene) return;

		const observer = scene.onBeforeRenderObservable.add(() => {
			const now = performance.now();
			const delta = (now - lastTimeRef.current) / 1000;
			lastTimeRef.current = now;

			if (isFiring) {
				flashIntensity.current = 1;
			} else {
				flashIntensity.current = Math.max(0, flashIntensity.current - delta * 15);
			}
		});

		return () => {
			scene.onBeforeRenderObservable.remove(observer);
		};
	}, [scene, isFiring]);

	// Precomputed colors
	const colors = useMemo(
		() => ({
			darkMetal: new Color3(0.133, 0.133, 0.133), // #222
			blackMetal: new Color3(0.067, 0.067, 0.067), // #111
			wood: new Color3(0.2, 0.133, 0.067), // #332211
			cyanGlass: new Color3(0, 0.8, 1), // #00ccff
			lightGray: new Color3(0.933, 0.933, 0.933), // #eee
			darkGreen: new Color3(0.239, 0.239, 0.161), // #3d3d29
			darkGray: new Color3(0.133, 0.133, 0.133), // #222
			gunMetal: new Color3(0.102, 0.102, 0.102), // #1a1a1a
			darkBrown: new Color3(0.29, 0.208, 0.125), // #4a3520
			lime: new Color3(0.667, 1, 0.667), // #aaffaa
			mortarGreen: new Color3(0.161, 0.161, 0.102), // #2a2a1a
			mortarDark: new Color3(0.133, 0.133, 0.133), // #222
			pressureChamber: new Color3(0.176, 0.29, 0.176), // #2d4a2d
			darkGray2: new Color3(0.2, 0.2, 0.2), // #333
			needleMetal: new Color3(0.333, 0.333, 0.333), // #555
		}),
		[],
	);

	return (
		<transformNode name="weapon">
			{weapon.visualType === "PISTOL_GRIP" && (
				<transformNode name="pistolGroup" positionX={0} positionY={-0.1} positionZ={0.2}>
					{/* Body */}
					<box
						name="pistolBody"
						options={{ width: 0.15, height: 0.25, depth: 0.5 }}
						positionX={0}
						positionY={0}
						positionZ={0}
					>
						<standardMaterial name="pistolBodyMat" diffuseColor={colors.darkMetal} />
					</box>
					{/* Barrel */}
					<cylinder
						name="pistolBarrel"
						options={{ diameterTop: 0.08, diameterBottom: 0.08, height: 0.4, tessellation: 8 }}
						positionX={0}
						positionY={0.08}
						positionZ={0.3}
						rotationX={Math.PI / 2}
					>
						<standardMaterial name="pistolBarrelMat" diffuseColor={colors.blackMetal} />
					</cylinder>
					<transformNode
						name="pistolMuzzle"
						ref={muzzleRef}
						positionX={0}
						positionY={0.08}
						positionZ={0.5}
					/>
				</transformNode>
			)}

			{weapon.visualType === "FISH_CANNON" && (
				<transformNode
					name="cannonGroup"
					positionX={0}
					positionY={-0.2}
					positionZ={0.8}
					rotationX={0.1}
				>
					{/* Main Barrel */}
					<cylinder
						name="cannonBarrel"
						options={{ diameterTop: 0.3, diameterBottom: 0.36, height: 1.2, tessellation: 12 }}
						positionX={0}
						positionY={0}
						positionZ={0}
						rotationX={Math.PI / 2}
					>
						<standardMaterial name="cannonBarrelMat" diffuseColor={colors.darkMetal} />
					</cylinder>
					{/* Stock/Handle */}
					<box
						name="cannonStock"
						options={{ width: 0.1, height: 0.3, depth: 0.4 }}
						positionX={0}
						positionY={-0.15}
						positionZ={-0.4}
					>
						<standardMaterial name="cannonStockMat" diffuseColor={colors.wood} />
					</box>
					<transformNode
						name="cannonMuzzle"
						ref={muzzleRef}
						positionX={0}
						positionY={0}
						positionZ={0.6}
					/>
				</transformNode>
			)}

			{weapon.visualType === "BUBBLE_GUN" && (
				<transformNode name="bubbleGunGroup" positionX={0} positionY={-0.2} positionZ={0.7}>
					<sphere
						name="bubbleGunBody"
						options={{ diameter: 0.5, segments: 12 }}
						positionX={0}
						positionY={0}
						positionZ={0}
					>
						<standardMaterial name="bubbleGunBodyMat" diffuseColor={colors.cyanGlass} alpha={0.6} />
					</sphere>
					<cylinder
						name="bubbleGunBarrel"
						options={{ diameterTop: 0.1, diameterBottom: 0.2, height: 0.4, tessellation: 8 }}
						positionX={0}
						positionY={0}
						positionZ={0.3}
						rotationX={Math.PI / 2}
					>
						<standardMaterial name="bubbleGunBarrelMat" diffuseColor={colors.lightGray} />
					</cylinder>
					<transformNode
						name="bubbleGunMuzzle"
						ref={muzzleRef}
						positionX={0}
						positionY={0}
						positionZ={0.5}
					/>
				</transformNode>
			)}

			{/* Scatter Shell - Double barrel shotgun */}
			{weapon.visualType === "SHOTGUN" && (
				<transformNode
					name="shotgunGroup"
					positionX={0}
					positionY={-0.15}
					positionZ={0.5}
					rotationX={0.05}
				>
					{/* Double barrels */}
					{([-0.05, 0.05] as number[]).map((x, i) => (
						<cylinder
							key={`barrel-${i}`}
							name={`shotgunBarrel-${i}`}
							options={{ diameterTop: 0.12, diameterBottom: 0.12, height: 0.9, tessellation: 8 }}
							positionX={x}
							positionY={0.05}
							positionZ={0}
							rotationX={Math.PI / 2}
						>
							<standardMaterial name={`shotgunBarrelMat-${i}`} diffuseColor={colors.gunMetal} />
						</cylinder>
					))}
					{/* Receiver */}
					<box
						name="shotgunReceiver"
						options={{ width: 0.18, height: 0.15, depth: 0.4 }}
						positionX={0}
						positionY={0}
						positionZ={-0.35}
					>
						<standardMaterial name="shotgunReceiverMat" diffuseColor={colors.darkMetal} />
					</box>
					{/* Stock */}
					<box
						name="shotgunStock"
						options={{ width: 0.1, height: 0.2, depth: 0.4 }}
						positionX={0}
						positionY={-0.08}
						positionZ={-0.6}
						rotationX={0.1}
					>
						<standardMaterial name="shotgunStockMat" diffuseColor={colors.darkBrown} />
					</box>
					{/* Foregrip */}
					<box
						name="shotgunForegrip"
						options={{ width: 0.12, height: 0.1, depth: 0.25 }}
						positionX={0}
						positionY={-0.08}
						positionZ={0.1}
					>
						<standardMaterial name="shotgunForegripMat" diffuseColor={colors.darkBrown} />
					</box>
					<transformNode
						name="shotgunMuzzle"
						ref={muzzleRef}
						positionX={0}
						positionY={0.05}
						positionZ={0.45}
					/>
				</transformNode>
			)}

			{/* Clam Mortar - Grenade launcher */}
			{weapon.visualType === "MORTAR" && (
				<transformNode
					name="mortarGroup"
					positionX={0}
					positionY={-0.2}
					positionZ={0.6}
					rotationX={0.15}
				>
					{/* Wide mortar tube */}
					<cylinder
						name="mortarTube"
						options={{ diameterTop: 0.4, diameterBottom: 0.36, height: 0.8, tessellation: 12 }}
						positionX={0}
						positionY={0}
						positionZ={0}
						rotationX={Math.PI / 2}
					>
						<standardMaterial name="mortarTubeMat" diffuseColor={colors.darkGreen} />
					</cylinder>
					{/* Handle/Grip */}
					<box
						name="mortarGrip"
						options={{ width: 0.1, height: 0.25, depth: 0.15 }}
						positionX={0}
						positionY={-0.2}
						positionZ={-0.2}
					>
						<standardMaterial name="mortarGripMat" diffuseColor={colors.mortarGreen} />
					</box>
					{/* Shoulder brace */}
					<box
						name="mortarBrace"
						options={{ width: 0.15, height: 0.12, depth: 0.3 }}
						positionX={0}
						positionY={0}
						positionZ={-0.5}
						rotationX={-0.2}
					>
						<standardMaterial name="mortarBraceMat" diffuseColor={colors.mortarDark} />
					</box>
					<transformNode
						name="mortarMuzzle"
						ref={muzzleRef}
						positionX={0}
						positionY={0}
						positionZ={0.5}
					/>
				</transformNode>
			)}

			{/* Silt Needle - Precision dart gun */}
			{weapon.visualType === "NEEDLE_GUN" && (
				<transformNode name="needleGunGroup" positionX={0} positionY={-0.1} positionZ={0.3}>
					{/* Sleek barrel */}
					<cylinder
						name="needleBarrel"
						options={{ diameterTop: 0.05, diameterBottom: 0.06, height: 0.6, tessellation: 8 }}
						positionX={0}
						positionY={0.05}
						positionZ={0.15}
						rotationX={Math.PI / 2}
					>
						<standardMaterial name="needleBarrelMat" diffuseColor={colors.needleMetal} />
					</cylinder>
					{/* Pressure chamber */}
					<sphere
						name="pressureChamber"
						options={{ diameter: 0.2, segments: 12 }}
						positionX={0}
						positionY={0}
						positionZ={-0.1}
					>
						<standardMaterial name="pressureChamberMat" diffuseColor={colors.pressureChamber} />
					</sphere>
					{/* Grip */}
					<box
						name="needleGrip"
						options={{ width: 0.08, height: 0.18, depth: 0.12 }}
						positionX={0}
						positionY={-0.12}
						positionZ={-0.05}
					>
						<standardMaterial name="needleGripMat" diffuseColor={colors.darkGray2} />
					</box>
					{/* Needle tip accent */}
					<cylinder
						name="needleTip"
						options={{ diameterTop: 0, diameterBottom: 0.03, height: 0.08, tessellation: 6 }}
						positionX={0}
						positionY={0.05}
						positionZ={0.45}
						rotationX={Math.PI / 2}
					>
						<standardMaterial name="needleTipMat" diffuseColor={colors.lime} />
					</cylinder>
					<transformNode
						name="needleMuzzle"
						ref={muzzleRef}
						positionX={0}
						positionY={0.05}
						positionZ={0.5}
					/>
				</transformNode>
			)}
		</transformNode>
	);
}
