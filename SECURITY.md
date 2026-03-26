---
title: Security Policy
version: 1.0.0
updated: 2026-03-26
tags: [security, policy]
---

# Security Policy

## Scope

Private repository. No public-facing API or user data collection. The game runs entirely client-side (browser + Capacitor mobile wrapper).

## Reporting

Report security issues directly to the repository owner via GitHub.

## Dependencies

- Dependencies managed via pnpm with lockfile
- Dependabot configured for automated security updates
- Automerge enabled for Dependabot PRs after CI passes

## GitHub Actions

- Workflows use pinned action SHAs (not tags)
- `CI_GITHUB_TOKEN` secret used for release-please and automerge (avoids triggering limitation with default GITHUB_TOKEN)
- No untrusted input used in `run:` commands
- CodeQL analysis enabled for JavaScript/TypeScript

## Client-Side Security

- No user authentication or sessions
- No server-side endpoints
- Game state stored in browser localStorage only
- No external API calls from game code
