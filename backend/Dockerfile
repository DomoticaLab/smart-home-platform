# ─── Etapa 1: Build ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files primero (para cache de capas)
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts 2>/dev/null || npm install --ignore-scripts

COPY prisma prisma/
COPY tsconfig.json ./
COPY src src/

# Generar cliente Prisma (necesita schema)
RUN npx prisma generate

# Compilar TypeScript
RUN npm run build

# ─── Etapa 2: Producción ─────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copiar node_modules completos del builder (incluyen .prisma y todo)
COPY --from=builder /app/node_modules ./node_modules

# Copiar los archivos construidos del stage de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/package.json ./

# No necesita reinstallar nada - ya tiene todo de node_modules
EXPOSE 3000

CMD ["node", "dist/server.js"]