import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlacementGhost } from "@/rendering/PlacementGhost";

/** Minimal Phaser.GameObjects.Graphics mock */
function createMockGraphics() {
	return {
		clear: vi.fn(),
		fillStyle: vi.fn(),
		fillRect: vi.fn(),
		lineStyle: vi.fn(),
		strokeRect: vi.fn(),
		setDepth: vi.fn().mockReturnThis(),
		destroy: vi.fn(),
	};
}

function createMockText() {
	return {
		setText: vi.fn().mockReturnThis(),
		setPosition: vi.fn().mockReturnThis(),
		setOrigin: vi.fn().mockReturnThis(),
		setDepth: vi.fn().mockReturnThis(),
		destroy: vi.fn(),
	};
}

function createMockScene() {
	return {
		add: {
			graphics: vi.fn(() => createMockGraphics()),
			text: vi.fn(
				(_x: number, _y: number, _msg: string, _style?: unknown) => createMockText(),
			),
		},
	};
}

describe("PlacementGhost (US-022)", () => {
	let scene: ReturnType<typeof createMockScene>;
	let ghost: PlacementGhost;

	beforeEach(() => {
		scene = createMockScene();
		ghost = new PlacementGhost(scene as any);
	});

	afterEach(() => {
		ghost.destroy();
	});

	it("should not be active initially", () => {
		expect(ghost.isActive).toBe(false);
	});

	it("should become active when activated", () => {
		ghost.activate("barracks", () => ({ valid: true }));
		expect(ghost.isActive).toBe(true);
		expect(ghost.currentBuildingId).toBe("barracks");
	});

	it("should snap to 32px tile grid", () => {
		ghost.activate("barracks", () => ({ valid: true }));
		ghost.updatePosition(50, 70); // tile (1, 2)

		const pos = ghost.getTilePosition();
		expect(pos).toEqual({ x: 1, y: 2 });
	});

	it("should render green tint when placement is valid", () => {
		const gfx = (scene.add.graphics as any).mock.results[0].value;
		ghost.activate("barracks", () => ({ valid: true }));
		ghost.updatePosition(50, 70);

		// Fill with green tint at 50% alpha
		expect(gfx.fillStyle).toHaveBeenCalledWith(0x7cff8a, 0.5);
	});

	it("should render red tint when placement is invalid", () => {
		const gfx = (scene.add.graphics as any).mock.results[0].value;
		ghost.activate("barracks", () => ({ valid: false, reason: "Blocked" }));
		ghost.updatePosition(50, 70);

		// Fill with red tint at 50% alpha
		expect(gfx.fillStyle).toHaveBeenCalledWith(0xff5f5f, 0.5);
	});

	it("should show tooltip with reason when invalid", () => {
		ghost.activate("barracks", () => ({
			valid: false,
			reason: "Not enough resources",
		}));
		ghost.updatePosition(50, 70);

		// Tooltip text should be created
		expect(scene.add.text).toHaveBeenCalledWith(
			expect.any(Number),
			expect.any(Number),
			"Not enough resources",
			expect.any(Object),
		);
	});

	it("should not show tooltip when valid", () => {
		ghost.activate("barracks", () => ({ valid: true }));
		ghost.updatePosition(50, 70);

		// No tooltip text created
		expect(scene.add.text).not.toHaveBeenCalled();
	});

	it("should clear visuals on deactivate", () => {
		const gfx = (scene.add.graphics as any).mock.results[0].value;
		ghost.activate("barracks", () => ({ valid: true }));
		ghost.updatePosition(50, 70);

		ghost.deactivate();

		expect(ghost.isActive).toBe(false);
		expect(gfx.clear).toHaveBeenCalled();
	});

	it("should skip redraw when tile position hasn't changed", () => {
		const gfx = (scene.add.graphics as any).mock.results[0].value;
		ghost.activate("barracks", () => ({ valid: true }));

		ghost.updatePosition(50, 70); // tile (1, 2)
		const firstCallCount = gfx.fillStyle.mock.calls.length;

		ghost.updatePosition(55, 75); // still tile (1, 2)
		expect(gfx.fillStyle.mock.calls.length).toBe(firstCallCount);
	});
});
