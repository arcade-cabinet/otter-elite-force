/**
 * Player Rig / Modular Otter System
 * High-detail procedural character with authentic otter anatomy
 *
 * Real otter features:
 * - Elongated, sleek streamlined body built for swimming
 * - Dense brown fur with lighter cream/tan underbelly
 * - Thick, muscular rudder tail (tapered, slightly flattened)
 * - Webbed paws with visible webbing between toes
 * - Small rounded ears close to head
 * - Prominent sensitive whiskers
 * - Bright, intelligent beady eyes
 */

import type { TransformNode } from "@babylonjs/core";
import { Color3 } from "@babylonjs/core";
import { forwardRef, useEffect, useMemo, useRef } from "react";
import { useScene } from "reactylon";
import type { CharacterGear, CharacterTraits } from "../stores/gameStore";
import { Weapon } from "./Weapon";

interface PlayerRigProps {
	traits?: CharacterTraits;
	gear?: CharacterGear;
	position?: [number, number, number];
	rotation?: number;
	isMoving?: boolean;
	isClimbing?: boolean;
	velocity?: number;
	children?: React.ReactNode;
	muzzleRef?: React.RefObject<TransformNode>;
}

export const PlayerRig = forwardRef<TransformNode, PlayerRigProps>(
	(
		{
			traits = {
				id: "default",
				name: "OTTER",
				furColor: "#5D4037",
				eyeColor: "#111",
				whiskerLength: 0.35,
				grizzled: false,
				baseSpeed: 14,
				baseHealth: 100,
				climbSpeed: 10,
			},
			gear = {
				headgear: "none",
				vest: "tactical",
				backgear: "none",
				weaponId: "service-pistol",
			},
			position = [0, 0, 0],
			rotation = 0,
			isMoving = false,
			isClimbing = false,
			children,
			muzzleRef,
		},
		ref,
	) => {
		const scene = useScene();

		const legLRef = useRef<TransformNode>(null);
		const legRRef = useRef<TransformNode>(null);
		const armLRef = useRef<TransformNode>(null);
		const armRRef = useRef<TransformNode>(null);
		const headRef = useRef<TransformNode>(null);
		const tailRef = useRef<TransformNode>(null);

		// Memoize colors to prevent recreation every render
		const colors = useMemo(
			() => ({
				fur: Color3.FromHexString(traits.furColor),
				underFur: new Color3(0.627, 0.502, 0.376), // #a08060
				snout: new Color3(0.616, 0.494, 0.388), // #9D7E63
				nose: new Color3(0.133, 0.133, 0.133), // #222
				eye: Color3.FromHexString(traits.eyeColor),
				eyeHighlight: new Color3(1, 1, 1),
				webbing: new Color3(0.427, 0.314, 0.251), // #6d5040
				tacticalVest: new Color3(0.165, 0.227, 0.29), // #2a3a4a
				tacticalPouch: new Color3(0.102, 0.165, 0.227), // #1a2a3a
				whisker: new Color3(0.867, 0.867, 0.867), // #ddd
				helmetColor: new Color3(0.239, 0.302, 0.161), // #3d4d29
			}),
			[traits.furColor, traits.eyeColor],
		);

		// Animation loop via Babylon scene observable
		useEffect(() => {
			if (!scene) return;

			const observer = scene.onBeforeRenderObservable.add(() => {
				const time = performance.now() / 1000;

				// Tail always has subtle movement - otters use it for balance
				if (tailRef.current) {
					(tailRef.current.getChildren() as TransformNode[]).forEach((segment, i) => {
						segment.rotation.y = Math.sin(time * 3 - i * 0.5) * 0.1;
						segment.rotation.x = Math.sin(time * 2 - i * 0.3) * 0.05;
					});
				}

				if (isClimbing) {
					// Climbing gait
					const speed = time * 10;
					if (legLRef.current) legLRef.current.rotation.x = -Math.PI / 4 + Math.sin(speed) * 0.4;
					if (legRRef.current)
						legRRef.current.rotation.x = -Math.PI / 4 + Math.sin(speed + Math.PI) * 0.4;
					if (armLRef.current)
						armLRef.current.rotation.x = Math.PI / 4 + Math.sin(speed + Math.PI) * 0.4;
					if (armRRef.current) armRRef.current.rotation.x = Math.PI / 4 + Math.sin(speed) * 0.4;
					return;
				}

				if (headRef.current) {
					// Subtle breathing/idle head bob
					headRef.current.position.y = 0.55 + Math.sin(time * 2.5) * 0.01;
					if (isMoving) {
						headRef.current.rotation.z = Math.sin(time * 12) * 0.03;
						headRef.current.rotation.x = Math.sin(time * 6) * 0.02;
					} else {
						headRef.current.rotation.z += (0 - headRef.current.rotation.z) * 0.1;
						headRef.current.rotation.x += (0 - headRef.current.rotation.x) * 0.1;
					}
				}

				if (isMoving) {
					// Natural quadruped gait - diagonal pairs move together
					const walkSpeed = time * 14;
					if (legLRef.current) legLRef.current.rotation.x = Math.sin(walkSpeed) * 0.6;
					if (armRRef.current) armRRef.current.rotation.x = Math.sin(walkSpeed) * 0.6;
					if (legRRef.current) legRRef.current.rotation.x = Math.sin(walkSpeed + Math.PI) * 0.6;
					if (armLRef.current) armLRef.current.rotation.x = Math.sin(walkSpeed + Math.PI) * 0.6;
				} else {
					[legLRef, legRRef, armLRef, armRRef].forEach((limb) => {
						if (limb.current) limb.current.rotation.x += (0 - limb.current.rotation.x) * 0.1;
					});
				}

				// Tail swishes more when moving
				if (tailRef.current && isMoving) {
					tailRef.current.rotation.z = Math.sin(time * 8) * 0.15;
				}
			});

			return () => {
				scene.onBeforeRenderObservable.remove(observer);
			};
		}, [scene, isMoving, isClimbing]);

		// Webbed paw component - high detail realistic otter foot
		const WebbedPaw = ({ namePrefix, scale = 1 }: { namePrefix: string; scale?: number }) => (
			<transformNode name={`${namePrefix}-paw`} scalingX={scale} scalingY={scale} scalingZ={scale}>
				{/* Main paw pad */}
				<sphere
					name={`${namePrefix}-pad`}
					options={{ diameter: 0.2, segments: 16 }}
					positionX={0}
					positionY={-0.1}
					positionZ={0.02}
				>
					<standardMaterial name={`${namePrefix}-padMat`} diffuseColor={colors.snout} />
				</sphere>
				{/* Toes with webbing */}
				{([-0.07, -0.025, 0.025, 0.07] as number[]).map((x, i) => (
					<transformNode key={`toe-${i}`} name={`${namePrefix}-toeGroup-${i}`}>
						{/* Individual toe */}
						<sphere
							name={`${namePrefix}-toe-${i}`}
							options={{ diameter: 0.07, segments: 12 }}
							positionX={x}
							positionY={-0.12}
							positionZ={0.08}
						>
							<standardMaterial name={`${namePrefix}-toeMat-${i}`} diffuseColor={colors.fur} />
						</sphere>
						{/* Webbing between toes */}
						{i < 3 && (
							<plane
								name={`${namePrefix}-webbing-${i}`}
								options={{ width: 0.04, height: 0.06 }}
								positionX={(x + (x + 0.05)) / 2}
								positionY={-0.11}
								positionZ={0.06}
								rotationX={-0.2}
							>
								<standardMaterial
									name={`${namePrefix}-webbingMat-${i}`}
									diffuseColor={colors.webbing}
									alpha={0.9}
								/>
							</plane>
						)}
					</transformNode>
				))}
			</transformNode>
		);

		return (
			<transformNode
				name="playerRig"
				ref={ref}
				positionX={position[0]}
				positionY={position[1]}
				positionZ={position[2]}
				rotationY={rotation}
			>
				{children}

				{/* === QUADRUPEDAL BODY - Horizontal streamlined otter torso === */}
				<transformNode name="body" positionX={0} positionY={0.45} positionZ={0}>
					{/* Lower torso / Hips */}
					<sphere
						name="hips"
						options={{ diameter: 0.7, segments: 32 }}
						positionX={0}
						positionY={0}
						positionZ={-0.4}
					>
						<standardMaterial name="hipsMat" diffuseColor={colors.fur} />
					</sphere>

					{/* Main elongated body - approximated with cylinder */}
					<cylinder
						name="torso"
						options={{ diameterTop: 0.64, diameterBottom: 0.64, height: 0.8, tessellation: 32 }}
						positionX={0}
						positionY={0}
						positionZ={0}
						rotationX={Math.PI / 2}
					>
						<standardMaterial name="torsoMat" diffuseColor={colors.fur} />
					</cylinder>

					{/* Upper torso / Shoulders */}
					<sphere
						name="shoulders"
						options={{ diameter: 0.72, segments: 32 }}
						positionX={0}
						positionY={0.05}
						positionZ={0.4}
					>
						<standardMaterial name="shouldersMat" diffuseColor={colors.fur} />
					</sphere>

					{/* Underbelly - lighter coloration */}
					<cylinder
						name="underbelly"
						options={{ diameterTop: 0.5, diameterBottom: 0.5, height: 0.7, tessellation: 24 }}
						positionX={0}
						positionY={-0.15}
						positionZ={0}
						rotationX={Math.PI / 2}
					>
						<standardMaterial name="underbellyMat" diffuseColor={colors.underFur} />
					</cylinder>

					{/* === TACTICAL GEAR === */}
					{gear.vest === "tactical" && (
						<transformNode name="vestGroup" positionX={0} positionY={0.1} positionZ={0}>
							<cylinder
								name="vest"
								options={{ diameterTop: 0.76, diameterBottom: 0.76, height: 0.6, tessellation: 32 }}
								positionX={0}
								positionY={0}
								positionZ={0}
								rotationX={Math.PI / 2}
							>
								<standardMaterial name="vestMat" diffuseColor={colors.tacticalVest} />
							</cylinder>
							{/* Side pouches */}
							{([-0.35, 0.35] as number[]).map((x) => (
								<box
									key={`pouch-${x}`}
									name={`pouch-${x}`}
									options={{ width: 0.1, height: 0.2, depth: 0.3 }}
									positionX={x}
									positionY={0.15}
									positionZ={0}
								>
									<standardMaterial name={`pouchMat-${x}`} diffuseColor={colors.tacticalPouch} />
								</box>
							))}
						</transformNode>
					)}

					{/* === TAIL - Iconically thick and tapered === */}
					<transformNode
						name="tail"
						ref={tailRef}
						positionX={0}
						positionY={-0.05}
						positionZ={-0.65}
						rotationX={-0.1}
					>
						{([0.2, 0.15, 0.1, 0.05] as number[]).map((radius, i) => (
							<cylinder
								key={`tail-seg-${i}`}
								name={`tail-seg-${i}`}
								options={{
									diameterTop: radius * 2,
									diameterBottom: radius * 2,
									height: 0.4,
									tessellation: 24,
								}}
								positionX={0}
								positionY={0}
								positionZ={-i * 0.4}
								rotationX={Math.PI / 2}
							>
								<standardMaterial name={`tailSegMat-${i}`} diffuseColor={colors.fur} />
							</cylinder>
						))}
					</transformNode>

					{/* === LEGS - Quadrupedal arrangement === */}
					{/* Back Left Leg */}
					<transformNode
						name="legL"
						ref={legLRef}
						positionX={-0.25}
						positionY={-0.1}
						positionZ={-0.4}
					>
						<cylinder
							name="legLCyl"
							options={{ diameterTop: 0.24, diameterBottom: 0.24, height: 0.3, tessellation: 16 }}
							positionX={0}
							positionY={-0.15}
							positionZ={0}
						>
							<standardMaterial name="legLMat" diffuseColor={colors.fur} />
						</cylinder>
						<WebbedPaw namePrefix="legL" scale={0.9} />
					</transformNode>
					{/* Back Right Leg */}
					<transformNode
						name="legR"
						ref={legRRef}
						positionX={0.25}
						positionY={-0.1}
						positionZ={-0.4}
					>
						<cylinder
							name="legRCyl"
							options={{ diameterTop: 0.24, diameterBottom: 0.24, height: 0.3, tessellation: 16 }}
							positionX={0}
							positionY={-0.15}
							positionZ={0}
						>
							<standardMaterial name="legRMat" diffuseColor={colors.fur} />
						</cylinder>
						<WebbedPaw namePrefix="legR" scale={0.9} />
					</transformNode>

					{/* Front Left Arm */}
					<transformNode
						name="armL"
						ref={armLRef}
						positionX={-0.25}
						positionY={-0.1}
						positionZ={0.4}
					>
						<cylinder
							name="armLCyl"
							options={{ diameterTop: 0.22, diameterBottom: 0.22, height: 0.28, tessellation: 16 }}
							positionX={0}
							positionY={-0.15}
							positionZ={0}
						>
							<standardMaterial name="armLMat" diffuseColor={colors.fur} />
						</cylinder>
						<WebbedPaw namePrefix="armL" scale={0.8} />
					</transformNode>
					{/* Front Right Arm */}
					<transformNode
						name="armR"
						ref={armRRef}
						positionX={0.25}
						positionY={-0.1}
						positionZ={0.4}
					>
						<cylinder
							name="armRCyl"
							options={{ diameterTop: 0.22, diameterBottom: 0.22, height: 0.28, tessellation: 16 }}
							positionX={0}
							positionY={-0.15}
							positionZ={0}
						>
							<standardMaterial name="armRMat" diffuseColor={colors.fur} />
						</cylinder>
						<WebbedPaw namePrefix="armR" scale={0.8} />
						{/* Weapon remains attached to front right arm area */}
						<transformNode name="weaponMount" positionX={0.1} positionY={0} positionZ={0.1}>
							<Weapon weaponId={gear.weaponId} muzzleRef={muzzleRef} />
						</transformNode>
					</transformNode>

					{/* === NECK & HEAD === */}
					<transformNode
						name="headGroup"
						ref={headRef}
						positionX={0}
						positionY={0.1}
						positionZ={0.55}
					>
						{/* Neck */}
						<cylinder
							name="neck"
							options={{ diameterTop: 0.36, diameterBottom: 0.36, height: 0.3, tessellation: 24 }}
							positionX={0}
							positionY={0.15}
							positionZ={0.1}
							rotationX={-Math.PI / 4}
						>
							<standardMaterial name="neckMat" diffuseColor={colors.fur} />
						</cylinder>

						{/* Head Group */}
						<transformNode name="head" positionX={0} positionY={0.45} positionZ={0.2}>
							{/* Skull */}
							<sphere
								name="skull"
								options={{ diameter: 0.6, segments: 32 }}
								positionX={0}
								positionY={0}
								positionZ={0}
							>
								<standardMaterial name="skullMat" diffuseColor={colors.fur} />
							</sphere>

							{/* Snout */}
							<transformNode name="snoutGroup" positionX={0} positionY={-0.1} positionZ={0.22}>
								<sphere
									name="snout"
									options={{ diameter: 0.36, segments: 24 }}
									positionX={0}
									positionY={0}
									positionZ={0}
								>
									<standardMaterial name="snoutMat" diffuseColor={colors.snout} />
								</sphere>
								{/* Nose */}
								<sphere
									name="nose"
									options={{ diameter: 0.12, segments: 16 }}
									positionX={0}
									positionY={0.05}
									positionZ={0.15}
								>
									<standardMaterial name="noseMat" diffuseColor={colors.nose} />
								</sphere>
								{/* Whiskers */}
								{([-1, 1] as number[]).map((side) => (
									<transformNode
										key={`whiskers-${side}`}
										name={`whiskersGroup-${side}`}
										positionX={side * 0.12}
										positionY={0}
										positionZ={0.1}
									>
										{([0, 1, 2] as number[]).map((row) => (
											<cylinder
												key={`whisker-${side}-${row}`}
												name={`whisker-${side}-${row}`}
												options={{
													diameterTop: 0.001,
													diameterBottom: 0.004,
													height: traits.whiskerLength + row * 0.04,
													tessellation: 8,
												}}
												positionX={side * 0.02}
												positionY={-0.02 + row * 0.03}
												positionZ={0}
												rotationZ={side * (0.2 + row * 0.1)}
												rotationY={side * 0.3}
											>
												<standardMaterial
													name={`whiskerMat-${side}-${row}`}
													diffuseColor={colors.whisker}
													alpha={0.6}
												/>
											</cylinder>
										))}
									</transformNode>
								))}
							</transformNode>

							{/* Eyes */}
							{([-1, 1] as number[]).map((side) => (
								<transformNode
									key={`eye-${side}`}
									name={`eyeGroup-${side}`}
									positionX={side * 0.15}
									positionY={0.1}
									positionZ={0.22}
								>
									<sphere
										name={`eyeBall-${side}`}
										options={{ diameter: 0.09, segments: 16 }}
										positionX={0}
										positionY={0}
										positionZ={0}
									>
										<standardMaterial name={`eyeMat-${side}`} diffuseColor={colors.eye} />
									</sphere>
									<sphere
										name={`eyeHighlight-${side}`}
										options={{ diameter: 0.02, segments: 8 }}
										positionX={0}
										positionY={0}
										positionZ={0.035}
									>
										<standardMaterial
											name={`eyeHighlightMat-${side}`}
											diffuseColor={colors.eyeHighlight}
										/>
									</sphere>
								</transformNode>
							))}

							{/* Ears */}
							{([-1, 1] as number[]).map((side) => (
								<sphere
									key={`ear-${side}`}
									name={`ear-${side}`}
									options={{ diameter: 0.16, segments: 16 }}
									positionX={side * 0.28}
									positionY={0.2}
									positionZ={-0.05}
									rotationZ={side * 0.3}
								>
									<standardMaterial name={`earMat-${side}`} diffuseColor={colors.fur} />
								</sphere>
							))}

							{/* Headgear */}
							{gear.headgear === "helmet" && (
								<cylinder
									name="helmet"
									options={{
										diameterTop: 0.62,
										diameterBottom: 0.7,
										height: 0.35,
										tessellation: 32,
									}}
									positionX={0}
									positionY={0.2}
									positionZ={0}
									rotationX={0.1}
								>
									<standardMaterial name="helmetMat" diffuseColor={colors.helmetColor} />
								</cylinder>
							)}
						</transformNode>
					</transformNode>
				</transformNode>
			</transformNode>
		);
	},
);

PlayerRig.displayName = "PlayerRig";
