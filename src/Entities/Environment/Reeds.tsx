import { Color3 } from "@babylonjs/core";

function pseudoRandom(seed: number) {
	let s = seed;
	return () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
}

export function Reeds({ count = 40, seed = 0 }) {
	const rand = pseudoRandom(seed + 1);
	const reeds = Array.from({ length: count }, () => ({
		angle: rand() * Math.PI * 2,
		dist: 20 + rand() * 60,
		height: 1 + rand() * 2,
		ry: rand() * Math.PI * 2,
	}));

	return (
		<transformNode name="reeds">
			{reeds.map((r, i) => (
				<cylinder
					key={i}
					name={`reed-${i}`}
					options={{
						diameterTop: 0.08,
						diameterBottom: 0.12,
						height: r.height,
						tessellation: 8,
					}}
					positionX={Math.cos(r.angle) * r.dist}
					positionY={0.5 + r.height / 2}
					positionZ={Math.sin(r.angle) * r.dist}
					rotationY={r.ry}
				>
					<standardMaterial name={`reedMat-${i}`} diffuseColor={new Color3(0.302, 0.478, 0.169)} />
				</cylinder>
			))}
		</transformNode>
	);
}
