# Backend — Domótica Platform

API REST en Node.js + Fastify + Prisma + PostgreSQL. Implementa la lógica de cotización, catálogo de productos, bundles, clientes y cotizaciones para la plataforma domótica.

## Stack

- **Node.js** 20 LTS
- **TypeScript** 5.9
- **Fastify** 4.29
- **Prisma** 6.19 (ORM + migrations)
- **PostgreSQL** 16
- **Zod** 4.4 (validación)
- **Pino** 9.14 (logging estructurado)
- **Vitest** 4.1 (tests unitarios)

## Arquitectura

El backend sigue una arquitectura estricta en capas:

```
routes  →  controllers  →  services  →  repositories  →  Prisma
```

- **`routes/`** — Definen endpoints y los conectan con controllers.
- **`controllers/`** — Parsean request (Zod), llaman al service, formatean response.
- **`services/`** — Lógica de negocio pura (precios, transiciones de estado, validaciones de compatibilidad).
- **`repositories/`** — Único lugar donde se usa Prisma. Devuelven tipos tipados de Prisma (`Prisma.QuoteGetPayload<…>`).
- **`schemas/`** — Zod schemas reutilizables (request y response).
- **`types/`** — Tipos exportados por capa.
- **`lib/`** — Prisma factory, validación de config, errores HTTP, helpers.

Reglas no negociables:
- Ninguna ruta llama directamente a un repositorio.
- Ningún service importa Prisma.
- Ningún controller contiene lógica de negocio.
- Ningún `any` en TypeScript.

## Cómo correr en desarrollo

```bash
# 1. Instalar dependencias (desde la raíz del monorepo)
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar DATABASE_URL con tu PostgreSQL

# 3. Aplicar migraciones y seed
npm run db:migrate
npm run db:seed

# 4. Arrancar en modo desarrollo (ts-node, watch)
npm run dev
# → http://localhost:3000
```

El servidor imprime logs estructurados con **Pino**. En modo `development` se usa `pino-pretty` para colorear la salida.

## Endpoints disponibles

Base URL: `http://localhost:3000`

### Health

| Método | Ruta            | Descripción                              |
| ------ | --------------- | ---------------------------------------- |
| GET    | `/api/health`   | Health check básico (status + timestamp). |

### Productos

| Método | Ruta                                       | Descripción                                                   |
| ------ | ------------------------------------------ | ------------------------------------------------------------- |
| GET    | `/api/products`                            | Listado paginado con filtros (`brand`, `protocol`, `tier`, …). |
| GET    | `/api/products/:slug`                      | Detalle de un producto por slug.                              |
| GET    | `/api/products/catalog-summary`            | Resumen agregado del catálogo (totales por marca, tier, etc.).|
| GET    | `/api/products/by-protocol/:protocolSlug`  | Filtra productos por protocolo (Zigbee, Z-Wave, Wi-Fi, …).   |
| GET    | `/api/products/by-tier/:tier`              | Filtra productos por tier (`ENTRY`/`STANDARD`/`PRO`/`ENTERPRISE`). |
| GET    | `/api/products/by-capability/:code`        | Filtra productos por capacidad (`DIMMING`, `MOTION`, …).     |
| GET    | `/api/products/compatible-with/:hubSlug`   | Productos compatibles con un hub específico.                  |

### Bundles

| Método | Ruta                          | Descripción                                       |
| ------ | ----------------------------- | ------------------------------------------------- |
| GET    | `/api/bundles`                | Listado de bundles con tier y precio estimado.    |
| GET    | `/api/bundles/:slug`          | Detalle de un bundle + sus items.                 |
| GET    | `/api/bundles/:slug/price`    | Precio calculado del bundle.                      |

### Clientes

| Método | Ruta                          | Descripción                                       |
| ------ | ----------------------------- | ------------------------------------------------- |
| GET    | `/api/clients`                | Listado paginado con búsqueda por nombre/email.   |
| GET    | `/api/clients/:id`            | Detalle del cliente.                              |
| POST   | `/api/clients`                | Crear cliente.                                    |
| PUT    | `/api/clients/:id`            | Actualizar cliente.                               |
| DELETE | `/api/clients/:id`            | Eliminar cliente.                                 |

### Cotizaciones

