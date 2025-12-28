import type { SeededRandom } from "./random";
import type { WorldPoint } from "./types";

/**
 * Creates a connected graph of paths between points using Prim's MST algorithm
 * This ensures all areas are reachable
 */
export function generatePaths(
	points: Map<string, WorldPoint>,
	random: SeededRandom,
): Array<{ from: string; to: string }> {
	const pointIds = Array.from(points.keys());
	if (pointIds.length < 2) return [];

	const edges: Array<{ from: string; to: string; weight: number }> = [];

	// Calculate all possible edges with weights (distance + randomness for variety)
	for (let i = 0; i < pointIds.length; i++) {
		for (let j = i + 1; j < pointIds.length; j++) {
			const p1 = points.get(pointIds[i])!;
			const p2 = points.get(pointIds[j])!;
			const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.z - p2.z) ** 2);
			// Add some randomness to avoid always picking the absolute shortest
			const weight = distance * (0.8 + random.next() * 0.4);
			edges.push({ from: pointIds[i], to: pointIds[j], weight });
		}
	}

	// Sort edges by weight
	edges.sort((a, b) => a.weight - b.weight);

	// Prim's algorithm for MST
	const mstEdges: Array<{ from: string; to: string }> = [];
	const inMST = new Set<string>();
	inMST.add(pointIds[0]); // Start from LZ

	while (inMST.size < pointIds.length) {
		// Find cheapest edge connecting MST to non-MST vertex
		for (const edge of edges) {
			const fromIn = inMST.has(edge.from);
			const toIn = inMST.has(edge.to);

			if (fromIn !== toIn) {
				// One end in MST, one end outside
				mstEdges.push({ from: edge.from, to: edge.to });
				inMST.add(edge.from);
				inMST.add(edge.to);
				break;
			}
		}
	}

	// Add a few extra edges for alternative routes (not strictly tree)
	const extraEdgeCount = Math.floor(pointIds.length * 0.2);
	const shuffledEdges = random.shuffle(edges);
	let added = 0;

	for (const edge of shuffledEdges) {
		if (added >= extraEdgeCount) break;

		// Check if this edge already exists
		const exists = mstEdges.some(
			(e) =>
				(e.from === edge.from && e.to === edge.to) || (e.from === edge.to && e.to === edge.from),
		);

		if (!exists && edge.weight < 30) {
			// Only add shorter alternate routes
			mstEdges.push({ from: edge.from, to: edge.to });
			added++;
		}
	}

	return mstEdges;
}
