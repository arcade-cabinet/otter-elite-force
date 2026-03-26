# Changelog

All notable changes to this project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Commits: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
Automation: [release-please](https://github.com/googleapis/release-please).

## [Unreleased]

### Added
- Engine rewrite plan: LittleJS + bitECS + SolidJS
- 16 mission design docs (8,009 lines) with zones, phases, triggers, dialogue
- 12 purchased animal sprite atlases (465 animation frames)
- 138 Kenney CC0 tiles + 112 procedural biome blend tiles
- Convoy, stealth, tidal, fire, boss fight systems
- Extended scenario DSL (revealZone, panCamera, addObjective, etc.)
- release-please + automerge workflows
- Comprehensive doc restructure with frontmatter

### Changed
- Command structure: Sgt. Bubbles → Col. Bubbles
- Maps: 48x44 → 128x128+ tiles with zone-based progression
- Sprites: procedural → purchased atlas-based
- TypeScript 6.0, ES2024, Node 24 LTS
- CD pipeline: separated release.yml, cleaned cd.yml

### Fixed
- GitHub Pages asset loading (BASE_URL)
- Android build (AGP 8.5.2 + Gradle 8.7)
- Removed edge scroll
- 86 hidden TypeScript errors

## [0.2.0] - 2026-03-25

### Added
- React-Konva rendering (migrated from Phaser 3)
- Koota ECS integration
- 95 user stories implemented
- Procedural sprite generation
