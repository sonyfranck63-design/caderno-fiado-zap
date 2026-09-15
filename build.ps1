# Script de build para consolidar scripts em bundle.js
$files = @(
    "js\pix.js",
    "js\pdf.js",
    "js\state.js",
    "js\components\Icons.js",
    "js\components\AdMobBanner.js",
    "js\components\Header.js",
    "js\components\BottomNav.js",
    "js\components\RewardedAdModal.js",
    "js\components\WhatsAppModal.js",
    "js\components\PixModal.js",
    "js\components\SettingsModal.js",
    "js\components\ClientDetailModal.js",
    "js\components\ClientsTab.js",
    "js\components\NewRecordTab.js",
    "js\components\ReportsTab.js",
    "js\components\VipTab.js",
    "js\components\InstallPwaModal.js",
    "js\app.js"
)

$sb = [System.Text.StringBuilder]::new()
foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        $text = [System.IO.File]::ReadAllText($fullPath, [System.Text.Encoding]::UTF8)
        [void]$sb.AppendLine("// ==========================================")
        [void]$sb.AppendLine("// Arquivo: $file")
        [void]$sb.AppendLine("// ==========================================")
        [void]$sb.AppendLine($text)
        [void]$sb.AppendLine("")
    } else {
        Write-Warning "Arquivo não encontrado: $fullPath"
    }
}

$bundlePath = Join-Path $PSScriptRoot "js\bundle.js"
[System.IO.File]::WriteAllText($bundlePath, $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Host "Bundle criado com sucesso em: $bundlePath"
