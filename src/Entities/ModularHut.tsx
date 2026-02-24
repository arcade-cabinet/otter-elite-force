/**
 * Modular Building System
 * Authentic river village huts with layered thatched palm/reed roofs
 * Elevated on stilts to handle flooding and mud
 */

import { Color3, Vector3 } from "@babylonjs/core";
import { useMemo } from "react";

interface HutProps {
	position: [number, number, number];
	seed: number;
	isHealerHut?: boolean;
}

export function ModularHut({ position, seed, isHealerHut = false }: HutProps) {
	const components = useMemo(() => {
		const pseudoRandom = () => {
			let s = seed;
			return () => {
				s = (s * 9301 + 49297) % 233280;
				return s / 233280;
			};
		};
		const rand = pseudoRandom();

		const width = 3 + Math.floor(rand() * 2);
		const depth = 3 + Math.floor(rand() * 2);
		const hasPorch = rand() > 0.5;
		const roofPitch = 0.8 + rand() * 0.3;

		return { width, depth, hasPorch, roofPitch };
	}, [seed]);

	const { width, depth, hasPorch, roofPitch } = components;

	const colors = useMemo(
		() => ({
			stilt: new Color3(0.165, 0.094, 0.063),
			floor: new Color3(0.29, 0.22, 0.157),
			wall: isHealerHut ? new Color3(0.227, 0.227, 0.227) : new Color3(0.365, 0.29, 0.227),
			wallFrame: isHealerHut ? new Color3(0.157, 0.094, 0.063) : new Color3(0.239, 0.165, 0.102),
			thatch: isHealerHut ? new Color3(0.478, 0.416, 0.353) : new Color3(0.769, 0.659, 0.471),
			thatchDark: isHealerHut ? new Color3(0.353, 0.29, 0.227) : new Color3(0.643, 0.533, 0.333),
			thatchHighlight: isHealerHut
				? new Color3(0.604, 0.541, 0.478)
				: new Color3(0.831, 0.722, 0.533),
			roofFrame: new Color3(0.227, 0.165, 0.102),
		}),
		[isHealerHut],
	);

	const thatchLayers = useMemo(() => {
		const layers = [];
		const layerCount = 6;
		for (let i = 0; i < layerCount; i++) {
			const t = i / (layerCount - 1);
			layers.push({
				y: 3.2 + i * 0.15,
				scale: 1 - t * 0.4,
				color: i % 2 === 0 ? colors.thatch : colors.thatchDark,
			});
		}
		return layers;
	}, [colors]);

	const stiltCorners: [number, number][] = [
		[-width / 2, -depth / 2],
		[width / 2, -depth / 2],
		[-width / 2, depth / 2],
		[width / 2, depth / 2],
	];

	return (
		<transformNode
			name="modularHut"
			positionX={position[0]}
			positionY={position[1]}
			positionZ={position[2]}
		>
			{/* === STILT FOUNDATION === */}
			{stiltCorners.map((p, i) => (
				<transformNode
					key={`stilt-${i}`}
					name={`stiltGroup-${i}`}
					positionX={p[0]}
					positionY={0}
					positionZ={p[1]}
				>
					<cylinder
						name={`stilt-${i}`}
						options={{ diameterTop: 0.24, diameterBottom: 0.3, height: 2.2, tessellation: 8 }}
						positionX={0}
						positionY={0}
						positionZ={0}
					>
						<standardMaterial name={`stiltMat-${i}`} diffuseColor={colors.stilt} />
					</cylinder>
					{i < 2 && (
						<cylinder
							name={`brace-${i}`}
							options={{
								diameterTop: 0.08,
								diameterBottom: 0.08,
								height: depth * 0.7,
								tessellation: 6,
							}}
							positionX={0}
							positionY={-0.3}
							positionZ={depth / 2}
							rotationX={0.3}
						>
							<standardMaterial name={`braceMat-${i}`} diffuseColor={colors.stilt} />
						</cylinder>
					)}
				</transformNode>
			))}

			{/* Center support stilts for larger huts */}
			{width > 3 && (
				<>
					<cylinder
						name="centerStiltFront"
						options={{ diameterTop: 0.2, diameterBottom: 0.24, height: 2.2, tessellation: 8 }}
						positionX={0}
						positionY={0}
						positionZ={-depth / 2}
					>
						<standardMaterial name="centerStiltMatF" diffuseColor={colors.stilt} />
					</cylinder>
					<cylinder
						name="centerStiltRear"
						options={{ diameterTop: 0.2, diameterBottom: 0.24, height: 2.2, tessellation: 8 }}
						positionX={0}
						positionY={0}
						positionZ={depth / 2}
					>
						<standardMaterial name="centerStiltMatR" diffuseColor={colors.stilt} />
					</cylinder>
				</>
			)}

			{/* === FLOOR PLATFORM === */}
			<box
				name="floorDeck"
				options={{ width: width + (hasPorch ? 1.5 : 0.3), height: 0.15, depth: depth + 0.3 }}
				positionX={0}
				positionY={1.1}
				positionZ={0}
			>
				<standardMaterial name="floorMat" diffuseColor={colors.floor} />
			</box>
			{Array.from({ length: Math.floor(width * 2) }, (_, i) => (
				<box
					key={`plank-${i}`}
					name={`plank-${i}`}
					options={{ width: 0.02, height: 0.02, depth: depth }}
					positionX={-width / 2 + 0.25 + i * 0.5}
					positionY={1.18}
					positionZ={0}
				>
					<standardMaterial name={`plankMat-${i}`} diffuseColor={new Color3(0.165, 0.102, 0.063)} />
				</box>
			))}

			{/* === WALLS === */}
			<box
				name="backWallFrame"
				options={{ width: width + 0.1, height: 2.1, depth: 0.08 }}
				positionX={0}
				positionY={2.1}
				positionZ={-depth / 2 + 0.05}
			>
				<standardMaterial name="backFrameMat" diffuseColor={colors.wallFrame} />
			</box>
			<box
				name="backWallPanel"
				options={{ width: width - 0.2, height: 1.8, depth: 0.05 }}
				positionX={0}
				positionY={2.1}
				positionZ={-depth / 2 + 0.1}
			>
				<standardMaterial name="backPanelMat" diffuseColor={colors.wall} />
			</box>

			{([-1, 1] as const).map((side) => (
				<transformNode
					key={`sideWall-${side}`}
					name={`sideWallGroup-${side}`}
					positionX={side * (width / 2 - 0.05)}
					positionY={2.1}
					positionZ={0}
				>
					<box
						name={`sideFrame-${side}`}
						options={{ width: 0.08, height: 2.1, depth: depth + 0.1 }}
						positionX={0}
						positionY={0}
						positionZ={0}
					>
						<standardMaterial name={`sideFrameMat-${side}`} diffuseColor={colors.wallFrame} />
					</box>
					<box
						name={`sideWindow-${side}`}
						options={{ width: 0.1, height: 0.6, depth: depth * 0.4 }}
						positionX={side * 0.05}
						positionY={0.2}
						positionZ={0}
					>
						<standardMaterial
							name={`windowMat-${side}`}
							diffuseColor={new Color3(0.102, 0.071, 0.031)}
						/>
					</box>
				</transformNode>
			))}

			<box
				name="frontWallLeft"
				options={{ width: width / 2 - 0.6, height: 2.1, depth: 0.08 }}
				positionX={-width / 4 - 0.4}
				positionY={2.1}
				positionZ={depth / 2 - 0.05}
			>
				<standardMaterial name="frontFrameMatL" diffuseColor={colors.wallFrame} />
			</box>
			<box
				name="frontWallRight"
				options={{ width: width / 2 - 0.6, height: 2.1, depth: 0.08 }}
				positionX={width / 4 + 0.4}
				positionY={2.1}
				positionZ={depth / 2 - 0.05}
			>
				<standardMaterial name="frontFrameMatR" diffuseColor={colors.wallFrame} />
			</box>
			<box
				name="doorLintel"
				options={{ width: 1.1, height: 0.4, depth: 0.08 }}
				positionX={0}
				positionY={2.9}
				positionZ={depth / 2 - 0.05}
			>
				<standardMaterial name="lintelMat" diffuseColor={colors.wallFrame} />
			</box>
			{([-0.5, 0.5] as const).map((x) => (
				<box
					key={`doorpost-${x}`}
					name={`doorpost-${x}`}
					options={{ width: 0.1, height: 1.7, depth: 0.1 }}
					positionX={x}
					positionY={1.9}
					positionZ={depth / 2}
				>
					<standardMaterial name={`doorpostMat-${x}`} diffuseColor={colors.stilt} />
				</box>
			))}

			{/* === THATCHED ROOF === */}
			<cylinder
				name="ridgeBeam"
				options={{ diameterTop: 0.16, diameterBottom: 0.16, height: width + 0.5, tessellation: 8 }}
				positionX={0}
				positionY={3.2 + 0.9 * roofPitch}
				positionZ={0}
				rotationZ={Math.PI / 2}
			>
				<standardMaterial name="ridgeBeamMat" diffuseColor={colors.roofFrame} />
			</cylinder>

			{([-1, 1] as const).map((side) => (
				<transformNode key={`thatchSide-${side}`} name={`thatchSide-${side}`}>
					{thatchLayers.map((layer, i) => (
						<box
							key={`thatch-${side}-${i}`}
							name={`thatch-${side}-${i}`}
							options={{ width: (width / 1.3) * layer.scale, height: 0.12, depth: depth + 0.8 }}
							positionX={side * (width / 4) * layer.scale}
							positionY={(layer.y - 3.2) * roofPitch + 3.2}
							positionZ={0}
							rotationZ={side * 0.65}
						>
							<standardMaterial name={`thatchMat-${side}-${i}`} diffuseColor={layer.color} />
						</box>
					))}
				</transformNode>
			))}

			<box
				name="ridgeThatch"
				options={{ width: 0.3, height: 0.15, depth: depth + 0.6 }}
				positionX={0}
				positionY={3.2 + 0.95 * roofPitch}
				positionZ={0}
			>
				<standardMaterial name="ridgeThatchMat" diffuseColor={colors.thatchHighlight} />
			</box>

			{([-1, 1] as const).map((side) => (
				<box
					key={`eave-${side}`}
					name={`eave-${side}`}
					options={{ width: 0.5, height: 0.1, depth: depth + 0.5 }}
					positionX={side * (width / 2 + 0.3)}
					positionY={3.0}
					positionZ={0}
					rotationZ={side * 0.8}
				>
					<standardMaterial name={`eaveMat-${side}`} diffuseColor={colors.thatchDark} />
				</box>
			))}

			{/* === HEALER HUT SIGNIFIERS === */}
			{isHealerHut && (
				<transformNode name="healerSignifiers">
					<box
						name="healerCrossV"
						options={{ width: 0.08, height: 0.8, depth: 0.08 }}
						positionX={0}
						positionY={4.5}
						positionZ={0}
					>
						<standardMaterial
							name="healerCrossMatV"
							diffuseColor={new Color3(0.8, 0, 0)}
							emissiveColor={new Color3(0.533, 0, 0)}
						/>
					</box>
					<sphere
						name="healerLantern"
						options={{ diameter: 0.3, segments: 8 }}
						positionX={0}
						positionY={5.0}
						positionZ={0}
					>
						<standardMaterial
							name="lanternMat"
							diffuseColor={new Color3(1, 0.2, 0.2)}
							emissiveColor={new Color3(1, 0, 0)}
							alpha={0.8}
						/>
					</sphere>
					<pointLight
						name="healerLight"
						position={new Vector3(0, 5.0, 0)}
						diffuse={new Color3(1, 0.267, 0.267)}
						specular={new Color3(1, 0.267, 0.267)}
						intensity={2}
						range={8}
					/>

					{([-0.4, 0.4] as const).map((x) => (
						<cylinder
							key={`herb-${x}`}
							name={`herb-${x}`}
							options={{ diameterTop: 0, diameterBottom: 0.2, height: 0.3, tessellation: 6 }}
							positionX={x}
							positionY={2.8}
							positionZ={depth / 2 + 0.1}
						>
							<standardMaterial
								name={`herbMat-${x}`}
								diffuseColor={new Color3(0.29, 0.416, 0.227)}
							/>
						</cylinder>
					))}
				</transformNode>
			)}

			{/* Interior light glow */}
			<pointLight
				name="interiorLight"
				position={new Vector3(0, 2, 0)}
				diffuse={isHealerHut ? new Color3(1, 0.667, 0.533) : new Color3(1, 0.8, 0.533)}
				specular={isHealerHut ? new Color3(1, 0.667, 0.533) : new Color3(1, 0.8, 0.533)}
				intensity={0.5}
				range={5}
			/>
		</transformNode>
	);
}
