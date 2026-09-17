$javaPath = "C:\Program Files (x86)\Common Files\Oracle\Java\java8path\java.exe"
& $javaPath -jar tools\apktool.jar d tools\template.apk -o apk_inspect -f
Get-ChildItem -Path apk_inspect -Recurse -Filter "*.smali" | Select-String -Pattern "JavascriptInterface" | ForEach-Object {
    $_.Filename + ": " + $_.Line
}
