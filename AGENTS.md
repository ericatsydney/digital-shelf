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

Do not proceed to code review if any command fails.

## 6. Code review

Run the code-review skill against the working-tree diff:

```powershell
git diff HEAD
git status --short
```

Critical and Important findings block completion. Fix them, rerun affected tests, and review again. Minor findings should be reported.

## 7. Local verification server

Start Vite with:

```powershell
npm run dev -- --host 127.0.0.1 --port 4173
```

Use port 4173 when available. If it is occupied, allow Vite to select the next available port and report the exact URL. Do not terminate another process occupying the preferred port.

## Completion rules

- Preserve user changes.
- Do not commit unless explicitly requested.
- Report test results, review status, and the local verification URL.
