---
name: auto-execute
description: Autonomous verifier-driven acceptance convergence skill for Codex/OMX. Use when the user provides PRD/docs/UI/screenshots/specs and expects implementation, verifier gates, repair loops, final-gate evidence, or Relay Mode that auto-splits a long goal into one fresh Codex worker per task.
---

# auto-execute

Use this skill when the user wants a project completed from requirements, UI references, screenshots, APIs, tests, or product docs.

The default contract is: **the user provides intent and evidence; the agent turns it into a working, verified implementation.**

## Prime Directive

If PRD/docs/UI references are provided, treat them as sufficient authority to proceed. Do not repeatedly ask the user to confirm normal product, UI, routing, copy, or implementation details.

This skill is **Story-Driven Verifier Harness v2.3**. Codex/OMX is the executor; project-local verifier scripts are the judges; `run-final-gate.ps1` is the only authority allowed to declare `PASS`, `PASS_WITH_LIMITATION`, `PASS_NEEDS_MANUAL_UI_REVIEW`, `REPAIR_REQUIRED`, `FAIL`, `HARD_FAIL`, or `BLOCKED`.

Current control plane:

```text
Business project loop:
PRD/UI -> Story -> Test Points -> Tests -> Evidence -> Gap -> Repair -> Final Gate

Harness self loop:
Harness self-test -> score -> harness gaps -> repair plan -> harness patch -> self-test again

Long-running repair loop:
REPAIR_REQUIRED -> TODO.md -> fresh codex exec Worker -> verifier rerun -> HANDOFF.md
```

Version history is intentionally secondary. The durable rules are: final gate is the judge, `COMPLETED` is not acceptance, state lives in files rather than chat, and supervisor workers may repair one TODO item at a time without bypassing verifier gates.

The agent must:

1. Read the repository instructions and project files.
2. Read the provided PRD/docs/UI/specs/screenshots.
3. Infer the acceptance criteria.
4. Create or update the acceptance pack.
5. Implement the required behavior.
6. Run the relevant gates.
7. Repair failures automatically.
8. Repeat until done or genuinely blocked.
9. Produce final evidence and a concise report.

Planning, harness setup, and reports are not the delivery by themselves. Delivery means the target behavior is implemented and verified as far as the local environment allows.

## Relay Mode

Use Relay Mode when the user asks for long autonomous execution, context reset, "one task per Codex", fresh workers, automatic task splitting, or avoiding context overflow.

Relay Mode is a thin orchestration layer over the same verifier harness:

```text
Goal -> planner Codex -> TODO.md -> fresh worker Codex per task -> HANDOFF.md -> final gate
```

Operational rules:

1. Start with `run-codex-relay.ps1` for large goals that need task splitting.
2. The planner may inspect the repository and write `TODO.md`; it must not implement product code.
3. Each worker runs as a fresh `codex exec` process and may complete exactly one unchecked TODO item.
4. Every worker must update `TODO.md` and `docs/auto-execute/latest/HANDOFF.md` before stopping.
5. Resume without `-ResetRelay`; use `-ResetRelay` only when the user wants a new task plan.
6. Final acceptance still comes only from `run-final-gate.ps1`.

Command:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-codex-relay.ps1 `
  -ProjectRoot "<project root>" `
  -Goal "<goal>" `
  -MaxTasks 6 `
  -MaxWorkerRounds 12 `
  -Mode gate `
  -ResetRelay
```

Add `-NewWindow` only when visible separate PowerShell worker windows are wanted. Details live in `references/codex-relay.md`.

## Confirmation Policy

Do not ask the user for ordinary approvals.

Do not ask questions for:

- choosing between reasonable UI interpretations;
- missing minor copy, spacing, icon, color, or layout details;
- route/component/file placement that can be inferred from the codebase;
- normal build, lint, type, test, or runtime failures;
- whether to continue after a failed gate;
- whether to implement the next obvious item from the PRD/UI;
- whether to create local test artifacts, screenshots, or docs under the project.

Instead, make a conservative decision, document it in `docs/auto-execute/05-known-gaps-and-assumptions.md`, implement, verify, and continue.

Only stop and ask the user for:

- credentials, accounts, captcha, OTP, private tokens, or secret keys;
- real payment or billing action;
- production deployment or production data access;
- destructive database/data deletion;
- irreversible filesystem or git operations;
- unclear product direction where multiple choices would materially change the business goal and no evidence favors one;
- a missing critical source artifact after repository inspection;
- five repair loops on the same blocking failure without a safe next fix.

## Source-of-Truth Order

When requirements conflict, decide in this order:

1. Direct user instruction in the current conversation.
2. Repository `AGENTS.md` and project-specific instructions.
3. Latest PRD/requirement document.
4. Latest UI reference, screenshot, or design artifact.
5. Existing stable code/API/data contracts.
6. Common product conventions for the project type.

Record conflicts and chosen tradeoffs. Do not pause unless the conflict changes the business goal.

## Global Skill and Project Harness

This skill is installed globally at:

```text
C:\Users\linyanhui\.codex\skills\auto-execute
```

It can be used in any project. When a project needs the harness, copy the bundled directories from this global skill directory into the target project root:

```text
scripts/acceptance/
docs/auto-execute/
```

Then run from the target project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\init-harness.ps1 -ProjectRoot "<project root>" -RequirementDocs @("<PRD path>") -UIReferences @("<UI path>")
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\plan-fullstack-delivery.ps1 -ProjectRoot "<project root>" -RequirementDocs "<docs path>" -UIReferences "<UI path>" -OutputHarnessYml "harness.yml"
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\test-harness.ps1 -ProjectRoot "<project root>"
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-convergence.ps1 -ProjectRoot "<project root>" -Mode full -MaxRounds 5 -ResetConvergence -Strict
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-convergence.ps1 -ProjectRoot "<project root>" -Mode full -MaxRounds 5 -UseCodexSupervisor
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-codex-relay.ps1 -ProjectRoot "<project root>" -Goal "<goal>" -MaxTasks 6 -MaxWorkerRounds 12 -Mode gate -ResetRelay
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-status.ps1
```

