# 🏠 Domótica Platform

> Plataforma comercial de automatización residencial diseñada para el mercado colombiano y latinoamericano. Sistema integral que cubre desde el catálogo técnico de dispositivos hasta la generación de cotizaciones profesionales, construido con arquitectura moderna, filosofía local-first y enfoque en instalaciones reales.

---

## ¿Qué es este proyecto?

Domótica Platform nació de una necesidad concreta: los integradores de automatización del hogar en Colombia no tienen herramientas propias para gestionar su operación comercial. Dependen de hojas de cálculo, PDFs manuales y catálogos desactualizados.

Este proyecto resuelve eso. Es una plataforma interna para integradores que permite gestionar el catálogo técnico de dispositivos IoT, construir soluciones empaquetadas por tier, levantar cotizaciones profesionales por ambiente físico y llevar el pipeline comercial desde el primer contacto hasta la instalación aprobada.

No es un proyecto de domótica para el usuario final. Es la herramienta que usa el integrador que instala los sistemas.

---

## Contexto de negocio

El modelo comercial detrás de esta plataforma opera bajo una premisa clara: **no se venden productos sueltos, se venden soluciones**. Cada cotización está estructurada alrededor de paquetes por tier (Entry / Standard / Pro) que agrupan dispositivos compatibles, requisitos de instalación y estimación de mano de obra, con márgenes calculados automáticamente.

El mercado objetivo son instaladores y empresas de acabados residenciales en Colombia que quieren agregar domótica a su oferta de servicios sin la complejidad técnica de construir su propio sistema de gestión.

---

## Stack técnico

**Backend**
- Node.js + TypeScript (modo estricto, sin `any`)
- Fastify como framework HTTP
- Prisma ORM + PostgreSQL
- Arquitectura en capas estricta: `routes → controllers → services → repositories`
- Zod para validación de variables de entorno (`lib/config.ts`)
- Vitest configurado como test runner (aún sin suites de tests)

**Frontend**
- React 19 + Vite + TypeScript
- Tailwind CSS con paleta de diseño oscuro personalizada
- React Query para manejo de estado del servidor
- React Router v6 para navegación

**Infraestructura**
- PostgreSQL en Docker para desarrollo local
- Docker Compose con healthcheck y volúmenes persistentes
- npm Workspaces para gestión del monorepo

**Filosofía IoT**
- Local-first: el sistema funciona sin dependencia de nube
- Zigbee 3.0 como protocolo principal (malla, estable, sin WiFi)
- Compatible con Home Assistant, Zigbee2MQTT y MQTT como bus de mensajería
- Catálogo real con precios verificados (SONOFF Colombia, mayo 2026)

---

## Arquitectura del sistema

```text
domotica-platform/
├── backend/                     # API REST + lógica de negocio
│   ├── src/
│   │   ├── routes/              # Definición de endpoints
│   │   ├── controllers/         # Manejo de request/response
│   │   ├── services/            # Lógica de negocio
│   │   ├── repositories/        # Acceso a datos via Prisma
│   │   ├── types/               # Tipos compartidos por dominio
│   │   └── lib/                 # Prisma client, config (validado con Zod)
│   └── prisma/
│       ├── schema.prisma        # Modelo de datos completo
│       └── seed.ts              # Catálogo inicial de productos
└── frontend/                    # Aplicación React
    └── src/
        ├── pages/               # Vistas principales (dashboard, catálogo, bundles,
        │                        #   clientes, cotizaciones, wizard de cotización)
        ├── components/
        │   └── layout/          # MainLayout y estructura general de la app
        ├── lib/                 # Cliente HTTP para consumir la API
        └── assets/              # Recursos estáticos
```

Los dominios implementados en el backend (con su recorrido completo `routes → controllers → services → repositories`) son: **bundles**, **clients**, **quotes** y **products**.

---

## Modelo de datos

El schema está diseñado para representar con precisión el dominio técnico y comercial de la domótica residencial. Algunos aspectos de diseño que vale la pena destacar:

- Todas las relaciones many-to-many son **tablas explícitas con atributos propios**, sin atajos implícitos de Prisma. Esto permite almacenar metadatos en la relación misma (precio por proveedor, nivel de compatibilidad por ecosistema, rol en automatización).
- El modelo `Quote` es el núcleo comercial: agrupa `Rooms` (ambientes físicos), `QuoteItems` (productos por ambiente) y `QuoteBundles` (paquetes completos), con cálculo automático de márgenes y estimación de mano de obra.
- `Bundle` y `BundleItem` permiten definir paquetes vendibles reutilizables que se pueden agregar a cualquier cotización.
- `ProductSupplier` almacena precio, stock y URL por proveedor para cada producto, permitiendo rastrear disponibilidad real en el mercado colombiano.

