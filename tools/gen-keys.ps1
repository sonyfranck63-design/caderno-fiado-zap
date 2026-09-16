Add-Type -AssemblyName System.Core

$cng = New-Object System.Security.Cryptography.ECDsaCng(256)
$pubBlob = $cng.Key.Export([System.Security.Cryptography.CngKeyBlobFormat]::EccPublicBlob)
$privBlob = $cng.Key.Export([System.Security.Cryptography.CngKeyBlobFormat]::EccPrivateBlob)

# O formato BCRYPT_ECCKEY_BLOB da Microsoft:
# Magic: 4 bytes (BCRYPT_ECDSA_PUBLIC_P256_MAGIC = 0x31534345 = "ECS1")
# cbKey: 4 bytes (32)
# X: 32 bytes
# Y: 32 bytes
# Para private key:
# Magic: 4 bytes (BCRYPT_ECDSA_PRIVATE_P256_MAGIC = 0x32534345 = "ECS2")
# cbKey: 4 bytes (32)
# X: 32 bytes
# Y: 32 bytes
# D: 32 bytes

function To-B64Url([byte[]]$data) {
    return [System.Convert]::ToBase64String($data).Replace('+', '-').Replace('/', '_').TrimEnd('=')
}

$xBytes = New-Object byte[] 32
$yBytes = New-Object byte[] 32
[System.Array]::Copy($pubBlob, 8, $xBytes, 0, 32)
[System.Array]::Copy($pubBlob, 40, $yBytes, 0, 32)

$dBytes = New-Object byte[] 32
[System.Array]::Copy($privBlob, 72, $dBytes, 0, 32)

$jwkPub = @{
    kty = "EC"
    crv = "P-256"
    x = To-B64Url $xBytes
    y = To-B64Url $yBytes
}

$jwkPriv = @{
    kty = "EC"
    crv = "P-256"
    x = To-B64Url $xBytes
    y = To-B64Url $yBytes
    d = To-B64Url $dBytes
}

$res = @{
    publicKeyJwk = $jwkPub
    privateKeyJwk = $jwkPriv
}

$json = $res | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText((Join-Path $PSScriptRoot "license-keys.json"), $json, [System.Text.Encoding]::UTF8)
Write-Host "Chaves salvas com sucesso!"