To create a clean global skill release zip from the global skill root, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\package-release.ps1
```

The release zip is allowlisted. It must not include old `docs/auto-execute/results`, `logs`, `comparison`, `meta-tests/workspaces`, `machine-summary.json`, `evidence-manifest.json`, `docs/AUTO_EXECUTE_DELIVERY_REPORT.md`, or old project run reports.

The harness is a project-local tool for evidence and repeatability. Do not confuse harness initialization with task completion.

`init-harness.ps1` must create `harness.yml` in the target project. Project-specific commands, docs, UI references, lane enablement, and safety flags belong in `harness.yml`, not in ad hoc prompt text or hard-coded script edits.

## Resumable Execution and Context Protection

The skill must not rely on chat context as long-term state.

Every run must maintain:

- `docs/auto-execute/latest/HANDOFF.md`
- `docs/auto-execute/latest/run-id.txt`
- `docs/auto-execute/latest/machine-summary.json`
- `docs/auto-execute/latest/gap-list.json`
- `docs/auto-execute/latest/repair-plan.md`
- `docs/auto-execute/latest/next-agent-action.md`
- `docs/auto-execute/latest/verification-results.md`
- `docs/auto-execute/latest/blockers.md`

The agent must update `HANDOFF.md` after:

1. init-harness
2. each verifier lane
3. each convergence round
4. each `REPAIR_REQUIRED`
5. each code repair
6. each retest
7. final gate

If context is low, time is long, or a large repair is about to start, write `HANDOFF.md` before continuing.

`REPAIR_REQUIRED` is not an end state. The agent must read `repair-plan.md` and `next-agent-action.md`, modify implementation/tests/evidence, then rerun convergence without `-ResetConvergence`.

If interrupted, the next run must resume from `docs/auto-execute/latest/HANDOFF.md`, not restart with `-ResetConvergence`.

## Codex Supervisor Mode

Supervisor mode is a Manager / Worker loop for long repair runs. It does not replace PRD/UI verifiers or `run-final-gate.ps1`; it only launches fresh `codex exec` sessions so context does not accumulate inside one long chat.

Supervisor state lives in:

- `TODO.md`
- `docs/auto-execute/latest/HANDOFF.md`
- `docs/auto-execute/latest/gap-list.json`
- `docs/auto-execute/latest/repair-plan.md`
- `docs/auto-execute/latest/next-agent-action.md`
- `.codex-runs/worker-round-*.log`

Use supervisor mode when:

- context is low;
- task runtime is long;
- multiple repair gaps remain;
- `run-convergence.ps1` returned `REPAIR_REQUIRED`;
- the user wants continuous execution without a single long model context.

Supervisor mode rules:

1. `export-todo-from-gaps.ps1` converts open `HARD_FAIL` / `IN_SCOPE_GAP` items into `TODO.md`.
2. `run-codex-supervisor.ps1` starts one fresh `codex exec` Worker per round.
3. Each Worker must read `TODO.md`, `HANDOFF.md`, `repair-plan.md`, and `next-agent-action.md`.
4. Each Worker may fix exactly the first unfinished TODO item, then update `TODO.md` and `HANDOFF.md`.
5. Workers must not run `-ResetConvergence`, weaken tests, fake evidence, access production resources, or perform destructive git/filesystem operations.
6. After TODO is complete, supervisor reruns convergence without `-ResetConvergence`.
7. Final acceptance still comes only from `run-final-gate.ps1`.

Enable explicitly:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-convergence.ps1 -ProjectRoot "<project root>" -Mode full -MaxRounds 5 -ResetConvergence -UseCodexSupervisor
```

Or set in `harness.yml`:

```yaml
supervisor:
  enabled: true
  maxWorkerRounds: 20
```

## v2.0 Story-Driven Verifier Control Plane

The harness must run concrete verifier scripts and write machine-readable JSON under `docs/auto-execute/results/`. Markdown reports are useful for humans, but final acceptance cannot depend on prose claims.

Required verifier scripts:

