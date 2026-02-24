/**
 * ToxicSludge Environmental Hazard
 * Scale-Guard industrial runoff that damages over time
 * Glowing green, bubbling, visually dangerous
 */

import { Color3 } from "@babylonjs/core";

function pseudoRandom(seed: number) {
	let s = seed;
	return () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
}

interface ToxicSludgeProps {
	positionX?: number;
	positionY?: number;
	positionZ?: number;
	size?: number;
}

export function ToxicSludge({
	positionX = 0,
	positionY = 0,
	positionZ = 0,
	size = 3,
}: ToxicSludgeProps) {
	const rand = pseudoRandom(99);

	const bubbles = Array.from({ length: 12 }, () => ({
		x: (rand() - 0.5) * size * 0.9,
		z: (rand() - 0.5) * size * 0.9,
		diameter: (0.1 + rand() * 0.15) * 2,
	}));

	const vapors = Array.from({ length: 5 }, (_, i) => ({
		x: (rand() - 0.5) * size,
		z: (rand() - 0.5) * size,
		diameter: (0.2 + i * 0.1) * 2,
		y: i * 0.2,
	}));

	const warningAngles = [0, 1, 2, 3].map((i) => (i / 4) * Math.PI * 2 + Math.PI / 4);

	return (
		<transformNode
			name="toxicSludge"
			positionX={positionX}
			positionY={positionY}
			positionZ={positionZ}
		>
			{/* Toxic surface - glowing green */}
			<cylinder
				name="toxicSurface"
				options={{
					diameterTop: size * 2,
					diameterBottom: size * 2,
					height: 0.04,
					tessellation: 24,
				}}
				positionY={0.05}
			>
				<standardMaterial
					name="toxicSurfaceMat"
					diffuseColor={new Color3(0.102, 0.29, 0.102)}
					emissiveColor={new Color3(0.0, 0.5, 0.0)}
				/>
			</cylinder>

			{/* Inner glow ring */}
			<cylinder
				name="toxicGlowRing"
				options={{
					diameterTop: size * 0.7 * 2,
					diameterBottom: size * 0.7 * 2,
					height: 0.03,
					tessellation: 20,
				}}
				positionY={0.06}
			>
				<standardMaterial
					name="toxicGlowRingMat"
					diffuseColor={new Color3(0.498, 1.0, 0.0)}
					emissiveColor={new Color3(0.2, 0.4, 0.0)}
				/>
			</cylinder>

			{/* Toxic bubbles */}
			{bubbles.map((b, i) => (
				<sphere
					key={i}
					name={`toxicBubble-${i}`}
					options={{ diameter: b.diameter, segments: 6 }}
					positionX={b.x}
					positionY={0.1}
					positionZ={b.z}
				>
					<standardMaterial
						name={`toxicBubbleMat-${i}`}
						diffuseColor={new Color3(0.498, 1.0, 0.0)}
						emissiveColor={new Color3(0.1, 0.3, 0.0)}
					/>
				</sphere>
			))}

			{/* Vapor wisps */}
			<transformNode name="toxicVapor" positionY={0.3}>
				{vapors.map((v, i) => (
					<sphere
						key={i}
						name={`vapor-${i}`}
						options={{ diameter: v.diameter, segments: 6 }}
						positionX={v.x}
						positionY={v.y}
						positionZ={v.z}
					>
						<standardMaterial name={`vaporMat-${i}`} diffuseColor={new Color3(0.29, 0.478, 0.29)} />
					</sphere>
				))}
			</transformNode>

			{/* Warning markers on edge */}
			{warningAngles.map((angle, i) => (
				<transformNode
					key={i}
					name={`warningGroup-${i}`}
					positionX={Math.cos(angle) * (size + 0.3)}
					positionY={0.1}
					positionZ={Math.sin(angle) * (size + 0.3)}
					rotationY={-angle}
				>
					<box
						name={`warningSign-${i}`}
						options={{ width: 0.3, height: 0.5, depth: 0.05 }}
						positionX={0}
						positionY={0}
						positionZ={0}
					>
						<standardMaterial name={`warningMat-${i}`} diffuseColor={new Color3(1.0, 1.0, 0.0)} />
					</box>
					<cylinder
						name={`warningSymbol-${i}`}
						options={{ diameterTop: 0.2, diameterBottom: 0.2, height: 0.03, tessellation: 6 }}
						positionX={0}
						positionY={0.03}
						positionZ={0.04}
					>
						<standardMaterial
							name={`warningSymbolMat-${i}`}
							diffuseColor={new Color3(0.0, 0.0, 0.0)}
						/>
					</cylinder>
				</transformNode>
			))}
		</transformNode>
	);
}
