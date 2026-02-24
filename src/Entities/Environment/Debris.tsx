import { Color3 } from "@babylonjs/core";

function pseudoRandom(seed: number) {
	let s = seed;
	return () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
}

// Parse "#rrggbb" hex string to Color3
function hexToColor3(hex: string): Color3 {
	const r = parseInt(hex.slice(1, 3), 16) / 255;
	const g = parseInt(hex.slice(3, 5), 16) / 255;
	const b = parseInt(hex.slice(5, 7), 16) / 255;
	return new Color3(r, g, b);
}

export function Debris({ count = 10, color = "#444444", seed = 0 }) {
	const rand = pseudoRandom(seed + 5);
	const pieces = Array.from({ length: count }, () => ({
		angle: rand() * Math.PI * 2,
		dist: 10 + rand() * 60,
		sx: 0.5 + rand() * 1.5,
		sy: 0.5 + rand() * 0.5,
		sz: 0.5 + rand() * 1.5,
		ry: rand() * Math.PI * 2,
	}));

	const col = hexToColor3(
		color.length === 4
			? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
			: color,
	);

	return (
		<transformNode name="debris">
			{pieces.map((p, i) => (
				<box
					key={i}
					name={`debris-${i}`}
					options={{ width: p.sx, height: p.sy, depth: p.sz }}
					positionX={Math.cos(p.angle) * p.dist}
					positionY={0.2 + p.sy / 2}
					positionZ={Math.sin(p.angle) * p.dist}
					rotationY={p.ry}
				>
					<standardMaterial name={`debrisMat-${i}`} diffuseColor={col} />
				</box>
			))}
		</transformNode>
	);
}
