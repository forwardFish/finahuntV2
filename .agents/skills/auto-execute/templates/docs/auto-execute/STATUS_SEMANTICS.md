# Status Semantics

`run-final-gate.ps1` is the only final acceptance judge.

## PASS

All enabled and required verifier gates passed with existing evidence.

## PASS_WITH_LIMITATION

Core behavior has evidence, but limitations, disabled-but-detected lanes, manual review, deferred scope, or documented blockers prevent pure automated PASS.

## PASS_NEEDS_MANUAL_UI_REVIEW

Functional evidence exists, but visual or pixel-perfect approval still needs human review.

## COMPLETED / COMPLETE

COMPLETED means process finished, not acceptance passed. COMPLETE and COMPLETED must never normalize to PASS.

## Dynamic Lanes

`run-final-gate.ps1` reads `harness.yml` `lanes.<lane>.enabled`. Disabled frontend, backend, visual, and integration lanes are not hard required verifier gates. Requirements, stories, secret guard, and report integrity remain enabled by default. If a lane is auto-detected but not explicitly enabled, final gate records a suggestion instead of silently claiming coverage.

## UI Mapping Priority

1. `harness.yml` `uiMapping`
2. UI references discovered from configured docs/UI locations
3. filename route guess
4. manual review

Required `uiMapping` entries without actual screenshot evidence are `HARD_FAIL`. Auto-guessed UI mappings cannot claim pure PASS unless screenshot and diff evidence both exist.

## Acceptance Confidence

`machine-summary.json` must include `acceptanceConfidence` and `confidenceFactors`. Non-PASS verdicts must explain which factors reduced confidence.
