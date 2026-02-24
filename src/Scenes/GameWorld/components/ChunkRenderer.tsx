import { Color3, Vector3 } from "@babylonjs/core";
import { useEffect, useRef } from "react";
import { useScene } from "reactylon";
import { Gator } from "../../../Entities/Enemies/Gator";
import { Snake } from "../../../Entities/Enemies/Snake";
import { Snapper } from "../../../Entities/Enemies/Snapper";
import {
	BurntTrees,
	Debris,
	FloatingDrums,
	Lilypads,
	Mangroves,
	Reeds,
} from "../../../Entities/Environment";
import { ExtractionPoint } from "../../../Entities/ExtractionPoint";
import { ModularHut } from "../../../Entities/ModularHut";
import { Siphon } from "../../../Entities/Objectives/Siphon";
import { Raft } from "../../../Entities/Raft";
import { Villager } from "../../../Entities/Villager";
import { CHUNK_SIZE, type ChunkData, useGameStore } from "../../../stores/gameStore";

// ---------------------------------------------------------------------------
// GasStockpile
// ---------------------------------------------------------------------------
export function GasStockpile({
	position,
	secured = false,
}: {
	position: [number, number, number];
	secured?: boolean;
}) {
	const color = secured ? new Color3(0.18, 0.24, 0.1) : new Color3(0.83, 0.18, 0.18);
	return (
		<transformNode
			name="gasStockpile"
			positionX={position[0]}
			positionY={position[1]}
			positionZ={position[2]}
		>
			{(
				[
					[-0.5, 0, 0],
					[0.5, 0, 0],
					[0, 0, 0.5],
				] as [number, number, number][]
			).map((pos, i) => (
				<cylinder
					key={i}
					name={`barrel-${i}`}
					options={{ diameter: 0.8, height: 1.2, tessellation: 32 }}
					positionX={pos[0]}
					positionY={pos[1]}
					positionZ={pos[2]}
				>
					<standardMaterial name={`barrelMat-${i}`} diffuseColor={color} />
				</cylinder>
			))}
			<box
				name="gasBase"
				options={{ width: 2, height: 0.2, depth: 2 }}
				positionX={0}
				positionY={-0.5}
				positionZ={0}
			>
				<standardMaterial name="gasBaseMat" diffuseColor={new Color3(0.24, 0.17, 0.12)} />
			</box>
		</transformNode>
	);
}

// ---------------------------------------------------------------------------
// ClamBasket
// ---------------------------------------------------------------------------
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
				name="basket"
				options={{ diameterTop: 1.2, diameterBottom: 1.0, height: 0.5, tessellation: 32 }}
				positionX={0}
				positionY={0}
				positionZ={0}
			>
				<standardMaterial name="basketMat" diffuseColor={new Color3(0.36, 0.25, 0.15)} />
			</cylinder>
			{isTrap && (
				<pointLight
					name="trapLight"
					diffuse={new Color3(1, 0, 0)}
					specular={new Color3(1, 0, 0)}
					intensity={0.2}
					range={2}
					position={new Vector3(0, 0, 0)}
				/>
			)}
		</transformNode>
	);
}

// ---------------------------------------------------------------------------
// PrisonCage
// ---------------------------------------------------------------------------
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
			{!rescued && (
				<box
					name="cage"
					options={{ width: 2, height: 3, depth: 2 }}
					positionX={0}
					positionY={0}
					positionZ={0}
				>
					<standardMaterial name="cageMat" diffuseColor={new Color3(0.13, 0.13, 0.13)} wireframe />
				</box>
			)}
			<box
				name="cageBase"
				options={{ width: 2.5, height: 0.2, depth: 2.5 }}
				positionX={0}
				positionY={-0.1}
				positionZ={0}
			>
				<standardMaterial name="cageBaseMat" diffuseColor={new Color3(0.07, 0.07, 0.07)} />
			</box>
		</transformNode>
	);
}

// ---------------------------------------------------------------------------
// WaterPlane - animated water surface
// ---------------------------------------------------------------------------
function WaterPlane({ chunkSize, id }: { chunkSize: number; id: string }) {
	const scene = useScene();
	// Animate specular power to simulate water shimmer
	const timeRef = useRef(0);

	useEffect(() => {
		if (!scene) return;
		const observer = scene.onBeforeRenderObservable.add(() => {
			timeRef.current = performance.now() / 1000;
		});
		return () => {
			scene.onBeforeRenderObservable.remove(observer);
		};
	}, [scene]);

	return (
		<ground
			name={`waterPlane-${id}`}
			options={{ width: chunkSize, height: chunkSize }}
			positionX={0}
			positionY={0.1}
			positionZ={0}
		>
			<standardMaterial
				name={`waterMat-${id}`}
				diffuseColor={new Color3(0.3, 0.26, 0.2)}
				alpha={0.7}
				specularColor={new Color3(0.6, 0.6, 0.6)}
			/>
		</ground>
	);
}

