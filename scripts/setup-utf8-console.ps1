$utf8 = [System.Text.UTF8Encoding]::new()

try {
  chcp 65001 | Out-Null
} catch {
  Write-Warning "コードページを UTF-8 に切り替えられませんでした。"
}

[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8

Write-Host "PowerShell の入出力を UTF-8 に設定しました。"
Write-Host "必要なら Get-Content -Encoding UTF8 <path> を使ってください。"
