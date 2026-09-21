$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $chromePath
$psi.Arguments = "--headless=new --virtual-time-budget=10000 --dump-dom http://localhost:3000/index.html?debug=true"
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$proc = [System.Diagnostics.Process]::Start($psi)
$stdout = $proc.StandardOutput.ReadToEnd()
$stderr = $proc.StandardError.ReadToEnd()
$proc.WaitForExit(10000)

Set-Content -Path "chrome_test_index.txt" -Value $stdout -Encoding UTF8
Write-Host "Tamanho stdout: $($stdout.Length)"
if ($stdout.Contains('debug-error')) {
    Write-Host "debug-error presente"
}
