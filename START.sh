#!/bin/bash
# ============================================================
# Script de lanzamiento - Domotica Smart Home Platform
# Ejecute: bash START.sh
# ============================================================

set -e

# Colores
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          Domotica Smart Home Platform                  ║${NC}"
echo -e "${CYAN}║          Lanzando plataforma...                        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker no está instalado.${NC}"
    echo ""
    echo "Por favor instala Docker Desktop desde:"
    echo "  https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Verificar que Docker esté corriendo
if ! docker info &> /dev/null; then
    echo -e "${YELLOW}[INFO] Docker no está corriendo. Abriendo Docker Desktop...${NC}"
    open -a "Docker Desktop" 2>/dev/null || echo -e "${YELLOW}[INFO] Abre Docker Desktop manualmente y espera a que inicie.${NC}"
    echo ""
    echo "Esperando a que Docker inicie (30 segundos)..."
    sleep 30
fi

echo -e "${GREEN}[1/3]${NC} Iniciando servicios con Docker Compose..."
echo ""
docker compose up -d --build

echo ""
echo -e "${GREEN}[2/3]${NC} Esperando que la base de datos esté lista..."
sleep 10

echo ""
echo -e "${GREEN}[3/3]${NC} Verificando servicios..."
echo ""

# Verificar servicios
for service in db backend frontend; do
    if docker compose ps | grep -q "$service.*Up"; then
        echo -e "  [OK] Servicio $service corriendo."
    else
        echo -e "  [WARNING] Servicio $service puede no estar completamente listo."
    fi
done

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  📋 Frontend (UI):     ${GREEN}http://localhost:5173${NC}"
echo -e "  🔧 Backend (API):     ${GREEN}http://localhost:3000${NC}"
echo -e "  🗄️  Base de datos:    ${GREEN}localhost:5432${NC}"
echo ""
echo -e "  Presiona ${YELLOW}Ctrl+C${NC} en esta ventana para detener todos los servicios."
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Abrir navegador
case "$(uname -s)" in
    Darwin*) open http://localhost:5173 ;;
    Linux*) xdg-open http://localhost:5173 2>/dev/null || echo "Abre http://localhost:5173 en tu navegador" ;;
esac

echo -e "${YELLOW}[INFO]${NC} Presiona Ctrl+C aquí para detener la plataforma."
echo ""

# Mantener corriendo
wait