| Método | Ruta                                | Descripción                                                       |
| ------ | ----------------------------------- | ----------------------------------------------------------------- |
| GET    | `/api/quotes`                       | Listado paginado con filtros (`status`, `clientId`, `fromDate`, `toDate`). |
| GET    | `/api/quotes/:id`                   | Detalle completo (cliente + rooms + items + bundles).             |
| POST   | `/api/quotes`                       | Crear cotización en `DRAFT`.                                     |
| POST   | `/api/quotes/:id/rooms`             | Agregar `Room` a la cotización.                                   |
| POST   | `/api/quotes/:id/items`             | Agregar `QuoteItem` (producto + cantidad).                        |
| DELETE | `/api/quotes/:id/items/:productId`  | Eliminar item(es) por productId.                                  |
| POST   | `/api/quotes/:id/bundles`           | Asociar un bundle.                                                |
| PATCH  | `/api/quotes/:id/status`            | Cambiar estado (`DRAFT→REVIEW→FINAL→APPROVED→ARCHIVED`).          |
| POST   | `/api/quotes/:id/duplicate`         | Duplicar como nueva cotización `DRAFT`.                           |
| GET    | `/api/quotes/:id/summary`           | Vista estructurada optimizada para export a PDF.                  |

### Dashboard

| Método | Ruta              | Descripción                                                                              |
| ------ | ----------------- | ---------------------------------------------------------------------------------------- |
| GET    | `/api/dashboard`  | KPIs del pipeline comercial: cotizaciones por estado, pipeline/aprobado, top productos, recientes. |

## Migrations y seeds

```bash
# Aplicar migraciones pendientes (crea la DB si no existe)
npm run db:migrate

# Ejecutar el seed (catálogo de productos, marcas, protocolos, bundles, plantillas)
npm run db:seed

# Inspeccionar la DB visualmente
npm run db:studio
# → http://localhost:5555
```

El seed carga productos **reales** de SONOFF, Aqara y Shelly con precios de mercado colombianos en COP. **No** usa productos ficticios.

## Tests

```bash
# Correr la suite completa
npm test

# Modo watch (desarrollo)
npm run test:watch

# Con reporte de cobertura
npx vitest run --coverage
```

Los tests apuntan a la **capa de servicios** y mockean los repositorios de forma manual (no usan `vi.mock` de Prisma). Esto evita la conexión accidental a la base de datos real.

Estructura de los tests:

```
backend/src/services/__tests__/
├── pricing.service.test.ts
├── quotes.service.test.ts
└── bundles.service.test.ts
```

## Variables de entorno

| Variable       | Descripción                                       | Ejemplo                                              |
| -------------- | ------------------------------------------------- | ---------------------------------------------------- |
| `DATABASE_URL` | URL de conexión a PostgreSQL.                     | `postgresql://USER:PASSWORD@localhost:5433/domotica` |
| `NODE_ENV`     | `development` \| `production` \| `test`.          | `development`                                        |
| `PORT`         | Puerto del servidor HTTP.                         | `3000`                                               |
| `LOG_LEVEL`    | Nivel de log de Pino.                             | `debug`                                              |

> Las variables se validan con Zod en `src/lib/config.ts`. Si falta alguna o es inválida, el proceso **falla rápido** al arrancar.

## Build y deploy

```bash
# Compilar TypeScript
npm run build
# → dist/

# Ejecutar la versión compilada
npm start
```

En producción asegurate de:
- Definir las 4 variables de entorno.
- Correr las migraciones antes de arrancar (`prisma migrate deploy`).
- Apuntar `LOG_LEVEL=info` o superior.

## Estructura de carpetas

```
backend/
├── prisma/
│   ├── schema.prisma           # Modelo de datos completo
│   ├── seed.ts                 # Seed del catálogo
│   └── migrations/             # Migraciones generadas
├── src/
│   ├── controllers/            # Capa HTTP
│   ├── services/               # Lógica de negocio
│   │   └── __tests__/          # Tests unitarios (Vitest)
│   ├── repositories/           # Acceso a Prisma
│   ├── routes/                 # Definición de rutas
│   ├── schemas/                # Zod schemas
│   ├── lib/                    # prisma, config, errors
│   ├── types/                  # Tipos exportados
│   ├── plugins/                # Plugins Fastify
│   └── server.ts               # Entry point
├── .env.example
├── tsconfig.json
├── vitest.config.ts
└── package.json
```
