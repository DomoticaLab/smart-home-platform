# Frontend — Domótica Platform

SPA en React + Vite + TypeScript + Tailwind CSS. UI oscura orientada a producto (paleta navy / gold / green / red) para gestionar catálogo, bundles, clientes y cotizaciones.

## Stack

- **React** 19
- **Vite** 8 (bundler / dev server con HMR)
- **TypeScript** 6
- **Tailwind CSS** 4
- **React Query** 5 (server state, caché, refetch)
- **React Router** 7 (rutas declarativas)
- **Recharts** 3 (gráficos del dashboard)
- **Lucide React** (iconografía)

## Cómo correr en desarrollo

```bash
# 1. Instalar dependencias (desde la raíz del monorepo)
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# VITE_API_URL=http://localhost:3000 (default)

# 3. Arrancar Vite con HMR
npm run dev
# → http://localhost:5173
```

Para que el frontend funcione, el **backend debe estar corriendo** en la URL definida en `VITE_API_URL`. Si no lo está, las queries devuelven error y la UI muestra el estado de error con botón "Reintentar".

## Variables de entorno

| Variable        | Descripción                          | Default                  |
| --------------- | ------------------------------------ | ------------------------ |
| `VITE_API_URL`  | URL base del backend Fastify.        | `http://localhost:3000`  |

> Las variables de Vite deben tener el prefijo `VITE_` para ser expuestas al cliente. Se acceden vía `import.meta.env.VITE_API_URL`.

## Páginas disponibles

Las páginas están cargadas con `React.lazy` para code-splitting. La ruta raíz `/` redirige a `/dashboard`.

| Ruta                       | Página               | Descripción                                                                       |
| -------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `/dashboard`               | `DashboardPage`      | KPIs del pipeline comercial + gráficos + cotizaciones y clientes recientes.       |
| `/products`                | `ProductsPage`       | Catálogo de productos con filtros (marca, protocolo, tier, capacidad).            |
| `/products/:slug`          | `ProductDetailPage`  | Detalle del producto: specs, compatibilidad, precio, ecosistema.                  |
| `/bundles`                 | `BundlesPage`        | Bundles pre-empaquetados con tier y precio estimado.                              |
| `/clients`                 | `ClientsPage`        | Listado y CRUD de clientes con búsqueda y paginación.                             |
| `/quotes`                  | `QuotesPage`         | Listado de cotizaciones con filtros por estado y stats cards.                     |
| `/quotes/new`              | `QuoteWizardPage`    | Wizard de 4 pasos para crear una cotización (cliente → rooms → items → review).   |
| `/quotes/:id`              | `QuoteDetailPage`    | Detalle de la cotización: totales, items por room, cambio de estado, export.      |

## Estructura de carpetas

```
frontend/src/
├── components/
│   ├── ui/                    # Primitivos reutilizables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Toast.tsx          # + useToast hook
│   │   ├── Spinner.tsx
│   │   └── index.ts
│   ├── layout/                # Layout principal + navegación
│   ├── products/              # ProductCard, ProductFilters
│   ├── clients/               # ClientForm
│   └── quotes/                # Wizard (Step1–4) + components del detail
│       └── wizard/
├── pages/                     # Páginas ruteadas (cargadas con React.lazy)
├── hooks/                     # useProducts, useQuotes, useDashboard, …
├── services/                  # Llamadas HTTP al backend
├── types/                     # Tipos espejo de la API
├── lib/                       # http client, helpers, config
├── assets/                    # Recursos estáticos
├── App.tsx                    # Router principal
└── main.tsx                   # Entry point
```

## Convenciones

- **Componentes funcionales y hooks solamente** (no clases).
- **No `any`** en TypeScript. Cada componente define explícitamente sus `props` con `interface`.
- **No `fetch` directo en componentes de presentación.** Toda la data va por React Query hooks.
- **Tailwind only** para estilos. No usar CSS-in-JS ni módulos CSS.
- **Diseño oscuro** con la paleta definida en `tailwind.config.js`:
  - `navy` (#1A3A5C), `gold` (#C9A96E), `green` (#2D7A4F), `red` (#B03030)
  - `bg-primary` (#0F1117), `bg-secondary` (#161B22), `bg-card` (#1C2333)
  - `border-default` (#30363D), `text-primary` (#E6EDF3), `text-secondary` (#8B949E)

## Build y deploy

```bash
# Type-check + Vite build
npm run build
# → dist/

# Preview del build (local)
npm run preview
# → http://localhost:4173
```

El build de producción genera un bundle estático que puede servirse desde cualquier CDN (Vercel, Netlify, S3 + CloudFront, Nginx, etc.). Configurá un fallback a `index.html` para que React Router tome el control de las rutas en el cliente.