// ---------------------------------------------------------------------------
// ChunkRenderer
// ---------------------------------------------------------------------------
export function ChunkRenderer({ data, playerPos }: { data: ChunkData; playerPos: Vector3 }) {
	const chunkX = data.x * CHUNK_SIZE;
	const chunkZ = data.z * CHUNK_SIZE;
	const addResources = useGameStore((state) => state.addResources);

	return (
		<transformNode name={`chunk-${data.id}`} positionX={chunkX} positionY={0} positionZ={chunkZ}>
			{/* Terrain base */}
			<box
				name={`terrain-${data.id}`}
				options={{ width: CHUNK_SIZE, height: 5, depth: CHUNK_SIZE }}
				positionX={0}
				positionY={-2.5}
				positionZ={0}
			>
				<standardMaterial
					name={`terrainMat-${data.id}`}
					diffuseColor={new Color3(0.1, 0.07, 0.03)}
				/>
			</box>

			{/* Ground surface */}
			<ground
				name={`ground-${data.id}`}
				options={{ width: CHUNK_SIZE, height: CHUNK_SIZE }}
				positionX={0}
				positionY={0}
				positionZ={0}
			>
				<standardMaterial
					name={`groundMat-${data.id}`}
					diffuseColor={new Color3(0.18, 0.31, 0.09)}
				/>
			</ground>

			{/* Animated water surface */}
			<WaterPlane chunkSize={CHUNK_SIZE} id={data.id} />

			{/* Decorations */}
			{data.decorations.map((dec) => {
				const key = dec.id;
				if (dec.type === "REED") return <Reeds key={key} count={dec.count} seed={data.seed} />;
				if (dec.type === "LILYPAD")
					return <Lilypads key={key} count={dec.count} seed={data.seed} />;
				if (dec.type === "MANGROVE")
					return <Mangroves key={key} count={dec.count} seed={data.seed} />;
				if (dec.type === "BURNT_TREE")
					return <BurntTrees key={key} count={dec.count} seed={data.seed} />;
				if (dec.type === "DRUM")
					return <FloatingDrums key={key} count={dec.count} seed={data.seed} />;
				if (dec.type === "DEBRIS") return <Debris key={key} count={dec.count} seed={data.seed} />;
				return null;
			})}

			{/* Entities */}
			{data.entities.map((entity) => {
				const wx = chunkX + entity.position[0];
				const wy = entity.position[1];
				const wz = chunkZ + entity.position[2];
				const worldPos = new Vector3(wx, wy, wz);
				const worldPosArr: [number, number, number] = [wx, wy, wz];

				if (entity.type === "GATOR")
					return (
						<Gator
							key={entity.id}
							data={{
								id: entity.id,
								position: worldPos,
								hp: entity.hp || 10,
								maxHp: 10,
								state: "IDLE",
								suppression: entity.suppression || 0,
								isHeavy: entity.isHeavy ?? false,
							}}
							targetPosition={playerPos}
							onDeath={() => {
								addResources({ wood: 5, metal: 2, supplies: 1 });
								useGameStore.getState().addKill();
							}}
						/>
					);
				if (entity.type === "SNAKE")
					return (
						<Snake
							key={entity.id}
							data={{
								id: entity.id,
								position: worldPos,
								hp: 2,
								maxHp: 2,
								suppression: 0,
							}}
							targetPosition={playerPos}
							onDeath={() => {
								addResources({ wood: 2, metal: 0, supplies: 1 });
								useGameStore.getState().addKill();
							}}
						/>
					);
				if (entity.type === "SNAPPER")
					return (
						<Snapper
							key={entity.id}
							data={{
								id: entity.id,
								position: worldPos,
								hp: 20,
								maxHp: 20,
								suppression: 0,
							}}
							targetPosition={playerPos}
							onDeath={() => {
								addResources({ wood: 10, metal: 5, supplies: 3 });
								useGameStore.getState().addKill();
							}}
						/>
					);
				if (entity.type === "PLATFORM")
					return (
						<box
							key={entity.id}
							name={`platform-${entity.id}`}
							options={{ width: 5, height: 1, depth: 5 }}
							positionX={wx}
							positionY={wy}
							positionZ={wz}
						>
							<standardMaterial
								name={`platMat-${entity.id}`}
								diffuseColor={new Color3(0.24, 0.17, 0.12)}
							/>
						</box>
					);
				if (entity.type === "CLIMBABLE")
					return (
						<cylinder
							key={entity.id}
							name={`climbable-${entity.id}`}
							options={{
								diameterTop: 1.6,
								diameterBottom: 2.0,
								height: 10,
								tessellation: 32,
							}}
							positionX={wx}
							positionY={wy}
							positionZ={wz}
						>
							<standardMaterial
								name={`climbMat-${entity.id}`}
								diffuseColor={new Color3(0.18, 0.12, 0.08)}
							/>
						</cylinder>
					);
				if (entity.type === "SIPHON")
					return <Siphon key={entity.id} position={worldPosArr} secured={data.secured} />;
				if (entity.type === "GAS_STOCKPILE")
					return <GasStockpile key={entity.id} position={worldPosArr} secured={data.secured} />;
				if (entity.type === "CLAM_BASKET")
					return <ClamBasket key={entity.id} position={worldPosArr} isTrap={entity.isHeavy} />;
				if (entity.type === "EXTRACTION_POINT")
					return <ExtractionPoint key={entity.id} position={worldPosArr} />;
				if (entity.type === "VILLAGER") return <Villager key={entity.id} position={worldPosArr} />;
				if (entity.type === "HEALER") return <Villager key={entity.id} position={worldPosArr} />;
				if (entity.type === "HUT")
					return <ModularHut key={entity.id} position={worldPosArr} seed={data.seed} />;
				if (entity.type === "PRISON_CAGE")
					return <PrisonCage key={entity.id} position={worldPosArr} rescued={entity.rescued} />;
				if (entity.type === "RAFT") {
					const isThisRaft = useGameStore.getState().raftId === entity.id;
					return (
						<Raft
							key={entity.id}
							position={isThisRaft ? [0, 0, 0] : [worldPos.x, worldPos.y, worldPos.z]}
							isPiloted={isThisRaft}
						/>
					);
				}
				return null;
			})}
		</transformNode>
	);
}
