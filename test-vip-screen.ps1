$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) {
    $edge = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

# Cria script que clica na aba VIP após carregar
$clickScript = @"
setTimeout(() => {
    const vipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Plano VIP'));
    if (vipBtn) vipBtn.click();
}, 2000);
"@

# Executa edge headless
& $edge --headless=new --window-size=412,915 --screenshot="screenshot-vip.png" --virtual-time-budget=4000 "http://localhost:3000/#vip"
Write-Output "Screenshot VIP capturado!"
