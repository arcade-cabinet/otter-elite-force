/**
 * MudPit Environmental Hazard
 * Slows movement significantly, authentic swamp aesthetic
 */

import { Color3 } from "@babylonjs/core";

function pseudoRandom(seed: number) {
	let s = seed;
	return () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
}

interface MudPitProps {
	positionX?: number;
	positionY?: number;
	positionZ?: number;
	size?: number;
}

export function MudPit({ positionX = 0, positionY = 0, positionZ = 0, size = 4 }: MudPitProps) {
	const rand = pseudoRandom(42);

	const bubbles = Array.from({ length: 8 }, () => ({
		x: (rand() - 0.5) * size * 0.8,
		z: (rand() - 0.5) * size * 0.8,
		diameter: 0.08 + rand() * 0.1,
	}));

	const edgeDebris = Array.from({ length: 6 }, (_, i) => ({
		angle: (i / 6) * Math.PI * 2,
		width: 0.3 + rand() * 0.2,
		depth: 0.15 + rand() * 0.1,
	}));

	const rippleRatios = [0.4, 0.6, 0.8];

	return (
		<transformNode name="mudPit" positionX={positionX} positionY={positionY} positionZ={positionZ}>
			{/* Main mud surface */}
			<cylinder
				name="mudSurface"
				options={{
					diameterTop: size * 2,
					diameterBottom: size * 2,
					height: 0.04,
					tessellation: 24,
				}}
				positionY={0.02}
			>
				<standardMaterial name="mudSurfaceMat" diffuseColor={new Color3(0.239, 0.169, 0.122)} />
			</cylinder>

			{/* Darker center */}
			<cylinder
				name="mudCenter"
				options={{
					diameterTop: size * 1.2,
					diameterBottom: size * 1.2,
					height: 0.04,
					tessellation: 18,
				}}
				positionY={0.03}
			>
				<standardMaterial name="mudCenterMat" diffuseColor={new Color3(0.165, 0.122, 0.082)} />
			</cylinder>

			{/* Mud ripple rings */}
			{rippleRatios.map((r, i) => (
				<cylinder
					key={i}
					name={`mudRipple-${i}`}
					options={{
						diameterTop: size * r * 2,
						diameterBottom: size * r * 2,
						height: 0.02,
						tessellation: 16,
					}}
					positionY={0.04 + i * 0.005}
				>
					<standardMaterial
						name={`mudRippleMat-${i}`}
						diffuseColor={new Color3(0.29, 0.22, 0.157)}
					/>
				</cylinder>
			))}

			{/* Bubbles */}
			{bubbles.map((b, i) => (
				<sphere
					key={i}
					name={`mudBubble-${i}`}
					options={{ diameter: b.diameter * 2, segments: 6 }}
					positionX={b.x}
					positionY={0.05}
					positionZ={b.z}
				>
					<standardMaterial
						name={`mudBubbleMat-${i}`}
						diffuseColor={new Color3(0.365, 0.251, 0.216)}
					/>
				</sphere>
			))}

			{/* Edge debris */}
			{edgeDebris.map((d, i) => (
				<box
					key={i}
					name={`mudDebris-${i}`}
					options={{ width: d.width, height: 0.1, depth: d.depth }}
					positionX={Math.cos(d.angle) * size * 0.85}
					positionY={0.05}
					positionZ={Math.sin(d.angle) * size * 0.85}
				>
					<standardMaterial
						name={`mudDebrisMat-${i}`}
						diffuseColor={new Color3(0.176, 0.125, 0.082)}
					/>
				</box>
			))}
		</transformNode>
	);
}
