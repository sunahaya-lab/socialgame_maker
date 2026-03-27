$utf8 = [System.Text.UTF8Encoding]::new($false)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir

try {
  & "$scriptDir\setup-utf8-console.ps1" | Out-Null
} catch {}

$files = @(
  "public/screens/home-edit-workspace.js",
  "public/screens/editor-screen.js",
  "public/screens/system-editor.js",
  "public/screens/story-editor.js",
  "public/lib/ui-text.js"
)

$failed = $false

Write-Host "editor files syntax check"
foreach ($file in $files) {
  $path = Join-Path $repoRoot $file
  if (-not (Test-Path $path)) {
    Write-Host "missing: $file"
    $failed = $true
    continue
  }
  node --check $path
  if ($LASTEXITCODE -ne 0) {
    Write-Host "syntax error: $file"
    $failed = $true
  } else {
    Write-Host "ok: $file"
  }
}

Write-Host ""
Write-Host "ui text key scan"
rg --line-number --fixed-strings "editor.empty" "$repoRoot\public" | Out-Host

if ($failed) {
  exit 1
}
