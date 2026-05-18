# Codex Relay Mode

Relay Mode converts a long goal into a queue of small tasks and executes each task with a fresh Codex worker.

## Why

Long autonomous coding runs fail mainly because context grows, state is stored in chat, and the agent starts doing more than one task. Relay Mode fixes that by keeping state in files and forcing one task per process.

## Flow

```text
run-codex-relay.ps1
  -> plan-relay-tasks.ps1
       -> codex exec read-only planner
       -> TODO.md
       -> docs/auto-execute/latest/relay-tasks.json
  -> run-codex-supervisor.ps1
       -> worker round 1 fresh codex exec
       -> write-handoff.ps1
       -> worker round 2 fresh codex exec
       -> write-handoff.ps1
  -> run-final-gate.ps1
```

## Main command

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-codex-relay.ps1 `
  -ProjectRoot "<project root>" `
  -Goal "<goal>" `
  -MaxTasks 6 `
  -MaxWorkerRounds 12 `
  -Mode gate `
  -ResetRelay `
  -NewWindow
```

## Resume

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-codex-relay.ps1 `
  -ProjectRoot "<project root>" `
  -MaxWorkerRounds 12 `
  -Mode gate
```

## Rules

- Use `-ResetRelay` only when generating a new TODO plan.
- Omit `-ResetRelay` to continue.
- Use `-NewWindow` only when you want visible separate worker windows.
- The final gate remains the acceptance authority.
