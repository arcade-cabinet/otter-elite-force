import { Color3 } from "@babylonjs/core";

const hc = (hex: string): Color3 => {
	const h = hex.replace("#", "");
	const f =
		h.length === 3
			? h
					.split("")
					.map((c) => c + c)
					.join("")
			: h;
	return new Color3(
		parseInt(f.slice(0, 2), 16) / 255,
		parseInt(f.slice(2, 4), 16) / 255,
		parseInt(f.slice(4, 6), 16) / 255,
	);
};

export function SimpleHut({ position }: { position: [number, number, number] }) {
	return (
		<transformNode
			name="simpleHut"
			positionX={position[0]}
			positionY={position[1]}
			positionZ={position[2]}
		>
			<box name="hutBase" options={{ width: 4, height: 2, depth: 4 }} positionY={1}>
				<standardMaterial name="hutBaseMat" diffuseColor={hc("#3d2b1f")} />
			</box>
			<cylinder
				name="hutRoof"
				options={{ diameterTop: 0, diameterBottom: 6, height: 1.5, tessellation: 4 }}
				positionY={2.5}
			>
				<standardMaterial name="hutRoofMat" diffuseColor={hc("#d4c4a8")} />
			</cylinder>
			<box
				name="hutDoor"
				options={{ width: 1, height: 1.6, depth: 0.05 }}
				positionY={0.8}
				positionZ={2.01}
			>
				<standardMaterial name="hutDoorMat" emissiveColor={hc("#000000")} />
			</box>
		</transformNode>
	);
}
