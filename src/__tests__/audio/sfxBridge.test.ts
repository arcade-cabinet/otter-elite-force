/**
 * SFX Bridge Tests (US-030)
 *
 * Verifies that:
 * - installSFXBridge wires EventBus events to AudioEngine.playSFX()
 * - Each gameplay event triggers the correct SFX type
 * - Gather events respect resource type routing
 * - The teardown function removes all listeners
 * - hud-alert with warning/critical severity plays errorAction
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AudioEngine } from "@/audio/engine";
import { installSFXBridge } from "@/audio/sfxBridge";
import { EventBus } from "@/game/EventBus";

function createMockEngine(): AudioEngine {
	return {
		playSFX: vi.fn(),
		playMusic: vi.fn(),
		stopMusic: vi.fn(),
		stopAll: vi.fn(),
		setMasterVolume: vi.fn(),
		setSFXVolume: vi.fn(),
		setMusicVolume: vi.fn(),
		init: vi.fn(),
		dispose: vi.fn(),
		isReady: true,
	} as unknown as AudioEngine;
}

describe("installSFXBridge (US-030)", () => {
	let engine: AudioEngine;
	let teardown: () => void;

	beforeEach(() => {
		engine = createMockEngine();
		teardown = installSFXBridge(engine);
	});

	afterEach(() => {
		teardown();
		EventBus.removeAllListeners();
	});

	it("plays unitSelect on unit-selected event", () => {
		EventBus.emit("unit-selected");
		expect(engine.playSFX).toHaveBeenCalledWith("unitSelect");
	});

	it("plays unitMove on move-command event", () => {
		EventBus.emit("move-command");
		expect(engine.playSFX).toHaveBeenCalledWith("unitMove");
	});

	it("plays unitAttack on attack-command event", () => {
		EventBus.emit("attack-command");
		expect(engine.playSFX).toHaveBeenCalledWith("unitAttack");
	});

	it("plays meleeHit on melee-hit event", () => {
		EventBus.emit("melee-hit");
		expect(engine.playSFX).toHaveBeenCalledWith("meleeHit");
	});

	it("plays rangedFire on ranged-fire event", () => {
		EventBus.emit("ranged-fire");
		expect(engine.playSFX).toHaveBeenCalledWith("rangedFire");
	});

	it("plays resourceGather on gather-command without resource type", () => {
		EventBus.emit("gather-command");
		expect(engine.playSFX).toHaveBeenCalledWith("resourceGather");
	});

	it("plays gatherWood on gather-command with timber resource", () => {
		EventBus.emit("gather-command", { resourceType: "timber" });
		expect(engine.playSFX).toHaveBeenCalledWith("gatherWood");
	});

	it("plays gatherFish on gather-command with fish resource", () => {
		EventBus.emit("gather-command", { resourceType: "fish" });
		expect(engine.playSFX).toHaveBeenCalledWith("gatherFish");
	});

	it("plays gatherSalvage on gather-command with salvage resource", () => {
		EventBus.emit("gather-command", { resourceType: "salvage" });
		expect(engine.playSFX).toHaveBeenCalledWith("gatherSalvage");
	});

	it("plays resourceDeposit on resource-deposited event", () => {
		EventBus.emit("resource-deposited");
		expect(engine.playSFX).toHaveBeenCalledWith("resourceDeposit");
	});

	it("plays buildStart on building-placed event", () => {
		EventBus.emit("building-placed");
		expect(engine.playSFX).toHaveBeenCalledWith("buildStart");
	});

	it("plays buildComplete on building-complete event", () => {
		EventBus.emit("building-complete");
		expect(engine.playSFX).toHaveBeenCalledWith("buildComplete");
	});

	it("plays trainingComplete on training-complete event", () => {
		EventBus.emit("training-complete");
		expect(engine.playSFX).toHaveBeenCalledWith("trainingComplete");
	});

	it("plays researchComplete on research-complete event", () => {
		EventBus.emit("research-complete");
		expect(engine.playSFX).toHaveBeenCalledWith("researchComplete");
	});

	it("plays errorAction on error-action event", () => {
		EventBus.emit("error-action");
		expect(engine.playSFX).toHaveBeenCalledWith("errorAction");
	});

	it("plays unitDeath on unit-died event", () => {
		EventBus.emit("unit-died");
		expect(engine.playSFX).toHaveBeenCalledWith("unitDeath");
	});

	it("plays errorAction on hud-alert with warning severity", () => {
		EventBus.emit("hud-alert", { message: "test", severity: "warning" });
		expect(engine.playSFX).toHaveBeenCalledWith("errorAction");
	});

	it("plays errorAction on hud-alert with critical severity", () => {
		EventBus.emit("hud-alert", { message: "test", severity: "critical" });
		expect(engine.playSFX).toHaveBeenCalledWith("errorAction");
	});

	it("does not play errorAction on hud-alert with info severity", () => {
		EventBus.emit("hud-alert", { message: "test", severity: "info" });
		expect(engine.playSFX).not.toHaveBeenCalled();
	});

	it("removes all listeners on teardown", () => {
		teardown();
		EventBus.emit("unit-selected");
		EventBus.emit("move-command");
		EventBus.emit("melee-hit");
		expect(engine.playSFX).not.toHaveBeenCalled();
	});
});
