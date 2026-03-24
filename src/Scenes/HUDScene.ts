/**
 * HUD Scene — runs in parallel with GameScene.
 *
 * Displays: resource bar, minimap, unit info panel, action panel, build menu.
 * Reads from Zustand stores (rtsGameStore, resourceStore) via subscribe().
 */
import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "@/config/constants";
import { URA_BUILDINGS } from "@/data/buildings";
import { URA_UNITS } from "@/data/units";
import { Health } from "@/ecs/traits/combat";
import { Faction, IsBuilding, Selected, UnitType } from "@/ecs/traits/identity";
import { Position } from "@/ecs/traits/spatial";
import { world } from "@/ecs/world";
import type { MobileInput } from "@/input/mobileInput";
import { TILE_SIZE } from "@/maps/loader";
import { resourceStore } from "@/stores/resourceStore";
import { useRTSGameStore } from "@/stores/rtsGameStore";

interface HUDData {
	missionId: number;
	difficulty: "support" | "tactical" | "elite";
	isMobile?: boolean;
	mobileInput?: MobileInput;
}

const MINIMAP_SIZE = 160;
const MINIMAP_PADDING = 10;
const MONOSPACE: Phaser.Types.GameObjects.Text.TextStyle = {
	fontFamily: "monospace",
	fontSize: "14px",
	color: "#d1d5db",
};
const SMALL_MONO: Phaser.Types.GameObjects.Text.TextStyle = {
	fontFamily: "monospace",
	fontSize: "11px",
	color: "#d1d5db",
};

export class HUDScene extends Phaser.Scene {
	private resourceTexts!: {
		fish: Phaser.GameObjects.Text;
		timber: Phaser.GameObjects.Text;
		salvage: Phaser.GameObjects.Text;
		population: Phaser.GameObjects.Text;
	};
	private minimapGraphics!: Phaser.GameObjects.Graphics;
	private minimapX = MINIMAP_PADDING;
	private minimapY = GAME_HEIGHT - MINIMAP_SIZE - MINIMAP_PADDING;

	private unitInfoContainer!: Phaser.GameObjects.Container;
	private unitNameText!: Phaser.GameObjects.Text;
	private unitHpBar!: Phaser.GameObjects.Graphics;
	private unitHpText!: Phaser.GameObjects.Text;
	private unitStatsText!: Phaser.GameObjects.Text;
	private noSelectionText!: Phaser.GameObjects.Text;
	private unitPortrait!: Phaser.GameObjects.Image;

	private actionContainer!: Phaser.GameObjects.Container;
	private actionButtons: Phaser.GameObjects.Container[] = [];

	private unsubscribeResource!: () => void;
	private unsubscribeSelection!: () => void;

	private isMobile = false;
	private mobileInput?: MobileInput;
	private mobileBottomBar?: Phaser.GameObjects.Container;

	constructor() {
		super({ key: "HUD" });
	}

	create(_data: HUDData): void {
		this.isMobile = !!_data.isMobile;
		this.mobileInput = _data.mobileInput;
		this.createResourceBar();
		this.createMinimap();
		this.createUnitInfoPanel();
		this.createActionPanel();
		if (this.isMobile) {
			this.createMobileBottomBar();
		}

		// Subscribe to Zustand stores for live updates
		this.unsubscribeResource = resourceStore.subscribe((state) => {
			this.resourceTexts.fish.setText(String(state.fish));
			this.resourceTexts.timber.setText(String(state.timber));
			this.resourceTexts.salvage.setText(String(state.salvage));
			this.resourceTexts.population.setText(`${state.currentPop}/${state.maxPop}`);
		});

		let prevSelectedIds = useRTSGameStore.getState().selectedEntityIds;
		this.unsubscribeSelection = useRTSGameStore.subscribe((state) => {
			if (state.selectedEntityIds !== prevSelectedIds) {
				prevSelectedIds = state.selectedEntityIds;
				this.updateUnitInfoPanel(state.selectedEntityIds);
				this.updateActionPanel(state.selectedEntityIds);
			}
		});

		// Clean up subscriptions when scene shuts down
		this.events.on("shutdown", () => {
			this.unsubscribeResource();
			this.unsubscribeSelection();
		});
	}

	update(): void {
		this.updateMinimap();
	}

	// =========================================================================
	// RESOURCE BAR
	// =========================================================================

