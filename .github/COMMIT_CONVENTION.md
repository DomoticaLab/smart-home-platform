# Convención de Commits

Este repositorio sigue la convención **Conventional Commits** adaptada al contexto del proyecto. La descripción del commit es siempre en **español**.

## Formato

```
<tipo>(<scope>): <descripción corta en español>
```

## Tipos

| Tipo       | Descripción                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `feat`     | Nueva funcionalidad visible para el usuario final o el desarrollador.       |
| `fix`      | Corrección de un bug o comportamiento incorrecto.                           |
| `chore`    | Tareas de mantenimiento que no afectan lógica de negocio (deps, configs).   |
| `docs`     | Cambios en documentación (READMEs, comentarios, .github/).                  |
| `refactor` | Cambio de código que no corrige bug ni agrega feature (reestructuración).   |
| `test`     | Agregar o ajustar tests (sin tocar lógica de producción).                   |
| `style`    | Cambios de formato, espacios, comas, sin impacto en comportamiento.          |
| `perf`     | Mejora de rendimiento sin cambio funcional.                                 |

## Scopes

| Scope      | Aplica a                                                  |
| ---------- | --------------------------------------------------------- |
| `backend`  | Cambios en `backend/` (rutas, controllers, services, etc.) |
| `frontend` | Cambios en `frontend/` (páginas, hooks, componentes, etc.)|
| `db`       | Cambios en schema Prisma, migraciones o seeds.            |
| `infra`    | Docker, CI/CD, scripts del monorepo, configuración root.   |
| `deps`     | Cambios de dependencias en `package.json` o `package-lock`.|

> Cuando un cambio afecta a varios scopes, se prefiere el **scope dominante** (por ejemplo, una pantalla nueva que sólo consume un endpoint existente es `feat(frontend)`).

## Reglas

1. La descripción va en **español** y en **minúsculas**.
2. Máximo ~72 caracteres en la primera línea.
3. Usar imperativo: "agregar", "corregir", "actualizar" (no "agregado", "corregido").
4. No terminar la primera línea con punto.
5. Si el cambio es breaking, agregar `!` después del scope y documentar en el cuerpo del commit:
   ```
   feat(backend)!: cambiar contrato de /api/quotes
   ```
6. El cuerpo del commit (opcional) debe explicar el **qué** y el **por qué**, separado del título por una línea en blanco.

## Ejemplos

```text
feat(backend): agregar endpoint de resumen de cotización
fix(frontend): corregir cálculo de IVA en wizard
chore(deps): actualizar prisma a 6.9.0
docs: actualizar README con instrucciones de Docker
test(backend): agregar tests para QuotesService
refactor(backend): extraer lógica de precios a PricingService
style(frontend): reformatear QuoteDetailPage con prettier
perf(backend): agregar índice a Quote.clientId
db: crear tabla Client con índices en email y phone
infra: agregar docker-compose.dev para levantar stack completo
feat(frontend)!: migrar catálogo a React Query v5
```

## Mensaje en el código vs. mensaje del commit

- El **código** (identificadores, comentarios, mensajes de log) va en **inglés**.
- El **commit message** va en **español**.
- Los **READMEs y docs en `.github/`** van en **español**.

Esto aplica al proyecto en general — ver `BRANCHING.md` para más detalles.
