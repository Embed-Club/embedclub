$filePath = Join-Path (Get-Location) "green_dots.txt"
if (-not (Test-Path $filePath)) {
    New-Item -ItemType File -Path $filePath -Force
}
for ($i = 1; $i -le 5; $i++) {
    $random = Get-Random -Minimum 1000 -Maximum 9999
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Add-Content -Path $filePath -Value "Commit $i - Code: $random - Date: $timestamp"
    git add green_dots.txt
    git commit -m "chore: activity update $i ($random)"
}
Write-Output "Commits completed. Pushing to GitHub..."
git push origin main