- `run-requirement-extract.ps1`: extract candidate requirements from PRD/docs.
- `run-requirement-section-map.ps1`: map Markdown and Chinese/numbered PRD sections into `requirement-section-map.json`; uncovered P0/P1 sections become gaps.
- `run-requirement-coverage.ps1`: verify PRD/requirement sections are mapped into `requirement-target.json`; uncovered P0/P1 sections become gaps.
- `run-requirement-verify.ps1`: verify `requirement-target.json`; P0/P1 in-scope requirements need status and existing evidence.
- `run-story-extract.ps1`: extract candidate stories from PRD/docs and normalized requirements.
- `run-story-curate.ps1`: classify raw story candidates into valid stories, supporting requirements, architecture notes, out-of-scope items, duplicates, and ambiguous items before normalization.
- `run-story-normalize.ps1`: normalize candidates into `story-target.json`, `epic-map.json`, and `sprint-plan.json`.
- `run-story-test-generate.ps1`: generate or normalize route/API/E2E/visual/functional test points into `story-test-matrix.json`.
- `run-story-test-materialize.ps1`: convert story test points into generated tests, existing bindings, UI verifier bindings, manual review entries, or deferred entries with commands and evidence outputs.
- `run-generated-story-tests.ps1`: execute generated route/API/E2E story tests and backfill passing generated evidence into story targets and the story test matrix.
- `run-story-quality-gate.ps1`: reject unnormalized P0/P1 stories, copied PRD text, empty acceptance criteria, empty test points, empty evidence requirements, and missing route/API/E2E/visual coverage.
- `run-story-verify.ps1`: verify P0/P1 stories have acceptance criteria, test points, and existing evidence for every required test point.
- `run-story-final-report.ps1`: generate `story-acceptance-summary.json` and update `docs/AUTO_EXECUTE_DELIVERY_REPORT.md` with `## Story Acceptance Summary`.
- `run-ui-capture.ps1`: inventory UI references, run configured screenshot capture, or fall back to `capture-ui.mjs` with Playwright when available.
- `run-ui-compare.ps1`: run optional `compare-ui.mjs` pixel diff with `pixelmatch/pngjs`, then verify `ui-target.json`; UI PASS requires reference plus actual screenshot/evidence, and pixel-perfect PASS requires visual diff evidence.
- `run-contract-map.ps1`: discover frontend calls and backend API definitions into `contract-map.json`, including default Next.js, Nest, and Flutter contract adapters.
- `run-contract-verify.ps1`: verify path, method, request, response, auth/session, error, loading, empty, and evidence alignment.
- `run-frontend-test.ps1`: run frontend lint/typecheck/unit/build/analyze gates through the project-native tooling.
- `run-backend-test.ps1`: run backend build/unit/integration/API gates through the project-native tooling.
- `run-e2e-flow.ps1`: run configured full-flow/E2E command or mark the lane as manual review/blocker with evidence.
- `run-report-integrity.ps1`: validate reports, Markdown fences, mojibake, and evidence paths.
- `run-secret-guard.ps1`: validate staged/worktree/log/report secret risks.
- `run-final-gate.ps1`: read verifier JSON plus `gap-list.json`, `machine-summary.json`, `requirement-target.json`, `story-target.json`, `story-test-matrix.json`, and `ui-target.json`; this is the only final judge.
- `write-handoff.ps1`: sync resumable state into `docs/auto-execute/latest/HANDOFF.md`.
- `resume-convergence.ps1`: resume the current run without `-ResetConvergence`.
- `export-todo-from-gaps.ps1`: convert open hard/in-scope gaps into `TODO.md` for Worker repair.
- `run-codex-supervisor.ps1`: launch fresh one-task `codex exec` Workers and rerun convergence without resetting state.
- `plan-relay-tasks.ps1`: use a read-only planner Codex to split a large goal into `TODO.md` plus `docs/auto-execute/latest/relay-tasks.json`.
- `run-codex-relay.ps1`: orchestrate Relay Mode from goal planning through one-worker-per-task supervision.
- `run-codex-worker-once.ps1`: helper for visible `-NewWindow` worker execution.
- `run-verifier-dependencies.ps1`: install or verify dev-only verifier dependencies according to `harness.yml`.
- `run-harness-self-eval.ps1`: run harness meta-tests against good and bad fixtures.
- `run-harness-score.ps1`: write the 100-point `harness-scorecard.json`.
- `run-harness-gap-repair.ps1`: write `harness-gap-list.json` and `harness-repair-plan.md` when the score is below 90.

Final gate must fail or block when required verifier JSON is missing. A green build/test is not sufficient; every convergence round must also compare PRD, PRD section coverage, `requirement-section-map.json`, P0/P1 stories and test-point evidence, generated story test execution, story materialization, story quality, story acceptance summary, UI screenshots/diffs, contract, E2E/full-flow evidence, report integrity, and secret safety.

Use mature project tooling beneath the harness whenever available: Playwright for screenshots, pixelmatch/looks-same for pixel diff, npm/pnpm/yarn/flutter/pytest/vitest/jest/Nest scripts for tests, Docker Compose for safe local DB E2E, and gitleaks/secretlint when installed. If a mature tool is unavailable, record the lane as `PASS_WITH_LIMITATION`, `MANUAL_REVIEW_REQUIRED`, `DEFERRED`, or `DOCUMENTED_BLOCKER`; do not fake a `PASS`.

### Verifier Dependency Policy

`harness.yml` must include:

```yaml
verifierDependencies:
  allowInstallDevDependencies: false
  allowEphemeralNpx: true
  installPlaywrightBrowsers: false
  packages:
    - playwright
    - pixelmatch
    - pngjs
```

The harness must not modify `package.json` or lockfiles by default. It first uses project-resolvable dependencies, then ephemeral `npx`/`npm exec` when `allowEphemeralNpx: true`, and only installs dev dependencies when `allowInstallDevDependencies: true` is explicitly set. It must record whether dependency mutation happened in verifier dependency JSON and `docs/auto-execute/verification-results.md`. If neither local dependencies nor ephemeral execution are available, the related verifier must return `DOCUMENTED_BLOCKER`, never a fake pass.

### Default UI Verification

If `commands.uiCapture` is configured in `harness.yml`, use it. Otherwise `run-ui-capture.ps1` must try the bundled `capture-ui.mjs` fallback:

If `uiMapping` is configured in `harness.yml`, it is the preferred UI source of truth:

```yaml
uiMapping:
  - id: UI-HOME
    reference: docs/UI/home.png
    route: /
    viewport: 1440x900
    required: true
```

Automatic UI route inference is only a fallback. Any `uiMapping` item with `required: true` must have an existing reference and actual screenshot evidence before UI acceptance.

