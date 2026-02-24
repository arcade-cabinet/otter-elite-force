/**
 * Platform Entity
 * Elevated wooden platform for tactical positioning
 * Authentic Vietnam-era stilted construction
 */

import { Color3 } from "@babylonjs/core";

interface PlatformProps {
	positionX?: number;
	positionY?: number;
	positionZ?: number;
	width?: number;
	depth?: number;
	height?: number;
}

export function Platform({
	positionX = 0,
	positionY = 0,
	positionZ = 0,
	width = 5,
	depth = 5,
	height = 2,
}: PlatformProps) {
	const plankColor = new Color3(0.365, 0.251, 0.216);
	const stiltColor = new Color3(0.239, 0.165, 0.122);
	const ropeColor = new Color3(0.545, 0.451, 0.333);

	const plankCount = Math.ceil(width / 0.4);
	const planks = Array.from({ length: plankCount }, (_, i) => ({
		x: -width / 2 + i * 0.4 + 0.2,
	}));

	const beamZPositions = [-depth / 3, 0, depth / 3];

	const stiltPositions = [
		{ x: -width / 2 + 0.2, z: -depth / 2 + 0.2 },
		{ x: width / 2 - 0.2, z: -depth / 2 + 0.2 },
		{ x: -width / 2 + 0.2, z: depth / 2 - 0.2 },
		{ x: width / 2 - 0.2, z: depth / 2 - 0.2 },
	];

	const rungCount = Math.ceil(height / 0.4);
	const rungs = Array.from({ length: rungCount }, (_, i) => ({
		y: -height / 2 + 0.3 + i * 0.4,
	}));

	const railPostXPositions = [-width / 2 + 0.3, 0, width / 2 - 0.3];

	return (
		<transformNode
			name="platform"
			positionX={positionX}
			positionY={positionY}
			positionZ={positionZ}
		>
			{/* Main deck planks */}
			<transformNode name="deck" positionY={height}>
				{planks.map((p, i) => (
					<box
						key={i}
						name={`plank-${i}`}
						options={{ width: 0.35, height: 0.08, depth: depth }}
						positionX={p.x}
						positionY={0}
						positionZ={0}
					>
						<standardMaterial name={`plankMat-${i}`} diffuseColor={plankColor} />
					</box>
				))}

				{/* Support beams underneath deck */}
				{beamZPositions.map((z, i) => (
					<box
						key={i}
						name={`beam-${i}`}
						options={{ width: width, height: 0.12, depth: 0.2 }}
						positionX={0}
						positionY={-0.1}
						positionZ={z}
					>
						<standardMaterial name={`beamMat-${i}`} diffuseColor={stiltColor} />
					</box>
				))}
			</transformNode>

			{/* Corner stilts */}
			{stiltPositions.map((sp, i) => (
				<transformNode
					key={i}
					name={`stiltGroup-${i}`}
					positionX={sp.x}
					positionY={height / 2}
					positionZ={sp.z}
				>
					<cylinder
						name={`stilt-${i}`}
						options={{ diameterTop: 0.24, diameterBottom: 0.3, height: height, tessellation: 8 }}
						positionX={0}
						positionY={0}
						positionZ={0}
					>
						<standardMaterial name={`stiltMat-${i}`} diffuseColor={stiltColor} />
					</cylinder>
					{i < 2 && (
						<cylinder
							name={`brace-${i}`}
							options={{
								diameterTop: 0.08,
								diameterBottom: 0.08,
								height: height * 0.7,
								tessellation: 6,
							}}
							positionX={0}
							positionY={0}
							positionZ={depth / 2 - 0.2}
							rotationX={Math.PI / 6}
						>
							<standardMaterial name={`braceMat-${i}`} diffuseColor={stiltColor} />
						</cylinder>
					)}
				</transformNode>
			))}

			{/* Rope bindings at top of stilts */}
			{stiltPositions.map((sp, i) => (
				<cylinder
					key={i}
					name={`rope-${i}`}
					options={{ diameterTop: 0.33, diameterBottom: 0.33, height: 0.05, tessellation: 12 }}
					positionX={sp.x}
					positionY={height - 0.1}
					positionZ={sp.z}
					rotationX={Math.PI / 2}
				>
					<standardMaterial name={`ropeMat-${i}`} diffuseColor={ropeColor} />
				</cylinder>
			))}

			{/* Ladder */}
			<transformNode
				name="ladder"
				positionX={width / 2 + 0.15}
				positionY={height / 2}
				positionZ={0}
				rotationZ={0.15}
			>
				{/* Rails */}
				{[-0.15, 0.15].map((x, i) => (
					<box
						key={i}
						name={`ladderRail-${i}`}
						options={{ width: 0.06, height: height + 0.5, depth: 0.06 }}
						positionX={x}
						positionY={0}
						positionZ={0}
					>
						<standardMaterial name={`ladderRailMat-${i}`} diffuseColor={stiltColor} />
					</box>
				))}
				{/* Rungs */}
				{rungs.map((r, i) => (
					<box
						key={i}
						name={`rung-${i}`}
						options={{ width: 0.3, height: 0.05, depth: 0.05 }}
						positionX={0}
						positionY={r.y}
						positionZ={0}
					>
						<standardMaterial name={`rungMat-${i}`} diffuseColor={plankColor} />
					</box>
				))}
			</transformNode>

			{/* Railing on one side */}
			<transformNode
				name="railing"
				positionX={0}
				positionY={height + 0.5}
				positionZ={-depth / 2 + 0.1}
			>
				{/* Posts */}
				{railPostXPositions.map((x, i) => (
					<box
						key={i}
						name={`railPost-${i}`}
						options={{ width: 0.08, height: 0.6, depth: 0.08 }}
						positionX={x}
						positionY={0}
						positionZ={0}
					>
						<standardMaterial name={`railPostMat-${i}`} diffuseColor={stiltColor} />
					</box>
				))}
				{/* Top rail */}
				<box
					name="topRail"
					options={{ width: width - 0.3, height: 0.06, depth: 0.06 }}
					positionX={0}
					positionY={0.25}
					positionZ={0}
				>
					<standardMaterial name="topRailMat" diffuseColor={plankColor} />
				</box>
			</transformNode>
		</transformNode>
	);
}
