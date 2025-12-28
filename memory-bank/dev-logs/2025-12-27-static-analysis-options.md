# Static Analysis & GitHub Apps for OTTER: ELITE FORCE

## Current Setup

### ✅ Already Active

| Tool | Type | Status |
|------|------|--------|
| **Biome** | Linting + Formatting | ✅ In CI |
| **TypeScript** | Type Checking | ✅ In CI (`pnpm typecheck`) |
| **Coveralls** | Code Coverage | ✅ In CI |
| **Dependabot** | Dependency Updates | ✅ Configured |
| **Secret Scanning** | Security | ✅ GitHub native |
| **CodeQL** | Security Analysis | ✅ GitHub default |
| **SonarCloud** | Quality/Complexity | ✅ Configured (auto PR comments) |
| **Playwright** | E2E Testing | ✅ In CI |
| **Vitest** | Unit Testing | ✅ In CI |

### ✅ GitHub Native Security Features

```json
{
  "secret_scanning": "enabled",
  "secret_scanning_push_protection": "enabled",
  "dependabot_security_updates": "enabled",
  "secret_scanning_ai_detection": "enabled"
}
```

---

## Recommended GitHub Apps to Add

### 1. **CodeQL / GitHub Advanced Security** (FREE for public repos)

**What it does**: 
- Semantic code analysis for security vulnerabilities
- Finds SQL injection, XSS, etc. (less relevant for games but still useful)
- Tracks dependencies for known CVEs

**Setup**:
```yaml
# .github/workflows/codeql.yml
name: "CodeQL"

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    steps:
    - uses: actions/checkout@v4
    - uses: github/codeql-action/init@v3
      with:
        languages: javascript-typescript
    - uses: github/codeql-action/autobuild@v3
    - uses: github/codeql-action/analyze@v3
```

**Verdict**: ✅ ADD - Free, no additional app needed, just workflow

---

### 2. **SonarCloud** (FREE for public repos)

**What it does**:
- Code quality metrics (complexity, duplication, maintainability)
- Security hotspots
- Technical debt tracking
- PR decoration with quality gates

**Why useful for games**:
- Identifies complex functions (like Level.tsx at 510 lines!)
- Tracks code smells
- Enforces quality gates before merge

**Setup**:
1. Go to https://sonarcloud.io/
2. Sign in with GitHub
3. Import `arcade-cabinet/otter-elite-force`
4. Add workflow:

```yaml
# .github/workflows/sonarcloud.yml
name: SonarCloud
on:
  push:
    branches: [main]
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  sonarcloud:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:coverage
      - uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

Add `sonar-project.properties`:
```properties
sonar.projectKey=arcade-cabinet_otter-elite-force
sonar.organization=arcade-cabinet
sonar.sources=src
sonar.tests=src
sonar.test.inclusions=**/*.test.ts,**/*.test.tsx
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

**Verdict**: ✅ STRONGLY RECOMMEND - Best for tracking complexity/debt

---

### 3. **CodeClimate** (FREE for public repos)

**What it does**:
- Similar to SonarCloud (maintainability, test coverage)
- GPA-style letter grades
- Identifies "code smells"

**Comparison to SonarCloud**:
- SonarCloud has better TypeScript support
- CodeClimate has simpler UI
- Both are free for OSS

**Verdict**: ⚖️ OPTIONAL - Only if you prefer over SonarCloud

---

### 4. **Snyk** (FREE for open source)

**What it does**:
- Dependency vulnerability scanning
- Container scanning
- License compliance

**Why useful**:
- Complements Dependabot
- More detailed vulnerability info
- Auto-fix PRs

**Verdict**: ⚖️ OPTIONAL - Dependabot already covers most of this

---

### 5. **Codecov** (Alternative to Coveralls)

**What it does**:
- Same as Coveralls (coverage tracking)
- Better PR comments
- Coverage diff visualization

**Verdict**: ⚖️ OPTIONAL - Coveralls is already set up

---

## Recommended Setup

### Minimal (Just add CodeQL)

```bash
# Already have:
# - Biome (lint)
# - TypeScript (types)
# - Coveralls (coverage)
# - Dependabot (deps)

# Add:
# - CodeQL (security)
```

**Cost**: FREE, just add workflow file

### Comprehensive (Add SonarCloud)

```bash
# Add:
# - CodeQL (security)
# - SonarCloud (quality/complexity)
```

**Benefits**:
- Complexity tracking (identify files > 400 lines)
- Technical debt score
- Quality gates on PRs
- Maintainability rating

---

## Comparison Summary

| Tool | Type | Free? | GitHub App? | Effort |
|------|------|-------|-------------|--------|
| CodeQL | Security | ✅ | No (workflow only) | Low |
| SonarCloud | Quality | ✅ | Yes | Medium |
| Snyk | Dependencies | ✅ | Yes | Low |
| CodeClimate | Quality | ✅ | Yes | Medium |

---

## Current Status ✅

### Both Are Now Configured:

1. **CodeQL** - Enabled via GitHub's default security settings (no custom workflow needed)
2. **SonarCloud** - Fully integrated into CI workflow
   - Uses LCOV coverage reports from Vitest (`coverage/lcov.info`)
   - Configuration in `sonar-project.properties`
   - `SONAR_TOKEN` secret required in repo settings
   - Automatic PR comments for quality feedback

### Files Added/Modified:

- `sonar-project.properties` - SonarCloud configuration
- `.github/workflows/ci.yml` - Added SonarCloud scan step with `fetch-depth: 0`

This gives us:
- ✅ Security scanning (CodeQL - GitHub default)
- ✅ Quality/complexity tracking (SonarCloud - integrated with coverage)
- ✅ Coverage (Coveralls + SonarCloud)
- ✅ Dependencies (Dependabot)
- ✅ Linting (Biome)

**Comprehensive static analysis is now fully operational.**
