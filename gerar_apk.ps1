# ==============================================================================
# Script de Automação para Geração do APK Nativo Android: CadernoFiado & Cobrança Zap
# ==============================================================================
param(
    [switch]$KeepTemp = $false
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " INICIANDO GERAÇÃO DO APK: CADERNOFIADO (ANDROID)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verificar e Localizar Java Runtime
$javaCmd = Get-Command java -ErrorAction SilentlyContinue
$javaPath = if ($javaCmd) { $javaCmd.Source } else { $null }
if (-not $javaPath -and (Test-Path "C:\Program Files (x86)\Common Files\Oracle\Java\java8path\java.exe")) {
    $javaPath = "C:\Program Files (x86)\Common Files\Oracle\Java\java8path\java.exe"
    $env:PATH = "C:\Program Files (x86)\Common Files\Oracle\Java\java8path;$env:PATH"
}

if (-not $javaPath) {
    Write-Error "Java Runtime Environment não foi encontrado. Instale o Java para prosseguir."
    exit 1
}
Write-Host "[1/7] Java Runtime detectado: $javaPath" -ForegroundColor Green

# 2. Executar build do bundle.js para consolidar alterações mais recentes
Write-Host "[2/7] Consolidando scripts do aplicativo (build.ps1)..." -ForegroundColor Yellow
$buildScript = Join-Path $root "build.ps1"
if (Test-Path $buildScript) {
    & powershell -ExecutionPolicy Bypass -File $buildScript
} else {
    Write-Warning "build.ps1 não encontrado, prosseguindo com arquivos existentes."
}

# 3. Validar ferramentas do pipeline
$toolsDir = Join-Path $root "tools"
$apktoolJar = Join-Path $toolsDir "apktool.jar"
$signerJar = Join-Path $toolsDir "uber-apk-signer.jar"
$templateApk = Join-Path $toolsDir "template.apk"

if (-not (Test-Path $apktoolJar) -or -not (Test-Path $signerJar) -or -not (Test-Path $templateApk)) {
    Write-Error "Ferramentas ausentes na pasta tools/. Certifique-se de que apktool.jar, uber-apk-signer.jar e template.apk estão presentes."
    exit 1
}

$buildDir = Join-Path $root "apk_build_tmp"
if (Test-Path $buildDir) {
    Write-Host "Limpando diretório temporário anterior..." -ForegroundColor DarkGray
    Remove-Item $buildDir -Recurse -Force
}

# 4. Descompilar o template base com Apktool
Write-Host "[3/7] Descompilando APK base..." -ForegroundColor Yellow
& $javaPath -jar $apktoolJar d $templateApk -o $buildDir -f
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $buildDir)) {
    Write-Error "Falha ao descompilar o APK base."
    exit 1
}

# 5. Aplicar personalizações nativas (Nome, Cores, Ícones e Configurações)
Write-Host "[4/7] Aplicando identidade visual, ícones e permissões do CadernoFiado..." -ForegroundColor Yellow

# A. Atualizar Nome do Aplicativo
$stringsPath = Join-Path $buildDir "res\values\strings.xml"
if (Test-Path $stringsPath) {
    $stringsXml = [System.IO.File]::ReadAllText($stringsPath, [System.Text.Encoding]::UTF8)
    $stringsXml = $stringsXml -replace '<string name="app_name">.*?</string>', '<string name="app_name">CadernoFiado</string>'
    [System.IO.File]::WriteAllText($stringsPath, $stringsXml, [System.Text.Encoding]::UTF8)
}

# B. Atualizar Cor de Fundo do Ícone
$colorsPath = Join-Path $buildDir "res\values\colors.xml"
if (Test-Path $colorsPath) {
    $colorsXml = [System.IO.File]::ReadAllText($colorsPath, [System.Text.Encoding]::UTF8)
    $colorsXml = $colorsXml -replace '<color name="ic_launcher_background">.*?</color>', '<color name="ic_launcher_background">#090d16</color>'
    [System.IO.File]::WriteAllText($colorsPath, $colorsXml, [System.Text.Encoding]::UTF8)
}

# C. Configurar Ícones PNG de Alta Resolução
$iconSource = Join-Path $root "icons\icon-192.png"
if (-not (Test-Path $iconSource)) {
    $iconSource = Join-Path $root "icons\icon-512.png"
}

