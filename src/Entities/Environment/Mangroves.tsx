import { Color3 } from "@babylonjs/core";

function pseudoRandom(seed: number) {
	let s = seed;
	return () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
}

export function Mangroves({ count = 30, seed = 0 }) {
	const rand = pseudoRandom(seed + 2);
	const trees = Array.from({ length: count }, () => ({
		angle: rand() * Math.PI * 2,
		dist: 25 + rand() * 55,
		height: 5 + rand() * 7,
		sx: 0.8 + rand() * 0.7,
		rx: rand() * 0.2 - 0.1,
		ry: rand() * Math.PI * 2,
		rz: rand() * 0.2 - 0.1,
	}));

	return (
		<transformNode name="mangroves">
			{trees.map((t, i) => (
				<cylinder
					key={i}
					name={`mangrove-${i}`}
					options={{
						diameterTop: 0.4 * t.sx,
						diameterBottom: 0.8 * t.sx,
						height: t.height,
						tessellation: 12,
					}}
					positionX={Math.cos(t.angle) * t.dist}
					positionY={t.height / 2}
					positionZ={Math.sin(t.angle) * t.dist}
					rotationX={t.rx}
					rotationY={t.ry}
					rotationZ={t.rz}
				>
					<standardMaterial
						name={`mangroveMat-${i}`}
						diffuseColor={new Color3(0.176, 0.239, 0.098)}
					/>
				</cylinder>
			))}
		</transformNode>
	);
}
