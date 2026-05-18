# auto-execute v2.3 Usage

Use `$auto-execute` with a project root, requirement docs, and UI references. Keep the prompt short; long-term state belongs in `docs/auto-execute/latest/HANDOFF.md`, `TODO.md`, `harness.yml`, and verifier JSON.

## Commands

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\test-harness.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\init-harness.ps1 -ProjectRoot "<project root>"
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-convergence.ps1 -ProjectRoot "<project root>" -Mode full -MaxRounds 5 -ResetConvergence -Strict
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\resume-convergence.ps1 -ProjectRoot "<project root>" -Mode full -MaxRounds 5
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\export-todo-from-gaps.ps1 -ProjectRoot "<project root>"
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-codex-supervisor.ps1 -ProjectRoot "<project root>" -MaxWorkerRounds 20 -Mode gate
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-codex-relay.ps1 -ProjectRoot "<project root>" -Goal "<goal>" -MaxTasks 6 -MaxWorkerRounds 12 -Mode gate -ResetRelay
powershell -ExecutionPolicy Bypass -File .\scripts\package-release.ps1
```

One-step supervisor mode for a new or explicitly reset run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-convergence.ps1 -ProjectRoot "<project root>" -Mode full -MaxRounds 5 -ResetConvergence -UseCodexSupervisor
```

Resume never includes reset:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\resume-convergence.ps1 -ProjectRoot "<project root>" -Mode full -MaxRounds 5
```

## Relay Mode

Use this when you want automatic task splitting plus a fresh Codex worker for each task.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-codex-relay.ps1 `
  -ProjectRoot "<project root>" `
  -Goal "<your full goal>" `
  -MaxTasks 6 `
  -MaxWorkerRounds 12 `
  -Mode gate `
  -ResetRelay
```

Important:

- `-ResetRelay` regenerates `TODO.md` from the goal.
- Omit `-ResetRelay` to continue an existing TODO queue.
- Add `-NewWindow` only when you want visible separate PowerShell worker windows.
- Each worker reads `TODO.md` and `docs/auto-execute/latest/HANDOFF.md`, completes exactly one TODO item, updates handoff, and stops.

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

## Resume Instruction

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

If the verdict is PASS, PASS_WITH_LIMITATION, or PASS_NEEDS_MANUAL_UI_REVIEW, do not repair again. If the verdict is REPAIR_REQUIRED or HARD_FAIL, repair from the plan and resume convergence. If BLOCKED, report the blocker.
```
