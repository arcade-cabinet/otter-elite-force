/**
 * Chunk Renderer
 * Renders individual world chunks with terrain, water, decorations, and entities.
 * Uses strata Water component for water rendering.
 */

import { Water } from "@strata-game-library/core/components";
import * as THREE from "three";
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
import { ModularHut } from "../../../Entities/ModularHut";
import { ExtractionPoint } from "../../../Entities/Objectives/Clam";
import { Siphon } from "../../../Entities/Objectives/Siphon";
import { Raft } from "../../../Entities/Raft";
import { Villager } from "../../../Entities/Villager";
import { CHUNK_SIZE, type ChunkData, useGameStore } from "../../../stores/gameStore";

export function GasStockpile({
	position,
	secured = false,
}: {
	position: THREE.Vector3;
	secured?: boolean;
}) {
	return (
		<group position={position}>
			{[
				[-0.5, 0, 0],
				[0.5, 0, 0],
				[0, 0, 0.5],
			].map((pos, i) => (
				<mesh key={i} position={pos as [number, number, number]} castShadow receiveShadow>
					<cylinderGeometry args={[0.4, 0.4, 1.2, 32]} />
					<meshStandardMaterial color={secured ? "#2d3d19" : "#d32f2f"} metalness={0.5} />
				</mesh>
			))}
			<mesh position={[0, -0.5, 0]} receiveShadow>
				<boxGeometry args={[2, 0.2, 2]} />
				<meshStandardMaterial color="#3d2b1f" />
			</mesh>
		</group>
	);
}

export function ClamBasket({
	position,
	isTrap = false,
}: {
	position: THREE.Vector3;
	isTrap?: boolean;
}) {
	return (
		<group position={position}>
			<mesh castShadow receiveShadow>
				<cylinderGeometry args={[0.6, 0.5, 0.5, 32]} />
				<meshStandardMaterial color="#5d4037" />
			</mesh>
			{isTrap && <pointLight color="#ff0000" intensity={0.2} distance={2} />}
		</group>
	);
}

export function PrisonCage({
	position,
	rescued = false,
}: {
	position: THREE.Vector3;
	rescued?: boolean;
}) {
	return (
		<group position={position}>
			{!rescued && (
				<mesh castShadow>
					<boxGeometry args={[2, 3, 2]} />
					<meshStandardMaterial color="#222" wireframe />
				</mesh>
			)}
			<mesh position={[0, -0.1, 0]} receiveShadow>
				<boxGeometry args={[2.5, 0.2, 2.5]} />
				<meshStandardMaterial color="#111" />
			</mesh>
		</group>
	);
}

export function ChunkRenderer({ data, playerPos }: { data: ChunkData; playerPos: THREE.Vector3 }) {
	const chunkX = data.x * CHUNK_SIZE;
	const chunkZ = data.z * CHUNK_SIZE;

	return (
		<group position={[chunkX, 0, chunkZ]}>
			{/* Ground base */}
			<mesh position={[0, -2.5, 0]} receiveShadow>
				<boxGeometry args={[CHUNK_SIZE, 5, CHUNK_SIZE]} />
				<meshStandardMaterial color="#1a1208" />
			</mesh>

			{/* Terrain surface */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
				<planeGeometry args={[CHUNK_SIZE, CHUNK_SIZE]} />
				<meshStandardMaterial color="#2d5016" />
			</mesh>

			{/* Strata Water component - murky swamp water */}
			<Water
				position={[0, 0.1, 0]}
				size={CHUNK_SIZE}
				segments={16}
				color={0x4d4233}
				opacity={0.7}
				waveSpeed={0.5}
				waveHeight={0.1}
			/>

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
				const worldPos = new THREE.Vector3(
					chunkX + entity.position[0],
					entity.position[1],
					chunkZ + entity.position[2],
				);
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
						/>
					);
				if (entity.type === "SNAKE")
					return (
						<Snake
							key={entity.id}
							data={{ id: entity.id, position: worldPos, hp: 2, maxHp: 2, suppression: 0 }}
							targetPosition={playerPos}
						/>
					);
				if (entity.type === "SNAPPER")
					return (
						<Snapper
							key={entity.id}
							data={{ id: entity.id, position: worldPos, hp: 20, maxHp: 20, suppression: 0 }}
							targetPosition={playerPos}
						/>
					);
				if (entity.type === "PLATFORM")
					return (
						<mesh key={entity.id} position={worldPos} castShadow receiveShadow>
							<boxGeometry args={[5, 1, 5]} />
							<meshStandardMaterial color="#3d2b1f" />
						</mesh>
					);
				if (entity.type === "CLIMBABLE")
					return (
						<mesh key={entity.id} position={worldPos} castShadow receiveShadow>
							<cylinderGeometry args={[0.8, 1, 10, 32]} />
							<meshStandardMaterial color="#2d1f15" />
						</mesh>
					);
				if (entity.type === "SIPHON")
					return <Siphon key={entity.id} position={worldPos} secured={data.secured} />;
				if (entity.type === "GAS_STOCKPILE")
					return <GasStockpile key={entity.id} position={worldPos} secured={data.secured} />;
				if (entity.type === "CLAM_BASKET")
					return <ClamBasket key={entity.id} position={worldPos} isTrap={entity.isHeavy} />;
				if (entity.type === "EXTRACTION_POINT")
					return <ExtractionPoint key={entity.id} position={worldPos} />;
				if (entity.type === "VILLAGER") return <Villager key={entity.id} position={worldPos} />;
				if (entity.type === "HEALER") return <Villager key={entity.id} position={worldPos} />;
				if (entity.type === "HUT")
					return <ModularHut key={entity.id} position={worldPos} seed={data.seed} />;
				if (entity.type === "PRISON_CAGE")
					return <PrisonCage key={entity.id} position={worldPos} rescued={entity.rescued} />;
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
		</group>
	);
}
