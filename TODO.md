# TODO.md

Status: all previously exported repair gaps are closed by the latest final gate.

## Closed tasks

- [x] GAP-UI-001: UI references mapped to required web/miniprogram screens in `docs/auto-execute/ui-target.json`; evidence exists under `docs/auto-execute/screenshots/` and miniprogram WXML pages.
- [x] GAP-STORY-TARGET-STORY-QUALITY-1: normalized `story-target.json`, `story-test-matrix.json`, and `story-materialized-tests.json` now bind P0 stories to evidence.
- [x] GAP-REQ-001: normalized `requirement-target.json` and `requirement-section-map.json` now cover P0/P1 sections.

## Verification

- `npm run verify:all` => PASS
- `powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-report-integrity.ps1 -ProjectRoot "D:\lyh\agent\agent-frame\finahuntV2"` => PASS
- `powershell -ExecutionPolicy Bypass -File .\scripts\acceptance\run-final-gate.ps1 -ProjectRoot "D:\lyh\agent\agent-frame\finahuntV2"` => PASS_NEEDS_MANUAL_UI_REVIEW

Remaining limitation: Playwright/pixelmatch/pngjs are installed and screenshot/diff evidence exists, but pixel diff ratios exceed threshold 0.08, so UI remains PASS_NEEDS_MANUAL_UI_REVIEW; no HARD_FAIL or IN_SCOPE_GAP remains.
