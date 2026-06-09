@echo off
:: ============================================================
:: Domotica Smart Home Platform - Script de lanzamiento
:: ============================================================
chcp 65001 >nul 2>&1
color 0A
title Domotica Platform

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║          Domotica Smart Home Platform                  ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

:: Verificar Docker
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no esta corriendo.
    echo.
    echo Asegurate de que Docker Desktop este abierto.
    echo Presiona cualquier tecla para salir...
    pause >nul
    exit /b 1
)

echo [1/3] Levantando contenedores...
docker compose up -d --build

echo.
echo [2/3] Esperando que la base de datos este lista...
timeout /t 15 /nobreak >nul

echo.
echo [3/3] Verificando servicios...
echo.

for %%C in (db backend frontend) do (
    docker compose ps | findstr "%%C.*Up" >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] Servicio %%C puede no estar listo.
    ) else (
        echo [OK] Servicio %%C corriendo.
    )
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo   LA PLATAFORMA ESTA EN EJECUCION
echo.
echo   Navegador: http://localhost:5173
echo   API:       http://localhost:3000
echo.
echo   Presiona Ctrl+C en esta ventana para detener.
echo ═══════════════════════════════════════════════════════════════
echo.

:: Abrir navegador
start http://localhost:5173

:: Mantener ventana abierta
echo Presiona Ctrl+C aqui para detener la plataforma.
pause