	private createResourceBar(): void {
		const barBg = this.add.graphics();
		barBg.fillStyle(0x0d1117, 0.85);
		barBg.fillRect(0, 0, GAME_WIDTH, 36);
		barBg.lineStyle(1, 0x2a3a4e, 1);
		barBg.lineBetween(0, 36, GAME_WIDTH, 36);

		const fishIcon = this.add.text(20, 8, "FISH:", { ...MONOSPACE, color: "#38bdf8" });
		const fishVal = this.add.text(fishIcon.x + fishIcon.width + 5, 8, "0", MONOSPACE);

		const timberIcon = this.add.text(fishVal.x + 80, 8, "TIMBER:", {
			...MONOSPACE,
			color: "#a3e635",
		});
		const timberVal = this.add.text(timberIcon.x + timberIcon.width + 5, 8, "0", MONOSPACE);

		const salvageIcon = this.add.text(timberVal.x + 80, 8, "SALVAGE:", {
			...MONOSPACE,
			color: "#fbbf24",
		});
		const salvageVal = this.add.text(salvageIcon.x + salvageIcon.width + 5, 8, "0", MONOSPACE);

		const popIcon = this.add.text(GAME_WIDTH - 160, 8, "POP:", {
			...MONOSPACE,
			color: "#c4a43a",
		});
		const popVal = this.add.text(popIcon.x + popIcon.width + 5, 8, "0/4", MONOSPACE);

		this.resourceTexts = {
			fish: fishVal,
			timber: timberVal,
			salvage: salvageVal,
			population: popVal,
		};
	}

	// =========================================================================
	// MINIMAP
	// =========================================================================

	private createMinimap(): void {
		const x = this.minimapX;
		const y = this.minimapY;

		const bg = this.add.graphics();
		bg.fillStyle(0x0d1117, 0.85);
		bg.lineStyle(1, 0xc4a43a, 1);
		bg.fillRect(x, y, MINIMAP_SIZE, MINIMAP_SIZE);
		bg.strokeRect(x, y, MINIMAP_SIZE, MINIMAP_SIZE);

		this.minimapGraphics = this.add.graphics();

		this.add
			.text(x + MINIMAP_SIZE / 2, y - 8, "MAP", {
				fontFamily: "monospace",
				fontSize: "10px",
				color: "#6b7280",
			})
			.setOrigin(0.5);
	}

	private updateMinimap(): void {
		this.minimapGraphics.clear();

		const x = this.minimapX + 2;
		const y = this.minimapY + 2;
		const size = MINIMAP_SIZE - 4;

		// Background terrain fill
		this.minimapGraphics.fillStyle(0x1a3a1a, 0.5);
		this.minimapGraphics.fillRect(x, y, size, size);

		// Get the game scene's camera bounds for scaling
		const gameScene = this.scene.get("Game");
		if (!gameScene) return;

		const cam = gameScene.cameras.main;
		const mapW = cam.getBounds().width || 1600;
		const mapH = cam.getBounds().height || 1280;
		const scaleX = size / mapW;
		const scaleY = size / mapH;

		// Draw unit dots
		world.query(Position, Faction).forEach((entity) => {
			const pos = entity.get(Position);
			const faction = entity.get(Faction);
			if (!pos || !faction) return;

			const dotX = x + pos.x * TILE_SIZE * scaleX;
			const dotY = y + pos.y * TILE_SIZE * scaleY;

			if (entity.has(IsBuilding)) {
				// Buildings: squares
				const color = faction.id === "ura" ? 0x00ff00 : 0xff0000;
				this.minimapGraphics.fillStyle(color, 0.9);
				this.minimapGraphics.fillRect(dotX - 2, dotY - 2, 4, 4);
			} else {
				// Units: circles
				const color = faction.id === "ura" ? 0x00ff00 : 0xff4444;
				this.minimapGraphics.fillStyle(color, 0.8);
				this.minimapGraphics.fillCircle(dotX, dotY, 2);
			}
		});

		// Draw camera viewport rectangle
		this.minimapGraphics.lineStyle(1, 0xffffff, 0.6);
		const vpX = x + cam.scrollX * scaleX;
		const vpY = y + cam.scrollY * scaleY;
		const vpW = (GAME_WIDTH / cam.zoom) * scaleX;
		const vpH = (GAME_HEIGHT / cam.zoom) * scaleY;
		this.minimapGraphics.strokeRect(vpX, vpY, vpW, vpH);
	}

