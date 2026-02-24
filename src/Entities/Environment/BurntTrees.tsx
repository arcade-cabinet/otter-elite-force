import { Color3 } from "@babylonjs/core";

function pseudoRandom(seed: number) {
	let s = seed;
	return () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
}

export function BurntTrees({ count = 15, seed = 0 }) {
	const rand = pseudoRandom(seed + 3);
	const trees = Array.from({ length: count }, () => ({
		angle: rand() * Math.PI * 2,
		dist: 30 + rand() * 60,
		height: 4 + rand() * 6,
		sx: 0.5 + rand() * 0.5,
	}));

	return (
		<transformNode name="burntTrees">
			{trees.map((t, i) => (
				<cylinder
					key={i}
					name={`burntTree-${i}`}
					options={{
						diameterTop: 0.3 * t.sx,
						diameterBottom: 0.5 * t.sx,
						height: t.height,
						tessellation: 8,
					}}
					positionX={Math.cos(t.angle) * t.dist}
					positionY={t.height / 2}
					positionZ={Math.sin(t.angle) * t.dist}
				>
					<standardMaterial name={`burntTreeMat-${i}`} diffuseColor={new Color3(0.1, 0.1, 0.1)} />
				</cylinder>
			))}
		</transformNode>
	);
}
