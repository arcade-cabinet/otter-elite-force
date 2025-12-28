---
allowed-tools: Edit,Write,Read,Bash(git:*),Bash(gh:*),Bash(pnpm:*)
description: Prepare a new version release
---

# Release Command

Prepare and create a new version release.

## Process

1. **Check Current State**
   ```bash
   git log --oneline -20
   cat package.json | grep version
   ```

2. **Determine Version Bump**
   - Analyze changes since last release
   - **Major** (X.0.0): Breaking changes
   - **Minor** (0.X.0): New features
   - **Patch** (0.0.X): Bug fixes

3. **Update CHANGELOG.md**
   - Add new version section with date
   - Categorize changes:
     - Added
     - Changed
     - Fixed
     - Removed
   - Follow [Keep a Changelog](https://keepachangelog.com/) format

4. **Bump Version**
   - Update version in `package.json`

5. **Run Final Checks**
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test:unit
   pnpm build
   ```

6. **Create Release Commit**
   ```bash
   git add .
   git commit -m "🔖 chore: release v<version>"
   ```

7. **Create Git Tag**
   ```bash
   git tag v<version>
   ```

8. **Create GitHub Release**
   ```bash
   gh release create v<version> --generate-notes
   ```

## CHANGELOG Format

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes

### Removed
- Removed features
```

---