- requires Node plus project-resolvable `playwright`;
- reads `ui-target.json` screens with `route`, or falls back to `ui-candidates.json` and route inference;
- uses `commands.uiBaseUrl` or `http://127.0.0.1:3000`;
- optionally starts `commands.uiStart`;
- captures desktop `1440x900` and mobile `390x844`;
- checks for blank pages and runtime error overlays;
- writes screenshots under `docs/auto-execute/screenshots/`;
- updates `actualScreenshot`, `actualScreenshotDesktop`, `actualScreenshotMobile`, and `visualEvidence` in `ui-target.json`;
- writes `docs/auto-execute/results/ui-capture.json`.

If Playwright, routes, or the local server are unavailable, mark the lane `MANUAL_REVIEW_REQUIRED` or `DOCUMENTED_BLOCKER`; never mark UI as `PASS`.

`run-ui-compare.ps1` must try bundled `compare-ui.mjs` when Node is available. It uses `pixelmatch` and `pngjs` if installed. If pixel diff tooling is missing, final gate can only produce `PASS_NEEDS_MANUAL_UI_REVIEW` or a stronger limitation, never pixel-perfect `PASS`.

`ui-verifier.json` must expose per-screen `structureStatus`, `screenshotStatus`, `pixelDiffStatus`, `finalUiStatus`, `canClaimPixelPerfect`, and `knownDifferences`. Required UI without an actual screenshot is a hard failure. Required UI with screenshots but without pixel diff evidence can be accepted only as manual UI review or limitation, never as pixel-perfect PASS.

UI mapping priority is fixed:

1. `harness.yml` `uiMapping`.
2. UI references automatically discovered from configured UI reference paths and common `docs/UI` locations.
3. filename route guessing.
4. manual review.

Required `uiMapping` entries without screenshot evidence are `HARD_FAIL`. Auto-guessed UI mapping cannot directly claim pure `PASS` unless screenshot and diff evidence both exist.

### UI Fidelity Hard Gate

When any `uiMapping` item has `required: true`, automated UI evidence is not allowed to hide visible mismatch behind a soft limitation.

- `run-ui-compare.ps1` must read `ui-verifier.json`, `ui-pixel-diff.json`, `ui-target.json`, and `gap-list.json`, then write each required screen's `ratio`, `sizeMismatch`, `knownDifferences`, `pixelDiffStatus`, `finalUiStatus`, and `canClaimPixelPerfect`.
- If a required screen's pixel diff ratio is greater than `visual.diffThreshold`, the verifier must add an open `IN_SCOPE_GAP`; in Strict mode it must produce `HARD_FAIL` or `FAIL`.
- If a required screen has `sizeMismatch=true`, the verifier must at least prevent pure `PASS`; in Strict mode it must fail.
- `next-agent-action.md` must tell the next agent to repair the implementation and rerun screenshot/diff gates. It must not redirect obvious in-scope UI mismatch to generic manual review.
- `run-acceptance-compare.ps1` must convert machine-readable UI diff results into comparison gaps. It must not depend only on Markdown status words.
- "There is a screenshot" is not enough for UI acceptance when the page visibly does not match the required UI reference.

### Structured Repository / DB Hard Gate

When the project PRD or `harness.yml` requires a structured repository, JSON runtime artifacts are transitional evidence only.

- `DATABASE_BACKEND=json` or missing `DATABASE_URL` cannot count as backend `PASS` for a required structured repository lane.
- The DB lane must verify a safe local PostgreSQL target, schema bootstrap, runtime write, and repository/API read path when the repo exposes those commands.
- Supabase is treated as a remote PostgreSQL target behind the same `DATABASE_URL`; the harness must not require real Supabase credentials for local acceptance.
- JSON artifacts may remain as audit evidence and fallback, but final reports must say whether the serving path is `postgres`, `json`, or `seed`.

### Dynamic Final Gate

`run-final-gate.ps1` must read `harness.yml` `lanes.<lane>.enabled` dynamically:

- `frontend.enabled: false` means `frontend-test.json` is not a hard required verifier result.
- `backend.enabled: false` means `backend-test.json` is not a hard required verifier result.
- `visual.enabled: false` means `ui-capture.json` and `ui-verifier.json` are not hard required verifier results.
- `integration.enabled: false` means `e2e-flow.json` is not a hard required verifier result.
- requirements, stories, secret guard, and report integrity remain enabled by default.
- if adapter detection or existing verifier output suggests a disabled or unconfigured lane exists, final gate records a suggestion instead of silently claiming coverage.

### Acceptance Confidence

`machine-summary.json` must include:

- `acceptanceConfidence`;
- `confidenceFactors.requirementsCovered`;
- `confidenceFactors.storiesCovered`;
- `confidenceFactors.uiScreenshotsCovered`;
- `confidenceFactors.contractVerified`;
- `confidenceFactors.e2eVerified`;
- `confidenceFactors.manualReviewRemaining`.

Final reports must display `Acceptance confidence: 0.xx`. If `finalVerdict` is not `PASS`, final gate must explain which factors reduced confidence.

### Strict Mode

Use `run-convergence.ps1 -Mode full -MaxRounds 5 -ResetConvergence -Strict` for final delivery. Strict mode allows only `PASS`, `FAIL`, or `BLOCKED` as final verdicts. In Strict mode, `MANUAL_REVIEW_REQUIRED`, `PASS_WITH_LIMITATION`, missing screenshots, missing visual diff evidence, missing P0/P1 evidence, contract verifier failure, E2E verifier failure, report-integrity failure, or secret-guard failure prevents final `PASS`.

## OMX Usage

For PRD + UI driven delivery, prefer the direct skill keyword. Plain language can route approximately, but explicit `$auto-execute`, `$ralph`, `$ralplan`, and `$code-review` are the deterministic control surface.

