# Domótica Platform

Plataforma monorepo para una solución comercial de domótica residencial (Colombia / LATAM).

## Stack técnico

- Node.js + TypeScript + Fastify + Prisma + PostgreSQL (backend)
- React + Vite + TypeScript + Tailwind CSS (frontend)

## Estructura del monorepo

- `backend/` — API, Prisma schema, migrations, servicios y repositorios
- `frontend/` — aplicación cliente con Vite y componentes

## Comandos de desarrollo

- `npm run dev:backend` — arranca el backend en modo desarrollo
- `npm run dev:frontend` — arranca el frontend en modo desarrollo
- `npm run build:backend` — construye el backend
- `npm run build:frontend` — construye el frontend
- `npm run db:migrate` — aplica migraciones (workspace `backend`)
- `npm run db:seed` — ejecuta el seed de la base de datos (workspace `backend`)
- `npm run db:studio` — abre Prisma Studio (workspace `backend`)
- `npm test` — ejecuta tests (workspace `backend`)

## Convención de commits

Usar commit messages tipo: `feat`, `fix`, `chore`, `docs`, `refactor`.

Ejemplo: `feat(products): add product bundle support`
