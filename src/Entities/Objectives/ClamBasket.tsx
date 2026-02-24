import { Color3, Vector3 } from "@babylonjs/core";

export function ClamBasket({
	position,
	isTrap = false,
}: {
	position: [number, number, number];
	isTrap?: boolean;
}) {
	return (
		<transformNode
			name="clamBasket"
			positionX={position[0]}
			positionY={position[1]}
			positionZ={position[2]}
		>
			<cylinder
				name="basketBody"
				options={{ diameterTop: 1.2, diameterBottom: 1.0, height: 0.5, tessellation: 8 }}
				positionX={0}
				positionY={0}
				positionZ={0}
			>
				<standardMaterial name="basketMat" diffuseColor={new Color3(0.365, 0.251, 0.216)} />
			</cylinder>
			{isTrap && (
				<pointLight
					name="trapLight"
					position={new Vector3(0, 0.5, 0)}
					diffuse={new Color3(1, 0, 0)}
					specular={new Color3(1, 0, 0)}
					intensity={0.2}
					range={2}
				/>
			)}
		</transformNode>
	);
}