Keep the user prompt short. Do not paste this whole skill or long historical rules into every task prompt. Project-specific commands, lane switches, docs, UI mappings, safety flags, and resumable state belong in `harness.yml` and `docs/auto-execute/latest/HANDOFF.md`.

### Recommended Direct Command

Use `$auto-execute` when the task should go from PRD/UI to implementation, verification, repair, and review:

```text
$auto-execute

Project root:
<absolute project path>

Requirement docs:
<paths to PRD/docs>

UI references:
<paths to UI/screenshots/design files>

Task:
Implement the product behavior described by the requirement docs and UI references end-to-end.

Execution rules:
- Treat the provided PRD/docs/UI as sufficient authority.
- Do not ask me to confirm ordinary product, UI, routing, copy, or implementation details.
- Infer acceptance criteria from the docs and UI.
- Convert PRD requirements into story-target.json and story-test-matrix.json before claiming acceptance.
- Every P0/P1 story must have acceptanceCriteria, testPoints, and evidence for each required testPoint.
- Initialize the project-local harness if missing.
- Run plan-fullstack-delivery.ps1 or equivalent planning to create full-stack lanes.
- Create/update docs/auto-execute acceptance artifacts.
- Implement frontend screens/routes/components/states from the UI.
- Implement backend APIs/services/data behavior from the requirements.
- Align frontend/backend contracts: routes, payloads, auth/session, response shapes, error states.
- Run frontend-only, backend-only, contract/API, integrated/full-flow, and visual checks that apply to this repo.
- Repair failures automatically and re-run the failed gates.
- After any apparently passing round, compare the implementation against the requirement docs and UI references again.
- If comparison finds any requirement/UI/contract/evidence gap, start the next repair round automatically.
- If `run-convergence.ps1` returns `REPAIR_REQUIRED`, do not stop. Read `docs/auto-execute/next-agent-action.md` and `docs/auto-execute/repair-plan.md`, modify implementation/tests/evidence, then rerun convergence. Repeat up to 5 rounds.
- If interrupted, read `docs/auto-execute/latest/HANDOFF.md` and resume with `resume-convergence.ps1`; do not use `-ResetConvergence` for the same run.
- Completion requires one clean comparison round with no unresolved P0/P1 requirement, story, UI, contract, or evidence gaps.
- Run code review before final response.
- Stop only for credentials, production deployment/data, payment, destructive/irreversible actions, or after five failed repair loops on the same blocker.
- I only do final acceptance.

Final report:
docs/AUTO_EXECUTE_DELIVERY_REPORT.md
```

Do not wrap this skill in `$autopilot` unless direct skill invocation is unavailable. `$autopilot` is only a fallback transport for environments that cannot invoke `$auto-execute` directly.

### Focused Completion Command

Use `$ralph` when the plan is already clear and you mainly need persistent implementation/repair:

```text
$ralph "Use the auto-execute skill. Continue from the current PRD/UI acceptance criteria, implement all missing behavior, run verification, fix failures, and do not ask ordinary clarification questions. Stop only for hard blockers. I only do final acceptance."
```

### Planning-Only Command

Use `$ralplan` only when the user explicitly wants a plan and does not want code changes yet:

```text
$ralplan "Use the auto-execute skill in planning-only mode. Read the PRD/UI, produce acceptance criteria, implementation plan, verification commands, and stop rules. Do not edit production code."
```

### Review-Only Command

Use `$code-review` after an implementation pass or when the user asks for audit/review only:

```text
$code-review "Review the current diff against the PRD/UI and docs/auto-execute acceptance criteria. Prioritize bugs, missing requirements, broken UI behavior, missing tests, and false completion claims."
```

### Expected OMX Behavior

When this skill is used through the `$autopilot` fallback, OMX should run the loop:

```text
$ralplan -> $ralph -> $code-review
```

If review is not clean, it should feed the findings back into the next plan and continue. It should not return to the user after every step for routine approval.

## Acceptance Convergence Loop

The task is not complete after the first green build/test round. Green tests only mean the current checks passed. The agent must then compare the built product against the requirement docs and UI references.

Run this loop:

1. Implement from PRD/UI.
2. Run frontend, backend, contract, visual, and integrated gates.
3. Run `run-acceptance-compare.ps1`.
4. If comparison finds gaps, convert those gaps into the next repair tasks.
5. Repair implementation and/or evidence.
6. Re-run the affected gates.
7. Run another comparison round.
8. Stop only when a comparison round reports no unresolved requirement/story/UI/contract/evidence gaps, or when a hard stop condition is reached.

Each comparison round must write:

```text
docs/auto-execute/comparison/round-NNN.json
docs/auto-execute/comparison/round-NNN.md
docs/auto-execute/results/acceptance-compare.json
docs/auto-execute/18-acceptance-comparison-loop.md
```

The final report can claim completion only if the latest `acceptance-compare` result is `PASS`, guard lanes are clean, and code review is clean or explicitly accepted as manual review by the user.

When `run-gap-repair.ps1` produces open `HARD_FAIL` or `IN_SCOPE_GAP` items, the agent must edit implementation, tests, or evidence before starting the next convergence round. The scripts detect gaps and write `docs/auto-execute/repair-plan.md`; they must not simply loop without code changes and pretend repair happened.

Use `-ResetConvergence` for a new task or after switching PRD/UI/project scope. This clears stale convergence state so an older fifth-round failure cannot poison a new run.

`REPAIR_REQUIRED` must be reflected in `docs/auto-execute/convergence-state.json`, `docs/auto-execute/machine-summary.json`, and `docs/auto-execute/latest/HANDOFF.md`. The next agent should be able to resume by reading `docs/auto-execute/latest/HANDOFF.md`, `machine-summary.json`, `next-agent-action.md`, `repair-plan.md`, and `gap-list.json`.

