/**
 * ECS Renderers
 *
 * Components that render ECS entities using Babylon.js via Reactylon.
 * These are stub implementations - visual geometry is handled by dedicated
 * Babylon.js mesh components elsewhere in the Entities directory.
 */

import { useEffect, useRef } from "react";
import { useScene } from "reactylon";
import {
	type Faction,
	instantiateMesh,
	type MeshId,
} from "../../systems/assembly/componentLibrary";
import type { Entity } from "../world";

// =============================================================================
// HEALTH BAR COMPONENT
// =============================================================================

interface HealthBarProps {
	current: number;
	max: number;
	width?: number;
	height?: number;
	yOffset?: number;
	color?: string;
}

export function HealthBar({
	current: _current,
	max: _max,
	width: _width = 1.4,
	height: _height = 0.08,
	yOffset: _yOffset = 2,
	color: _color = "#ff4400",
}: HealthBarProps) {
	// Health bar rendering is handled imperatively via Babylon.js GUI or mesh overlays.
	// Return null here; concrete implementations use Babylon.js AdvancedDynamicTexture or
	// billboard meshes created in useEffect.
	return null;
}

// =============================================================================
// GATOR RENDERER
// =============================================================================

interface GatorRendererProps {
	entity: Entity;
}

export function GatorRenderer({ entity: _entity }: GatorRendererProps) {
	// Gator mesh is created imperatively by the Babylon.js Gator entity component.
	return null;
}

// =============================================================================
// SCOUT RENDERER
// =============================================================================

interface ScoutRendererProps {
	entity: Entity;
}

export function ScoutRenderer({ entity: _entity }: ScoutRendererProps) {
	// Scout mesh is created imperatively by the Babylon.js Scout entity component.
	return null;
}

// =============================================================================
// HAZARD RENDERERS
// =============================================================================

interface HazardRendererProps {
	entity: Entity;
}

export function MudPitRenderer({ entity: _entity }: HazardRendererProps) {
	// Mud pit rendering is handled by the Babylon.js environment mesh system.
	return null;
}

export function ToxicSludgeRenderer({ entity: _entity }: HazardRendererProps) {
	// Toxic sludge rendering is handled by the Babylon.js environment mesh system.
	return null;
}

// =============================================================================
// EXTRACTION POINT RENDERER
// =============================================================================

export function ExtractionPointRenderer({ entity: _entity }: { entity: Entity }) {
	// Extraction point rendering is handled by the Babylon.js Objectives system.
	return null;
}

// =============================================================================
// COMPONENT LIBRARY MESH RENDERER
// =============================================================================

/**
 * Renders a mesh from the Component Library based on MeshId.
 * This bridges the DRY component system with the ECS using Babylon.js scene API.
 */
interface ComponentLibraryMeshProps {
	meshId: MeshId;
	faction?: Faction;
	materialType?: "WOOD" | "METAL" | "FABRIC" | "SKIN" | "PRIMARY" | "SECONDARY";
	position?: { x: number; y: number; z: number };
	rotation?: { x: number; y: number; z: number };
	scale?: { x: number; y: number; z: number };
	castShadow?: boolean;
	receiveShadow?: boolean;
}

export function ComponentLibraryMesh({
	meshId,
	faction = "URA",
	materialType = "PRIMARY",
	position,
	rotation,
	scale,
	castShadow = true,
	receiveShadow = true,
}: ComponentLibraryMeshProps) {
	const scene = useScene();
	const meshRef = useRef<ReturnType<typeof instantiateMesh>>(null);

	useEffect(() => {
		if (!scene) return;

		// instantiateMesh returns a THREE.Mesh; position/rotation/scale/shadow are applied
		// by the caller or a dedicated Babylon.js entity component.
		const mesh = instantiateMesh(meshId, faction, materialType);
		meshRef.current = mesh;

		if (mesh && position) {
			mesh.position.set(position.x, position.y, position.z);
		}
		if (mesh && rotation) {
			mesh.rotation.set(rotation.x, rotation.y, rotation.z);
		}
		if (mesh && scale) {
			mesh.scale.set(scale.x, scale.y, scale.z);
		}
		if (mesh) {
			mesh.castShadow = castShadow;
			mesh.receiveShadow = receiveShadow;
		}

		return () => {
			// THREE.Mesh geometry and material disposal handled by caller
		};
	}, [scene, meshId, faction, materialType, position, rotation, scale, castShadow, receiveShadow]);

	return null;
}

// =============================================================================
// STRUCTURE RENDERER (Using Component Library)
// =============================================================================

interface StructureRendererProps {
	entity: Entity;
	faction?: Faction;
}

/**
 * Renders a structure entity using the Component Library.
 * Falls back to basic rendering if specific meshes aren't available.
 */
export function StructureRenderer({ entity, faction = "NATIVE" }: StructureRendererProps) {
	if (!entity.transform || !entity.structure) return null;

	const { archetype } = entity.structure;

	// Determine which mesh to use based on archetype
	const getMeshId = (): MeshId | null => {
		switch (archetype) {
			case "BASIC_HUT":
			case "LONGHOUSE":
			case "MEDICAL_POST":
				return "WALL_BAMBOO_SLATS";
			case "WATCHTOWER":
				return "STILT_ROUND";
			default:
				return null;
		}
	};

	const meshId = getMeshId();
	if (!meshId) return null;

	return (
		<ComponentLibraryMesh
			meshId={meshId}
			faction={faction}
			position={entity.transform.position}
			rotation={entity.transform.rotation}
			scale={entity.transform.scale}
		/>
	);
}

// =============================================================================
// PATH RENDERER
// =============================================================================

interface PathRendererProps {
	entity: Entity;
}

export function PathRenderer({ entity: _entity }: PathRendererProps) {
	// Path rendering is handled by the Babylon.js environment mesh system.
	return null;
}
