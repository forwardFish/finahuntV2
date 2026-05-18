# auto-execute

Global Codex/OMX skill for PRD + UI driven implementation, verification, repair, and final acceptance reporting.

Durable rules:

- `run-final-gate.ps1` is the final authority for `finalVerdict`.
- `run-all.ps1` runs verifier lanes; it does not decide acceptance.
- `COMPLETED` only means a process finished. It is not `PASS`.
- Resumable state lives in `docs/auto-execute/latest/`, especially `HANDOFF.md` and `run-id.txt`.
- Resume the same run with `resume-convergence.ps1`; do not reset convergence for the same RunId.
- Keep prompts short. Put project-specific rules in `harness.yml` and resumable state files, not in a repeated long prompt.

## Global Location

```text
C:\Users\linyanhui\.codex\skills\auto-execute
```

## Project Harness

Copy the bundled `scripts/acceptance/` and `docs/auto-execute/` into the target project, then run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\init-harness.ps1 -ProjectRoot "<project root>" -RequirementDocs @("<PRD path>") -UIReferences @("<UI path>")
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\test-harness.ps1 -ProjectRoot "<project root>"
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-convergence.ps1 -ProjectRoot "<project root>" -Mode full -MaxRounds 5 -ResetConvergence -Strict
```

Resume the same run without resetting:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\resume-convergence.ps1 -ProjectRoot "<project root>" -Mode full -MaxRounds 5
```

Optional supervisor mode for long repairs:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-convergence.ps1 -ProjectRoot "<project root>" -Mode full -MaxRounds 5 -ResetConvergence -UseCodexSupervisor
```

## Relay Mode: One Fresh Codex Worker Per Task

Relay Mode is for long goals where one Codex session would overflow context or lose task discipline.

It does:

```text
Goal -> planner Codex -> TODO.md -> fresh worker Codex per task -> HANDOFF.md -> final gate
```

Start a new relay:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-codex-relay.ps1 `
  -ProjectRoot "<project root>" `
  -Goal "Take over the project, split the work, fix blockers, complete the core flow, run tests, and write the delivery report." `
  -MaxTasks 6 `
  -MaxWorkerRounds 12 `
  -Mode gate `
  -ResetRelay
```

Add `-NewWindow` when you want each worker in a visible PowerShell window. Resume an existing relay by omitting `-ResetRelay` and `-Goal`.

## Standard Short Instruction

```text
$auto-execute

Project root:
<absolute project path>

Requirement docs:
<absolute PRD/docs paths>

UI references:
<absolute UI/screenshot/design paths>

Task:
Run verifier-driven acceptance convergence. Implement from PRD/UI, verify, compare, repair, and repeat up to 5 rounds until run-final-gate.ps1 returns PASS, PASS_WITH_LIMITATION, PASS_NEEDS_MANUAL_UI_REVIEW, FAIL, or BLOCKED.

Rules:
- If REPAIR_REQUIRED appears, read latest/repair-plan.md and latest/next-agent-action.md, repair implementation/tests/evidence, then rerun without resetting.
- If interrupted, resume from latest/HANDOFF.md with resume-convergence.ps1.
- Do not paste the full skill rules into this prompt; use harness.yml and latest/HANDOFF.md as state.
```

## Resume Short Instruction

```text
$auto-execute

Project root:
<absolute project path>

Continue the previous auto-execute run. Do not reinitialize. Do not reset convergence.

Read:
docs/auto-execute/latest/HANDOFF.md
docs/auto-execute/latest/run-id.txt
docs/auto-execute/latest/machine-summary.json
docs/auto-execute/latest/gap-list.json
docs/auto-execute/latest/repair-plan.md
docs/auto-execute/latest/next-agent-action.md
docs/auto-execute/latest/verification-results.md
docs/auto-execute/latest/blockers.md

If the verdict is REPAIR_REQUIRED or HARD_FAIL, repair from the plan and resume convergence. If BLOCKED, report the blocker.
```

## Release

Create a clean release zip:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\package-release.ps1
```

The release zip is allowlisted. It includes skill docs, the harness template, acceptance scripts, Node verifier helpers, templates, and fixtures. It must not include old run artifacts such as `docs/auto-execute/results`, `logs`, `runs`, `comparison`, `machine-summary.json`, `evidence-manifest.json`, or `docs/AUTO_EXECUTE_DELIVERY_REPORT.md`.