	// =========================================================================
	// UNIT INFO PANEL
	// =========================================================================

	private createUnitInfoPanel(): void {
		const panelX = 10;
		const panelY = GAME_HEIGHT - 320;
		const panelW = 160;
		const panelH = 140;

		this.unitInfoContainer = this.add.container(panelX, panelY);

		const bg = this.add.graphics();
		bg.fillStyle(0x0d1117, 0.85);
		bg.lineStyle(1, 0x2a3a4e, 1);
		bg.fillRect(0, 0, panelW, panelH);
		bg.strokeRect(0, 0, panelW, panelH);
		this.unitInfoContainer.add(bg);

		// Portrait placeholder (32x32)
		this.unitPortrait = this.add.image(24, 24, "river-rat").setVisible(false);
		this.unitPortrait.setDisplaySize(32, 32);
		this.unitInfoContainer.add(this.unitPortrait);

		// Unit name
		this.unitNameText = this.add.text(62, 10, "", { ...SMALL_MONO, color: "#c4a43a" });
		this.unitInfoContainer.add(this.unitNameText);

		// HP bar background + foreground
		this.unitHpBar = this.add.graphics();
		this.unitInfoContainer.add(this.unitHpBar);

		// HP text
		this.unitHpText = this.add.text(62, 32, "", {
			fontFamily: "monospace",
			fontSize: "9px",
			color: "#9ca3af",
		});
		this.unitInfoContainer.add(this.unitHpText);

		// Stats text
		this.unitStatsText = this.add.text(8, 56, "", {
			fontFamily: "monospace",
			fontSize: "9px",
			color: "#9ca3af",
			lineSpacing: 2,
		});
		this.unitInfoContainer.add(this.unitStatsText);

		// "No selection" text
		this.noSelectionText = this.add.text(panelW / 2, panelH / 2, "NO UNIT\nSELECTED", {
			fontFamily: "monospace",
			fontSize: "11px",
			color: "#4a4a4a",
			align: "center",
		});
		this.noSelectionText.setOrigin(0.5);
		this.unitInfoContainer.add(this.noSelectionText);
	}

	private updateUnitInfoPanel(selectedIds: number[]): void {
		if (selectedIds.length === 0) {
			this.noSelectionText.setVisible(true);
			this.unitNameText.setText("");
			this.unitHpBar.clear();
			this.unitHpText.setText("");
			this.unitStatsText.setText("");
			this.unitPortrait.setVisible(false);
			return;
		}

		this.noSelectionText.setVisible(false);

		if (selectedIds.length === 1) {
			this.showSingleUnitInfo(selectedIds[0]);
		} else {
			this.showMultiUnitInfo(selectedIds);
		}
	}

	private showSingleUnitInfo(entityId: number): void {
		// Find the entity in the world
		const entities = world.query(UnitType, Position, Health, Faction);
		let found = false;

		entities.forEach((entity) => {
			if (found || entity.id() !== entityId) return;
			found = true;

			const unitType = entity.get(UnitType);
			const health = entity.get(Health);
			const faction = entity.get(Faction);
			if (!unitType || !health || !faction) return;

			// Look up unit definition
			const unitDef = URA_UNITS[unitType.type];
			const buildingDef = URA_BUILDINGS[unitType.type];
			const def = unitDef || buildingDef;
			const name = def?.name || unitType.type.toUpperCase();

			// Portrait
			const textureKey = unitType.type.replace(/_/g, "-");
			if (this.textures.exists(textureKey)) {
				this.unitPortrait.setTexture(textureKey);
				this.unitPortrait.setVisible(true);
			}

			// Name
			this.unitNameText.setText(name);

			// HP bar
			this.unitHpBar.clear();
			const barW = 90;
			const barH = 6;
			const barX = 62;
			const barY = 26;
			const hpRatio = health.current / health.max;

			this.unitHpBar.fillStyle(0x333333, 1);
			this.unitHpBar.fillRect(barX, barY, barW, barH);

			const hpColor = hpRatio > 0.5 ? 0x22c55e : hpRatio > 0.25 ? 0xeab308 : 0xef4444;
			this.unitHpBar.fillStyle(hpColor, 1);
			this.unitHpBar.fillRect(barX, barY, barW * hpRatio, barH);

			this.unitHpText.setText(`${health.current}/${health.max}`);

			// Stats
			const lines: string[] = [];
			if (faction.id) lines.push(`FACTION: ${faction.id.toUpperCase()}`);
			if (unitDef) {
				lines.push(`DMG: ${unitDef.damage} (${unitDef.damageType})`);
				lines.push(`ARMOR: ${unitDef.armor}  SPD: ${unitDef.speed}`);
				lines.push(`RANGE: ${unitDef.range}`);
			}
			this.unitStatsText.setText(lines.join("\n"));
		});
	}

