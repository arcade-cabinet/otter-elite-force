---
allowed-tools: Bash(git:*),Bash(pnpm:*)
description: Create well-formatted commits with conventional messages
---

# Smart Commit

Create well-formatted commits following conventional commit standards.

## Process

1. **Pre-commit Checks** (unless `--no-verify` specified)
   - Run `pnpm run typecheck` for type errors
   - Run `pnpm run lint` for linting issues
   - Run `pnpm run test:unit` to verify tests pass

2. **Check Staged Files**
   ```bash
   git status
   ```
   - If no files are staged, analyze un-staged changes and stage only files relevant to a single logical change.

3. **Analyze Changes**
   ```bash
   git diff --staged
   ```
   - Review the diff to understand what's changing
   - Identify if changes should be split into multiple commits

4. **Determine Commit Type**
   - ✨ `feat`: New feature
   - 🐛 `fix`: Bug fix
   - 📝 `docs`: Documentation
   - 💄 `style`: Formatting/style
   - ♻️ `refactor`: Code refactoring
   - ⚡️ `perf`: Performance
   - ✅ `test`: Tests
   - 🔧 `chore`: Tooling/config
   - Emojis are visual hints and **not** part of the `type` token (e.g. `feat`, `fix`).

5. **Create Commit Message**
   - Preferred format: `<emoji> <type>: <description>`
     - Example: `✨ feat: add squad intelligence for gator enemies`
   - Alternative (when scopes are needed): `<type>(<scope>): <description>`
     - Example: `feat(ai): add pack hunting behavior`
   - Keep first line under 72 characters
   - Use present tense, imperative mood

## Examples

Good commit messages:
- ✨ feat: add squad intelligence for gator enemies
- 🐛 fix: resolve oil slick collision detection
- ⚡️ perf: optimize InstancedMesh for bullet particles
- 📝 docs: update memory-bank with new patterns
- ♻️ refactor: simplify weapon upgrade logic
- ✅ test: add unit tests for damage calculation

## Split Guidelines

Consider splitting if:
- Changes touch unrelated parts of codebase
- Mix of features, fixes, and refactoring
- Very large changes that would be clearer separate

---
