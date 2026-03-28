# Persistence And Capacitor

The rewrite standardizes persistence on Capacitor and SQLite across web and mobile.

## Rules

- Android is the current ship target.
- iOS must stay architecturally viable.
- Web uses the same persistence contract as native.
- No save migration work is required for pre-launch runtime formats.

## Persisted Domains

- campaign progress
- mission runtime save state
- skirmish setup and seed metadata
- settings
- diagnostics metadata and optional run snapshots

## Excluded Runtime State

- Yuka runtime objects
- navigation caches
- particles and visual effects
- camera interpolation state
- ephemeral bridge caches

## Reconstruction

After load, the runtime rebuilds:

- navigation objects
- Yuka actors
- transient caches
- derived bridge state