	private showMultiUnitInfo(selectedIds: number[]): void {
		this.unitPortrait.setVisible(false);
		this.unitNameText.setText(`${selectedIds.length} UNITS`);
		this.unitHpBar.clear();
		this.unitHpText.setText("");

		// Count unit types
		const counts = new Map<string, number>();
		const entities = world.query(Selected, UnitType);
		entities.forEach((entity) => {
			const ut = entity.get(UnitType);
			if (!ut) return;
			counts.set(ut.type, (counts.get(ut.type) || 0) + 1);
		});

		const lines: string[] = [];
		for (const [type, count] of counts) {
			const def = URA_UNITS[type];
			lines.push(`${def?.name || type}: ${count}`);
		}
		this.unitStatsText.setText(lines.join("\n"));
	}

	// =========================================================================
	// ACTION PANEL
	// =========================================================================

	private createActionPanel(): void {
		const panelW = 340;
		const panelH = 80;
		const panelX = GAME_WIDTH / 2 - panelW / 2;
		const panelY = GAME_HEIGHT - panelH - 10;

		this.actionContainer = this.add.container(panelX, panelY);

		const bg = this.add.graphics();
		bg.fillStyle(0x0d1117, 0.85);
		bg.lineStyle(1, 0x2a3a4e, 1);
		bg.fillRect(0, 0, panelW, panelH);
		bg.strokeRect(0, 0, panelW, panelH);
		this.actionContainer.add(bg);

		// Start with empty buttons — they'll be populated by updateActionPanel
	}

	private updateActionPanel(selectedIds: number[]): void {
		// Clear existing buttons
		for (const btn of this.actionButtons) {
			btn.destroy();
		}
		this.actionButtons = [];

		if (selectedIds.length === 0) return;

		// Check what's selected to determine which buttons to show
		const firstEntity = this.findSelectedEntity(selectedIds[0]);
		if (!firstEntity) return;

		const isBuilding = firstEntity.has(IsBuilding);
		const unitType = firstEntity.get(UnitType);

		let actions: string[];

		if (isBuilding && unitType) {
			// Building selected — show train buttons
			const buildingDef = URA_BUILDINGS[unitType.type];
			if (buildingDef?.trains) {
				actions = buildingDef.trains.map((t) => {
					const uDef = URA_UNITS[t];
					return uDef?.name || t.toUpperCase();
				});
			} else {
				actions = [];
			}
		} else {
			// Units selected — show command buttons
			actions = ["MOVE", "ATTACK", "STOP", "PATROL"];
		}

		const btnW = 58;
		const spacing = 6;
		const startX = 10;

		for (let i = 0; i < actions.length; i++) {
			const bx = startX + i * (btnW + spacing);
			const by = 15;

			const btnContainer = this.add.container(0, 0);

			const btnBg = this.add.graphics();
			btnBg.fillStyle(0x1a2332, 1);
			btnBg.lineStyle(1, 0x4a4a4a, 1);
			btnBg.fillRect(bx, by, btnW, 50);
			btnBg.strokeRect(bx, by, btnW, 50);
			btnContainer.add(btnBg);

			const label = this.add
				.text(bx + btnW / 2, by + 25, actions[i], {
					fontFamily: "monospace",
					fontSize: "9px",
					color: "#9ca3af",
					align: "center",
				})
				.setOrigin(0.5);
			btnContainer.add(label);

			this.actionContainer.add(btnContainer);
			this.actionButtons.push(btnContainer);
		}
	}

	/** Find a selected entity by its ID from the ECS world. */
	private findSelectedEntity(entityId: number): ReturnType<typeof world.queryFirst> {
		let found: ReturnType<typeof world.queryFirst>;
		world.query(Selected).forEach((entity) => {
			if (entity.id() === entityId) {
				found = entity;
			}
		});
		return found;
	}

