$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) {
    $edge = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

$mobilePath = Join-Path $PSScriptRoot "screenshot.png"
$desktopPath = Join-Path $PSScriptRoot "screenshot-desktop.png"
$adminPath = Join-Path $PSScriptRoot "screenshot-admin.png"

# 1. Mobile screenshot (Clientes & Fiados)
Start-Process -FilePath $edge -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--virtual-time-budget=3000",
    "--window-size=430,932",
    "--screenshot=$mobilePath",
    "http://localhost:3000/"
) -Wait

# 2. Desktop screenshot
Start-Process -FilePath $edge -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--virtual-time-budget=3000",
    "--window-size=1280,860",
    "--screenshot=$desktopPath",
    "http://localhost:3000/"
) -Wait

# 3. Painel do Dono (tools/admin.html)
Start-Process -FilePath $edge -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--virtual-time-budget=3000",
    "--window-size=960,820",
    "--screenshot=$adminPath",
    "http://localhost:3000/tools/admin.html"
) -Wait

Write-Host "Todos os Screenshots gerados com sucesso:"
Get-Item (Join-Path $PSScriptRoot "screenshot*.png") | Select-Object Name, Length
