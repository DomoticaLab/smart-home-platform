# Domótica Platform

Plataforma comercial para generar cotizaciones precisas y defendibles de instalaciones domóticas residenciales en Colombia y LATAM. Pensada para instaladores y equipos de ventas que necesitan armar propuestas técnicas con productos reales del mercado (SONOFF, Aqara, Shelly), considerando compatibilidad de protocolos, infraestructura del sitio y márgenes de mano de obra.

## Contexto de negocio

Un cliente llega pidiendo "automatizar mi casa" y el vendedor necesita:

1. Registrar al cliente y su proyecto.
2. Definir las áreas de la casa (`Room`s: sala, habitaciones, cocina, etc.).
3. Seleccionar productos del catálogo agrupados por ambiente, con validaciones automáticas de:
   - **Compatibilidad de protocolo** (Zigbee, Z-Wave, Wi-Fi, Matter, Thread, RF 433, Bluetooth).
   - **Infraestructura del sitio** (Wi-Fi bueno vs. mesh, neutro en cajetines, drops Ethernet, UPS, VLAN, PoE).
   - **Ecosistemas** (Alexa, Google Home, Apple Home, SmartThings) con niveles `CERTIFIED | COMPATIBLE | LIMITED | EXPERIMENTAL | NOT_SUPPORTED`.
   - **Tier de instalación** (`ENTRY | STANDARD | PRO | ENTERPRISE`).
   - **Control local vs. dependencia de cloud** (los productos `cloudRequired = true` flaggean un riesgo).
4. Aplicar bundles pre-empaquetados y plantillas de automatización / escenas.
5. Calcular subtotal + mano de obra + IVA (19% Colombia) + total en COP.
6. Exportar la cotización (PDF) y hacer seguimiento del estado comercial: `DRAFT → REVIEW → FINAL → APPROVED → ARCHIVED`.

Esta plataforma cubre todo ese flujo con un backend tipado, un frontend oscuro orientado al producto, y un motor de cotización que considera las reglas de compatibilidad y márgenes configurados.

## Stack tecnológico

### Backend
- **Node.js** 20 LTS
- **TypeScript** 5.9
- **Fastify** 4.29 (HTTP server, alto rendimiento)
- **Prisma** 6.19 (ORM + migrations)
- **PostgreSQL** 16
- **Zod** 4.4 (validación de request/response)
- **Pino** 9.14 (logging estructurado)
- **Vitest** 4.1 (unit tests)

### Frontend
- **React** 19
- **Vite** 8 (bundler / dev server)
- **TypeScript** 6
- **Tailwind CSS** 4
- **React Query** 5 (server state)
- **React Router** 7
- **Recharts** 3 (gráficos del dashboard)
- **Lucide React** (iconografía)

## Prerrequisitos

Para desarrollar localmente necesitás:

| Herramienta    | Versión mínima | Notas                                    |
| -------------- | -------------- | ---------------------------------------- |
| **Node.js**    | 20.x LTS       | Backend y frontend comparten toolchain.  |
| **npm**        | 10.x           | Viene con Node 20.                       |
| **PostgreSQL** | 16.x           | O usar Docker para evitar instalación.   |
| **Docker**     | 24+ (opcional) | Recomendado para entorno reproducible.   |
| **VS Code**    | Última         | Con extensiones de TS y Prisma.          |
| **Git**        | 2.40+          | Para la estrategia de ramas.             |

## Setup paso a paso

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd smart-home-platform

# 2. Cambiar a la rama de trabajo principal
git checkout develop

# 3. Instalar dependencias de ambos workspaces
npm install

# 4. Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Editar backend/.env con la URL real de PostgreSQL

# 5. Levantar la base de datos (si no usás Docker)
#    Asegurate de que PostgreSQL esté corriendo y creá la base:
#    CREATE DATABASE domotica;

# 6. Aplicar migraciones y seed
npm run db:migrate
npm run db:seed