---

## Funcionalidades principales

**Catálogo técnico**
Gestión completa de productos IoT con sus especificaciones: protocolo, capacidades, requisitos de instalación, compatibilidad con ecosistemas (Home Assistant, Alexa, Google Home, Apple HomeKit) y disponibilidad por proveedor con precios en COP.

**Bundles comerciales**
Paquetes predefinidos por tier con cálculo automático de precio base aplicando el margen sobre el costo real de los equipos. Los bundles son el producto principal que se le vende al cliente.

**Gestión de cotizaciones**
Wizard de cuatro pasos que guía la creación de una cotización: selección de cliente → definición de ambientes → selección de productos/bundles → resumen con desglose de costos. Incluye duplicación, cambio de estado y exportación de resumen estructurado.

**Dashboard comercial**
Vista del pipeline en tiempo real: cotizaciones por estado, valor total en negociación, productos más cotizados y actividad reciente de clientes.

---

## Decisiones técnicas relevantes

**¿Por qué Fastify sobre Express?**
Validación de schemas nativa, mejor soporte TypeScript y rendimiento superior. Para una API que va a procesar queries complejas de Prisma con múltiples includes, la diferencia es perceptible.

**¿Por qué Zigbee sobre WiFi como protocolo principal?**
Zigbee opera en red de malla — cada dispositivo actúa como repetidor. No depende de la estabilidad del router. Funciona sin internet. En instalaciones residenciales en Colombia donde la infraestructura WiFi es irregular, esto elimina la principal fuente de soporte técnico post-instalación.

**¿Por qué local-first?**
Los sistemas que dependen de servidores cloud del fabricante tienen un problema estructural: si el fabricante cierra, cambia su política o tiene caídas, el sistema del cliente deja de funcionar. Local-first garantiza que la instalación siga operando independientemente de lo que pase en internet.

---

## Estado del proyecto

| Módulo | Estado |
|---|---|
| Schema Prisma + migraciones | ✅ Completo |
| Seeds de catálogo (SONOFF, Aqara, Broadlink) | ✅ Completo |
| API de productos y bundles | ✅ Completo |
| API de cotizaciones | ✅ Completo |
| Dashboard endpoint | ✅ Completo |
| Frontend — catálogo y bundles | ✅ Completo |
| Frontend — wizard de cotización | ✅ Completo |
| Frontend — dashboard | ✅ Completo |
| Tests unitarios de servicios | 🔲 Pendiente (Vitest configurado, sin suites aún) |
| Exportación a PDF | 🔲 Próxima fase |
| Módulo de instalación y garantías | 🔲 Próxima fase |

---

## Cómo ejecutar el proyecto localmente

Requiere Node.js, npm y Docker (para PostgreSQL).

```bash
# 1. Clonar e instalar dependencias del monorepo (workspaces backend + frontend)
npm install

# 2. Levantar PostgreSQL en Docker
docker compose -f backend/docker-compose.yml up -d

# 3. Configurar variables de entorno del backend
cp backend/.env.example backend/.env
# Editar backend/.env con las credenciales que corresponda

# 4. Aplicar migraciones y cargar el catálogo inicial
npm run db:migrate
npm run db:seed

# 5. Levantar backend y frontend (en terminales separadas)
npm run dev:backend
npm run dev:frontend
```

Otros scripts disponibles desde la raíz del monorepo: `build:backend`, `build:frontend`, `db:studio` (Prisma Studio) y `test` (Vitest sobre el workspace de backend).

---

## Sobre el desarrollo

Este proyecto se construyó combinando diseño de arquitectura en profundidad con desarrollo asistido por IA (GitHub Copilot + Claude). El flujo consistió en tomar decisiones de arquitectura, modelo de datos y lógica de negocio de forma deliberada y documentada, y usar las herramientas de IA para acelerar la implementación dentro de esas decisiones ya tomadas.

La arquitectura, las decisiones de producto y el diseño del schema son propios. Las herramientas de IA operaron como aceleradores de implementación dentro de un marco técnico definido previamente.

---

## Autor

**Leonardo Muñoz**
Ingeniero Electrónico — Universidad del Norte, Barranquilla
Desarrollador backend independiente especializado en Node.js, TypeScript y sistemas IoT

[GitHub](https://github.com/Lmz-23) · [LinkedIn](https://linkedin.com/in/leonardo-muñoz-50a45a365)
