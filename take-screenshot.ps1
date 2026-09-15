$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$mobilePath = Join-Path $PSScriptRoot "screenshot.png"
$desktopPath = Join-Path $PSScriptRoot "screenshot-desktop.png"

# Mobile screenshot
Start-Process -FilePath $edge -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--virtual-time-budget=6000",
    "--window-size=430,932",
    "--screenshot=$mobilePath",
    "http://localhost:3000/"
) -Wait

# Desktop showcase screenshot
Start-Process -FilePath $edge -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--virtual-time-budget=6000",
    "--window-size=1280,860",
    "--screenshot=$desktopPath",
    "http://localhost:3000/"
) -Wait

Write-Host "Screenshots gerados:"
Get-Item (Join-Path $PSScriptRoot "screenshot*.png") | Select-Object Name, Length