# 7. Arrancar backend y frontend en terminales separadas
npm run dev:backend    # → http://localhost:3000
npm run dev:frontend   # → http://localhost:5173
```

El frontend (Vite) habla con el backend en `http://localhost:3000` por default. Si querés cambiarlo, ajustá `VITE_API_URL` en `frontend/.env`.

## 🚀 Lanzamiento rápido con Docker (recomendado)

Si preferís no instalar Node.js ni PostgreSQL localmente, usá **Docker Compose** para levantar toda la plataforma con un comando:

### Windows (doble clic en START.bat)
```
Lanzar START.bat desde el Explorador de Archivos
```
Se abrirá automáticamente en tu navegador.

### Mac / Linux
```bash
# Dar permisos de ejecución
chmod +x START.sh

# Lanzar
./START.sh
# o
bash START.sh
```

### Manual (cualquier plataforma)
```bash
# Desde la raíz del proyecto
docker compose up -d --build

# Esperar ~20 segundos y abrir:
#   http://localhost:5173
```

> **Primer inicio:** Docker baja las imágenes de Node 20 Alpine + PostgreSQL 16 (~5-10 min según tu conexión). Las siguientes veces será casi instantáneo.

### ¿Qué hace Docker Compose?
| Servicio   | Puerto | Descripción                         |
| ---------- | ------ | ----------------------------------- |
| `db`       | 5432   | PostgreSQL 16 Alpine                 |
| `backend`  | 3000   | API REST (Fastify + Prisma)          |
| `frontend` | 80→5173| SPA React (servida por `serve`)      |

> **Nota:** El puerto 5173 del frontend se mapea internamente al 80 dentro del contenedor. En tu navegador sigues usando `http://localhost:5173`.

### Detener la plataforma
```bash
# Desde la raíz
docker compose down

# Para eliminar también los datos persistidos
docker compose down -v
```

## Comandos disponibles (raíz)

Todos los comandos se ejecutan desde la **raíz del monorepo** y delegan al workspace correspondiente:

| Comando              | Descripción                                              |
| -------------------- | -------------------------------------------------------- |
| `npm run dev:backend`  | Arranca el backend en modo desarrollo (ts-node, watch). |
| `npm run dev:frontend` | Arranca el frontend con Vite y HMR.                      |
| `npm run build:backend`  | Compila el backend con `tsc`.                          |
| `npm run build:frontend` | Compila el frontend (tsc + Vite build).                |
| `npm run db:migrate`     | Aplica migraciones de Prisma (dev).                    |
| `npm run db:seed`        | Ejecuta el seed del catálogo.                         |
| `npm run db:studio`      | Abre Prisma Studio en el navegador.                   |
| `npm test`               | Corre la suite de tests del backend (Vitest).         |

## Estructura del proyecto

```text
smart-home-platform/
├── backend/                          # API REST + lógica de cotización
│   ├── prisma/
│   │   ├── schema.prisma             # Modelo de datos
│   │   ├── seed.ts                   # Seed del catálogo (SONOFF, Aqara, Shelly)
│   │   └── migrations/               # Migraciones generadas
│   ├── src/
│   │   ├── controllers/              # Capa HTTP: parsea, delega, responde
│   │   ├── services/                 # Lógica de negocio (precios, cotizaciones)
│   │   ├── repositories/             # Acceso a Prisma (única capa que lo usa)
│   │   ├── routes/                   # Definición de rutas Fastify
│   │   ├── schemas/                  # Zod schemas (request/response)
│   │   ├── lib/                      # prisma, config, errors, http
│   │   ├── types/                    # Tipos exportados por capa
│   │   ├── plugins/                  # Plugins de Fastify (cors, sensible)
│   │   ├── services/__tests__/       # Tests unitarios (Vitest)
│   │   └── server.ts                 # Entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/                         # SPA React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # Primitivos (Button, Card, Modal, Table, Toast, …)
│   │   │   ├── layout/               # MainLayout, Sidebar, Header
│   │   │   ├── products/             # ProductCard, ProductFilters
│   │   │   ├── clients/              # ClientForm
│   │   │   └── quotes/               # Wizard (Step1–4) + components del detail
│   │   ├── pages/                    # Páginas ruteadas (Dashboard, Products, …)
│   │   ├── hooks/                    # useProducts, useQuotes, useDashboard, …
│   │   ├── services/                 # Llamadas HTTP (products.service, …)
│   │   ├── types/                    # Tipos espejo de la API
│   │   ├── lib/                      # http client, helpers
│   │   ├── assets/                   # Recursos estáticos
│   │   ├── App.tsx                   # Router principal
│   │   └── main.tsx                  # Entry point
│   ├── .env.example
│   └── package.json
│
├── .github/
│   ├── COMMIT_CONVENTION.md          # Convención de commits
│   ├── BRANCHING.md                  # Estrategia de ramas
│   ├── agents/                       # Subagents para OpenCode
│   └── copilot-agents.yml
│
├── package.json                      # Workspaces de npm
├── tsconfig.json                     # Config TS compartida
├── opencode.json                     # Config del agente
└── README.md                         # Este archivo
```

