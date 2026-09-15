$text = [System.IO.File]::ReadAllText('dump.html')
$idx = $text.IndexOf('id="root"')
if ($idx -ge 0) {
    Write-Host "Found id=root at $idx"
    $sub = $text.Substring($idx, [Math]::Min(800, $text.Length - $idx))
    Write-Host $sub
} else {
    Write-Host "id=root NOT found in dump.html"
}

$idxErr = $text.IndexOf('id="debug-error"')
if ($idxErr -ge 0) {
    Write-Host "Found id=debug-error at $idxErr"
    $subErr = $text.Substring($idxErr, [Math]::Min(500, $text.Length - $idxErr))
    Write-Host $subErr
}
