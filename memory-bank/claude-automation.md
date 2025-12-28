# 🤖 Claude Code Automation

This document describes the comprehensive Claude Code automation system integrated into OTTER: ELITE FORCE.

## Overview

The repository uses [Claude Code Action](https://github.com/anthropics/claude-code-action) to provide AI-powered automation for:

- Interactive code assistance via @claude mentions
- Automatic PR code reviews
- CI failure detection and auto-fix
- Issue triage and labeling
- Weekly maintenance tasks
- Security audits
- Dependency updates

## Workflow Files

### `.github/workflows/claude_code.yml`

Main Claude automation workflow with multiple jobs:

| Job | Trigger | Purpose |
|-----|---------|---------|
| `claude-interactive` | @claude mention | On-demand AI assistance |
| `claude-review` | PR opened/updated | Automatic code review |
| `claude-triage` | Issue opened | Auto-label new issues |
| `claude-maintenance` | Weekly schedule | Repository health check |
| `claude-security` | Manual dispatch | Deep security audit |
| `claude-deps` | Manual dispatch | Safe dependency updates |

### `.github/workflows/claude_fix_ci.yml`

Automatic CI failure handling:

| Job | Trigger | Purpose |
|-----|---------|---------|
| `auto-fix` | CI workflow fails | Analyze and fix failures |
| `detect-flaky` | CI workflow fails | Detect flaky tests |

### `.github/workflows/claude_issue_dedup.yml`

Issue deduplication:

| Job | Trigger | Purpose |
|-----|---------|---------|
| `deduplicate` | Issue opened | Check for duplicate issues |

## Custom Commands

Located in `.claude/commands/`:

### `/fix-issue <number>`

Analyze and fix a GitHub issue by number. Reads issue details, searches codebase, implements fix, and prepares commit.

### `/commit`

Create well-formatted commits with conventional messages and emoji. Runs pre-commit checks, analyzes diff, suggests commit splitting if needed.

### `/create-pr`

Create a branch and pull request with proper formatting. Runs all checks, creates logical commits, pushes and creates PR with summary.

### `/release`

Prepare a new version release. Updates CHANGELOG, bumps version, creates tag and GitHub release.

### `/optimize <file>`

Analyze code for performance optimizations. Checks Three.js patterns, React performance, memory management, mobile considerations.

### `/label-issue`

Automatically categorize and label issues.

**Labels applied based on issue content:**
- Type: bug, enhancement, question, documentation
- Area: gameplay, ui, audio, ai, performance, testing, build, mobile
- Priority: P1 (critical), P2 (high), P3 (medium/low)

### `/review-pr`

Comprehensive PR review using specialized sub-agents.

**Review checklist:**
- TypeScript & code quality
- Mobile performance (Three.js, R3F)
- Zustand state patterns
- Testing coverage
- Procedural generation compliance

### `/fix-tests`

Debug and fix failing tests.

**Handles:**
- Unit test failures (Vitest)
- E2E test failures (Playwright)
- Mock issues
- Flaky test stabilization

### `/add-feature`

Add new features following project conventions.

**Ensures:**
- Procedural generation (no external assets)
- Mobile-first performance
- Proper TypeScript types
- Test coverage

## Specialized Agents

Located in `.claude/agents/`:

### performance-reviewer

Optimizes for mobile 3D game performance.

**Checks:**
- Three.js resource disposal
- Memory leaks
- Draw call optimization
- InstancedMesh usage
- useFrame performance
- React re-render optimization

### security-reviewer

Game-specific security review.

**Checks:**
- localStorage data integrity
- Save game validation
- Client-side cheating vectors
- Dependency vulnerabilities
- Build security (source maps)
- CI/CD secret handling

### threejs-reviewer

Three.js and React Three Fiber patterns.

**Checks:**
- Proper resource disposal
- useFrame best practices
- Declarative vs imperative patterns
- Procedural model generation
- Animation patterns

### testing-reviewer

Test quality and coverage.

**Checks:**
- Unit test patterns
- Mock completeness
- E2E test reliability
- Flaky test detection
- Coverage gaps

### zustand-reviewer

State management patterns.

**Checks:**
- Immutable updates
- Selector optimization
- Persistence configuration
- Reset patterns for testing

## Configuration

### `.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "pnpm biome format --write"
          }
        ],
        "matcher": "Edit|Write|MultiEdit"
      }
    ]
  }
}
```

Auto-formats files after Claude edits using Biome.

## Tool Permissions

Claude is granted comprehensive tool access for autonomous development:

**File Operations:**
- Edit, MultiEdit, Write, Read
- Glob, Grep, LS

**Shell Commands:**
- pnpm, npm, npx, node
- git (all subcommands)
- gh (GitHub CLI)
- biome, tsc, vitest, playwright, vite
- Standard utilities (cat, ls, grep, find, etc.)

**Special:**
- WebFetch (external URLs)
- NotebookEditCell (Jupyter notebooks)

## Usage Examples

### Interactive (@claude mentions)

```
@claude please fix the TypeScript errors in src/store/gameStore.ts
```

```
@claude add unit tests for the combat damage calculation
```

```
@claude optimize the enemy spawning for mobile performance
```

### Automatic Reviews

PRs automatically receive reviews with:
- Progress tracking (shows "in progress" status)
- Inline code comments for specific issues
- Summary comment with checklist results

### CI Auto-Fix

When CI fails on a PR:
1. Workflow fetches error logs
2. Claude analyzes the failure
3. Claude fixes the issue
4. Changes are committed
5. PR comment explains the fix

### Flaky Test Detection

Uses structured output (JSON schema) to return:
- `is_flaky`: boolean
- `confidence`: 0-1
- `summary`: explanation

If flaky and high confidence, PR is commented with advisory.

## Security Considerations

### Who Can Trigger

Interactive mode restricted to:
- Repository owner
- Organization members
- Collaborators

### Permissions Scope

Each workflow requests minimal permissions:
- `contents: read/write` - only when needed
- `pull-requests: write` - for comments
- `issues: write` - for labeling
- `actions: read` - for CI log access
- `id-token: write` - for OIDC auth

### Branch Protection

Auto-fix commits go to PR branches, not main.
All changes still require PR review/approval.

## Troubleshooting

### Claude Not Responding

1. Check `ANTHROPIC_API_KEY` secret is set
2. Verify user is collaborator/member
3. Check workflow logs in Actions tab

### CI Auto-Fix Not Working

1. Ensure `workflow_run` event is configured
2. Check the CI workflow name matches
3. Verify branch isn't prefixed with `claude/`

### Flaky Test False Positives

Adjust confidence threshold in workflow:
```yaml
if: fromJSON(steps.detect.outputs.structured_output).confidence >= 0.7
```

## Future Enhancements

- Visual regression review for screenshots
- Performance benchmark comparisons
- Multi-model support (different agents use different models)
- Custom slash commands via issue comments
- Integration with project management tools