## Convención de commits y ramas

- **Commits**: `feat(frontend): agregar wizard de cotización`, `fix(backend): corregir cálculo de IVA`, etc. Ver detalle completo en [`.github/COMMIT_CONVENTION.md`](.github/COMMIT_CONVENTION.md).
- **Ramas**: `main` (producción), `develop` (integración), `feature/*`, `fix/*`, `chore/*`. Ver detalle en [`.github/BRANCHING.md`](.github/BRANCHING.md).
- **Código en inglés, commits y docs en español.**

## Variables de entorno

### Backend (`backend/.env`)

| Variable       | Descripción                                | Ejemplo                                              |
| -------------- | ------------------------------------------ | ---------------------------------------------------- |
| `DATABASE_URL` | URL de conexión a PostgreSQL.              | `postgresql://USER:PASSWORD@localhost:5433/domotica` |
| `NODE_ENV`     | Entorno de ejecución.                      | `development`                                        |
| `PORT`         | Puerto del servidor HTTP.                  | `3000`                                               |
| `LOG_LEVEL`    | Nivel de log de Pino (`debug`/`info`/...). | `debug`                                              |

> Las variables se validan con Zod en `backend/src/lib/config.ts` al arrancar. Si falta alguna, el proceso **falla rápido**.

### Frontend (`frontend/.env`)

| Variable        | Descripción                          | Ejemplo                  |
| --------------- | ------------------------------------ | ------------------------ |
| `VITE_API_URL`  | URL base del backend.                | `http://localhost:3000`  |

## Tests

La suite de tests vive en `backend/src/services/__tests__/` y se ejecuta con **Vitest**:

```bash
# Desde la raíz
npm test

# Desde el workspace del backend
npm test --workspace=backend

# En modo watch (desarrollo)
npm run test:watch --workspace=backend

# Con cobertura
npx vitest run --coverage --workspace=backend
```

Los tests apuntan a la **capa de servicios** y mockean los repositorios manualmente (Prisma se inyecta por constructor, no se conecta a la DB real).

## Contacto del equipo

| Rol              | Persona             | Canal               |
| ---------------- | ------------------- | ------------------- |
| Tech lead        | _a definir_         | _a definir_         |
| Backend          | _a definir_         | _a definir_         |
| Frontend         | _a definir_         | _a definir_         |
| Producto         | _a definir_         | _a definir_         |

> Completar con los datos reales del equipo al deployar.

## Documentación adicional

- [`.github/COMMIT_CONVENTION.md`](.github/COMMIT_CONVENTION.md) — Convención de commits
- [`.github/BRANCHING.md`](.github/BRANCHING.md) — Estrategia de ramas
- [`backend/README.md`](backend/README.md) — Detalle del backend
- [`frontend/README.md`](frontend/README.md) — Detalle del frontend
