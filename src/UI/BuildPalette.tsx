/**
 * Build Palette Component
 *
 * Displays a grid of buildable items with costs and availability.
 * Shows when build mode is active.
 */

import { useCallback, useMemo } from "react";
import { BUILDABLE_TEMPLATES, type BuildableTemplate } from "../ecs/data/buildableTemplates";
import { useGameStore } from "../stores/gameStore";

interface BuildPaletteProps {
	onSelectItem: (item: BuildableTemplate) => void;
	onClose: () => void;
}

export function BuildPalette({ onSelectItem, onClose }: BuildPaletteProps) {
	const { saveData } = useGameStore();

	// Filter to unlocked items
	const unlockedItems = BUILDABLE_TEMPLATES.filter(
		(item) =>
			!item.unlockRequirement ||
			saveData.territoryScore >= parseInt(item.unlockRequirement.match(/\d+/)?.[0] || "0", 10),
	);

	// Group by category
	const categories: Record<string, BuildableTemplate[]> = {
		FOUNDATION: [],
		WALLS: [],
		ROOF: [],
		DEFENSE: [],
		UTILITY: [],
		COMFORT: [],
	};

	for (const item of unlockedItems) {
		categories[item.category].push(item);
	}

	// Get player resources (memoized to avoid hook dependency issues)
	const resources = useMemo(
		() => ({
			wood: saveData.resources?.wood || 100,
			metal: saveData.resources?.metal || 20,
			supplies: saveData.resources?.supplies || 30,
		}),
		[saveData.resources],
	);

	const canAfford = useCallback(
		(item: BuildableTemplate) => {
			return (
				resources.wood >= item.cost.wood &&
				resources.metal >= item.cost.metal &&
				resources.supplies >= item.cost.supplies
			);
		},
		[resources],
	);

	return (
		<div className="build-palette-overlay">
			<div className="build-palette">
				<div className="build-palette-header">
					<h2>BUILD MODE</h2>
					<button type="button" onClick={onClose} className="close-btn">
						✕
					</button>
				</div>

				<div className="resource-display">
					<div className="resource-item">
						<span className="resource-icon">🪵</span>
						<span className="resource-amount">{resources.wood}</span>
					</div>
					<div className="resource-item">
						<span className="resource-icon">⚙️</span>
						<span className="resource-amount">{resources.metal}</span>
					</div>
					<div className="resource-item">
						<span className="resource-icon">📦</span>
						<span className="resource-amount">{resources.supplies}</span>
					</div>
				</div>

				<div className="build-palette-content">
					{Object.entries(categories).map(([category, items]) => {
						if (items.length === 0) return null;

						return (
							<div key={category} className="build-category">
								<h3 className="category-title">{category.replace("_", " ")}</h3>
								<div className="build-grid">
									{items.map((item) => {
										const affordable = canAfford(item);
										return (
											<button
												key={item.id}
												type="button"
												className={`build-item ${!affordable ? "disabled" : ""}`}
												onClick={() => affordable && onSelectItem(item)}
												disabled={!affordable}
											>
												<div className="item-icon">🏗️</div>
												<div className="item-name">{item.name}</div>
												<div className="item-cost">
													{item.cost.wood > 0 && <span>🪵{item.cost.wood}</span>}
													{item.cost.metal > 0 && <span>⚙️{item.cost.metal}</span>}
													{item.cost.supplies > 0 && <span>📦{item.cost.supplies}</span>}
												</div>
											</button>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
