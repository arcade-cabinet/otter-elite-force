/**
 * Main Menu Package
 *
 * Production-ready main menu implementing the "Game Loader" paradigm.
 * Replaces POC "level select" with proper New Game / Continue / Canteen flow.
 *
 * Components:
 * - MainMenuScreen: Root menu container
 * - DifficultySelector: Difficulty mode selection with escalation lock
 * - SaveSlotManager: Continue/Load game functionality
 * - MenuButton: Reusable menu button component
 *
 * @see memory-bank/projectbrief.md - Open world design mandate
 * @see docs/architecture/CHUNK_PERSISTENCE.md - Save system
 */

export { MenuButton } from "./MenuButton";
