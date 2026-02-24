/**
 * Canteen Component Tests
 *
 * Tests the Forward Operating Base (canteen) UI including:
 * - Header and navigation
 * - WEAPONS tab: arsenal display
 * - EQUIPMENT tab: upgrades
 * - INTEL tab: mission stats
 * - Return to menu
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useGameStore } from "../../stores/gameStore";
import { Canteen } from "../Canteen";

// Mock CSS
jest.mock("../../styles/main.css", () => ({}));

// Mock reactylon/web Engine and Scene (Babylon.js backdrop)
jest.mock("reactylon/web");
jest.mock("reactylon");

describe("Canteen", () => {
	beforeEach(() => {
		useGameStore.setState({
			mode: "CANTEEN",
			selectedCharacterId: "bubbles",
			saveData: {
				...useGameStore.getState().saveData,
				coins: 5000,
				unlockedCharacters: ["bubbles"],
				upgrades: {
					speedBoost: 0,
					healthBoost: 0,
					damageBoost: 0,
					weaponLvl: {
						pistol: 1,
						smg: 0,
						rifle: 0,
						shotgun: 0,
					},
				},
			},
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("should render the canteen", () => {
		render(<Canteen />);
		expect(screen.getByText("FORWARD OPERATING BASE")).toBeInTheDocument();
	});

	it("should show back to menu button", () => {
		render(<Canteen />);
		// TouchableOpacity renders as div in tests, use getByText
		expect(screen.getByText("RETURN TO COMMAND")).toBeInTheDocument();
	});

	it("should navigate back to menu when back clicked", () => {
		render(<Canteen />);
		const backButton = screen.getByText("RETURN TO COMMAND");

		fireEvent.click(backButton);

		expect(useGameStore.getState().mode).toBe("MENU");
	});

	it("should show WEAPONS, EQUIPMENT, INTEL tabs", () => {
		render(<Canteen />);
		// Tab labels rendered by TouchableOpacity (renders as div in tests)
		expect(screen.getByText("WEAPONS")).toBeInTheDocument();
		expect(screen.getByText("EQUIPMENT")).toBeInTheDocument();
		expect(screen.getByText("INTEL")).toBeInTheDocument();
	});

	it("should show WEAPONS tab content by default", () => {
		render(<Canteen />);
		expect(screen.getByText("ARSENAL")).toBeInTheDocument();
	});

	it("should display credit balance in weapons tab", () => {
		render(<Canteen />);
		expect(screen.getByText("Credits")).toBeInTheDocument();
		expect(screen.getByText("5000c")).toBeInTheDocument();
	});

	it("should display weapons list in weapons tab", () => {
		render(<Canteen />);
		expect(screen.getByText("PISTOL")).toBeInTheDocument();
		expect(screen.getByText("SMG")).toBeInTheDocument();
		expect(screen.getByText("RIFLE")).toBeInTheDocument();
		expect(screen.getByText("SHOTGUN")).toBeInTheDocument();
	});

	it("should show UNLOCKED status for owned weapons", () => {
		render(<Canteen />);
		expect(screen.getByText("UNLOCKED")).toBeInTheDocument();
	});
});

describe("Canteen - Equipment Tab", () => {
	beforeEach(() => {
		useGameStore.setState({
			mode: "CANTEEN",
			saveData: {
				...useGameStore.getState().saveData,
				coins: 5000,
				upgrades: {
					speedBoost: 2,
					healthBoost: 1,
					damageBoost: 0,
					weaponLvl: {
						pistol: 1,
					},
				},
			},
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("should display FIELD UPGRADES when EQUIPMENT tab clicked", () => {
		render(<Canteen />);
		const equipmentTab = screen.getByText("EQUIPMENT");
		fireEvent.click(equipmentTab);

		expect(screen.getByText("FIELD UPGRADES")).toBeInTheDocument();
	});

	it("should display upgrade names in EQUIPMENT tab", () => {
		render(<Canteen />);
		const equipmentTab = screen.getByText("EQUIPMENT");
		fireEvent.click(equipmentTab);

		expect(screen.getByText("Speed Boost")).toBeInTheDocument();
		expect(screen.getByText("Health Boost")).toBeInTheDocument();
		expect(screen.getByText("Damage Boost")).toBeInTheDocument();
	});

	it("should display upgrade levels as fraction in EQUIPMENT tab", () => {
		render(<Canteen />);
		const equipmentTab = screen.getByText("EQUIPMENT");
		fireEvent.click(equipmentTab);

		expect(screen.getByText("2 / 5")).toBeInTheDocument();
		expect(screen.getByText("1 / 5")).toBeInTheDocument();
		expect(screen.getByText("0 / 5")).toBeInTheDocument();
	});
});

describe("Canteen - Intel Tab", () => {
	beforeEach(() => {
		useGameStore.setState({
			mode: "CANTEEN",
			saveData: {
				...useGameStore.getState().saveData,
				peacekeepingScore: 15,
				territoryScore: 8,
				strategicObjectives: {
					siphonsDismantled: 2,
					villagesLiberated: 0,
					gasStockpilesCaptured: 0,
					healersProtected: 0,
					alliesRescued: 3,
				},
			},
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("should show MISSION INTELLIGENCE in INTEL tab", () => {
		render(<Canteen />);
		const intelTab = screen.getByText("INTEL");
		fireEvent.click(intelTab);

		expect(screen.getByText("MISSION INTELLIGENCE")).toBeInTheDocument();
	});

	it("should display peacekeeping score in INTEL tab", () => {
		render(<Canteen />);
		const intelTab = screen.getByText("INTEL");
		fireEvent.click(intelTab);

		expect(screen.getByText("PEACEKEEPING SCORE")).toBeInTheDocument();
		expect(screen.getByText("15")).toBeInTheDocument();
	});

	it("should display rank progression in INTEL tab", () => {
		render(<Canteen />);
		const intelTab = screen.getByText("INTEL");
		fireEvent.click(intelTab);

		expect(screen.getByText("RANK PROGRESSION")).toBeInTheDocument();
	});
});
