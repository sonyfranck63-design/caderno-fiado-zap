@echo off
title CadernoFiado & Cobranca Zap
echo ======================================================
echo  Iniciando CadernoFiado & Cobranca Zap...
echo ======================================================
start http://localhost:3000/
powershell.exe -NoExit -ExecutionPolicy Bypass -File "%~dp0server.ps1"
