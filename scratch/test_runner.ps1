$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$url = "http://localhost:3000/tests/test_audit.html"

$outFile = Join-Path $PSScriptRoot "output_dom.txt"
if (Test-Path $outFile) { Remove-Item $outFile -Force }

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $chromePath
$psi.Arguments = "--headless=new --virtual-time-budget=20000 --dump-dom `"$url`""
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true

$proc = [System.Diagnostics.Process]::Start($psi)
$stdout = $proc.StandardOutput.ReadToEnd()
$stderr = $proc.StandardError.ReadToEnd()
$proc.WaitForExit(20000)

[System.IO.File]::WriteAllText($outFile, $stdout, [System.Text.Encoding]::UTF8)

Write-Host "Tamanho stdout: $($stdout.Length)"
if ($stdout -match "RESULTADO FINAL") {
    Write-Host "ENCONTRADO RESULTADO FINAL!" -ForegroundColor Green
    $lines = $stdout -split "`n"
    $lines | Where-Object { $_ -match "RESULTADO FINAL" -or $_ -match "\[FAIL\]" } | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "NÃO ENCONTRADO RESULTADO FINAL." -ForegroundColor Red
    if ($stdout -match '(?s)<div id="results"[^>]*>(.*?)</div>') {
        Write-Host "CONTEUDO RESULTS:"
        Write-Host $Matches[1]
    }
}