When a previously open `HARD_FAIL` or `IN_SCOPE_GAP` no longer appears in the latest comparison round, record the closure in `docs/auto-execute/gap-closure-log.md` with the round, gap id, closure basis, and evidence path.

## Full-Stack Delivery Pipeline

When the user provides requirement docs and UI references, the agent must arrange the work into these lanes and drive them to evidence:

| Lane | Purpose | Required outputs | Completion evidence |
| --- | --- | --- | --- |
| 0. Intake | Read repo instructions, PRD, UI, existing architecture | project intake, assumptions, source inventory | docs/auto-execute/00-project-intake.md |
| 1. Requirements | Turn PRD/UI into acceptance criteria | traceability matrix, acceptance checklist | docs/auto-execute/02-requirement-traceability-matrix.md |
| 2. Stories | Convert requirements into sprint/story/test-point units | story map, story test matrix, story status | story-target.json and story-test-matrix.json |
| 3. Frontend | Build screens/routes/components/states from UI | frontend plan, changed UI files, visual checklist | frontend tests/build/screenshots |
| 4. Backend | Build APIs/services/data behavior required by PRD | backend plan, endpoints/services/data changes | backend tests/API smoke |
| 5. Contract alignment | Ensure frontend calls match backend routes, shapes, auth, errors | contract map and mismatch log | API contract tests or smoke evidence |
| 6. Frontend verification | Verify UI independently | lint/typecheck/analyze, unit/widget tests, build, visual evidence | logs under docs/auto-execute/logs |
| 7. Backend verification | Verify backend independently | build, lint/typecheck, unit/integration/API tests | logs under docs/auto-execute/logs |
| 8. Integrated verification | Verify end-to-end behavior across frontend/backend/data | E2E, smoke, full-flow checklist | docs/auto-execute/FULL_FLOW_ACCEPTANCE.md |
| 9. Acceptance comparison | Compare implementation/evidence against PRD/UI/stories | comparison rounds and gap list | results/acceptance-compare.json |
| 10. Repair | Fix failures and rerun targeted gates | repair log | docs/auto-execute/08-repair-log.md |
| 11. Guard and integrity | Check secrets and report/evidence integrity | secret guard, report integrity | results/secret-guard.json and results/report-integrity.json |
| 12. Review and report | Review diff against PRD/UI/story evidence | code review, final report | docs/AUTO_EXECUTE_DELIVERY_REPORT.md |

These lanes are not optional for full-stack work. If a lane does not apply, mark it `DEFERRED` or `MANUAL_REVIEW_REQUIRED` with a reason. Do not silently skip it.

### Required Task Decomposition

Create `docs/auto-execute/12-fullstack-delivery-plan.md` with a task table like:

| ID | Lane | Task | Target files | Depends on | Verification | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |

Every P0/P1 requirement from the PRD or UI must map to at least one story and at least one frontend/backend/contract/test task. A requirement is not done until its implementation task, story test points, and verification task all have evidence.

Every P0/P1 story is not done until:

- it has `acceptanceCriteria`;
- it has `testPoints`;
- every required test point is `PASS` or `PASS_WITH_LIMITATION`;
- every required test point points to existing evidence.

Auto-extracted requirements are candidates only. `run-requirements.ps1` writes them to `docs/auto-execute/requirement-candidates.json`. The agent must normalize grep/script output into real acceptance criteria in `docs/auto-execute/requirement-target.json` before implementation or final `PASS`: assign P0/P1/P2 priority, write acceptance criteria, map each item to surface/API/UI/test evidence, and keep unnormalized items out of `requirement-target.json`. If `requirement-target.json` contains `CANDIDATE`, final gate must fail.

### Frontend and Backend Alignment

For every frontend data interaction, record:

- UI surface or component;
- backend endpoint/service expected;
- request payload/query params;
- response shape;
- auth/session requirement;
- loading/empty/error/success UI state;
- test or smoke evidence.

Write this to `docs/auto-execute/13-frontend-backend-contract-map.md`.

If the frontend expects an API that does not exist, implement the backend API when it is within scope. If an existing backend API exists with a different shape, adapt the frontend or backend according to the source-of-truth order and document the decision.

## Harness v0.2 Control Plane

The harness must keep machine-readable state so the next agent can resume without rereading every Markdown report:

```text
harness.yml
docs/auto-execute/evidence-manifest.json
docs/auto-execute/machine-summary.json
docs/auto-execute/repair-attempts.json
docs/auto-execute/results/*.json
```

Each lane writes one JSON result:

```json
{
  "lane": "frontend",
  "status": "PASS",
  "commands": [],
  "evidence": [],
  "blockers": [],
  "nextActions": []
}
```

The final Markdown report is for humans. `machine-summary.json` is for the next agent. Final claims must be based on `evidence-manifest.json`, lane results, and current verification results.

`COMPLETED` is not a valid final verdict. COMPLETED means process finished, not acceptance passed. It can only mean a process finished running, never that acceptance passed. `COMPLETE` and `COMPLETED` must not normalize to `PASS`; they must become `PASS_WITH_LIMITATION`, `MANUAL_REVIEW_REQUIRED`, or a stricter non-pass state until final gate proves acceptance. Final verdicts must use `PASS`, `PASS_WITH_LIMITATION`, `PASS_NEEDS_MANUAL_UI_REVIEW`, `REPAIR_REQUIRED`, `HARD_FAIL`, or `BLOCKED`, and scripts must map them to stable exit codes.

