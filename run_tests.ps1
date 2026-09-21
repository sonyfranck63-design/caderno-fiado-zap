$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chromePath)) {
    Write-Error "Chrome não encontrado em $chromePath"
    exit 1
}

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $chromePath
$psi.Arguments = "--headless=new --virtual-time-budget=60000 --dump-dom http://localhost:3000/tests/test_audit.html"
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true

$proc = [System.Diagnostics.Process]::Start($psi)
$stdout = $proc.StandardOutput.ReadToEnd()
$stderr = $proc.StandardError.ReadToEnd()
$proc.WaitForExit(20000)
Set-Content -Path "dump_tests_stdout.txt" -Value $stdout -Encoding UTF8

if ($stdout -match "RESULTADO FINAL: (\d+)/(\d+) TESTES PASSARAM COM SUCESSO!") {
    $passed = [int]$Matches[1]
    $total = [int]$Matches[2]
    if ($passed -eq $total) {
        Write-Host "SUCESSO: $passed/$total testes passaram com sucesso!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "ATENÇÃO: $passed/$total testes passaram ($($total - $passed) FALHARAM)" -ForegroundColor Red
        if ($stdout -match '(?s)<div id="results"[^>]*>(.*?)</div>') {
            $lines = $Matches[1] -split '</div>'
            foreach ($l in $lines) {
                if ($l -match 'FALHOU|FAIL') {
                    $clean = $l -replace '<[^>]+>', '' -replace '&gt;', '>' -replace '&lt;', '<'
                    Write-Host $clean -ForegroundColor Red
                }
            }
        }
        exit 1
    }
} else {
    Write-Host "Verificando saída completa de results:"
    if ($stdout -match '(?s)<div id="results"[^>]*>(.*?)</div>') {
        $clean = $Matches[1] -replace '<[^>]+>', "`n" -replace '&gt;', '>' -replace '&lt;', '<'
        Write-Host $clean
    } else {
        Write-Host "Div results não encontrada ou vazia."
    }
    if ($stderr) {
        Write-Host "STDERR:"
        Write-Host $stderr
    }
    exit 1
}
