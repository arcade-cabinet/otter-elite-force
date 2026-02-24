import { Color3 } from "@babylonjs/core";

const IRON = new Color3(0.13, 0.13, 0.13);
const STONE = new Color3(0.07, 0.07, 0.07);
const RESCUE_GREEN = new Color3(0, 1, 0.3);
const RESCUE_GLOW = new Color3(0, 0.5, 0.17);

export function PrisonCage({
	position,
	rescued = false,
}: {
	position: [number, number, number];
	rescued?: boolean;
}) {
	return (
		<transformNode
			name="prisonCage"
			positionX={position[0]}
			positionY={position[1]}
			positionZ={position[2]}
		>
			{/* Base platform */}
			<box name="cageBase" options={{ width: 2.5, height: 0.2, depth: 2.5 }} positionY={-0.1}>
				<standardMaterial name="cageBaseMat" diffuseColor={STONE} />
			</box>

			{/* Cage bars - visible when not rescued */}
			{!rescued && (
				<>
					<box
						name="barFL"
						options={{ width: 0.1, height: 3, depth: 0.1 }}
						positionX={-0.9}
						positionY={1.5}
						positionZ={-0.9}
					>
						<standardMaterial name="barFL_mat" diffuseColor={IRON} />
					</box>
					<box
						name="barFR"
						options={{ width: 0.1, height: 3, depth: 0.1 }}
						positionX={0.9}
						positionY={1.5}
						positionZ={-0.9}
					>
						<standardMaterial name="barFR_mat" diffuseColor={IRON} />
					</box>
					<box
						name="barBL"
						options={{ width: 0.1, height: 3, depth: 0.1 }}
						positionX={-0.9}
						positionY={1.5}
						positionZ={0.9}
					>
						<standardMaterial name="barBL_mat" diffuseColor={IRON} />
					</box>
					<box
						name="barBR"
						options={{ width: 0.1, height: 3, depth: 0.1 }}
						positionX={0.9}
						positionY={1.5}
						positionZ={0.9}
					>
						<standardMaterial name="barBR_mat" diffuseColor={IRON} />
					</box>
					<box
						name="topFront"
						options={{ width: 2.0, height: 0.1, depth: 0.1 }}
						positionY={3.0}
						positionZ={-0.9}
					>
						<standardMaterial name="topFront_mat" diffuseColor={IRON} />
					</box>
					<box
						name="topBack"
						options={{ width: 2.0, height: 0.1, depth: 0.1 }}
						positionY={3.0}
						positionZ={0.9}
					>
						<standardMaterial name="topBack_mat" diffuseColor={IRON} />
					</box>
				</>
			)}

			{/* Rescue indicator */}
			{rescued && (
				<box name="rescueMarker" options={{ width: 0.3, height: 0.3, depth: 0.3 }} positionY={0.5}>
					<standardMaterial
						name="rescueMat"
						diffuseColor={RESCUE_GREEN}
						emissiveColor={RESCUE_GLOW}
					/>
				</box>
			)}
		</transformNode>
	);
}
