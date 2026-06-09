# ─── Etapa 1: Build ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files primero (para cache de capas)
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts 2>/dev/null || npm install --ignore-scripts

COPY vite.config.ts tailwind.config.js postcss.config.cjs tsconfig.json tsconfig.node.json tsconfig.app.json index.html ./
COPY src src/

# Build de React (compila TypeScript + Vite)
RUN npm run build

# ─── Etapa 2: Producción (servir archivos estáticos) ─────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Instalar serve para servir archivos estáticos (más ligero que nginx para esto)
RUN npm install -g serve

# Copiar los archivos construidos del stage de build
COPY --from=builder /app/dist ./dist

# Sirve en puerto 80 (el puerto público por defecto de Docker)
# "serve -s dist" sirve en modo Single Page (fallback a index.html para client-side routing)
EXPOSE 80

CMD ["serve", "-s", "dist", "-l", "80"]