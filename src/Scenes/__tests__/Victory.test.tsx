/**
 * Victory Component Tests
 *
 * Tests the victory/mission complete screen including:
 * - Stats display (combat debrief)
 * - Rank progression
 * - Navigation actions
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useGameStore } from "../../stores/gameStore";
import { Victory } from "../Victory";

// Mock CSS
jest.mock("../../styles/main.css", () => ({}));

// Mock reactylon/web Engine and Scene (Babylon.js backdrop)
jest.mock("reactylon/web");
jest.mock("reactylon");

describe("Victory", () => {
	beforeEach(() => {
		useGameStore.setState({
			mode: "GAMEOVER",
			kills: 10,
			health: 0,
			saveData: {
				...useGameStore.getState().saveData,
				rank: 2,
				xp: 500,
				coins: 1000,
				peacekeepingScore: 3,
				spoilsOfWar: {
					creditsEarned: 50,
					clamsHarvested: 0,
					upgradesUnlocked: 0,
				},
				strategicObjectives: {
					siphonsDismantled: 0,
					villagesLiberated: 0,
					gasStockpilesCaptured: 0,
					healersProtected: 0,
					alliesRescued: 0,
				},
			},
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("should render victory screen", () => {
		render(<Victory />);
		expect(screen.getByText("MISSION COMPLETE")).toBeInTheDocument();
	});

	it("should display URA extraction subtitle", () => {
		render(<Victory />);
		expect(screen.getByText("URA EXTRACTION SUCCESSFUL")).toBeInTheDocument();
	});

	it("should display kill count under enemies neutralized", () => {
		render(<Victory />);
		expect(screen.getByText("ENEMIES NEUTRALIZED")).toBeInTheDocument();
		expect(screen.getByText("10")).toBeInTheDocument();
	});

	it("should show combat debrief section", () => {
		render(<Victory />);
		expect(screen.getByText("COMBAT DEBRIEF")).toBeInTheDocument();
	});

	it("should display return to command button", () => {
		render(<Victory />);
		// TouchableOpacity renders as div in tests, use getByText
		expect(screen.getByText("RETURN TO COMMAND")).toBeInTheDocument();
	});

	it("should navigate to menu when return to command clicked", () => {
		render(<Victory />);
		const returnButton = screen.getByText("RETURN TO COMMAND");

		fireEvent.click(returnButton);

		expect(useGameStore.getState().mode).toBe("MENU");
	});

	it("should show peacekeeping score", () => {
		render(<Victory />);
		expect(screen.getByText("PEACEKEEPING SCORE")).toBeInTheDocument();
	});

	it("should display credits earned", () => {
		render(<Victory />);
		expect(screen.getByText("CREDITS EARNED")).toBeInTheDocument();
	});

	it("should show visit canteen button", () => {
		render(<Victory />);
		expect(screen.getByText("VISIT CANTEEN (FOB)")).toBeInTheDocument();
	});

	it("should navigate to canteen when visit canteen clicked", () => {
		render(<Victory />);
		const canteenButton = screen.getByText("VISIT CANTEEN (FOB)");

		fireEvent.click(canteenButton);

		expect(useGameStore.getState().mode).toBe("CANTEEN");
	});
});

describe("Victory - Mission Statistics", () => {
	beforeEach(() => {
		useGameStore.setState({
			mode: "GAMEOVER",
			kills: 25,
			health: 50,
			saveData: {
				...useGameStore.getState().saveData,
				spoilsOfWar: {
					creditsEarned: 100,
					clamsHarvested: 5,
					upgradesUnlocked: 2,
				},
				strategicObjectives: {
					siphonsDismantled: 1,
					villagesLiberated: 0,
					gasStockpilesCaptured: 1,
					healersProtected: 0,
					alliesRescued: 2,
				},
				peacekeepingScore: 15,
			},
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("should display mission complete title", () => {
		render(<Victory />);
		expect(screen.getByText("MISSION COMPLETE")).toBeInTheDocument();
	});

	it("should display enemies neutralized count", () => {
		render(<Victory />);
		expect(screen.getByText("ENEMIES NEUTRALIZED")).toBeInTheDocument();
		expect(screen.getByText("25")).toBeInTheDocument();
	});

	it("should display peacekeeping score value", () => {
		render(<Victory />);
		expect(screen.getByText("PEACEKEEPING SCORE")).toBeInTheDocument();
		expect(screen.getByText("15")).toBeInTheDocument();
	});

	it("should display allies rescued count", () => {
		render(<Victory />);
		expect(screen.getByText("ALLIES RESCUED")).toBeInTheDocument();
		expect(screen.getByText("2")).toBeInTheDocument();
	});

	it("should display siphons dismantled count", () => {
		render(<Victory />);
		expect(screen.getByText("SIPHONS DISMANTLED")).toBeInTheDocument();
		expect(screen.getByText("1")).toBeInTheDocument();
	});

	it("should display rank progression section", () => {
		render(<Victory />);
		expect(screen.getByText("RANK PROGRESSION")).toBeInTheDocument();
		expect(screen.getByText("XP PROGRESS")).toBeInTheDocument();
	});

	it("should display current rank section", () => {
		render(<Victory />);
		expect(screen.getByText("CURRENT RANK")).toBeInTheDocument();
	});
});
