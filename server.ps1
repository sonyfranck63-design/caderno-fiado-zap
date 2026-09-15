# Servidor HTTP Local em PowerShell para CadernoFiado & Cobrança Zap
$port = 3000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host " CadernoFiado & Cobrança Zap rodando em:" -ForegroundColor Cyan
    Write-Host " http://localhost:$port/  ou  http://127.0.0.1:$port/" -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Green

    $basePath = $PSScriptRoot

    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response

            $urlPath = $request.Url.LocalPath
            if ($urlPath -eq "/" -or $urlPath -eq "") {
                $urlPath = "/index.html"
            }

            $filePath = Join-Path $basePath $urlPath.TrimStart('/')

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $mime = switch ($ext) {
                    ".html" { "text/html; charset=utf-8" }
                    ".css"  { "text/css; charset=utf-8" }
                    ".js"   { "application/javascript; charset=utf-8" }
                    ".json" { "application/json; charset=utf-8" }
                    ".svg"  { "image/svg+xml" }
                    ".png"  { "image/png" }
                    ".jpg"  { "image/jpeg" }
                    ".jpeg" { "image/jpeg" }
                    default { "application/octet-stream" }
                }

                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentType = $mime
                $response.ContentLength64 = $bytes.Length
                $response.AddHeader("Access-Control-Allow-Origin", "*")
                $response.AddHeader("Service-Worker-Allowed", "/")

                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                $response.StatusCode = 404
                $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($notFound, 0, $notFound.Length)
                }
            }
            $response.Close()
        } catch {
            Write-Host "Erro na requisição: $_" -ForegroundColor Red
        }
    }
} finally {
    $listener.Stop()
}
