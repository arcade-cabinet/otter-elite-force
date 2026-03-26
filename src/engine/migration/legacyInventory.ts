/**
 * Legacy Inventory — Files and dependencies to delete during Milestone G cutover.
 *
 * These lists are built from filesystem scanning and import analysis.
 * The React/Koota/legacy system layers are being replaced by:
 *   - SolidJS (UI)
 *   - bitECS (ECS data)
 *   - src/engine/systems/ (system implementations)
 *
 * Used by: G-milestone deletion tasks to cleanly remove the old stack.
 */

// ---------------------------------------------------------------------------
// React component files — to be replaced by SolidJS equivalents
// ---------------------------------------------------------------------------

export const LEGACY_REACT_FILES: string[] = [
	// App root and entry
	"src/app/App.tsx",
	"src/main.tsx",

	// UI: command post screens
	"src/ui/command-post/CampaignView.tsx",
	"src/ui/command-post/MainMenu.tsx",
	"src/ui/command-post/SettingsControls.tsx",
	"src/ui/command-post/SettingsPanel.tsx",

	// UI: briefing
	"src/ui/BriefingDialogue.tsx",
	"src/ui/briefing/BriefingOverlay.tsx",
	"src/ui/briefing/DeployButton.tsx",
	"src/ui/briefing/PortraitDisplay.tsx",
	"src/ui/briefing/ReconPhoto.tsx",

	// UI: HUD components
	"src/ui/hud/ActionBar.tsx",
	"src/ui/hud/AlertBanner.tsx",
	"src/ui/hud/BossHealthBar.tsx",
	"src/ui/hud/BuildMenu.tsx",
	"src/ui/hud/CombatTextOverlay.tsx",
	"src/ui/hud/CommandTransmissionPanel.tsx",
	"src/ui/hud/ErrorFeedback.tsx",
	"src/ui/hud/MilitaryTooltip.tsx",
	"src/ui/hud/Minimap.tsx",
	"src/ui/hud/PanelFrame.tsx",
	"src/ui/hud/PauseOverlay.tsx",
	"src/ui/hud/ResourceBar.tsx",
	"src/ui/hud/StarRatingDisplay.tsx",
	"src/ui/hud/TransmissionPortrait.tsx",
	"src/ui/hud/TutorialOverlay.tsx",
	"src/ui/hud/UnitPanel.tsx",

	// UI: layout and utilities
	"src/ui/GameLayout.tsx",
	"src/ui/PortraitCanvas.tsx",
	"src/ui/layout/shells.tsx",
	"src/ui/layout/viewport.ts",
	"src/ui/lib/utils.ts",

	// UI: mobile (React versions, replaced by src/solid/mobile/)
	"src/ui/mobile/CommandButtons.tsx",
	"src/ui/mobile/RadialMenu.tsx",
	"src/ui/mobile/SquadTabs.tsx",

	// UI: themes (CSS, may be reused by Solid — review before deletion)
	"src/ui/themes/briefing.css",
	"src/ui/themes/command-post.css",
	"src/ui/themes/tactical.css",

	// Shared React components (shadcn)
	"src/components/ui/badge.tsx",
	"src/components/ui/button.tsx",
	"src/components/ui/card.tsx",
	"src/components/ui/separator.tsx",

	// Shared utility lib
	"src/lib/utils.ts",

	// React hooks
	"src/hooks/useAudioSettings.ts",
	"src/hooks/useAudioUnlock.ts",
	"src/hooks/useMusicWiring.ts",
	"src/hooks/useReducedMotion.ts",
	"src/hooks/useResponsive.ts",
	"src/hooks/useSFXWiring.ts",
	"src/hooks/useTypewriter.ts",

	// Theme (React-specific decorations)
	"src/theme/designTokens.ts",
	"src/theme/svgDecorations.tsx",
	"src/theme/modernCSS.css",

	// Feature components (React)
	"src/features/skirmish/SkirmishSetup.tsx",
	"src/features/skirmish/SkirmishResult.tsx",
	"src/features/main-menu/state/menuReducer.ts",
	"src/features/main-menu/types/menu.types.ts",

	// Engine: React runtime host (bridge between React and LittleJS)
	"src/engine/runtime/RuntimeHost.tsx",
];

// ---------------------------------------------------------------------------
// Koota ECS files — replaced by bitECS components in src/engine/world/
// ---------------------------------------------------------------------------

export const LEGACY_KOOTA_FILES: string[] = [
	// Core world singleton
	"src/ecs/world.ts",
	"src/ecs/singletons.ts",

	// Koota relations and queries
	"src/ecs/relations/index.ts",
	"src/ecs/queries/index.ts",

	// Koota data structures
	"src/ecs/data/slots.ts",
	"src/ecs/data/__tests__/slots.test.ts",

	// Koota traits — all replaced by src/engine/world/components.ts stores
	"src/ecs/traits/ai.ts",
	"src/ecs/traits/boss.ts",
	"src/ecs/traits/combat.ts",
	"src/ecs/traits/convoy.ts",
	"src/ecs/traits/economy.ts",
	"src/ecs/traits/environment.ts",
	"src/ecs/traits/identity.ts",
	"src/ecs/traits/orders.ts",
	"src/ecs/traits/spatial.ts",
	"src/ecs/traits/state.ts",
	"src/ecs/traits/stealth.ts",
	"src/ecs/traits/water.ts",
];

// ---------------------------------------------------------------------------
// Old system files — replaced by src/engine/systems/
// ---------------------------------------------------------------------------

export const LEGACY_SYSTEM_FILES: string[] = [
	"src/systems/aiSystem.ts",
	"src/systems/bossSystem.ts",
	"src/systems/buildingSystem.ts",
	"src/systems/combatSystem.ts",
	"src/systems/convoySystem.ts",
	"src/systems/demolitionSystem.ts",
	"src/systems/detectionSystem.ts",
	"src/systems/difficultyScaling.ts",
	"src/systems/economySystem.ts",
	"src/systems/encounterSystem.ts",
	"src/systems/fireSystem.ts",
	"src/systems/fogSystem.ts",
	"src/systems/gameLoop.ts",
	"src/systems/index.ts",
	"src/systems/lootSystem.ts",
	"src/systems/movementSystem.ts",
	"src/systems/multiBaseSystem.ts",
	"src/systems/orderSystem.ts",
	"src/systems/productionSystem.ts",
	"src/systems/researchSystem.ts",
	"src/systems/saveLoadSystem.ts",
	"src/systems/scenarioSystem.ts",
	"src/systems/scoringSystem.ts",
	"src/systems/siegeSystem.ts",
	"src/systems/siphonSystem.ts",
	"src/systems/stealthSystem.ts",
	"src/systems/territorySystem.ts",
	"src/systems/tidalSystem.ts",
	"src/systems/waterSystem.ts",
	"src/systems/waveSpawnerSystem.ts",
	"src/systems/weatherSystem.ts",
];

// ---------------------------------------------------------------------------
// Package dependencies to remove from package.json
// ---------------------------------------------------------------------------

export const LEGACY_DEPS: string[] = [
	// React ecosystem
	"react",
	"react-dom",
	"@types/react",
	"@types/react-dom",
	"@vitejs/plugin-react",
	"@testing-library/react",

	// Koota ECS
	"koota",

	// React UI libraries (shadcn, radix, base-ui)
	"@base-ui/react",
	"@hugeicons/react",
	"@radix-ui/react-dialog",
	"@radix-ui/react-slot",
	"@radix-ui/react-tooltip",
	"class-variance-authority",
	"clsx",
	"tailwind-merge",
	"shadcn",
];
