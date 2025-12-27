/**
 * Modular Building System
 * Authentic river village huts with layered thatched palm/reed roofs
 * Elevated on stilts to handle flooding and mud
 */

import { useMemo } from "react";
import type * as THREE from "three";

interface HutProps {
	position: THREE.Vector3;
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
		const roofPitch = 0.8 + rand() * 0.3; // Steeper roofs for rain runoff

		return { width, depth, hasPorch, roofPitch, rand };
	}, [seed]);

	const { width, depth, hasPorch, roofPitch } = components;

	// Authentic tropical hut colors
	const colors = useMemo(
		() => ({
			stilt: "#2a1810", // Dark weathered wood
			floor: "#4a3828", // Worn deck wood
			wall: isHealerHut ? "#3a3a3a" : "#5d4a3a", // Bamboo/wood panels
			wallFrame: "#3d2a1a", // Darker framing
			thatch: isHealerHut ? "#7a6a5a" : "#c4a878", // Palm frond color
			thatchDark: isHealerHut ? "#5a4a3a" : "#a48858", // Layered shadow
			thatchHighlight: isHealerHut ? "#9a8a7a" : "#d4b888", // Sun-bleached tips
			roofFrame: "#3a2a1a",
		}),
		[isHealerHut],
	);

	// Generate thatch layers for authentic look
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

	return (
		<group position={position}>
			{/* === STILT FOUNDATION === */}
			{/* Main corner stilts - thick bamboo/wood */}
			{[
				[-width / 2, -depth / 2],
				[width / 2, -depth / 2],
				[-width / 2, depth / 2],
				[width / 2, depth / 2],
			].map((p, i) => (
				<group key={`stilt-${i}`} position={[p[0], 0, p[1]]}>
					{/* Main stilt */}
					<mesh castShadow>
						<cylinderGeometry args={[0.12, 0.15, 2.2, 8]} />
						<meshStandardMaterial color={colors.stilt} roughness={0.95} />
					</mesh>
					{/* Cross bracing */}
					{i < 2 && (
						<mesh position={[0, -0.3, depth / 2]} rotation-x={0.3}>
							<cylinderGeometry args={[0.04, 0.04, depth * 0.7, 6]} />
							<meshStandardMaterial color={colors.stilt} roughness={0.9} />
						</mesh>
					)}
				</group>
			))}
			{/* Center support stilts for larger huts */}
			{width > 3 && (
				<>
					<mesh position={[0, 0, -depth / 2]} castShadow>
						<cylinderGeometry args={[0.1, 0.12, 2.2, 8]} />
						<meshStandardMaterial color={colors.stilt} roughness={0.95} />
					</mesh>
					<mesh position={[0, 0, depth / 2]} castShadow>
						<cylinderGeometry args={[0.1, 0.12, 2.2, 8]} />
						<meshStandardMaterial color={colors.stilt} roughness={0.95} />
					</mesh>
				</>
			)}

			{/* === FLOOR PLATFORM === */}
			<group position={[0, 1.1, 0]}>
				{/* Main deck */}
				<mesh receiveShadow castShadow>
					<boxGeometry args={[width + (hasPorch ? 1.5 : 0.3), 0.15, depth + 0.3]} />
					<meshStandardMaterial color={colors.floor} roughness={0.9} />
				</mesh>
				{/* Deck planks detail */}
				{[...Array(Math.floor(width * 2))].map((_, i) => (
					<mesh key={`plank-${i}`} position={[-width / 2 + 0.25 + i * 0.5, 0.08, 0]}>
						<boxGeometry args={[0.02, 0.02, depth]} />
						<meshStandardMaterial color="#2a1a10" />
					</mesh>
				))}
			</group>

			{/* === WALLS - Woven bamboo/reed panels === */}
			<group position={[0, 2.1, 0]}>
				{/* Back Wall */}
				<group position={[0, 0, -depth / 2 + 0.05]}>
					{/* Wall frame */}
					<mesh>
						<boxGeometry args={[width + 0.1, 2.1, 0.08]} />
						<meshStandardMaterial color={colors.wallFrame} roughness={0.9} />
					</mesh>
					{/* Woven panel */}
					<mesh position={[0, 0, 0.05]}>
						<boxGeometry args={[width - 0.2, 1.8, 0.05]} />
						<meshStandardMaterial color={colors.wall} roughness={0.95} />
					</mesh>
				</group>

				{/* Side Walls */}
				{[-1, 1].map((side) => (
					<group key={`wall-${side}`} position={[side * (width / 2 - 0.05), 0, 0]}>
						<mesh rotation-y={Math.PI / 2}>
							<boxGeometry args={[depth + 0.1, 2.1, 0.08]} />
							<meshStandardMaterial color={colors.wallFrame} roughness={0.9} />
						</mesh>
						{/* Window opening */}
						<mesh position={[side * 0.05, 0.2, 0]} rotation-y={Math.PI / 2}>
							<boxGeometry args={[depth * 0.4, 0.6, 0.1]} />
							<meshStandardMaterial color="#1a1208" />
						</mesh>
					</group>
				))}

				{/* Front Wall with doorway */}
				<group position={[0, 0, depth / 2 - 0.05]}>
					{/* Door frame sides */}
					<mesh position={[-width / 4 - 0.4, 0, 0]}>
						<boxGeometry args={[width / 2 - 0.6, 2.1, 0.08]} />
						<meshStandardMaterial color={colors.wallFrame} roughness={0.9} />
					</mesh>
					<mesh position={[width / 4 + 0.4, 0, 0]}>
						<boxGeometry args={[width / 2 - 0.6, 2.1, 0.08]} />
						<meshStandardMaterial color={colors.wallFrame} roughness={0.9} />
					</mesh>
					{/* Door lintel */}
					<mesh position={[0, 0.8, 0]}>
						<boxGeometry args={[1.1, 0.4, 0.08]} />
						<meshStandardMaterial color={colors.wallFrame} roughness={0.9} />
					</mesh>
					{/* Door posts */}
					{[-0.5, 0.5].map((x) => (
						<mesh key={`doorpost-${x}`} position={[x, -0.2, 0.05]}>
							<boxGeometry args={[0.1, 1.7, 0.1]} />
							<meshStandardMaterial color={colors.stilt} />
						</mesh>
					))}
				</group>
			</group>

			{/* === AUTHENTIC THATCHED ROOF === */}
			<group position={[0, 3.2, 0]}>
				{/* Roof ridge beam */}
				<mesh position={[0, 0.9 * roofPitch, 0]} rotation-z={Math.PI / 2}>
					<cylinderGeometry args={[0.08, 0.08, width + 0.5, 8]} />
					<meshStandardMaterial color={colors.roofFrame} roughness={0.9} />
				</mesh>

				{/* Roof frame rafters */}
				{[-1, 1].map((side) => (
					<group key={`rafter-${side}`}>
						{[...Array(4)].map((_, i) => {
							const z = -depth / 2 + 0.3 + (i * depth) / 3;
							return (
								<mesh
									key={`rafter-${side}-${i}`}
									position={[side * (width / 4), 0.45 * roofPitch, z]}
									rotation-z={side * 0.7}
								>
									<cylinderGeometry args={[0.04, 0.04, width / 1.5, 6]} />
									<meshStandardMaterial color={colors.roofFrame} roughness={0.9} />
								</mesh>
							);
						})}
					</group>
				))}

				{/* Layered thatch - creates authentic overlapping look */}
				{[-1, 1].map((side) => (
					<group key={`thatch-side-${side}`}>
						{thatchLayers.map((layer, i) => (
							<mesh
								key={`thatch-${side}-${i}`}
								position={[side * (width / 4) * layer.scale, (layer.y - 3.2) * roofPitch, 0]}
								rotation-z={side * 0.65}
							>
								<boxGeometry args={[(width / 1.3) * layer.scale, 0.12, depth + 0.8]} />
								<meshStandardMaterial color={layer.color} roughness={1.0} />
							</mesh>
						))}
					</group>
				))}

				{/* Roof cap/ridge thatch */}
				<mesh position={[0, 0.95 * roofPitch, 0]}>
					<boxGeometry args={[0.3, 0.15, depth + 0.6]} />
					<meshStandardMaterial color={colors.thatchHighlight} roughness={1.0} />
				</mesh>

				{/* Overhanging eaves - thatch draping */}
				{[-1, 1].map((side) => (
					<mesh
						key={`eave-${side}`}
						position={[side * (width / 2 + 0.3), -0.2, 0]}
						rotation-z={side * 0.8}
					>
						<boxGeometry args={[0.5, 0.1, depth + 0.5]} />
						<meshStandardMaterial color={colors.thatchDark} roughness={1.0} />
					</mesh>
				))}
			</group>

			{/* === HEALER HUT SIGNIFIERS === */}
			{isHealerHut && (
				<group>
					{/* Red cross marker */}
					<group position={[0, 4.2, 0]}>
						<mesh position={[0, 0.3, 0]}>
							<boxGeometry args={[0.08, 0.8, 0.08]} />
							<meshStandardMaterial color="#cc0000" emissive="#880000" emissiveIntensity={0.5} />
						</mesh>
						{/* Lantern */}
						<mesh position={[0, 0.8, 0]}>
							<octahedronGeometry args={[0.15]} />
							<meshStandardMaterial
								color="#ff3333"
								emissive="#ff0000"
								emissiveIntensity={1}
								transparent
								opacity={0.8}
							/>
						</mesh>
						<pointLight color="#ff4444" intensity={2} distance={8} />
					</group>
					{/* Healing herbs hanging */}
					{[-0.4, 0.4].map((x) => (
						<mesh key={`herb-${x}`} position={[x, 2.8, depth / 2 + 0.1]}>
							<coneGeometry args={[0.1, 0.3, 6]} />
							<meshStandardMaterial color="#4a6a3a" />
						</mesh>
					))}
				</group>
			)}

			{/* Interior light glow */}
			<pointLight
				position={[0, 2, 0]}
				color={isHealerHut ? "#ffaa88" : "#ffcc88"}
				intensity={0.5}
				distance={5}
			/>
		</group>
	);
}
