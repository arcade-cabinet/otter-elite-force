import { Color3 } from "@babylonjs/core";

function pseudoRandom(seed: number) {
	let s = seed;
	return () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
}

export function FloatingDrums({ count = 10, seed = 0 }) {
	const rand = pseudoRandom(seed + 4);
	const drums = Array.from({ length: count }, () => ({
		angle: rand() * Math.PI * 2,
		dist: 15 + rand() * 45,
		ry: rand() * Math.PI * 2,
	}));

	return (
		<transformNode name="floatingDrums">
			{drums.map((d, i) => (
				<cylinder
					key={i}
					name={`drum-${i}`}
					options={{
						diameterTop: 0.6,
						diameterBottom: 0.6,
						height: 0.9,
						tessellation: 16,
					}}
					positionX={Math.cos(d.angle) * d.dist}
					positionY={0.55}
					positionZ={Math.sin(d.angle) * d.dist}
					rotationX={Math.PI / 2}
					rotationY={d.ry}
				>
					<standardMaterial name={`drumMat-${i}`} diffuseColor={new Color3(0.33, 0.33, 0.33)} />
				</cylinder>
			))}
		</transformNode>
	);
}