`run-final-gate.ps1` is the only final judge. `run-all.ps1` executes lanes; `run-convergence.ps1` controls comparison and repair handoff; `run-final-gate.ps1` writes the authoritative `machine-summary.json` verdict. Do not call generic `Update-MachineSummary` after final gate, because that can overwrite the final verdict.

## Required Guard Lanes

Always run or explicitly defer:

- `run-secret-guard.ps1`: checks secret-like filenames, staged secret-like files, and secret-like content in logs/reports.
- `run-report-integrity.ps1`: checks unexpanded variables, broken Markdown fences, mojibake markers, missing evidence references, and machine summary integrity.
- `run-contract.ps1`: maintains contract evidence beyond basic API reachability.
- `run-scope-classification.ps1`: forces each requirement into `IN_SCOPE_MUST_CLOSE`, `IN_SCOPE_PASS_WITH_LIMITATION`, `DEFERRED_OUT_OF_SCOPE`, `PRODUCT_DECISION_REQUIRED`, or `BLOCKED_BY_ENVIRONMENT`.

If guard lanes fail, do not claim final completion.

`secret-guard` must classify findings: staged secret-like files or real key content are `HARD_FAIL`; untracked secret-like files are `DOCUMENTED_BLOCKER`; documentation that merely mentions patterns such as `client_secret_*.json` is not a leak.

## Required Acceptance Pack

Create or update:

```text
docs/auto-execute/00-project-intake.md
docs/auto-execute/01-task-decomposition.md
docs/auto-execute/01-prd-index.md
docs/auto-execute/02-requirement-traceability-matrix.md
docs/auto-execute/03-story-map.md
docs/auto-execute/03-surface-map.md
docs/auto-execute/04-story-test-matrix.md
docs/auto-execute/04-visual-acceptance-checklist.md
docs/auto-execute/05-known-gaps-and-assumptions.md
docs/auto-execute/06-test-matrix.md
docs/auto-execute/07-acceptance-test-plan.md
docs/auto-execute/08-repair-log.md
docs/auto-execute/09-code-review.md
docs/auto-execute/10-agent-mistake-log.md
docs/auto-execute/11-harness-improvement-log.md
docs/auto-execute/12-fullstack-delivery-plan.md
docs/auto-execute/13-frontend-backend-contract-map.md
docs/auto-execute/14-frontend-implementation-plan.md
docs/auto-execute/15-backend-implementation-plan.md
docs/auto-execute/16-integrated-verification-plan.md
docs/auto-execute/17-final-acceptance-checklist.md
docs/auto-execute/18-acceptance-comparison-loop.md
docs/auto-execute/STATUS_SEMANTICS.md
docs/auto-execute/comparison/
docs/auto-execute/acceptance-goal.json
docs/auto-execute/requirement-candidates.json
docs/auto-execute/requirement-target.json
docs/auto-execute/requirement-section-map.json
docs/auto-execute/epic-map.json
docs/auto-execute/sprint-plan.json
docs/auto-execute/story-candidates.json
docs/auto-execute/story-candidates-curated.json
docs/auto-execute/story-target.json
docs/auto-execute/story-test-matrix.json
docs/auto-execute/story-status.json
docs/auto-execute/story-materialized-tests.json
docs/auto-execute/story-quality-gate.json
docs/auto-execute/story-acceptance-summary.json
docs/auto-execute/story-gap-list.json
docs/auto-execute/ui-target.json
docs/auto-execute/surface-target.json
docs/auto-execute/gap-list.json
docs/auto-execute/gap-list.md
docs/auto-execute/gap-closure-log.md
docs/auto-execute/convergence-state.json
docs/auto-execute/convergence-rounds/
docs/auto-execute/next-agent-action.md
docs/auto-execute/final-convergence-report.md
docs/auto-execute/visual-diff-report.md
docs/auto-execute/evidence-manifest.json
docs/auto-execute/machine-summary.json
docs/auto-execute/repair-attempts.json
docs/auto-execute/results/
docs/auto-execute/latest/HANDOFF.md
docs/auto-execute/latest/run-id.txt
docs/auto-execute/latest/machine-summary.json
docs/auto-execute/latest/gap-list.json
docs/auto-execute/latest/repair-plan.md
docs/auto-execute/latest/next-agent-action.md
docs/auto-execute/latest/verification-results.md
docs/auto-execute/latest/blockers.md
docs/auto-execute/harness-scorecard.json
docs/auto-execute/harness-gap-list.json
docs/auto-execute/harness-repair-plan.md
docs/auto-execute/harness-self-eval-report.md
docs/AUTO_EXECUTE_DELIVERY_REPORT.md
```

The acceptance pack must be derived from actual files and provided references. It must not be empty ceremony.

## Implementation Policy

After the acceptance pack exists, implement. Do not stop at analysis.

Implement against:

- PRD/docs requirement IDs;
- UI references and screenshots;
- existing route/screen/API/component patterns;
- existing tests and contracts;
- local data models and mock/fallback patterns already used by the repo.

Prefer full feature completion over tiny artificial pauses. The "one feature at a time" lock is for risky repair loops and multi-agent coordination, not for blocking obvious adjacent work. If several changes are clearly required for the same acceptance criterion, implement them together and verify them together.

Do not invent unsupported backend APIs or fake data as a substitute for implementation. If local fallback data is necessary to prevent crashes, label it clearly and document the limitation.

## UI Delivery Rules

When UI references are provided:

