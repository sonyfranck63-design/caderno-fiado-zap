$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) {
    $edge = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

$screenshotPath = Join-Path $PSScriptRoot "screenshot-tests.png"
$adminScreenshot = Join-Path $PSScriptRoot "screenshot-admin.png"

# 1. Executa os testes de validação criptográfica e gera screenshot
Write-Host "Executando testes no Edge headless..."
Start-Process -FilePath $edge -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--virtual-time-budget=6000",
    "--window-size=1024,800",
    "--screenshot=$screenshotPath",
    "http://localhost:3000/tools/test-validation.html"
) -Wait

# 2. Gera screenshot do Painel do Dono (tools/admin.html)
Write-Host "Capturando screenshot do tools/admin.html..."
Start-Process -FilePath $edge -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--virtual-time-budget=4000",
    "--window-size=1024,800",
    "--screenshot=$adminScreenshot",
    "http://localhost:3000/tools/admin.html"
) -Wait

Write-Host "Capturas salvas com sucesso!"