if (Test-Path $iconSource) {
    # Remover mipmap-anydpi para priorizar o ícone bitmap em todos os Androids
    $anydpi = Join-Path $buildDir "res\mipmap-anydpi"
    if (Test-Path $anydpi) { Remove-Item $anydpi -Recurse -Force }

    $densities = @("mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi")
    foreach ($density in $densities) {
        $densityDir = Join-Path $buildDir "res\$density"
        if (-not (Test-Path $densityDir)) { New-Item -ItemType Directory -Path $densityDir | Out-Null }
        Copy-Item $iconSource (Join-Path $densityDir "ic_launcher.png") -Force
        Copy-Item $iconSource (Join-Path $densityDir "ic_launcher_round.png") -Force
    }
}

# D. Configurar Navegação e Abertura Automática do WhatsApp (settings.json)
$settingsPath = Join-Path $buildDir "assets\settings.json"
$appSettings = @{
    sites = @()
    other = ""
    match = @()
    skip = @()
    remote_debug = $false
    console_log = $false
    js_interface = $true # Habilita interface AppJavaScriptProxy (window.androidAppProxy)
    context_menu = $false
    not_matching = $true # Garante que links https://wa.me/... abram o app nativo do WhatsApp no celular!
    local_sites = $true
    update_zip = ""
    web_settings = @{
        JavaScriptEnabled = $true
        DomStorageEnabled = $true
        DatabaseEnabled = $true
    }
    source = "assets"
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
}
$jsonContent = $appSettings | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($settingsPath, $jsonContent, [System.Text.Encoding]::UTF8)

# 6. Injetar código fonte do aplicativo web na pasta assets/web/
Write-Host "[5/7] Empacotando aplicação e bibliotecas offline (assets/web)..." -ForegroundColor Yellow
$webTarget = Join-Path $buildDir "assets\web"
if (Test-Path $webTarget) { Remove-Item $webTarget -Recurse -Force }
New-Item -ItemType Directory -Path $webTarget | Out-Null

# Copiar arquivos web essenciais
Copy-Item (Join-Path $root "index.html") $webTarget -Force
Copy-Item (Join-Path $root "manifest.json") $webTarget -Force
Copy-Item (Join-Path $root "sw.js") $webTarget -Force
Copy-Item (Join-Path $root "css") $webTarget -Recurse -Force
Copy-Item (Join-Path $root "js") $webTarget -Recurse -Force
Copy-Item (Join-Path $root "vendor") $webTarget -Recurse -Force
Copy-Item (Join-Path $root "icons") $webTarget -Recurse -Force

# 7. Compilar o novo APK com Apktool
Write-Host "[6/7] Compilando pacote APK com Apktool..." -ForegroundColor Yellow
$unsignedApk = Join-Path $buildDir "unsigned.apk"
& $javaPath -jar $apktoolJar b $buildDir -o $unsignedApk
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $unsignedApk)) {
    Write-Error "Falha na compilação do APK pelo Apktool."
    exit 1
}

# 8. Assinar digitalmente e alinhar (zipalign) com Uber-APK-Signer
Write-Host "[7/7] Assinando digitalmente com certificados v1/v2/v3 e otimizando zipalign..." -ForegroundColor Yellow
$signedOutDir = Join-Path $buildDir "signed_out"
if (Test-Path $signedOutDir) { Remove-Item $signedOutDir -Recurse -Force }
New-Item -ItemType Directory -Path $signedOutDir | Out-Null

& $javaPath -jar $signerJar --allowResign -a $unsignedApk -o $signedOutDir

$signedApkFile = Get-ChildItem $signedOutDir -Filter "*.apk" | Select-Object -First 1
if (-not $signedApkFile) {
    Write-Error "Falha na assinatura do APK."
    exit 1
}

# 9. Copiar o APK final pronto para a raiz
$finalApkPath = Join-Path $root "CadernoFiado.apk"
Copy-Item $signedApkFile.FullName $finalApkPath -Force

# Limpeza do diretório temporário se solicitado
if (-not $KeepTemp) {
    try {
        Start-Sleep -Milliseconds 800
        Remove-Item $buildDir -Recurse -Force -ErrorAction SilentlyContinue
    } catch {}
}

$apkInfo = Get-Item $finalApkPath
$apkSizeMB = [math]::Round($apkInfo.Length / 1MB, 2)
$hash = (Get-FileHash -Path $finalApkPath -Algorithm SHA256).Hash

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " APK GERADO COM SUCESSO!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Arquivo:  $finalApkPath" -ForegroundColor Cyan
Write-Host " Tamanho:  $apkSizeMB MB ($($apkInfo.Length) bytes)" -ForegroundColor Yellow
Write-Host " SHA-256:  $hash" -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Pronto para instalar no celular! Você pode copiar via USB, enviar pelo WhatsApp Web ou baixar direto." -ForegroundColor White