	/** Public method for game systems to update resources directly. */
	updateResources(
		fish: number,
		timber: number,
		salvage: number,
		pop: number,
		maxPop: number,
	): void {
		this.resourceTexts.fish.setText(String(fish));
		this.resourceTexts.timber.setText(String(timber));
		this.resourceTexts.salvage.setText(String(salvage));
		this.resourceTexts.population.setText(`${pop}/${maxPop}`);
	}

	// =========================================================================
	// MOBILE BOTTOM BAR (squad tabs + Move/Attack buttons)
	// =========================================================================

	/**
	 * Creates the mobile-only bottom bar with squad tabs and command buttons.
	 * Spec §7 layout: [Squad Tabs 1-4] ... [Move] [Attack]
	 */
	private createMobileBottomBar(): void {
		const barH = 48;
		const barY = GAME_HEIGHT - barH;

		this.mobileBottomBar = this.add.container(0, barY);

		// Background
		const bg = this.add.graphics();
		bg.fillStyle(0x0d1117, 0.9);
		bg.lineStyle(1, 0x2a3a4e, 1);
		bg.fillRect(0, 0, GAME_WIDTH, barH);
		bg.lineBetween(0, 0, GAME_WIDTH, 0);
		this.mobileBottomBar.add(bg);

		// Squad tabs (left side)
		const squadCount = 4;
		const tabW = 64;
		const tabH = 36;
		const tabY = (barH - tabH) / 2;

		for (let i = 0; i < squadCount; i++) {
			const tabX = 10 + i * (tabW + 6);

			const tabBg = this.add.graphics();
			tabBg.fillStyle(0x1a2332, 1);
			tabBg.lineStyle(1, 0x4a4a4a, 1);
			tabBg.fillRect(tabX, tabY, tabW, tabH);
			tabBg.strokeRect(tabX, tabY, tabW, tabH);
			this.mobileBottomBar.add(tabBg);

			const label = this.add
				.text(tabX + tabW / 2, tabY + tabH / 2, `SQ ${i + 1}`, {
					fontFamily: "monospace",
					fontSize: "11px",
					color: "#9ca3af",
				})
				.setOrigin(0.5);
			this.mobileBottomBar.add(label);

			// Make tab interactive (48px touch target via the full tab area)
			const hitZone = this.add.zone(tabX + tabW / 2, tabY + tabH / 2, tabW, tabH).setInteractive();
			this.mobileBottomBar.add(hitZone);

			const squadIndex = i + 1;
			hitZone.on("pointerdown", () => {
				this.selectSquad(squadIndex);
			});
		}

		// Command buttons (right side): MOVE and ATTACK
		const btnW = 64;
		const btnH = 36;
		const btnY = (barH - btnH) / 2;

		this.createMobileCommandButton(
			GAME_WIDTH - btnW * 2 - 20,
			btnY,
			btnW,
			btnH,
			"MOVE",
			0x22c55e,
			() => {
				this.mobileInput?.setCommandMode("move");
			},
		);

		this.createMobileCommandButton(
			GAME_WIDTH - btnW - 10,
			btnY,
			btnW,
			btnH,
			"ATTACK",
			0xef4444,
			() => {
				this.mobileInput?.setCommandMode("attack");
			},
		);
	}

	private createMobileCommandButton(
		x: number,
		y: number,
		w: number,
		h: number,
		label: string,
		color: number,
		onTap: () => void,
	): void {
		if (!this.mobileBottomBar) return;

		const btnBg = this.add.graphics();
		btnBg.fillStyle(0x1a2332, 1);
		btnBg.lineStyle(2, color, 0.8);
		btnBg.fillRect(x, y, w, h);
		btnBg.strokeRect(x, y, w, h);
		this.mobileBottomBar.add(btnBg);

		const text = this.add
			.text(x + w / 2, y + h / 2, label, {
				fontFamily: "monospace",
				fontSize: "11px",
				color: `#${color.toString(16).padStart(6, "0")}`,
			})
			.setOrigin(0.5);
		this.mobileBottomBar.add(text);

		const hitZone = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive();
		this.mobileBottomBar.add(hitZone);
		hitZone.on("pointerdown", onTap);
	}

	/** Select a saved squad group by index. */
	private selectSquad(index: number): void {
		// Squad groups will be stored as arrays of entity IDs in rtsGameStore.
		// Once squadGroups[index] is implemented, this will recall the saved group.
		// For now, clear selection as a placeholder.
		void index;
		useRTSGameStore.getState().clearSelection();
	}
}
