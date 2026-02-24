/**
 * OilSlick - Environmental hazard (static Babylon.js version)
 * Realistic dark oil slick surface with iridescent sheen
 */

import { Color3 } from "@babylonjs/core";

function pseudoRandom(seed: number) {
	let s = seed;
	return () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
}

interface OilSlickProps {
	positionX?: number;
	positionY?: number;
	positionZ?: number;
	size?: number;
}

export function OilSlick({ positionX = 0, positionY = 0, positionZ = 0, size = 3 }: OilSlickProps) {
	const rand = pseudoRandom(77);

	const charMarks = Array.from({ length: 5 }, (_, i) => ({
		angle: i * 1.3,
		radius: size * 0.4,
	}));

	const sheenRings = [
		{ inner: size * 0.3, outer: size * 0.6 },
		{ inner: size * 0.6, outer: size * 0.85 },
	];

	return (
		<transformNode
			name="oilSlick"
			positionX={positionX}
			positionY={positionY}
			positionZ={positionZ}
		>
			{/* Main oil surface - dark, slightly reflective */}
			<cylinder
				name="oilSurface"
				options={{
					diameterTop: size * 2,
					diameterBottom: size * 2,
					height: 0.02,
					tessellation: 24,
				}}
				positionY={0.01}
			>
				<standardMaterial name="oilSurfaceMat" diffuseColor={new Color3(0.04, 0.04, 0.04)} />
			</cylinder>

			{/* Iridescent sheen rings */}
			{sheenRings.map((ring, i) => (
				<cylinder
					key={i}
					name={`oilSheen-${i}`}
					options={{
						diameterTop: ring.outer * 2,
						diameterBottom: ring.outer * 2,
						height: 0.015,
						tessellation: 20,
					}}
					positionY={0.02 + i * 0.002}
				>
					<standardMaterial name={`oilSheenMat-${i}`} diffuseColor={new Color3(0.18, 0.08, 0.35)} />
				</cylinder>
			))}

			{/* Dark residue marks */}
			{charMarks.map((m, i) => (
				<cylinder
					key={i}
					name={`oilChar-${i}`}
					options={{
						diameterTop: (0.3 + rand() * 0.3) * 2,
						diameterBottom: (0.3 + rand() * 0.3) * 2,
						height: 0.015,
						tessellation: 6,
					}}
					positionX={Math.cos(m.angle) * m.radius}
					positionY={0.025}
					positionZ={Math.sin(m.angle) * m.radius}
				>
					<standardMaterial name={`oilCharMat-${i}`} diffuseColor={new Color3(0.02, 0.02, 0.02)} />
				</cylinder>
			))}
		</transformNode>
	);
}
