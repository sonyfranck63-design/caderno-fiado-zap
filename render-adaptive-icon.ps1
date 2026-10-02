# Script para gerar ícone adaptativo Android com Safe Zone perfeita
# Garante que NUNCA corte em launchers circulares (Xiaomi MIUI / HyperOS, Poco X7, Samsung, Pixel)
Add-Type -AssemblyName System.Drawing

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

$srcPath = "C:\Users\MatheusSF\.gemini\antigravity-ide\brain\82bff6e0-5f27-4cab-a9f9-28734f7e1332\app_icon_premium_1790946871245.jpg"
if (-not (Test-Path $srcPath)) {
    $srcPath = Join-Path $root "icons\icon-512.png"
}

$src = [System.Drawing.Bitmap]::FromFile($srcPath)

# 1. Bounding box exato do caderno 3D
$cropX = 180
$cropY = 195
$cropW = 724
$cropH = 738

$cropBmp = [System.Drawing.Bitmap]::new($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gCrop = [System.Drawing.Graphics]::FromImage($cropBmp)
$gCrop.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gCrop.DrawImage($src, [System.Drawing.Rectangle]::new(0, 0, $cropW, $cropH), [System.Drawing.Rectangle]::new($cropX, $cropY, $cropW, $cropH), [System.Drawing.GraphicsUnit]::Pixel)
$gCrop.Dispose()
$src.Dispose()

# 2. Tornar o fundo branco do gerador transparente com suavização
for ($y = 0; $y -lt $cropH; $y++) {
    for ($x = 0; $x -lt $cropW; $x++) {
        $p = $cropBmp.GetPixel($x, $y)
        $brightness = ($p.R * 0.299 + $p.G * 0.587 + $p.B * 0.114)
        if ($brightness -ge 248 -and $p.R -ge 235 -and $p.G -ge 235 -and $p.B -ge 235) {
            $cropBmp.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        } elseif ($brightness -ge 230 -and $p.R -ge 220 -and $p.G -ge 220 -and $p.B -ge 220) {
            $alpha = [int](255 * (248 - $brightness) / 18)
            if ($alpha -lt 0) { $alpha = 0 }
            if ($alpha -gt 255) { $alpha = 255 }
            $cropBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
        }
    }
}

# 3. Gerar Foreground Adaptativo (512x512, Safe Zone = 300px centrado em 256, 256)
$fg = [System.Drawing.Bitmap]::new(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gFg = [System.Drawing.Graphics]::FromImage($fg)
$gFg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gFg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gFg.Clear([System.Drawing.Color]::Transparent)

$targetW = 300
$targetH = [int]($targetW * ($cropH / $cropW))
$posX = [int]((512 - $targetW) / 2)
$posY = [int]((512 - $targetH) / 2)

$gFg.DrawImage($cropBmp, [System.Drawing.Rectangle]::new($posX, $posY, $targetW, $targetH))
$gFg.Dispose()

$outFg = Join-Path $root "icons\icon-foreground-safe.png"
$fg.Save($outFg, [System.Drawing.Imaging.ImageFormat]::Png)
$fg.Dispose()

# 4. Gerar Ícone Completo (512x512) com fundo escuro gradiente moderno (#090d16 -> #064e3b)
$full = [System.Drawing.Bitmap]::new(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gFull = [System.Drawing.Graphics]::FromImage($full)
$gFull.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gFull.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

$brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Point]::new(0, 0),
    [System.Drawing.Point]::new(512, 512),
    [System.Drawing.Color]::FromArgb(255, 9, 13, 22),
    [System.Drawing.Color]::FromArgb(255, 6, 78, 59)
)
$gFull.FillRectangle($brush, 0, 0, 512, 512)
$brush.Dispose()

# Desenhar o caderno centralizado com safe-margin
$gFull.DrawImage($cropBmp, [System.Drawing.Rectangle]::new($posX, $posY, $targetW, $targetH))
$gFull.Dispose()

$outFull = Join-Path $root "icons\icon-512.png"
$full.Save($outFull, [System.Drawing.Imaging.ImageFormat]::Png)

# 5. Gerar icon-192.png
$icon192 = [System.Drawing.Bitmap]::new(192, 192, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g192 = [System.Drawing.Graphics]::FromImage($icon192)
$g192.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g192.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g192.DrawImage($full, [System.Drawing.Rectangle]::new(0, 0, 192, 192))
$g192.Dispose()

$out192 = Join-Path $root "icons\icon-192.png"
$icon192.Save($out192, [System.Drawing.Imaging.ImageFormat]::Png)
$icon192.Dispose()

$full.Dispose()
$cropBmp.Dispose()

Write-Host "Ícones gerados com sucesso com Safe Zone de ${targetW}x${targetH}px centrados em (${posX}, ${posY})!" -ForegroundColor Green
