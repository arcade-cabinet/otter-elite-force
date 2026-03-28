# Deterministic Seeding

The runtime uses a dual-layer seed model.

## Seed Layers

- Design seed
  - authored procedural generation
  - map synthesis helpers
  - deterministic placement variance
- Gameplay seeds
  - encounter rolls
  - loot tables
  - wave composition
  - proc chances
  - other runtime decisions

## Phrase Format

- adjective-adjective-noun

## Visibility Rules

- Missions use fixed buried seed phrases.
- Skirmish exposes the seed phrase and allows shuffle/regeneration.

## Replay

Every automated and manual diagnostic run should record:

- phrase
- numeric seed
- per-stream derived seeds
- mission or skirmish id