- map each visible screen/state to an implementation target;
- build the actual screen or component, not just docs around it;
- match layout, hierarchy, spacing, interaction states, empty/loading/error states, and responsive behavior as closely as the codebase allows;
- run visual or screenshot checks when possible;
- separate UI acceptance into structure, visual, and pixel-perfect layers when possible: `structureStatus` must be `PASS`; `visualStatus` may be `PASS` or `PASS_WITH_LIMITATION`; `pixelPerfectStatus` defaults to `MANUAL_REVIEW_REQUIRED` unless visual diff evidence exists;
- `ui-target.json` entries marked `PASS` must include a reference path, an actual screenshot or visual evidence path, and both files must exist;
- if pixel-perfect verification is unavailable, capture evidence and mark the remaining review as `PASS_WITH_LIMITATION` or `MANUAL_REVIEW_REQUIRED`;
- if pixel-perfect is required or claimed, visual diff evidence is required. Without visual diff evidence, do not claim `UI_PIXEL_PERFECT_PASS`.

Normal UI ambiguity is not a blocker. Choose the best-supported interpretation and continue.

## Verification and Repair

Auto-detect and run relevant checks from project files. Prefer existing scripts.

Typical gates include:

- build;
- lint/typecheck/analyze;
- unit tests;
- integration/API tests;
- E2E/smoke tests;
- visual/screenshot checks;
- DB-backed tests only when safe local/test infrastructure exists.

For full-stack work, run or document all of:

- frontend-only verification;
- backend-only verification;
- contract/API verification;
- integrated/full-flow verification;
- visual verification when UI references exist.
- secret guard and report integrity.
- acceptance comparison after every apparently passing implementation round.

Commit and push are not part of the default workflow. The default endpoint is: code changes, tests/evidence, git diff summary, and final report. Commit/push require explicit user instruction plus explicit harness safety flags.

On failure:

1. Classify the failure as task-caused, pre-existing, environment-blocked, or manual-review.
2. Fix task-caused failures.
3. Fix small related pre-existing failures when safe.
4. Re-run the failed gate.
5. Repeat up to five repair loops.

Do not delete or weaken valid tests to get a pass. Do not claim success when gates are red. A red gate can still be a completed delivery only when it is clearly documented as pre-existing, environment-blocked, or outside the allowed scope.

## Evidence Classes

Use these exact statuses:

- `PASS`
- `PASS_WITH_LIMITATION`
- `PASS_NEEDS_MANUAL_UI_REVIEW`
- `FAIL`
- `HARD_FAIL`
- `IN_SCOPE_GAP`
- `DOCUMENTED_BLOCKER`
- `BLOCKED_BY_ENVIRONMENT`
- `DEFERRED`
- `MANUAL_REVIEW_REQUIRED`
- `PRODUCT_DECISION_REQUIRED`

Every final claim needs evidence: command, log path, screenshot path, test result, or explicit blocker.

Final verdict statuses and default exit codes:

- `PASS`: exit 0.
- `PASS_WITH_LIMITATION`: exit 3.
- `PASS_NEEDS_MANUAL_UI_REVIEW`: exit 3.
- `REPAIR_REQUIRED`: exit 2.
- `FAIL`: exit 1.
- `HARD_FAIL`: exit 1.
- `BLOCKED`: exit 4.

`PASS_WITH_LIMITATION`, `PASS_NEEDS_MANUAL_UI_REVIEW`, `DEFERRED`, `DOCUMENTED_BLOCKER`, `MANUAL_REVIEW_REQUIRED`, and `PRODUCT_DECISION_REQUIRED` are not automatically hard failures. They must be reflected in the final report and prevent a pure `PASS` when relevant, but only open `HARD_FAIL` and `IN_SCOPE_GAP` force repair.

## Final Completion Hard Gate

Final completion requires all of:

1. `convergence-state.finalVerdict` is `PASS`, `PASS_WITH_LIMITATION`, or `PASS_NEEDS_MANUAL_UI_REVIEW`.
2. `gap-list.json` contains no open `HARD_FAIL`.
3. `gap-list.json` contains no open `IN_SCOPE_GAP`.
4. `requirement-target.json` contains no `CANDIDATE`.
5. `requirement-coverage.json` has no open P0/P1 section coverage gap.
6. All P0/P1 requirements have evidence.
7. `story-target.json` contains no `CANDIDATE`.
8. All P0/P1 stories have acceptance criteria and test points.
9. `story-quality-gate.json` is `PASS` or a truthful non-strict limitation.
10. `story-materialized-tests.json` maps every P0/P1 test point to generated tests, existing test bindings, UI verifier bindings, manual review, or deferred status.
11. Generated/bound story test points have commands and evidence output paths.
12. Generated story tests were actually executed when P0/P1 story materialization generated route/API/E2E scripts.
13. P0/P1 stories that require full-flow/E2E have `e2e-flow.json` or generated E2E evidence with `PASS`.
14. All required P0/P1 story test points have existing evidence.
15. `story-acceptance-summary.json` exists and the final report contains `## Story Acceptance Summary`.
16. `requirement-section-map.json` has no uncovered P0/P1 sections.
17. All required UI screens and required `uiMapping` entries have an existing actual screenshot or visual evidence path.
18. `report-integrity` is `PASS`.
19. `secret-guard` is `PASS` or an explicitly documented blocker.
20. `machine-summary.json finalVerdict` matches the final convergence report and includes verdict classification fields.

If any item fails, the final verdict is not complete; read `next-agent-action.md` or the final convergence report and continue repair.

## Final Report

At the end, report concisely:

- what was implemented;
- what requirements/UI references it satisfies;
- what commands were run;
- what passed;
- what failed and why;
- what evidence files were produced;
- what remains for human review, if anything.
- include the fixed `## Why This Is PASS` or `## Why Not Pure PASS?` section from final gate so non-pure PASS outcomes are explained by verifier lane.

Do not paste the whole report unless the user asks.
