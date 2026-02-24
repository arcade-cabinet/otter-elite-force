import { Color3 } from "@babylonjs/core";

function pseudoRandom(seed: number) {
	let s = seed;
	return () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
}

export function Lilypads({ count = 20, seed = 0 }) {
	const rand = pseudoRandom(seed);
	const pads = Array.from({ length: count }, () => ({
		angle: rand() * Math.PI * 2,
		dist: 10 + rand() * 50,
		size: 0.5 + rand() * 0.7,
		ry: rand() * Math.PI * 2,
	}));

	return (
		<transformNode name="lilypads">
			{pads.map((p, i) => (
				<cylinder
					key={i}
					name={`lilypad-${i}`}
					options={{
						diameterTop: p.size * 2,
						diameterBottom: p.size * 2,
						height: 0.05,
						tessellation: 16,
					}}
					positionX={Math.cos(p.angle) * p.dist}
					positionY={0.15}
					positionZ={Math.sin(p.angle) * p.dist}
					rotationY={p.ry}
				>
					<standardMaterial
						name={`lilypadMat-${i}`}
						diffuseColor={new Color3(0.165, 0.302, 0.102)}
					/>
				</cylinder>
			))}
		</transformNode>
	);
}
