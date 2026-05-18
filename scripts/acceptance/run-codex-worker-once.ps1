param(
  [string]$ProjectRoot = (Get-Location).Path,
  [Parameter(Mandatory=$true)][string]$PromptFile,
  [Parameter(Mandatory=$true)][string]$LogFile
)

$ErrorActionPreference = "Stop"
Set-Location $ProjectRoot

if (!(Test-Path -LiteralPath $PromptFile)) { throw "Prompt file missing: $PromptFile" }

Get-Content -LiteralPath $PromptFile -Raw | codex exec `
  --cd $ProjectRoot `
  --sandbox workspace-write `
  --ask-for-approval never `
  - 2>&1 | Tee-Object -FilePath $LogFile

exit $LASTEXITCODE
