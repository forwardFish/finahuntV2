# Next Agent Action

Generated: 05/18/2026 15:50:00

Do not run convergence again before making code, test, or evidence changes.

## Repair These Gaps First

- GAP-UI-001: UI references exist but ui-target.json has no screens.
  - Repair target: Map UI references to routes/screens in ui-target.json.
  - Source: docs\auto-execute\ui-target.json
- GAP-STORY-TARGET-STORY-QUALITY-1: story-target.json has no normalized stories.
  - Repair target: Run story extraction, curation, and normalization before final gate.
  - Source: docs\auto-execute\story-target.json
- GAP-UI-001: UI references exist but ui-target.json has no screens.
  - Repair target: Map UI references to routes/screens in ui-target.json.
  - Source: docs\auto-execute\ui-target.json
- GAP-REQ-001: No normalized requirements are listed in requirement-target.json
  - Repair target: Normalize docs/auto-execute/requirement-candidates.json into requirement-target.json with P0/P1/P2 acceptance criteria, surfaces, and evidence expectations.
  - Source: docs\auto-execute\requirement-candidates.json
- GAP-UI-001: UI references exist but ui-target.json has no screens.
  - Repair target: Map UI references to routes/screens in ui-target.json.
  - Source: docs\auto-execute\ui-target.json

## Allowed Work

- Modify implementation files required to close the listed gaps.
- Modify or add tests that prove the intended PRD/UI behavior.
- Capture or attach truthful evidence such as logs, screenshots, API results, or visual diffs.
- Update requirement-target.json or ui-target.json only when it reflects actual implementation and evidence.

## Required Rerun

After repairs, run:

~~~powershell
powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-convergence.ps1 -Mode full -MaxRounds 5
~~~

## Prohibited

- Do not delete or weaken valid tests to force a pass.
- Do not fabricate screenshots, logs, visual diffs, or evidence.
- Do not mark requirements or UI screens PASS unless the evidence exists.
- Do not rerun convergence repeatedly without changing implementation, tests, or evidence.
