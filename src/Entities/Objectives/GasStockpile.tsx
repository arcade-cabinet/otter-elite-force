import { Color3 } from "@babylonjs/core";

const CANISTER_POSITIONS: [number, number, number][] = [
	[-0.5, 0, 0],
	[0.5, 0, 0],
	[0, 0, 0.5],
];

export function GasStockpile({
	position,
	secured = false,
}: {
	position: [number, number, number];
	secured?: boolean;
}) {
	const canisterColor = secured ? new Color3(0.176, 0.239, 0.098) : new Color3(0.827, 0.184, 0.184);
	const baseColor = new Color3(0.239, 0.169, 0.122);

	return (
		<transformNode
			name="gasStockpile"
			positionX={position[0]}
			positionY={position[1]}
			positionZ={position[2]}
		>
			{CANISTER_POSITIONS.map((pos, i) => (
				<cylinder
					key={`gas-${i}`}
					name={`gasCanister-${i}`}
					options={{ diameterTop: 0.8, diameterBottom: 0.8, height: 1.2, tessellation: 8 }}
					positionX={pos[0]}
					positionY={pos[1]}
					positionZ={pos[2]}
				>
					<standardMaterial name={`canisterMat-${i}`} diffuseColor={canisterColor} />
				</cylinder>
			))}
			<box
				name="stockpileBase"
				options={{ width: 2, height: 0.2, depth: 2 }}
				positionX={0}
				positionY={-0.5}
				positionZ={0}
			>
				<standardMaterial name="baseMat" diffuseColor={baseColor} />
			</box>
		</transformNode>
	);
}
