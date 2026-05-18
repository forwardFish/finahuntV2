# Repair Plan

Generated: 05/18/2026 15:50:00

Agent must edit implementation, tests, or evidence for these gaps before the next convergence run.

## GAP-UI-001

- Type: ui
- Severity: IN_SCOPE_GAP
- Source: docs\auto-execute\ui-target.json
- Problem: UI references exist but ui-target.json has no screens.
- Repair target: Map UI references to routes/screens in ui-target.json.

## GAP-STORY-TARGET-STORY-QUALITY-1

- Type: story-quality
- Severity: HARD_FAIL
- Source: docs\auto-execute\story-target.json
- Problem: story-target.json has no normalized stories.
- Repair target: Run story extraction, curation, and normalization before final gate.

## GAP-UI-001

- Type: ui
- Severity: IN_SCOPE_GAP
- Source: docs\auto-execute\ui-target.json
- Problem: UI references exist but ui-target.json has no screens.
- Repair target: Map UI references to routes/screens in ui-target.json.

## GAP-REQ-001

- Type: requirement
- Severity: IN_SCOPE_GAP
- Source: docs\auto-execute\requirement-candidates.json
- Problem: No normalized requirements are listed in requirement-target.json
- Repair target: Normalize docs/auto-execute/requirement-candidates.json into requirement-target.json with P0/P1/P2 acceptance criteria, surfaces, and evidence expectations.

## GAP-UI-001

- Type: ui
- Severity: IN_SCOPE_GAP
- Source: docs\auto-execute\ui-target.json
- Problem: UI references exist but ui-target.json has no screens.
- Repair target: Map UI references to routes/screens in ui-target.json.

