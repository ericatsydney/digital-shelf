# Clean-Gated Brainstorm-to-Verification Workflow

Follow this workflow for future feature requests and behavior changes in this repository.

## 1. Clean repository gate

Run:

```powershell
git status --short
```

If the output is not empty, stop before brainstorming or implementation and report the changed files, unless every change is an expected workflow artifact for the current approved feature:

- `docs/superpowers/specs/<current-feature>-design.md`
- `docs/superpowers/plans/<current-feature>.md`

These two documents are intentionally created and left uncommitted by this workflow. Preserve them and continue. Any other pre-existing or unrelated change still requires stopping; do not stash, reset, overwrite, or commit user changes.

## 2. Brainstorm before implementation

Use the brainstorming skill before modifying code.

- Inspect the repository, architecture, docs, and recent commits.
- Ask requirement questions one at a time.
- Offer 2-3 approaches with trade-offs and a recommendation.
- Present the proposed design, data flow, error handling, and acceptance criteria.
- Wait for explicit user approval before implementation.

## 3. Spec and implementation plan

Create and review:

```text
docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md
docs/superpowers/plans/YYYY-MM-DD-<topic>.md
```

The spec must define requirements, scope, approach, interfaces, failure behavior, acceptance criteria, and tests. The plan must define exact files, TDD steps, commands, expected results, and sequencing.

Leave both documents uncommitted for the user.

## 4. Implementation

Use subagent-driven development for bounded tasks.

- Give each subagent a disjoint write scope.
- Write a failing test before production code.
- Review each task before starting the next.
- Do not create commits automatically.

## 5. Verification

Run all of the following:

```powershell
npx tsc -b --pretty false
npm run test
npm run build
npx playwright test
```

Use the Playwright MCP for a user-perspective verification against the local app:

- Open the local verification URL in the browser.
- Exercise the requested user flow through the visible UI.
- Confirm the expected rendered result and check for browser console errors.

For the Digital Shelf 3D model flow, click the Haro Green button and confirm that the visible 3D canvas renders the model successfully.

Do not proceed to code review if any command fails.

### Secret check (required before handing over any change)

Make sure no secret or API key can enter a commit:

```powershell
git ls-files | Select-String -Pattern '(^|/)\.env' | Where-Object { $_ -notmatch '\.env\.example$' }
git diff HEAD | Select-String -Pattern 'TRIPO_API_KEY\s*=\s*\S|tsk_[A-Za-z0-9]{8,}|(api[_-]?key|secret|token)\s*[:=]\s*["'']?[A-Za-z0-9_\-]{16,}'
```

Both commands must print nothing (also scan untracked files that will be added). Any match is a Critical finding: remove the secret, tell the user to rotate the key, and do not hand over until clean. Real keys live only in git-ignored `.env.local` or OS environment variables; only `.env.example` (variable names, no values) may be tracked. Never print key values in chat, logs, or test output.

## 6. Code review

Run the code-review skill against the working-tree diff:

```powershell
git diff HEAD
git status --short
```

Critical and Important findings block completion. Fix them, rerun affected tests, and review again. Minor findings should be reported.

## 7. Playwright visual verification capture

Start Vite as the target for Playwright, then ask the Playwright MCP to:

- Open the local verification URL.
- Exercise the requested user flow through the visible UI.
- Capture the final rendered screen, including the Haro Green 3D model state when applicable.
- Check for browser console errors.
- Return the screen capture and verification result in the Codex chat so it can be reviewed here or remotely on mobile.

Use port 4173 when available. If it is occupied, allow Vite to select the next available port and report the exact URL. Do not terminate another process occupying the preferred port. Do not require the user to open the local server manually.

## Completion rules

- Preserve user changes.
- Do not commit unless explicitly requested.
- Report test results, review status, and the local verification URL.
