# Changelog

All notable changes to this project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Commits: [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
Automation: [release-please](https://github.com/googleapis/release-please).

## 1.0.0 (2026-03-28)


### Features

* actors, AI, and combat systems ([#8](https://github.com/arcade-cabinet/otter-elite-force/issues/8)) ([7ce937d](https://github.com/arcade-cabinet/otter-elite-force/commit/7ce937dde74c065da68a975d6357fee362f29826))
* Add comprehensive end-to-end gameplay tests ([#33](https://github.com/arcade-cabinet/otter-elite-force/issues/33)) ([02ec152](https://github.com/arcade-cabinet/otter-elite-force/commit/02ec152f8d088d631092cdc9a9d56ed2286d9dbc))
* Add Content Security Policy for defense-in-depth ([#68](https://github.com/arcade-cabinet/otter-elite-force/issues/68)) ([6b8ed4b](https://github.com/arcade-cabinet/otter-elite-force/commit/6b8ed4b6199a586930d2693d63e969b42e073cb4))
* **canteen:** Redesign with modal-based character preview ([#53](https://github.com/arcade-cabinet/otter-elite-force/issues/53)) ([782f189](https://github.com/arcade-cabinet/otter-elite-force/commit/782f189e2d23c56976aa53e0a120ee253b10c7c9))
* complete engine rewrite — LittleJS + bitECS + SolidJS ([#174](https://github.com/arcade-cabinet/otter-elite-force/issues/174)) ([8be59ba](https://github.com/arcade-cabinet/otter-elite-force/commit/8be59baba2d064a4a6a83763f1bd4073f1ee1eee))
* complete remaining work — 95 user stories + rendering migration PRD ([#142](https://github.com/arcade-cabinet/otter-elite-force/issues/142)) ([202c870](https://github.com/arcade-cabinet/otter-elite-force/commit/202c870bc4f9ea47a8783d1620f4b314d4667f00))
* complete visual overhaul + 16-mission campaign + infrastructure systems ([#145](https://github.com/arcade-cabinet/otter-elite-force/issues/145)) ([6073f51](https://github.com/arcade-cabinet/otter-elite-force/commit/6073f51e9d4794e118b3792ffdbc0ffe2046c1ec))
* core engine systems and utility helpers ([#5](https://github.com/arcade-cabinet/otter-elite-force/issues/5)) ([ec9fce5](https://github.com/arcade-cabinet/otter-elite-force/commit/ec9fce5a9100c463ee2c8395f0c0b2d2bf4bd5bf))
* DDL modular architecture — complete RTS stack migration ([#139](https://github.com/arcade-cabinet/otter-elite-force/issues/139)) ([6b1f908](https://github.com/arcade-cabinet/otter-elite-force/commit/6b1f90858f7a2577f66256dc72ec00184a3beb36))
* enhance open world persistence and CI stability ([#85](https://github.com/arcade-cabinet/otter-elite-force/issues/85)) ([713cffa](https://github.com/arcade-cabinet/otter-elite-force/commit/713cffa19a96853e9cba0f065711b558259a1978))
* environmental and objective entities ([#7](https://github.com/arcade-cabinet/otter-elite-force/issues/7)) ([d4f8321](https://github.com/arcade-cabinet/otter-elite-force/commit/d4f832174571e6db5262103cf2111e1a2194aaf8))
* game state management with Zustand ([#6](https://github.com/arcade-cabinet/otter-elite-force/issues/6)) ([67333ab](https://github.com/arcade-cabinet/otter-elite-force/commit/67333ab3dca6470ce1276f8232e8ef493e2ac38f))
* implement combat collision and objective completion for open world ([#89](https://github.com/arcade-cabinet/otter-elite-force/issues/89)) ([6a84c9b](https://github.com/arcade-cabinet/otter-elite-force/commit/6a84c9bc6af924b0de1a08313e188a9476a38b99))
* project infrastructure and build configuration ([#3](https://github.com/arcade-cabinet/otter-elite-force/issues/3)) ([3f53093](https://github.com/arcade-cabinet/otter-elite-force/commit/3f53093a71e1996f030b6a3caef7aadad75c6d4d))
* release-please + automerge + fix GH Pages asset loading ([#170](https://github.com/arcade-cabinet/otter-elite-force/issues/170)) ([ca9e4f4](https://github.com/arcade-cabinet/otter-elite-force/commit/ca9e4f41cec4eeaaa9b7133a0db4b8173582cc0d))
* scenes, UI, and application flow ([#9](https://github.com/arcade-cabinet/otter-elite-force/issues/9)) ([0da75ec](https://github.com/arcade-cabinet/otter-elite-force/commit/0da75ec2ea568296fb19965a5a07eaeac352062c))


### Bug Fixes

* AGP 8.5.2 + Gradle 8.7 (Capacitor compatible + bcprov fixed) ([#152](https://github.com/arcade-cabinet/otter-elite-force/issues/152)) ([5a10d6c](https://github.com/arcade-cabinet/otter-elite-force/commit/5a10d6ce29754be9097d62b9f9f2024db503ebba))
* AGP 8.5.2 + Gradle 8.7 + SDK 35 + Java 21 — complete Android toolchain upgrade ([#159](https://github.com/arcade-cabinet/otter-elite-force/issues/159)) ([da3eac7](https://github.com/arcade-cabinet/otter-elite-force/commit/da3eac795db4288b50f93bb6c8af3de80f4ad50f))
* all local checks clean — TS + biome + tests ([#164](https://github.com/arcade-cabinet/otter-elite-force/issues/164)) ([82a457e](https://github.com/arcade-cabinet/otter-elite-force/commit/82a457e87521cd002cf6a0798f678e8f16a1ae1d))
* Allow Three.js web workers in Content Security Policy ([#81](https://github.com/arcade-cabinet/otter-elite-force/issues/81)) ([f1a0d56](https://github.com/arcade-cabinet/otter-elite-force/commit/f1a0d56bf5fd0cb20222a22858505be06a433fcc))
* biome config — exclude CSS, relax a11y for shadcn, fix all lint errors ([#146](https://github.com/arcade-cabinet/otter-elite-force/issues/146)) ([ffa96ff](https://github.com/arcade-cabinet/otter-elite-force/commit/ffa96ff118a422826e667cc669a65e21b023d690))
* biome schema 'latest' + format fixes ([#167](https://github.com/arcade-cabinet/otter-elite-force/issues/167)) ([801a4f7](https://github.com/arcade-cabinet/otter-elite-force/commit/801a4f71885159fdeb3fe29a13d3c0d7373b6f31))
* **ci:** Make E2E tests non-blocking for deploys ([#63](https://github.com/arcade-cabinet/otter-elite-force/issues/63)) ([682da29](https://github.com/arcade-cabinet/otter-elite-force/commit/682da292aaf4b6652da054f02f06e601a3474d37))
* **ci:** upgrade PNPM_VERSION to 10 to resolve cache restoration issues ([#83](https://github.com/arcade-cabinet/otter-elite-force/issues/83)) ([9b79ac5](https://github.com/arcade-cabinet/otter-elite-force/commit/9b79ac55ca1791c32d2c548179f6714d664f9bcb))
* clear all Gradle caches for Android build ([#149](https://github.com/arcade-cabinet/otter-elite-force/issues/149)) ([355a004](https://github.com/arcade-cabinet/otter-elite-force/commit/355a004c5590be04e98da81cf306e78a55dd7eed))
* clear Gradle JAR cache before Android build ([#148](https://github.com/arcade-cabinet/otter-elite-force/issues/148)) ([61c12e7](https://github.com/arcade-cabinet/otter-elite-force/commit/61c12e769710cc5274f1b278aa4b2badc8360705))
* disable Gradle cache to fix Android build digest-mismatch ([#147](https://github.com/arcade-cabinet/otter-elite-force/issues/147)) ([12c2fb0](https://github.com/arcade-cabinet/otter-elite-force/commit/12c2fb08d2c6749ed6fe4599ec2b554633ec87e6))
* exclude bcprov-jdk18on + revert to AGP 8.2.1 for Android build ([#155](https://github.com/arcade-cabinet/otter-elite-force/issues/155)) ([ca81cd7](https://github.com/arcade-cabinet/otter-elite-force/commit/ca81cd74f51a5763027e8c3abe0981f3c07bd8f6))
* exclude slow governor tests from default test run ([d0cf208](https://github.com/arcade-cabinet/otter-elite-force/commit/d0cf208a7bb46a6a59c7b61e1ca5ca013e2532bd))
* force bcprov 1.78.1 in buildscript classpath ([#157](https://github.com/arcade-cabinet/otter-elite-force/issues/157)) ([e910f5f](https://github.com/arcade-cabinet/otter-elite-force/commit/e910f5ff0e5b69596dfc3dfcd73b6ff0c5387a31))
* force bcprov 1.78.1 to fix Android build ([#156](https://github.com/arcade-cabinet/otter-elite-force/issues/156)) ([2c3ad0c](https://github.com/arcade-cabinet/otter-elite-force/commit/2c3ad0c048cad50f6ecb7850128686e5226c49dd))
* GitHub Pages asset loading — use BASE_URL for all paths ([#169](https://github.com/arcade-cabinet/otter-elite-force/issues/169)) ([b9a0b6f](https://github.com/arcade-cabinet/otter-elite-force/commit/b9a0b6fd7e5b57cee08e371a8d92329ce7ac91f2))
* ignoreDeprecations "6.0" for TS 6.x ([#162](https://github.com/arcade-cabinet/otter-elite-force/issues/162)) ([2113018](https://github.com/arcade-cabinet/otter-elite-force/commit/21130182b3d6677b2fde6bfe1f1d84dc6818f828))
* **input:** Proper lifecycle management for InputSystem ([#54](https://github.com/arcade-cabinet/otter-elite-force/issues/54)) ([d3b1d7c](https://github.com/arcade-cabinet/otter-elite-force/commit/d3b1d7c13c8f595015ba98b277276c85bc3a6c50))
* Java 17→21 for Android build (AGP 8.7.3 requires it) ([#151](https://github.com/arcade-cabinet/otter-elite-force/issues/151)) ([34008c6](https://github.com/arcade-cabinet/otter-elite-force/commit/34008c6eef63a66c0233b892b6141deb0a117856))
* Java 21 JDK + Java 17 source compat for Android build ([#154](https://github.com/arcade-cabinet/otter-elite-force/issues/154)) ([ab100d7](https://github.com/arcade-cabinet/otter-elite-force/commit/ab100d7e25e0876becb886681113e2e63cf99fa9))
* manualChunks function for Vite 8 / Rolldown ([#163](https://github.com/arcade-cabinet/otter-elite-force/issues/163)) ([1d225cb](https://github.com/arcade-cabinet/otter-elite-force/commit/1d225cb21071877244a9c5422c2581f4d724c0a2))
* mission 9 instant defeat + hero alias + browser test exclusion ([#182](https://github.com/arcade-cabinet/otter-elite-force/issues/182)) ([5f76e60](https://github.com/arcade-cabinet/otter-elite-force/commit/5f76e60360594b32dbde8f82d77570ad9331a7cd))
* mount TacticalHUD + condense briefing ([#186](https://github.com/arcade-cabinet/otter-elite-force/issues/186)) ([a6268ab](https://github.com/arcade-cabinet/otter-elite-force/commit/a6268ab88befef8cf0d92c004f94f8a0eb54b09a))
* move rank emblem rendering to overlay canvas for WebGL visibility ([#187](https://github.com/arcade-cabinet/otter-elite-force/issues/187)) ([6bc2ff2](https://github.com/arcade-cabinet/otter-elite-force/commit/6bc2ff2c26c258a0539eb72636cef7787612bb74))
* pin bcprov 1.78.1 in buildscript classpath ([#158](https://github.com/arcade-cabinet/otter-elite-force/issues/158)) ([787cd2b](https://github.com/arcade-cabinet/otter-elite-force/commit/787cd2b7b646ff0df1a875d1bcff351bc9780d33))
* proper toolchain — TS 6, ES2024, Node 24, no hacks ([#166](https://github.com/arcade-cabinet/otter-elite-force/issues/166)) ([4fe41f1](https://github.com/arcade-cabinet/otter-elite-force/commit/4fe41f150e5677079ce77a95d3937f7e0adef2dc))
* remove babylonjs NavigationSystem (residue from Expo migration) ([#140](https://github.com/arcade-cabinet/otter-elite-force/issues/140)) ([0c140f0](https://github.com/arcade-cabinet/otter-elite-force/commit/0c140f07b10a46da2b1c13dcf23557ac4ec989d4))
* remove verify-otter.mjs + fix remaining Biome errors ([#184](https://github.com/arcade-cabinet/otter-elite-force/issues/184)) ([8fa2d2e](https://github.com/arcade-cabinet/otter-elite-force/commit/8fa2d2eaf754fec2241447c3cc215cbc57af1281))
* repair build.gradle syntax + clean AGP 8.5.2 config ([#168](https://github.com/arcade-cabinet/otter-elite-force/issues/168)) ([fa6712d](https://github.com/arcade-cabinet/otter-elite-force/commit/fa6712d32a2b9c3ac6c34ab9077708783f9805d5))
* resolve 78 Biome lint errors + mission resource tuning ([#183](https://github.com/arcade-cabinet/otter-elite-force/issues/183)) ([55117f9](https://github.com/arcade-cabinet/otter-elite-force/commit/55117f9e7ca9b9a59721b77d027b39c3923f692a))
* resolve final 3 Biome lint errors blocking CD pipeline ([#185](https://github.com/arcade-cabinet/otter-elite-force/issues/185)) ([4de6461](https://github.com/arcade-cabinet/otter-elite-force/commit/4de6461e79a2261c06f1f72d9d0a3d9f919e818e))
* Resolve lint errors in E2E tests and App ([#73](https://github.com/arcade-cabinet/otter-elite-force/issues/73)) ([6af62da](https://github.com/arcade-cabinet/otter-elite-force/commit/6af62da63eba360731787adf7f1ab7794e555500))
* restore correct package.json for OTTER: ELITE FORCE ([#82](https://github.com/arcade-cabinet/otter-elite-force/issues/82)) ([d22e63e](https://github.com/arcade-cabinet/otter-elite-force/commit/d22e63ee0787dcf9584dc56ce1e474dd1e6acbe3))
* revert AGP 8.2.1 + Gradle 8.4 (Capacitor compatible) ([#153](https://github.com/arcade-cabinet/otter-elite-force/issues/153)) ([a89b6b5](https://github.com/arcade-cabinet/otter-elite-force/commit/a89b6b5fe6a96d92061a237c9e4c227212dd425f))
* standardize Node.js 22 and pnpm 10 in CI ([#87](https://github.com/arcade-cabinet/otter-elite-force/issues/87)) ([8c086bb](https://github.com/arcade-cabinet/otter-elite-force/commit/8c086bb24a252014a8063afec1a1189a9dc2fac8))
* TS7 deprecation + CD concurrency + Android toolchain ([#160](https://github.com/arcade-cabinet/otter-elite-force/issues/160)) ([c9559bd](https://github.com/arcade-cabinet/otter-elite-force/commit/c9559bd3008cc479ff1e8df539bba9c7535284ce))
* TypeScript 6.0.2 baseUrl deprecation ([#161](https://github.com/arcade-cabinet/otter-elite-force/issues/161)) ([0af786f](https://github.com/arcade-cabinet/otter-elite-force/commit/0af786fa31247db9bb2ffbf97f7e8390c016eba3))
* upgrade Gradle 8.9 + AGP 8.7.3 for Java 21 bytecode support ([#150](https://github.com/arcade-cabinet/otter-elite-force/issues/150)) ([04fa5cb](https://github.com/arcade-cabinet/otter-elite-force/commit/04fa5cb9e5a0f55a4169fd872f16e7d5baa49682))
* WebGL sprite rendering, POC-faithful sidebar layout, and full system wiring ([#188](https://github.com/arcade-cabinet/otter-elite-force/issues/188)) ([213e4eb](https://github.com/arcade-cabinet/otter-elite-force/commit/213e4ebb710e2ecc48c70093498b2a265993f2d5))

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
