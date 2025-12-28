---
allowed-tools: Edit,Write,Read,Glob,Grep,LS,Bash(pnpm:*),Bash(git:*),Bash(gh:*)
description: Analyze and fix a GitHub issue
---

# Fix GitHub Issue

Analyze and fix the GitHub issue: $ARGUMENTS

## Steps

1. **Get Issue Details**
   ```bash
   gh issue view $ARGUMENTS
   ```

2. **Understand the Problem**
   - Read the issue description carefully
   - Identify the expected vs actual behavior
   - Note any reproduction steps

3. **Search the Codebase**
   - Find relevant files using Glob/Grep
   - Understand the current implementation

4. **Implement the Fix**
   - Make minimal, focused changes
   - Follow existing code patterns
   - Add comments if logic is complex

5. **Test the Fix**
   - Run `pnpm test:unit` for unit tests
   - Run `pnpm build` to verify build
   - Run `pnpm lint` to check formatting

6. **Prepare the Commit**
   - Stage only relevant files
   - Write descriptive commit message referencing the issue
   - Format: `fix: <description> (fixes #<issue-number>)`

7. **Report Back**
   - Explain what was wrong
   - Describe the fix
   - Mention any side effects or follow-ups needed

---
