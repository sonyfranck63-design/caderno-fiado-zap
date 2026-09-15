# Renderizador de Ícones PNG para PWA via Edge Headless
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$iconsDir = Join-Path $PSScriptRoot "icons"
$svgPath = (Join-Path $iconsDir "icon.svg").Replace('\', '/')

# HTML temporário para renderizar 512x512
$html512 = @"
<!DOCTYPE html>
<html>
<head><style>body { margin: 0; padding: 0; background: transparent; overflow: hidden; }</style></head>
<body><img src="file:///$svgPath" width="512" height="512" style="display:block;" /></body>
</html>
"@
$tmp512 = Join-Path $iconsDir "tmp512.html"
[System.IO.File]::WriteAllText($tmp512, $html512, [System.Text.Encoding]::UTF8)

# HTML temporário para renderizar 192x192
$html192 = @"
<!DOCTYPE html>
<html>
<head><style>body { margin: 0; padding: 0; background: transparent; overflow: hidden; }</style></head>
<body><img src="file:///$svgPath" width="192" height="192" style="display:block;" /></body>
</html>
"@
$tmp192 = Join-Path $iconsDir "tmp192.html"
[System.IO.File]::WriteAllText($tmp192, $html192, [System.Text.Encoding]::UTF8)

$png512 = Join-Path $iconsDir "icon-512.png"
$png192 = Join-Path $iconsDir "icon-192.png"

Start-Process -FilePath $edge -ArgumentList @("--headless=new", "--disable-gpu", "--window-size=512,512", "--default-background-color=00000000", "--screenshot=$png512", "file:///$($tmp512.Replace('\', '/'))") -Wait
Start-Process -FilePath $edge -ArgumentList @("--headless=new", "--disable-gpu", "--window-size=192,192", "--default-background-color=00000000", "--screenshot=$png192", "file:///$($tmp192.Replace('\', '/'))") -Wait

Remove-Item $tmp512 -ErrorAction SilentlyContinue
Remove-Item $tmp192 -ErrorAction SilentlyContinue

Write-Host "Ícones gerados com sucesso:"
Get-Item (Join-Path $iconsDir "*.png") | Select-Object Name, Length
