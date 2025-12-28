/**
 * BuildPalette Component Tests
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BuildPalette } from "../BuildPalette";
import { useGameStore } from "../../stores/gameStore";

describe("BuildPalette", () => {
	const mockOnSelectItem = vi.fn();
	const mockOnClose = vi.fn();

	beforeEach(() => {
		// Reset store to default state
		useGameStore.setState({
			saveData: {
				...useGameStore.getState().saveData,
				territoryScore: 0,
				resources: {
					wood: 100,
					metal: 20,
					supplies: 30,
				},
			},
		});
		mockOnSelectItem.mockClear();
		mockOnClose.mockClear();
	});

	describe("Rendering", () => {
		it("renders the build palette overlay", () => {
			render(<BuildPalette onSelectItem={mockOnSelectItem} onClose={mockOnClose} />);
			expect(screen.getByText("BUILD MODE")).toBeInTheDocument();
		});

		it("displays current resources", () => {
			render(<BuildPalette onSelectItem={mockOnSelectItem} onClose={mockOnClose} />);
			expect(screen.getByText("100")).toBeInTheDocument(); // wood
			expect(screen.getByText("20")).toBeInTheDocument(); // metal
			expect(screen.getByText("30")).toBeInTheDocument(); // supplies
		});

		it("renders close button", () => {
			render(<BuildPalette onSelectItem={mockOnSelectItem} onClose={mockOnClose} />);
			const closeBtn = screen.getByRole("button", { name: "✕" });
			expect(closeBtn).toBeInTheDocument();
		});

		it("displays buildable items by category", () => {
			render(<BuildPalette onSelectItem={mockOnSelectItem} onClose={mockOnClose} />);
			
			// Check for category titles
			expect(screen.getByText("FOUNDATION")).toBeInTheDocument();
			expect(screen.getByText("WALLS")).toBeInTheDocument();
			expect(screen.getByText("DEFENSE")).toBeInTheDocument();
		});

		it("displays at least 5 buildable items", () => {
			const { container } = render(<BuildPalette onSelectItem={mockOnSelectItem} onClose={mockOnClose} />);
			
			const buildItems = container.querySelectorAll(".build-item");
			expect(buildItems.length).toBeGreaterThanOrEqual(5);
		});
	});

	describe("Resource Affordability", () => {
		it("enables items that player can afford", () => {
			render(<BuildPalette onSelectItem={mockOnSelectItem} onClose={mockOnClose} />);
			
			// Floor section costs 10 wood - should be affordable
			const floorButton = screen.getByRole("button", { name: /Floor Section/i });
			expect(floorButton).not.toBeDisabled();
			expect(floorButton).not.toHaveClass("disabled");
		});

		it("disables items that player cannot afford", () => {
			// Set resources to low values
			useGameStore.setState({
				saveData: {
					...useGameStore.getState().saveData,
					resources: {
						wood: 1,
						metal: 0,
						supplies: 0,
					},
				},
			});

			render(<BuildPalette onSelectItem={mockOnSelectItem} onClose={mockOnClose} />);
			
			// Most items should be disabled
			const buildItems = document.querySelectorAll(".build-item");
			const disabledItems = Array.from(buildItems).filter((item) =>
				item.classList.contains("disabled"),
			);
			expect(disabledItems.length).toBeGreaterThan(0);
		});

		it("shows items with unlock requirements when territory score is high enough", () => {
			useGameStore.setState({
				saveData: {
					...useGameStore.getState().saveData,
					territoryScore: 3,
				},
			});

			render(<BuildPalette onSelectItem={mockOnSelectItem} onClose={mockOnClose} />);
			
			// Watchtower requires "Secure 2 Territories" - should show with score 3
			expect(screen.getByText(/Watchtower/i)).toBeInTheDocument();
		});
	});

	describe("Item Display", () => {
		it("displays item name for each buildable", () => {
			render(<BuildPalette onSelectItem={mockOnSelectItem} onClose={mockOnClose} />);
			
			expect(screen.getByText("Floor Section")).toBeInTheDocument();
			expect(screen.getByText("Stilt Support")).toBeInTheDocument();
		});

		it("displays resource costs for items", () => {
			const { container } = render(<BuildPalette onSelectItem={mockOnSelectItem} onClose={mockOnClose} />);
			
			const costDisplays = container.querySelectorAll(".item-cost");
			expect(costDisplays.length).toBeGreaterThan(0);
		});

		it("groups items by category", () => {
			const { container } = render(<BuildPalette onSelectItem={mockOnSelectItem} onClose={mockOnClose} />);
			
			const categories = container.querySelectorAll(".build-category");
			// Should have multiple categories
			expect(categories.length).toBeGreaterThan(1);
		});
	});

	describe("Interactions", () => {
		it("calls onClose when close button clicked", () => {
			render(<BuildPalette onSelectItem={mockOnSelectItem} onClose={mockOnClose} />);
			
			const closeBtn = screen.getByRole("button", { name: "✕" });
			fireEvent.click(closeBtn);
			
			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});

		it("calls onSelectItem when affordable item clicked", () => {
			render(<BuildPalette onSelectItem={mockOnSelectItem} onClose={mockOnClose} />);
			
			const floorButton = screen.getByRole("button", { name: /Floor Section/i });
			fireEvent.click(floorButton);
			
			expect(mockOnSelectItem).toHaveBeenCalledTimes(1);
			expect(mockOnSelectItem).toHaveBeenCalledWith(
				expect.objectContaining({
					id: "floor-section",
					name: "Floor Section",
				}),
			);
		});

		it("does not call onSelectItem when unaffordable item clicked", () => {
			// Set resources to low values
			useGameStore.setState({
				saveData: {
					...useGameStore.getState().saveData,
					resources: {
						wood: 1,
						metal: 0,
						supplies: 0,
					},
				},
			});

			render(<BuildPalette onSelectItem={mockOnSelectItem} onClose={mockOnClose} />);
			
			// Try clicking an expensive item
			const buildItems = document.querySelectorAll(".build-item.disabled");
			if (buildItems.length > 0) {
				fireEvent.click(buildItems[0]);
				expect(mockOnSelectItem).not.toHaveBeenCalled();
			}
		});
	});

	describe("Category Filtering", () => {
		it("shows FOUNDATION category items", () => {
			render(<BuildPalette onSelectItem={mockOnSelectItem} onClose={mockOnClose} />);
			
			expect(screen.getByText("FOUNDATION")).toBeInTheDocument();
			expect(screen.getByText("Floor Section")).toBeInTheDocument();
			expect(screen.getByText("Stilt Support")).toBeInTheDocument();
		});

		it("shows DEFENSE category items", () => {
			render(<BuildPalette onSelectItem={mockOnSelectItem} onClose={mockOnClose} />);
			
			expect(screen.getByText("DEFENSE")).toBeInTheDocument();
			// Defense items should be present
			const defenseSection = screen.getByText("DEFENSE").closest(".build-category");
			expect(defenseSection).toBeInTheDocument();
		});

		it("hides categories with no unlocked items", () => {
			// If a category has only locked items, it shouldn't appear
			// This test checks that empty categories are hidden
			const { container } = render(<BuildPalette onSelectItem={mockOnSelectItem} onClose={mockOnClose} />);
			
			const categories = container.querySelectorAll(".build-category");
			for (const category of categories) {
				const grid = category.querySelector(".build-grid");
				// Each visible category should have at least one item
				expect(grid?.children.length).toBeGreaterThan(0);
			}
		});
	});
});
