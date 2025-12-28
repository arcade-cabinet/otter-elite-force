---
allowed-tools: Edit,Write,Read,Bash(git:*),Bash(gh:*),Bash(pnpm:*)
description: Create a pull request with proper formatting
---

# Create Pull Request

Create a new branch, commit changes, and submit a pull request.

## Process

1. **Pre-flight Checks**
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test:unit
   pnpm build
   ```

2. **Create Branch** (if needed)
   - Use descriptive name: `feat/description` or `fix/description`
   ```bash
   git checkout -b <branch-name>
   ```

3. **Analyze Changes**
   ```bash
   git diff
   git status
   ```

4. **Split into Logical Commits**
   - Each commit should focus on single concern
   - Related file changes stay together
   - Separate refactoring from features

5. **Push to Remote**
   ```bash
   git push -u origin <branch-name>
   ```

6. **Create PR**
   ```bash
   gh pr create --title "..." --body "..."
   ```

## PR Format

```markdown
## Summary
Brief description of what this PR does.

## Changes
- Bullet points of specific changes

## Test Plan
- [ ] Unit tests pass
- [ ] Build succeeds
- [ ] Manual testing done
- [ ] Mobile tested (if applicable)

## Screenshots
(if UI changes)
```

## Guidelines

- Keep PRs focused and reviewable
- Link related issues with "Fixes #123"
- Add screenshots for UI/3D changes
- Ensure CI passes before requesting review

---
